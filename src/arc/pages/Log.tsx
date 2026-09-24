import { useMemo, useState } from "react";
import { Check, Gift, Map as MapIcon, Minus, Plus, RotateCcw } from "lucide-react";
import type { ArcData, ArcState, Attire, Belt as BeltId, Control, Format, QuestKind, Roll, Session, Size } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import { RARITY, SLOTS, inventory, itemById, perkText, talismanBonus } from "../core/items.ts";
import { SECTORS, TECH, TECHS } from "../core/techniques.ts";
import { LEVELS, QUEST, SEALS, STUCK, rankOf } from "../core/lore.ts";
import { compute, diff, pickCards, xpParts } from "../core/model.ts";
import type { Diff } from "../core/model.ts";
import { BELTS, nf0, signed } from "../format.ts";
import { deleteSession, saveSession } from "../actions.ts";
import { go, uid } from "../store.ts";
import { useGear } from "../useGear.ts";
import { questTask, successLabel } from "../questText.ts";
import { KindBadge, SecTitle, Seg, Stepper } from "../components/ui.tsx";
import Burst from "../components/Burst.tsx";
import ItemIcon from "../components/ItemIcon.tsx";
import type { BurstEvent } from "../components/Burst.tsx";

interface Draft {
  format: Format;
  attire: Attire;
  taught: string;
  rolls: Roll[];
  quest: { node: string; kind: QuestKind; xp: number; att: number; succ: number; done: boolean } | null;
  worked: string;
  stuck: string;
}

const SIZES: { v: Size; label: string }[] = [
  { v: "leichter", label: "leichter" },
  { v: "gleich", label: "gleich" },
  { v: "schwerer", label: "schwerer" },
];
const CTRL: { v: Control; label: string }[] = [
  { v: 0, label: "Partner" },
  { v: 0.5, label: "gleich" },
  { v: 1, label: "ich" },
];

function initialDraft(data: ArcData, st: ArcState, today: string): Draft {
  const last = [...data.sessions].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const attire: Attire = data.ui.todayAttire?.day === today ? data.ui.todayAttire.attire : last?.attire ?? "gi";
  const acc = data.ui.accepted?.day === today ? data.ui.accepted : null;
  const top = acc ?? pickCards(st.offers, { attire })[0] ?? null;
  const own: BeltId = data.profile?.belt ?? "weiss";
  return {
    format: "class",
    attire,
    taught: "",
    rolls: Array.from({ length: 5 }, () => ({ belt: own, size: "gleich" as Size, sf: 0, sa: 0, c: 0.5 as Control })),
    quest: top ? { node: top.node, kind: top.kind, xp: top.xp, att: 0, succ: 0, done: false } : null,
    worked: "",
    stuck: "",
  };
}

function toSession(d: Draft, today: string, id: string): Session {
  return {
    id,
    date: today,
    format: d.format,
    attire: d.attire,
    taught: d.taught || null,
    rolls: d.rolls.map((r) => ({ ...r })),
    quest: d.quest ? { ...d.quest, succ: Math.min(d.quest.succ, d.quest.att) } : null,
    worked: d.worked || null,
    stuck: d.stuck || null,
    createdAt: Date.now(),
  };
}

/** Talisman XP is fixed when the session is saved, so changing gear later does not rewrite history. */
function withBonus(s: Session, talisman: ItemDef | undefined): Session {
  const bonus = talismanBonus(talisman, s);
  return bonus ? { ...s, bonus } : s;
}

export default function Log({ data, st, today }: { data: ArcData; st: ArcState; today: string }) {
  const [draft, setDraft] = useState<Draft>(() => initialDraft(data, st, today));
  const [result, setResult] = useState<{ s: Session; D: Diff; loot: ItemDef[] } | null>(null);
  const { gear, owned } = useGear(data, st);
  const belt = data.profile?.belt ?? "weiss";
  const talisman = gear.talisman;
  const [burst, setBurst] = useState<BurstEvent[]>([]);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const setRoll = (i: number, patch: Partial<Roll>) => setDraft((d) => ({ ...d, rolls: d.rolls.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const setQuest = (patch: Partial<NonNullable<Draft["quest"]>>) => setDraft((d) => (d.quest ? { ...d, quest: { ...d.quest, ...patch } } : d));

  const preview = useMemo(() => {
    const s = withBonus(toSession(draft, today, "preview"), talisman);
    const B = compute({ ...data, sessions: [...data.sessions, s] }, today);
    return { s, D: diff(st, B) };
  }, [draft, data, st, today, talisman]);

  const eta = 6 + 4 * draft.rolls.length + (draft.quest ? 5 : 0) + (draft.taught ? 2 : 0) + (draft.worked || draft.stuck ? 6 : 0);
  const cards = pickCards(st.offers, { attire: draft.attire });
  const questOptions = [...new Map([...(draft.quest ? [draft.quest] : []), ...cards].map((q) => [q.node, q])).values()];

  const save = () => {
    const s = withBonus(toSession(draft, today, uid()), talisman);
    const next = { ...data, sessions: [...data.sessions, s] };
    const after = compute(next, today);
    const D = diff(st, after);
    const loot = [...inventory(next, after).keys()]
      .filter((id) => !owned.has(id))
      .map((id) => itemById(id, next, after))
      .filter((x): x is ItemDef => !!x);
    saveSession(s);
    setResult({ s, D, loot });
    setBurst([...burstsFor(D, after), ...lootBursts(loot)]);
    window.scrollTo({ top: 0 });
  };

  if (result) {
    return (
      <div className="page log">
        {burst.length ? <Burst ev={burst[0]} onClose={() => setBurst((b) => b.slice(1))} /> : null}
        <SecTitle kanji="記録" eyebrow="Gespeichert" title="Training eingetragen" />
        <ResultPanel s={result.s} D={result.D} saved loot={result.loot} belt={belt} />
        <div className="row wrap">
          <button type="button" className="btn primary" onClick={() => go("karte", result.D.levels[0]?.id ?? result.D.mastery[0]?.id)}>
            <MapIcon size={16} aria-hidden="true" />
            <span>Auf der Karte ansehen</span>
          </button>
          {result.loot.length ? (
            <button type="button" className="btn ghost" onClick={() => go("held", "ausruestung")}>
              <Gift size={16} aria-hidden="true" /> <span>Beute ausrüsten</span>
            </button>
          ) : null}
          <button type="button" className="btn ghost" onClick={() => go("heute")}>
            Fertig
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              deleteSession(result.s.id);
              setResult(null);
            }}
          >
            <RotateCcw size={16} aria-hidden="true" /> Rückgängig
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page log">
      <SecTitle kanji="記録" eyebrow="Nach dem Training" title="Training eintragen">
        Standardwerte sind vorausgefüllt, du tippst nur, was abweicht. Rechts siehst du live, was das Training bewegt.
      </SecTitle>
      <div className="log-grid">
        <form
          className="log-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <fieldset className="step">
            <legend>
              <b>1</b> Check-in <small>1 Tipp</small>
            </legend>
            <div className="row wrap">
              <Seg label="Trainingsart" value={draft.format} onChange={(v) => set({ format: v })} options={[{ v: "class", label: "Kurs" }, { v: "open", label: "Open Mat" }]} />
              <Seg label="Gi oder No-Gi" value={draft.attire} onChange={(v) => set({ attire: v })} options={[{ v: "gi", label: "Gi" }, { v: "nogi", label: "No-Gi" }]} />
            </div>
            <label className="field">
              <span className="fl">Heute im Kurs gezeigt (optional)</span>
              <TechSelect id="arc-taught" value={draft.taught} onChange={(v) => set({ taught: v })} empty="nichts Neues" attire={draft.attire} />
            </label>
          </fieldset>

          <fieldset className="step">
            <legend>
              <b>2</b> Roll-Karten <small>≈ 4 s pro Roll</small>
            </legend>
            <p className="note-line">Gürtel und Größe des Partners, Subs in beide Richtungen, wer den Roll kontrolliert hat.</p>
            <div className="rolls">
              {draft.rolls.map((r, i) => (
                <div key={i} className="roll">
                  <span className="rnum">#{i + 1}</span>
                  <div className="field">
                    <span className="fl">Gürtel</span>
                    <div className="belt-dots" role="radiogroup" aria-label={`Gürtel Partner Roll ${i + 1}`}>
                      {BELTS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          role="radio"
                          aria-checked={r.belt === b.id}
                          aria-label={b.name}
                          title={b.name}
                          className={`belt-dot${r.belt === b.id ? " on" : ""}`}
                          style={{ ["--bc" as string]: b.color, ["--bar" as string]: b.bar }}
                          onClick={() => setRoll(i, { belt: b.id })}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <span className="fl">Größe</span>
                    <Seg label={`Größe Partner Roll ${i + 1}`} value={r.size} onChange={(v) => setRoll(i, { size: v })} options={SIZES} />
                  </div>
                  <div className="field">
                    <span className="fl">Subs ich</span>
                    <Stepper value={r.sf} onChange={(v) => setRoll(i, { sf: v })} max={9} label={`Subs ich Roll ${i + 1}`} />
                  </div>
                  <div className="field">
                    <span className="fl">Subs Partner</span>
                    <Stepper value={r.sa} onChange={(v) => setRoll(i, { sa: v })} max={9} label={`Subs Partner Roll ${i + 1}`} />
                  </div>
                  <div className="field">
                    <span className="fl">Kontrolle</span>
                    <Seg label={`Kontrolle Roll ${i + 1}`} value={r.c} onChange={(v) => setRoll(i, { c: v })} options={CTRL} />
                  </div>
                </div>
              ))}
            </div>
            <div className="row">
              <button type="button" className="btn ghost small" disabled={draft.rolls.length >= 12} onClick={() => set({ rolls: [...draft.rolls, { ...draft.rolls[draft.rolls.length - 1] ?? { belt: "weiss", size: "gleich", sf: 0, sa: 0, c: 0.5 }, sf: 0, sa: 0 }] })}>
                <Plus size={14} aria-hidden="true" /> Roll
              </button>
              <button type="button" className="btn ghost small" disabled={!draft.rolls.length} onClick={() => set({ rolls: draft.rolls.slice(0, -1) })}>
                <Minus size={14} aria-hidden="true" /> Roll
              </button>
            </div>
          </fieldset>

          <fieldset className="step quest-step">
            <legend>
              <b>3</b> Quest-Zähler <small>im Training mitgezählt</small>
            </legend>
            {draft.quest ? (
              <>
                <div className="quest-pick">
                  <label className="field">
                    <span className="fl">Quest</span>
                    <select
                      id="arc-quest"
                      value={draft.quest.node}
                      onChange={(e) => {
                        const q = questOptions.find((o) => o.node === e.target.value);
                        if (q) set({ quest: { node: q.node, kind: q.kind, xp: q.xp, att: 0, succ: 0, done: false } });
                      }}
                    >
                      {questOptions.map((q) => (
                        <option key={q.node} value={q.node}>
                          {QUEST[q.kind].name}: {TECH[q.node].name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <KindBadge kind={draft.quest.kind} />
                </div>
                <p className="note-line">{questTask(draft.quest)}</p>
                {draft.quest.kind === "kata" ? (
                  <label className="check">
                    <input id="arc-kata-done" type="checkbox" checked={draft.quest.done} onChange={(e) => setQuest({ done: e.target.checked })} />
                    Drill erledigt
                  </label>
                ) : (
                  <div className="row wrap">
                    <div className="field">
                      <span className="fl">Versuche</span>
                      <Stepper big value={draft.quest.att} onChange={(v) => setQuest({ att: v, succ: Math.min(draft.quest?.succ ?? 0, v) })} label="Versuche" />
                    </div>
                    <div className="field">
                      <span className="fl">{successLabel(draft.quest)}</span>
                      <Stepper big value={draft.quest.succ} onChange={(v) => setQuest({ succ: v })} max={draft.quest.att} label={successLabel(draft.quest)} />
                    </div>
                  </div>
                )}
                <button type="button" className="linkish" onClick={() => set({ quest: null })}>
                  Heute ohne Quest trainiert
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn ghost small"
                onClick={() => {
                  const q = cards[0];
                  if (q) set({ quest: { node: q.node, kind: q.kind, xp: q.xp, att: 0, succ: 0, done: false } });
                }}
              >
                Quest wieder hinzufügen
              </button>
            )}
          </fieldset>

          <fieldset className="step">
            <legend>
              <b>4</b> Notiz <small>optional · +15 XP</small>
            </legend>
            <label className="field">
              <span className="fl">Hat funktioniert</span>
              <TechSelect id="arc-worked" value={draft.worked} onChange={(v) => set({ worked: v })} empty="nichts eingetragen" attire={draft.attire} />
            </label>
            <div className="field">
              <span className="fl">Festgehangen in</span>
              <div className="chips">
                {Object.entries(STUCK).map(([k, v]) => (
                  <button key={k} type="button" className={`chip${draft.stuck === k ? " on" : ""}`} aria-pressed={draft.stuck === k} onClick={() => set({ stuck: draft.stuck === k ? "" : k })}>
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          <div className="savebar">
            <span className="eta">
              Eingabezeit etwa <b>{eta} s</b>
              {talisman?.perk ? (
                <small>
                  Talisman {talisman.name}: {perkText(talisman.perk)}
                </small>
              ) : null}
            </span>
            <button type="submit" className="btn primary big">
              <Check size={18} aria-hidden="true" />
              <span>Training speichern</span>
            </button>
          </div>
        </form>
        <aside className="log-side">
          <ResultPanel s={preview.s} D={preview.D} />
        </aside>
      </div>
    </div>
  );
}

function TechSelect({ id, value, onChange, empty, attire }: { id: string; value: string; onChange: (v: string) => void; empty: string; attire: Attire }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{empty}</option>
      <optgroup label="Fundament">
        {TECHS.filter((x) => x.sector === "fund").map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </optgroup>
      {SECTORS.flatMap((s) =>
        s.branches.map((b) => (
          <optgroup key={`${s.id}-${b.id}`} label={`${s.name} · ${b.name}`}>
            {TECHS.filter((x) => x.sector === s.id && x.branch === b.id && (attire === "gi" || x.nogi)).map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </optgroup>
        )),
      )}
    </select>
  );
}

function ResultPanel({ s, D, saved, loot, belt }: { s: Session; D: Diff; saved?: boolean; loot?: ItemDef[]; belt?: BeltId }) {
  const parts = xpParts(s, D);
  const ups = D.levels.filter((l) => l.to > l.from);
  const proven = D.dataLevels.filter((l) => l.to > l.from && !ups.some((u) => u.id === l.id));
  return (
    <div className={`result${saved ? " saved" : ""}`}>
      <div className="result-burst" aria-hidden="true" />
      <p className="eyebrow">{saved ? "Beute dieses Trainings" : "Vorschau · noch nicht gespeichert"}</p>
      <p className="xp-gain">
        +{nf0.format(D.xp)}
        <small>XP</small>
      </p>
      <ul className="parts">
        {parts.map(([k, v]) => (
          <li key={k}>
            <span>{k}</span>
            <b>+{nf0.format(v)}</b>
          </li>
        ))}
      </ul>
      <ul className="deltas">
        {D.lvlTo > D.lvlFrom ? <li className="up big">Level {D.lvlFrom} → {D.lvlTo}</li> : null}
        {D.weekGoal ? <li className="up">Wochenziel erreicht · Flamme {D.streakFrom} → {D.streakTo}</li> : null}
        {ups.map((l) => (
          <li key={l.id} className="up">
            <button type="button" className="linkish strong" onClick={() => go("karte", l.id)}>
              {TECH[l.id].name}
            </button>{" "}
            · Stufe {l.from} → {l.to} {LEVELS[l.to]}
          </li>
        ))}
        {proven.map((l) => (
          <li key={l.id} className="up">
            <button type="button" className="linkish strong" onClick={() => go("karte", l.id)}>
              {TECH[l.id].name}
            </button>{" "}
            · {D.confirmed.includes(l.id) ? `Einschätzung bestätigt, Stufe ${l.to}` : `Stufe ${l.to} im Roll bewiesen`}
          </li>
        ))}
        {D.mastery
          .filter((m) => !ups.some((l) => l.id === m.id))
          .map((m) => (
            <li key={m.id} className={m.d > 0 ? "up" : "down"}>
              {TECH[m.id].name} · Meisterung {signed(m.d, 1)}
            </li>
          ))}
        <li className={D.ki >= 0 ? "up" : "down"}>Ki {signed(D.ki)}</li>
        {D.seals.map((id) => (
          <li key={id} className="up">
            Siegel: {SEALS.find((x) => x.id === id)?.name}
          </li>
        ))}
      </ul>
      {loot?.length ? (
        <div className="loot">
          <p className="k">Beute</p>
          <ul>
            {loot.map((x) => (
              <li key={x.id} className={`item r-${x.rarity}`} style={{ ["--rc" as string]: RARITY[x.rarity].color }}>
                <ItemIcon item={x} belt={belt ?? "weiss"} size={44} />
                <span>
                  <b>{x.name}</b>
                  <small>
                    {RARITY[x.rarity].name} · {slotName(x)}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="adelta">
        {SECTORS.map((sc) => {
          const d = D.attrs[sc.id];
          return (
            <span key={sc.id}>
              {sc.name}
              <b className={d > 0.05 ? "pos" : d < -0.05 ? "neg" : ""}>{signed(d, 1)}</b>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function slotName(x: ItemDef) {
  return x.slot === "patch" ? "Aufnäher" : SLOTS.find((s) => s.id === x.slot)?.name ?? x.slot;
}

function lootBursts(loot: ItemDef[]): BurstEvent[] {
  const drops = loot.filter((x) => x.src.t === "drop");
  const earned = loot.filter((x) => x.src.t !== "drop");
  const out: BurstEvent[] = [];
  if (drops.length) {
    const best = drops.find((x) => x.rarity === "legendary") ?? drops.find((x) => x.rarity === "epic") ?? drops[0];
    out.push({
      kicker: `Beute · ${RARITY[best.rarity].name}`,
      title: drops.map((x) => x.name).join(" · "),
      lines: drops.map((x) => x.desc),
      tone: best.rarity === "legendary" || best.rarity === "epic" ? "gold" : "ai",
    });
  }
  if (earned.length) out.push({ kicker: "Freigeschaltet", title: earned.map((x) => x.name).join(" · "), lines: earned.map((x) => x.desc), tone: "gold" });
  return out;
}

function burstsFor(D: Diff, after: ArcState): BurstEvent[] {
  const out: BurstEvent[] = [];
  const tokui = D.levels.filter((l) => l.to === 5 && l.from < 5);
  for (const t of tokui) out.push({ kicker: "Neue Tokui-Waza", title: TECH[t.id].name, lines: [`Titel freigeschaltet: ${after.title}`, "Diese Technik trifft jetzt auch gegen Stärkere."], tone: "gold" });
  if (D.lvlTo > D.lvlFrom) {
    const lines = [`Level ${D.lvlFrom} → ${D.lvlTo}`];
    if (rankOf(D.lvlTo) !== rankOf(D.lvlFrom)) lines.push(`Neuer Rang: ${rankOf(D.lvlTo)}`);
    out.push({ kicker: "Aufstieg", title: "Level up!", lines, tone: "ai" });
  }
  const sharp = D.levels.filter((l) => l.to === 4 && l.from < 4);
  if (sharp.length) out.push({ kicker: "Stufe 4 · Geschärft", title: sharp.map((l) => TECH[l.id].name).join(" · "), lines: ["Funktioniert jetzt zuverlässig im Roll."], tone: "ai" });
  if (D.seals.length) out.push({ kicker: "Siegel erhalten", title: SEALS.find((s) => s.id === D.seals[0])?.name ?? "Siegel", lines: D.seals.map((id) => SEALS.find((s) => s.id === id)?.desc ?? ""), tone: "beni" });
  return out;
}

