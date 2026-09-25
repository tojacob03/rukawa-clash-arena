import { useMemo, useState } from "react";
import { Check, Gift, Minus, Plus, RotateCcw, ScanEye, Trophy } from "lucide-react";
import type { ArcData, ArcState, Attire, Belt as BeltId, CompMatch, Competition } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import { RARITY, inventory, itemById } from "../core/items.ts";
import { TECH } from "../core/techniques.ts";
import { SEALS } from "../core/lore.ts";
import { compXp, compute, diff } from "../core/model.ts";
import type { Diff } from "../core/model.ts";
import { BELTS, nf0, signed } from "../format.ts";
import { deleteCompetition, saveCompetition } from "../actions.ts";
import { go, uid } from "../store.ts";
import { useGear } from "../useGear.ts";
import { opponentRows, powerTier } from "../scan.ts";
import Burst from "../components/Burst.tsx";
import type { BurstEvent } from "../components/Burst.tsx";
import ItemIcon from "../components/ItemIcon.tsx";
import Scouter, { Silhouette } from "../components/Scouter.tsx";
import { SecTitle, Seg } from "../components/ui.tsx";
import { METHODS, ORGS, PLACE_NAME, RESULTS, SUBS, WEIGHTS } from "../compText.ts";

interface Draft {
  name: string;
  date: string;
  org: string;
  attire: Attire;
  weight: string;
  place: number;
  matches: CompMatch[];
}

function toComp(draft: Draft, id: string): Competition {
  return {
    id,
    date: draft.date,
    name: draft.name.trim() || "Turnier",
    org: draft.org || undefined,
    attire: draft.attire,
    weight: draft.weight || undefined,
    place: draft.place,
    matches: draft.matches.map((m) => ({ ...m, tech: m.method === "sub" ? m.tech ?? null : null })),
    createdAt: Date.now(),
  };
}

export default function Turnier({ data, st, today }: { data: ArcData; st: ArcState; today: string }) {
  const own = data.profile?.belt ?? "weiss";
  const lastAttire = [...data.sessions].sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.attire ?? "gi";
  const [draft, setDraft] = useState<Draft>({ name: "", date: today, org: "", attire: lastAttire, weight: "", place: 0, matches: [{ result: "win", method: "points", oppBelt: own }] });
  const [scanFor, setScanFor] = useState<number | null>(null);
  const [result, setResult] = useState<{ c: Competition; D: Diff; loot: ItemDef[] } | null>(null);
  const [burst, setBurst] = useState<BurstEvent[]>([]);
  const { owned } = useGear(data, st);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const setMatch = (i: number, patch: Partial<CompMatch>) => setDraft((d) => ({ ...d, matches: d.matches.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  const asOf = draft.date > today ? draft.date : today;

  const preview = useMemo(() => {
    const c = toComp(draft, "preview");
    const before = compute(data, asOf);
    const after = compute({ ...data, competitions: [...(data.competitions ?? []), c] }, asOf);
    return { c, D: diff(before, after) };
  }, [draft, data, asOf]);

  const save = () => {
    const c = toComp(draft, uid());
    const next = { ...data, competitions: [...(data.competitions ?? []), c] };
    const before = compute(data, asOf);
    const after = compute(next, asOf);
    const D = diff(before, after);
    const loot = [...inventory(next, after).keys()]
      .filter((id) => !owned.has(id))
      .map((id) => itemById(id, next, after))
      .filter((x): x is ItemDef => !!x);
    saveCompetition(c);
    setResult({ c, D, loot });
    const w = c.matches.filter((m) => m.result === "win").length;
    const l = c.matches.filter((m) => m.result === "loss").length;
    const events: BurstEvent[] = [
      {
        kicker: c.name,
        title: c.place ? `${PLACE_NAME[c.place]}!` : "Gekämpft!",
        lines: [`Bilanz ${w}-${l}`, `+${nf0.format(D.xp)} XP · Power Level ${signed(D.power)}`],
        tone: c.place === 1 ? "gold" : c.place ? "ai" : "beni",
      },
    ];
    if (loot.length) events.push({ kicker: "Freigeschaltet", title: loot.map((x) => x.name).join(" · "), lines: loot.map((x) => x.desc), tone: "gold" });
    setBurst(events);
    window.scrollTo({ top: 0 });
  };

  if (result) {
    return (
      <div className="page log">
        {burst.length ? <Burst ev={burst[0]} onClose={() => setBurst((b) => b.slice(1))} /> : null}
        <SecTitle kanji="試合" eyebrow="Gespeichert" title="Turnier eingetragen" />
        <CompResultPanel c={result.c} D={result.D} loot={result.loot} belt={own} saved />
        <div className="row wrap">
          <button type="button" className="btn primary" onClick={() => go("held", "turniere")}>
            <Trophy size={16} aria-hidden="true" /> <span>Kampfrekord</span>
          </button>
          {result.loot.length ? (
            <button type="button" className="btn ghost" onClick={() => go("held", "ausruestung")}>
              <Gift size={16} aria-hidden="true" /> <span>Beute ausrüsten</span>
            </button>
          ) : null}
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              deleteCompetition(result.c.id);
              setResult(null);
            }}
          >
            <RotateCcw size={16} aria-hidden="true" /> Rückgängig
          </button>
        </div>
      </div>
    );
  }

  const scanMatch = scanFor !== null ? draft.matches[scanFor] : null;
  const opp = scanMatch ? opponentRows(st.ru, scanMatch.oppBelt ?? own) : null;

  return (
    <div className="page log">
      {opp && scanFor !== null ? (
        <Scouter
          onClose={() => setScanFor(null)}
          target={{ name: `Gegner ${scanFor + 1}`, power: opp.power, tier: opp.tier, rows: opp.rows, portrait: <Silhouette size={180} />, foot: `Du: ${nf0.format(Math.round(st.ru * 10))} · ${powerTier(st.ru)}. Die Schätzung kennt nur den Gürtel.` }}
        />
      ) : null}
      <SecTitle kanji="試合" eyebrow="Wettkampf" title="Turnier eintragen">
        Ein Turnier zählt doppelt: jeder Kampf bewegt dein Power Level stärker als ein Roll, Aufgabe-Siege gelten als harter Beleg für die Technik.
      </SecTitle>
      <LogSwitch value="turnier" />
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
              <b>1</b> Turnier
            </legend>
            <label className="field">
              <span className="fl">Name</span>
              <input id="arc-comp-name" value={draft.name} maxLength={60} placeholder="z. B. Berlin Open" onChange={(e) => set({ name: e.target.value })} />
            </label>
            <div className="row wrap">
              <label className="field">
                <span className="fl">Datum</span>
                <input id="arc-comp-date" type="date" value={draft.date} max={today} onChange={(e) => set({ date: e.target.value || today })} />
              </label>
              <div className="field">
                <span className="fl">Gi oder No-Gi</span>
                <Seg label="Gi oder No-Gi" value={draft.attire} onChange={(v) => set({ attire: v })} options={[{ v: "gi", label: "Gi" }, { v: "nogi", label: "No-Gi" }]} />
              </div>
            </div>
            <div className="field">
              <span className="fl">Veranstalter oder Regelwerk</span>
              <div className="chips">
                {ORGS.map((o) => (
                  <button key={o} type="button" className={`chip${draft.org === o ? " on" : ""}`} aria-pressed={draft.org === o} onClick={() => set({ org: draft.org === o ? "" : o })}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="fl">Gewichtsklasse</span>
              <div className="chips">
                {WEIGHTS.map((w) => (
                  <button key={w} type="button" className={`chip${draft.weight === w ? " on" : ""}`} aria-pressed={draft.weight === w} onClick={() => set({ weight: draft.weight === w ? "" : w })}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className="step">
            <legend>
              <b>2</b> Kämpfe <small>{draft.matches.length}</small>
            </legend>
            <div className="rolls">
              {draft.matches.map((m, i) => (
                <div key={i} className="roll match">
                  <span className="rnum">#{i + 1}</span>
                  <div className="field">
                    <span className="fl">Ergebnis</span>
                    <Seg label={`Ergebnis Kampf ${i + 1}`} value={m.result} onChange={(v) => setMatch(i, { result: v })} options={RESULTS} />
                  </div>
                  <div className="field">
                    <span className="fl">Entschieden durch</span>
                    <Seg label={`Methode Kampf ${i + 1}`} value={m.method} onChange={(v) => setMatch(i, { method: v })} options={METHODS} />
                  </div>
                  {m.method === "sub" ? (
                    <label className="field">
                      <span className="fl">{m.result === "loss" ? "Aufgegeben gegen" : "Technik"}</span>
                      <select value={m.tech ?? ""} onChange={(e) => setMatch(i, { tech: e.target.value || null })}>
                        <option value="">nicht angegeben</option>
                        {SUBS.filter((x) => draft.attire === "gi" || x.nogi).map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <div className="field">
                    <span className="fl">Gegner</span>
                    <div className="row">
                      <div className="belt-dots" role="radiogroup" aria-label={`Gürtel Gegner Kampf ${i + 1}`}>
                        {BELTS.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            role="radio"
                            aria-checked={(m.oppBelt ?? own) === b.id}
                            aria-label={b.name}
                            title={b.name}
                            className={`belt-dot${(m.oppBelt ?? own) === b.id ? " on" : ""}`}
                            style={{ ["--bc" as string]: b.color, ["--bar" as string]: b.bar }}
                            onClick={() => setMatch(i, { oppBelt: b.id as BeltId })}
                          />
                        ))}
                      </div>
                      <button type="button" className="btn small scan" onClick={() => setScanFor(i)}>
                        <ScanEye size={14} aria-hidden="true" /> <span>Scannen</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="row">
              <button type="button" className="btn ghost small" disabled={draft.matches.length >= 10} onClick={() => set({ matches: [...draft.matches, { result: "win", method: "points", oppBelt: own }] })}>
                <Plus size={14} aria-hidden="true" /> Kampf
              </button>
              <button type="button" className="btn ghost small" disabled={draft.matches.length <= 1} onClick={() => set({ matches: draft.matches.slice(0, -1) })}>
                <Minus size={14} aria-hidden="true" /> Kampf
              </button>
            </div>
          </fieldset>

          <fieldset className="step quest-step">
            <legend>
              <b>3</b> Platzierung
            </legend>
            <Seg label="Platzierung" value={draft.place} onChange={(v) => set({ place: v })} options={[0, 1, 2, 3].map((v) => ({ v, label: v ? `${v}. · ${PLACE_NAME[v]}` : "keine" }))} />
          </fieldset>

          <div className="savebar">
            <span className="eta">
              <b>+{nf0.format(compXp(preview.c))} XP</b>
              <small>fürs Antreten und jeden Kampf</small>
            </span>
            <button type="submit" className="btn primary big">
              <Check size={18} aria-hidden="true" />
              <span>Turnier speichern</span>
            </button>
          </div>
        </form>
        <aside className="log-side">
          <CompResultPanel c={preview.c} D={preview.D} belt={own} />
        </aside>
      </div>
    </div>
  );
}

export function LogSwitch({ value }: { value: "training" | "turnier" }) {
  return (
    <Seg
      label="Was eintragen?"
      value={value}
      onChange={(v) => go("log", v === "turnier" ? "turnier" : undefined)}
      options={[
        { v: "training", label: "Training" },
        { v: "turnier", label: "Turnier" },
      ]}
    />
  );
}

function CompResultPanel({ c, D, loot, belt, saved }: { c: Competition; D: Diff; loot?: ItemDef[]; belt: BeltId; saved?: boolean }) {
  const ups = D.dataLevels.filter((l) => l.to > l.from);
  const w = c.matches.filter((m) => m.result === "win").length;
  const l = c.matches.filter((m) => m.result === "loss").length;
  const d = c.matches.length - w - l;
  return (
    <div className={`result${saved ? " saved" : ""}`}>
      <div className="result-burst" aria-hidden="true" />
      <p className="eyebrow">{saved ? "Beute dieses Turniers" : "Vorschau · noch nicht gespeichert"}</p>
      <p className="xp-gain">
        +{nf0.format(D.xp)}
        <small>XP</small>
      </p>
      <div className="comp-score">
        {c.place ? <span className={`medal m${c.place}`}>{c.place}</span> : null}
        <b>
          {w}-{l}
          {d ? `-${d}` : ""}
        </b>
        <small>{c.matches.filter((m) => m.result === "win" && m.method === "sub").length} per Aufgabe</small>
      </div>
      <ul className="deltas">
        {D.lvlTo > D.lvlFrom ? <li className="up big">Level {D.lvlFrom} → {D.lvlTo}</li> : null}
        <li className={D.power >= 0 ? "up" : "down"}>Power Level {signed(D.power)}</li>
        {ups.map((u) => (
          <li key={u.id} className="up">
            {TECH[u.id].name} · Stufe {u.from} → {u.to}
          </li>
        ))}
        {D.seals.map((id) => (
          <li key={id} className="up">
            Siegel: {SEALS.find((x) => x.id === id)?.name}
          </li>
        ))}
      </ul>
      {loot?.length ? (
        <div className="loot">
          <p className="k">Freigeschaltet</p>
          <ul>
            {loot.map((x) => (
              <li key={x.id} className={`item r-${x.rarity}`} style={{ ["--rc" as string]: RARITY[x.rarity].color }}>
                <ItemIcon item={x} belt={belt} size={44} />
                <span>
                  <b>{x.name}</b>
                  <small>{RARITY[x.rarity].name}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

