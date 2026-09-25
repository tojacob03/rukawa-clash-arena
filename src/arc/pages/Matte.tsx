// Mat mode: the quest counter for the training itself. Huge buttons for
// sweaty hands, the screen stays on, a short buzz per tap (where the phone
// allows it), and the count goes straight into the log afterwards.

import { useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import type { ArcData, ArcState, Attire, QuestOffer } from "../core/types.ts";
import { TECH, sectorName } from "../core/techniques.ts";
import { pickCards } from "../core/model.ts";
import { matSet, matStart } from "../actions.ts";
import { go } from "../store.ts";
import { questTask, successLabel } from "../questText.ts";
import { KindBadge } from "../components/ui.tsx";
import { plannedAttire } from "../plan.ts";

const KATA_ROUNDS = 3;

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not supported */
  }
}

/** Keeps the screen on while mounted. Returns whether that worked. */
function useWakeLock() {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void>; addEventListener: (e: string, f: () => void) => void }> } }).wakeLock;
    if (!wl) {
      setOn(false);
      return;
    }
    let lock: { release: () => Promise<void> } | null = null;
    let dead = false;
    const take = () => {
      if (document.visibilityState !== "visible") return;
      wl.request("screen")
        .then((l) => {
          if (dead) {
            void l.release();
            return;
          }
          lock = l;
          setOn(true);
          l.addEventListener("release", () => !dead && setOn(false));
        })
        .catch(() => setOn(false));
    };
    take();
    document.addEventListener("visibilitychange", take);
    return () => {
      dead = true;
      document.removeEventListener("visibilitychange", take);
      void lock?.release().catch(() => undefined);
    };
  }, []);
  return on;
}

export default function Matte({ data, st, today }: { data: ArcData; st: ArcState; today: string }) {
  const mat = data.ui.mat?.day === today ? data.ui.mat : null;
  const wake = useWakeLock();
  const undo = useRef<{ att: number; succ: number; done: boolean }[]>([]);
  const [said, setSaid] = useState("");

  if (!mat) return <PickQuest data={data} st={st} today={today} />;

  const x = TECH[mat.node];
  const kata = mat.kind === "kata";
  const label = successLabel(mat);
  const push = (patch: Partial<{ att: number; succ: number; done: boolean }>, msg: string, pattern: number | number[]) => {
    undo.current.push({ att: mat.att, succ: mat.succ, done: mat.done });
    matSet(patch);
    buzz(pattern);
    setSaid(msg);
  };
  const back = () => {
    const prev = undo.current.pop();
    if (!prev) return;
    matSet(prev);
    buzz(8);
    setSaid("Letzten Tipp zurückgenommen");
  };

  return (
    <div className="mat">
      <div className="mat-top">
        <button type="button" className="btn ghost small" onClick={() => go("heute")}>
          <X size={16} aria-hidden="true" /> <span>Schließen</span>
        </button>
        <p className="mat-wake small">{wake === null ? "" : wake ? "Bildschirm bleibt an" : "Tipp: Bildschirmsperre fürs Training verlängern"}</p>
      </div>

      <header className="mat-head">
        <div className="row wrap">
          <KindBadge kind={mat.kind} />
          <span className="muted small">{sectorName(x)}</span>
        </div>
        <h1 className="mat-name">{x.name}</h1>
        <p className="mat-task">{questTask(mat)}</p>
      </header>

      <p className="mat-count" aria-live="polite">
        {kata ? (
          <>
            <b>{Math.min(mat.att, KATA_ROUNDS)}</b> von {KATA_ROUNDS} Runden
          </>
        ) : (
          <>
            <b>{mat.att}</b> {mat.att === 1 ? "Versuch" : "Versuche"}, <b>{mat.succ}</b> {label}
          </>
        )}
      </p>
      <p className="sr-only" aria-live="assertive">
        {said}
      </p>

      {kata ? (
        <div className="mat-pads one">
          <button
            type="button"
            className="mat-pad hit"
            disabled={mat.done}
            onClick={() => {
              const att = mat.att + 1;
              push({ att, done: att >= KATA_ROUNDS }, `Runde ${att}`, att >= KATA_ROUNDS ? [20, 60, 20, 60, 40] : 18);
            }}
          >
            {mat.done ? "Geschafft" : "Runde geschafft"}
          </button>
        </div>
      ) : (
        <div className="mat-pads">
          <button type="button" className="mat-pad" onClick={() => push({ att: mat.att + 1 }, `Versuch ${mat.att + 1}`, 14)}>
            Versuch
            <small>ohne {label}</small>
          </button>
          <button type="button" className="mat-pad hit" onClick={() => push({ att: mat.att + 1, succ: mat.succ + 1 }, `${label} ${mat.succ + 1}`, [20, 50, 20])}>
            {label}
            <small>zählt auch als Versuch</small>
          </button>
        </div>
      )}

      <div className="mat-foot">
        <button type="button" className="btn ghost" disabled={!undo.current.length} onClick={back}>
          <RotateCcw size={16} aria-hidden="true" /> <span>Rückgängig</span>
        </button>
        <button type="button" className="btn" onClick={() => go("log")}>
          Training eintragen
        </button>
      </div>
    </div>
  );
}

function PickQuest({ data, st, today }: { data: ArcData; st: ArcState; today: string }) {
  const last: Attire = [...data.sessions].sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.attire ?? "gi";
  const attire: Attire = data.ui.todayAttire?.day === today ? data.ui.todayAttire.attire : plannedAttire(data, today) ?? last;
  const acc = data.ui.accepted?.day === today ? data.ui.accepted : null;
  const first = pickCards(st.offers, { attire });
  const cards: QuestOffer[] = data.ui.rerollDay === today ? pickCards(st.offers, { attire, exclude: new Set(first.map((c) => c.node)) }) : first;
  const options = acc ? [{ ...acc, P: 0, reason: "prog" as const }, ...cards.filter((c) => c.node !== acc.node)] : cards;
  return (
    <div className="mat">
      <div className="mat-top">
        <button type="button" className="btn ghost small" onClick={() => go("heute")}>
          <X size={16} aria-hidden="true" /> <span>Schließen</span>
        </button>
      </div>
      <header className="mat-head">
        <h1 className="mat-name">Welche Karte nimmst du mit?</h1>
        <p className="mat-task">Eine Technik, die du heute mitzählst. Der Zähler bleibt offen, bis du das Training einträgst.</p>
      </header>
      <div className="mat-pick">
        {options.map((q) => (
          <button key={q.node} type="button" className="mat-card" onClick={() => matStart(today, q)}>
            <KindBadge kind={q.kind} />
            <b>{TECH[q.node].name}</b>
            <small>{questTask(q)}</small>
          </button>
        ))}
        {!options.length ? <p className="muted">Heute gibt es keine Karte. Trag das Training danach einfach ein.</p> : null}
      </div>
    </div>
  );
}
