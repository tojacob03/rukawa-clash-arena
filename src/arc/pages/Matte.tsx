// Mat mode: the quest counter for the training itself. Huge buttons for
// sweaty hands, the screen stays on, a short buzz per tap (where the phone
// allows it), and the count goes straight into the log afterwards.

import { useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import type { ArcData, ArcState, Attire, QuestKind, QuestOffer, TechKind } from "../core/types.ts";
import { TECH, sectorName } from "../core/techniques.ts";
import { pickCards } from "../core/model.ts";
import { matSet, matStart } from "../actions.ts";
import { go } from "../store.ts";
import { questTask, successLabel } from "../questText.ts";
import { KindBadge } from "../components/ui.tsx";
import { plannedAttire } from "../plan.ts";

const KATA_ROUNDS = 3;

/** Points a success scores in a match (IBJJF): sweep and takedown 2, guard pass 3, back 4. */
const POINTS: Partial<Record<TechKind, number>> = { sweep: 2, takedown: 2, pass: 3, backtake: 4 };

/**
 * What a success looks like on the mat. A submission ends with the partner
 * tapping twice; a sweep, pass or back take scores like in a match. Escapes
 * and positions have no such sign.
 */
function successSign(node: string, kind: QuestKind): { t: "tap" } | { t: "pts"; n: number } | null {
  if (kind === "stand") return null;
  const k = TECH[node]?.kind;
  if (k === "sub") return { t: "tap" };
  const n = k ? POINTS[k] : undefined;
  return n ? { t: "pts", n } : null;
}

/** An open hand, palm down, fingers spread a little: the tap on the mat. */
const PALM = (
  <>
    <rect x={3} y={24} width={26} height={24} rx={11} />
    <rect x={4} y={4} width={5.5} height={24} rx={2.75} transform="rotate(-8 6.75 28)" />
    <rect x={11} y={0} width={5.5} height={27} rx={2.75} />
    <rect x={18} y={1} width={5.5} height={26} rx={2.75} transform="rotate(5 20.75 27)" />
    <rect x={24.5} y={6} width={5} height={22} rx={2.5} transform="rotate(12 27 28)" />
    <rect x={2} y={22} width={6} height={19} rx={3} transform="rotate(-42 5 40)" />
  </>
);

function SuccessMark({ sign }: { sign: { t: "tap" } | { t: "pts"; n: number } }) {
  if (sign.t === "tap")
    return (
      <span className="mat-fx" aria-hidden="true">
        <svg viewBox="0 0 120 70">
          <g transform="translate(30 16) rotate(-14)">
            <g className="palm">{PALM}</g>
          </g>
          <g transform="translate(70 12) rotate(10)">
            <g className="palm second">{PALM}</g>
          </g>
        </svg>
      </span>
    );
  return (
    <span className="mat-fx" aria-hidden="true">
      <span className="score">
        <b>+{sign.n}</b>
        <small>Punkte</small>
      </span>
    </span>
  );
}

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
  const [hits, setHits] = useState(0);

  if (!mat) return <PickQuest data={data} st={st} today={today} />;

  const x = TECH[mat.node];
  const kata = mat.kind === "kata";
  const label = successLabel(mat);
  const sign = successSign(mat.node, mat.kind);
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
          <button
            type="button"
            className="mat-pad hit"
            onClick={() => {
              // The phone buzzes like the sign: two taps, or one pulse per point.
              const pattern = sign?.t === "pts" ? Array.from({ length: sign.n * 2 - 1 }, (_, i) => (i % 2 ? 60 : 16)) : [20, 50, 20];
              push({ att: mat.att + 1, succ: mat.succ + 1 }, `${label} ${mat.succ + 1}`, pattern);
              setHits((h) => h + 1);
            }}
          >
            {label}
            <small>zählt auch als Versuch</small>
            {sign && hits ? <SuccessMark key={hits} sign={sign} /> : null}
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
