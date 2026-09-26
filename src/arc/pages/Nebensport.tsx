import { useMemo, useState } from "react";
import { RotateCcw, UserRound } from "lucide-react";
import type { ArcData, ArcState, CrossSession, SportId } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import { inventory, itemById } from "../core/items.ts";
import { TECHS } from "../core/techniques.ts";
import { BODY, CROSS_W, INTENSITY_NAME, SPORT, SPORTS } from "../core/sports.ts";
import { compute, crossXp, diff } from "../core/model.ts";
import type { Diff } from "../core/model.ts";
import { nf0, signed } from "../format.ts";
import { deleteCross, saveCross } from "../actions.ts";
import { go, uid } from "../store.ts";
import { useGear } from "../useGear.ts";
import { SPORT_ICON } from "../sportIcons.ts";
import ChapterEnd from "../components/ChapterEnd.tsx";
import type { SeaStep } from "../core/reward.ts";
import { seaFor } from "../reward.ts";
import { newlyOpen, stillClosed } from "../core/unlocks.ts";
import type { Feature, Opening } from "../core/unlocks.ts";
import { crossWays } from "../chapterRows.tsx";
import { SecTitle, Seg, Stepper } from "../components/ui.tsx";
import { LogSwitch } from "./Turnier.tsx";

const STAND = TECHS.filter((x) => x.sector === "stand").sort((a, b) => a.name.localeCompare(b.name, "de"));
const MINUTES = [30, 45, 60, 90];

interface Draft {
  sport: SportId;
  date: string;
  minutes: number;
  intensity: number;
  tech: string;
  att: number;
  succ: number;
}

function toCross(d: Draft, id: string): CrossSession {
  const grappling = SPORT[d.sport].grappling;
  return {
    id,
    date: d.date,
    sport: d.sport,
    minutes: Math.max(5, Math.min(300, Math.round(d.minutes))),
    intensity: d.intensity,
    tech: grappling && d.tech ? d.tech : null,
    att: grappling && d.tech ? d.att : 0,
    succ: grappling && d.tech ? Math.min(d.succ, d.att) : 0,
    createdAt: Date.now(),
  };
}

export default function Nebensport({ data, st, today }: { data: ArcData; st: ArcState; today: string }) {
  const mine = (data.profile?.sports ?? []).map((s) => s.id);
  const ordered = [...SPORTS].sort((a, b) => Number(mine.includes(b.id)) - Number(mine.includes(a.id)));
  const [draft, setDraft] = useState<Draft>({ sport: ordered[0].id, date: today, minutes: 60, intensity: 2, tech: "", att: 0, succ: 0 });
  const [result, setResult] = useState<{ c: CrossSession; D: Diff; loot: ItemDef[]; before: ArcState; after: ArcState; sea: SeaStep; opened: Opening[]; closed: Feature[] } | null>(null);
  const { owned } = useGear(data, st);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const sport = SPORT[draft.sport];
  const belt = data.profile?.belt ?? "weiss";

  const preview = useMemo(() => {
    const c = toCross(draft, "preview");
    const after = compute({ ...data, cross: [...(data.cross ?? []), c] }, today);
    return { c, D: diff(st, after) };
  }, [draft, data, st, today]);

  const save = () => {
    const c = toCross(draft, uid());
    const next = { ...data, cross: [...(data.cross ?? []), c] };
    const after = compute(next, today);
    const D = diff(st, after);
    const loot = [...inventory(next, after).keys()]
      .filter((id) => !owned.has(id))
      .map((id) => itemById(id, next, after))
      .filter((x): x is ItemDef => !!x);
    saveCross(c);
    setResult({ c, D, loot, before: st, after, sea: seaFor(data, next, today, c.date, "cross"), opened: newlyOpen(data, next), closed: stillClosed(next).map((o) => o.id) });
    window.scrollTo({ top: 0 });
  };

  if (result) {
    return (
      <ChapterEnd
        kanji="鍛"
        seal={{ kind: "鍛錬", date: result.c.date }}
        title={`${SPORT[result.c.sport].name} eingetragen`}
        before={result.before}
        after={result.after}
        ways={crossWays(result.D, result.after)}
        sea={result.sea}
        opened={result.opened}
        closed={result.closed}
        loot={result.loot}
        belt={belt}
        actions={
          <>
            <button type="button" className="btn primary" onClick={() => go("held")}>
              <UserRound size={18} aria-hidden="true" /> <span>Körperwerte ansehen</span>
            </button>
            <button type="button" className="btn" onClick={() => go("heute")}>
              Fertig
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                deleteCross(result.c.id);
                setResult(null);
              }}
            >
              <RotateCcw size={16} aria-hidden="true" /> Rückgängig
            </button>
          </>
        }
      />
    );
  }

  return (
    <div className="page log">
      <SecTitle h1 kanji="鍛" eyebrow="Neben der Matte" title="Nebensport eintragen">
        Kraft, Ausdauer, Ringen und Co. zählen nicht fürs BJJ-Wochenziel. Sie bringen XP und bauen deine Körperwerte auf. Takedowns aus Ringen, Judo und Sambo zählen für
        deine Stand-Techniken, mit drei Vierteln des Gewichts eines BJJ-Rolls.
      </SecTitle>
      <LogSwitch value="nebensport" />
      <div className="log-grid">
        <form
          className="log-form washi-sheet"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <fieldset className="step">
            <legend>
              <b aria-hidden="true">一</b> <span className="sr-only">1.</span> Sportart
            </legend>
            <div className="sport-tiles" role="radiogroup" aria-label="Sportart">
              {ordered.map((s) => {
                const Icon = SPORT_ICON[s.id];
                const on = draft.sport === s.id;
                return (
                  <button key={s.id} type="button" role="radio" aria-checked={on} className={`sport-tile${on ? " on" : ""}`} onClick={() => set({ sport: s.id, tech: s.grappling ? draft.tech : "" })}>
                    <Icon size={30} strokeWidth={2.2} aria-hidden="true" />
                    <span>{s.name}</span>
                    {mine.includes(s.id) ? <small>deine</small> : null}
                  </button>
                );
              })}
            </div>
            <label className="field" style={{ maxWidth: 220 }}>
              <span className="fl">Datum</span>
              <input id="arc-cross-date" type="date" value={draft.date} max={today} onChange={(e) => set({ date: e.target.value || today })} />
            </label>
          </fieldset>

          <fieldset className="step">
            <legend>
              <b aria-hidden="true">二</b> <span className="sr-only">2.</span> Umfang
            </legend>
            <div className="field">
              <span className="fl">Dauer in Minuten</span>
              <div className="row wrap">
                <div className="chips">
                  {MINUTES.map((m) => (
                    <button key={m} type="button" className={`chip${draft.minutes === m ? " on" : ""}`} aria-pressed={draft.minutes === m} onClick={() => set({ minutes: m })}>
                      {m}
                    </button>
                  ))}
                </div>
                <label className="field" style={{ width: 110 }}>
                  <span className="sr-only">Minuten</span>
                  <input id="arc-cross-min" inputMode="numeric" value={draft.minutes} onChange={(e) => set({ minutes: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
                </label>
              </div>
            </div>
            <div className="field">
              <span className="fl">Intensität</span>
              <Seg label="Intensität" value={draft.intensity} onChange={(v) => set({ intensity: v })} options={[1, 2, 3].map((v) => ({ v, label: INTENSITY_NAME[v] }))} />
            </div>
          </fieldset>

          {sport.grappling ? (
            <fieldset className="step quest-step">
              <legend>
                <b aria-hidden="true">三</b> <span className="sr-only">3.</span> Takedowns <small>optional</small>
              </legend>
              <label className="field">
                <span className="fl">Technik</span>
                <select id="arc-cross-tech" value={draft.tech} onChange={(e) => set({ tech: e.target.value })}>
                  <option value="">keine bestimmte</option>
                  {STAND.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </label>
              {draft.tech ? (
                <div className="counters">
                  <div className="field">
                    <span className="fl">Versuche</span>
                    <Stepper big value={draft.att} onChange={(v) => set({ att: v, succ: Math.min(draft.succ, v) })} label="Versuche" />
                  </div>
                  <div className="field">
                    <span className="fl">Treffer</span>
                    <Stepper big value={draft.succ} onChange={(v) => set({ succ: v })} max={draft.att} label="Treffer" />
                  </div>
                </div>
              ) : null}
              <p className="note-line">Ohne Versuche zählt die Technik als gedrillt. Mit Versuchen zählt sie als Live-Beleg mit Gewicht {nf0.format(CROSS_W * 100)} %.</p>
            </fieldset>
          ) : null}

          <div className="savebar">
            <span className="eta">
              <b>+{nf0.format(crossXp(preview.c))} XP</b>
              <small>zählt nicht fürs BJJ-Wochenziel</small>
            </span>
            <button type="submit" className="btn primary big seal-btn">
              <span className="seal" aria-hidden="true">
                鍛
              </span>
              <span>Speichern</span>
            </button>
          </div>
        </form>
        <aside className="log-side">
          <section className="panel result" aria-label="Vorschau">
            <p className="eyebrow">Vorschau, noch nicht gespeichert</p>
            <p className="xp-gain">
              +{nf0.format(preview.D.xp)}
              <small>XP</small>
            </p>
            <div className="body-stats">
              {BODY.map((b) => (
                <div key={b.id} className="body-row">
                  <span aria-hidden="true" />
                  <span>{b.name}</span>
                  <div className="bar thin" aria-hidden="true">
                    <i style={{ width: `${preview.D.body[b.id] + st.body[b.id]}%` }} />
                  </div>
                  <b>{signed(preview.D.body[b.id])}</b>
                </div>
              ))}
            </div>
            <p className="small muted">Körperwerte zeigen, was du in den letzten acht Wochen neben der Matte getan hast.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
