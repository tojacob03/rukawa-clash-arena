// Scouter: a lens that reads out fighters. Four modes: you (Power Level,
// trend, strengths, record by belt), a sparring partner (what is at stake,
// your record against the belt, a plan for the roll), a tournament opponent
// (stakes, your weapons, what to watch) and the weekly boss. Original design,
// static: the only orchestrated motion in the app is the chapter end.

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import type { ArcData, ArcState, Attire, Belt, Size } from "../core/types.ts";
import { SECTORS, TECH } from "../core/techniques.ts";
import { isoOf } from "../core/model.ts";
import { bossScan, opponentScan, partnerScan, selfScan } from "../core/scouter.ts";
import type { Plan, Stake } from "../core/scouter.ts";
import { BELT, BELTS, nf0, pct, shortDate, signed } from "../format.ts";
import { go } from "../store.ts";
import { selfRows } from "../scan.ts";
import type { ScoutMode, ScoutRequest } from "../scan.ts";
import { LevelPill, Seg } from "./ui.tsx";

const SIZES: { v: Size; label: string }[] = [
  { v: "leichter", label: "Leichter" },
  { v: "gleich", label: "Gleich" },
  { v: "schwerer", label: "Schwerer" },
];
const ATTIRE: { v: Attire; label: string }[] = [
  { v: "gi", label: "Gi" },
  { v: "nogi", label: "No-Gi" },
];

export default function Scouter({
  req,
  data,
  st,
  portrait,
  onClose,
}: {
  req: ScoutRequest;
  data: ArcData;
  st: ArcState;
  portrait: ReactNode;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<ScoutMode>(req.mode);
  const [belt, setBelt] = useState<Belt>(req.belt ?? data.profile?.belt ?? "weiss");
  const [size, setSize] = useState<Size>(req.size ?? "gleich");
  const [attire, setAttire] = useState<Attire>(req.attire ?? data.character?.mode ?? "gi");
  const lens = useRef<HTMLDivElement>(null);
  const tabs: [ScoutMode, string][] = req.mode === "gegner" ? [["gegner", "Gegner"], ["du", "Du"], ["boss", "Boss"]] : [["du", "Du"], ["partner", "Partner"], ["boss", "Boss"]];

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    lens.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !lens.current) return;
      const els = [...lens.current.querySelectorAll<HTMLElement>('button, [tabindex="0"], select, input')].filter((x) => !x.hasAttribute("disabled"));
      if (!els.length) return;
      const i = els.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        els[els.length - 1].focus();
      } else if (!e.shiftKey && i === els.length - 1) {
        e.preventDefault();
        els[0].focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      before?.focus?.();
    };
  }, [onClose]);

  const onTabKey = (e: ReactKeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const n = (i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    setMode(tabs[n][0]);
    lens.current?.querySelectorAll<HTMLElement>('[role="tab"]')[n]?.focus();
  };
  const toTech = (id: string) => {
    onClose();
    go("karte", id);
  };

  return (
    <div className="scouter" role="dialog" aria-modal="true" aria-label="Scouter" onClick={onClose}>
      <div className="scouter-lens" ref={lens} onClick={(e) => e.stopPropagation()}>
        <div className="sc-tabs" role="tablist" aria-label="Was der Scouter liest">
          {tabs.map(([m, label], i) => (
            <button
              key={m}
              type="button"
              role="tab"
              id={`sc-tab-${m}`}
              aria-selected={mode === m}
              aria-controls="sc-panel"
              tabIndex={mode === m ? 0 : -1}
              className={mode === m ? "on" : ""}
              onClick={() => setMode(m)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {label}
            </button>
          ))}
        </div>
        <div id="sc-panel" role="tabpanel" aria-labelledby={`sc-tab-${mode}`}>
          {mode === "du" ? (
            <SelfView data={data} st={st} portrait={portrait} onTech={toTech} />
          ) : mode === "boss" ? (
            <BossView st={st} onTech={toTech} />
          ) : (
            <FoeView
              kind={mode}
              label={req.label}
              data={data}
              st={st}
              belt={belt}
              size={size}
              attire={attire}
              setBelt={setBelt}
              setSize={setSize}
              setAttire={setAttire}
              onTech={toTech}
            />
          )}
        </div>
        <button type="button" className="sc-close" onClick={onClose}>
          Scouter abnehmen
        </button>
      </div>
    </div>
  );
}

function Target({ children }: { children: ReactNode }) {
  return (
    <div className="sc-target" aria-hidden="true">
      {children}
      <span className="sc-ret tl" />
      <span className="sc-ret tr" />
      <span className="sc-ret bl" />
      <span className="sc-ret br" />
    </div>
  );
}

function Rows({ rows }: { rows: { label: string; value: ReactNode; bar?: number }[] }) {
  return (
    <ul className="sc-rows">
      {rows.map((r) => (
        <li key={r.label}>
          <span>{r.label}</span>
          <b>{r.value}</b>
          {r.bar !== undefined ? (
            <i aria-hidden="true">
              <em style={{ width: `${Math.max(0, Math.min(100, r.bar))}%` }} />
            </i>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function TechChips({ ids, st, onTech }: { ids: string[]; st: ArcState; onTech: (id: string) => void }) {
  if (!ids.length) return <p className="small">Noch keine passenden Techniken mit Daten.</p>;
  return (
    <div className="sc-chips">
      {ids.map((id) => (
        <button key={id} type="button" className="sc-chip" onClick={() => onTech(id)}>
          <span>{TECH[id].name}</span>
          <LevelPill level={st.nodes[id].level} rust={st.nodes[id].rust} />
        </button>
      ))}
    </div>
  );
}

// ── You ───────────────────────────────────────────────────────────────────

function SelfView({ data, st, portrait, onTech }: { data: ArcData; st: ArcState; portrait: ReactNode; onTech: (id: string) => void }) {
  const s = useMemo(() => selfScan(data, st), [data, st]);
  const sec = (id: string) => SECTORS.find((x) => x.id === id)!.name;
  const today = isoOf(st.asOf);
  return (
    <>
      <div className="sc-grid">
        <Target>{portrait}</Target>
        <div className="sc-read">
          <p className="sc-k">Ziel erfasst</p>
          <p className="sc-name">{data.profile?.name}</p>
          <p className="sc-k">Power Level</p>
          <p className="sc-pl">{nf0.format(s.power)}</p>
          <p className="sc-tier">
            {s.tier}
            <span className={`sc-delta ${s.trend8 >= 0 ? "up" : "down"}`}>{signed(s.trend8)} in 8 Wochen</span>
          </p>
          <PowerSpark series={s.series} peak={s.peak} />
        </div>
      </div>
      <div className="sc-cols">
        <section className="sc-sec">
          <h3>Achsen</h3>
          <Rows rows={SECTORS.map((x) => ({ label: x.name, value: nf0.format(st.attrs[x.id].val), bar: st.attrs[x.id].val }))} />
        </section>
        <section className="sc-sec">
          <h3>Analyse</h3>
          <Rows
            rows={[
              { label: "Stärkste Achse", value: sec(s.strongest.sector) },
              { label: "Schwächste Achse", value: sec(s.weakest.sector) },
              { label: "Treffer gegen Stärkere", value: nf0.format(s.vsStronger) },
              { label: "Techniken mit Rost", value: nf0.format(s.rust) },
              { label: "Rolls in 8 Wochen", value: nf0.format(s.form.rolls) },
              { label: "Deine Subs darin", value: nf0.format(s.form.sf) },
              { label: "Getappt darin", value: `${nf0.format(s.form.sa)}×` },
            ]}
          />
          {s.weapon ? (
            <>
              <p className="sc-k">Beste Waffe</p>
              <TechChips ids={[s.weapon]} st={st} onTech={onTech} />
            </>
          ) : null}
        </section>
        {s.byBelt.length ? (
          <section className="sc-sec">
            <h3>Bilanz nach Gürtel</h3>
            <table className="sc-table">
              <thead>
                <tr>
                  <th scope="col">Gürtel</th>
                  <th scope="col">Rolls</th>
                  <th scope="col">Subs</th>
                  <th scope="col">Getappt</th>
                </tr>
              </thead>
              <tbody>
                {s.byBelt.map((b) => (
                  <tr key={b.belt}>
                    <th scope="row">
                      <i className="sc-belt" style={{ ["--bc" as string]: BELT[b.belt].color }} aria-hidden="true" />
                      {BELT[b.belt].name}
                    </th>
                    <td>{b.rolls}</td>
                    <td>{b.sf}</td>
                    <td>{b.sa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
        <section className="sc-sec">
          <h3>Steckbrief</h3>
          <Rows rows={selfRows(data, st, today).filter((r) => !SECTORS.some((x) => x.name === r.label))} />
        </section>
      </div>
      <p className="sc-foot">Das Power Level ist dein Elo-Rating aus Rolls und Turnierkämpfen, mal zehn.</p>
    </>
  );
}

/** Power Level over 16 weeks. Pointer or arrow keys read out single weeks. */
export function PowerSpark({ series, peak }: { series: { day: number; power: number }[]; peak: { power: number; day: number } }) {
  const [i, setI] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const W = 280;
  const H = 64;
  const P = 7;
  const vals = series.map((p) => p.power);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(40, max - min);
  const lo = min - (span - (max - min)) / 2;
  const x = (k: number) => P + (k * (W - 2 * P)) / (series.length - 1);
  const y = (v: number) => H - P - ((v - lo) / span) * (H - 2 * P);
  const line = series.map((p, k) => `${k ? "L" : "M"}${x(k).toFixed(1)} ${y(p.power).toFixed(1)}`).join(" ");
  const area = `${line} L${x(series.length - 1).toFixed(1)} ${H - 1} L${x(0).toFixed(1)} ${H - 1} Z`;
  const last = series.length - 1;
  const at = (clientX: number) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    const px = ((clientX - r.left) / r.width) * W;
    const k = Math.round(((px - P) / (W - 2 * P)) * last);
    setI(Math.max(0, Math.min(last, k)));
  };
  const first = series[0];
  const label = (k: number) => (k === last ? "heute" : `${shortDate(isoOf(series[k].day))}`);
  return (
    <figure
      className="spark"
      tabIndex={0}
      aria-label={`Power Level der letzten 16 Wochen: von ${nf0.format(first.power)} auf ${nf0.format(series[last].power)}, Spitze ${nf0.format(peak.power)}. Pfeiltasten lesen einzelne Wochen.`}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setI(Math.max(0, (i ?? last + 1) - 1));
        else if (e.key === "ArrowRight") setI(Math.min(last, (i ?? -1) + 1));
        else return;
        e.preventDefault();
      }}
      onBlur={() => setI(null)}
    >
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" onPointerMove={(e) => at(e.clientX)} onPointerLeave={() => setI(null)}>
        <path d={area} className="spark-area" />
        <path d={line} className="spark-line" />
        {i !== null ? <line x1={x(i)} x2={x(i)} y1={0} y2={H} className="spark-cross" /> : null}
        {i !== null && i !== last ? <circle cx={x(i)} cy={y(series[i].power)} r={4} className="spark-dot" /> : null}
        <circle cx={x(last)} cy={y(series[last].power)} r={5} className="spark-now" />
      </svg>
      <figcaption>
        {i !== null ? (
          <span aria-live="polite">
            {label(i)}: <b>{nf0.format(series[i].power)}</b>
          </span>
        ) : (
          <span>
            Vor 16 Wochen {nf0.format(first.power)}, Spitze {nf0.format(peak.power)} am {shortDate(isoOf(peak.day))}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

// ── Partner and opponent ──────────────────────────────────────────────────

function Stakes({ stakes }: { stakes: Stake[] }) {
  return (
    <ul className="sc-stakes">
      {stakes.map((s) => (
        <li key={s.label} className={s.delta > 0 ? "up" : s.delta < 0 ? "down" : ""}>
          <span>{s.label}</span>
          <b>{signed(s.delta)}</b>
        </li>
      ))}
    </ul>
  );
}

function PlanBox({ plan, st, onTech }: { plan: Plan; st: ArcState; onTech: (id: string) => void }) {
  return (
    <div className="sc-plan">
      <p className="sc-plan-t">{plan.title}</p>
      <p className="small">{plan.text}</p>
      <TechChips ids={plan.focus} st={st} onTech={onTech} />
    </div>
  );
}

function FoeView({
  kind,
  label,
  data,
  st,
  belt,
  size,
  attire,
  setBelt,
  setSize,
  setAttire,
  onTech,
}: {
  kind: "partner" | "gegner";
  label?: string;
  data: ArcData;
  st: ArcState;
  belt: Belt;
  size: Size;
  attire: Attire;
  setBelt: (b: Belt) => void;
  setSize: (s: Size) => void;
  setAttire: (a: Attire) => void;
  onTech: (id: string) => void;
}) {
  const p = useMemo(() => (kind === "partner" ? partnerScan(data, st, belt, size, attire) : null), [kind, data, st, belt, size, attire]);
  const o = useMemo(() => (kind === "gegner" ? opponentScan(data, st, belt, attire) : null), [kind, data, st, belt, attire]);
  const s = (p ?? o)!;
  const legCaution = o?.weapons.some((id) => TECH[id].caution);
  return (
    <>
      <div className="sc-grid">
        <Target>
          <Silhouette width={180} belt={belt} build={kind === "partner" ? size : "gleich"} />
        </Target>
        <div className="sc-read">
          <div className="sc-pick">
            <div className="belt-dots" role="radiogroup" aria-label="Gürtel">
              {BELTS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="radio"
                  aria-checked={belt === b.id}
                  aria-label={b.name}
                  title={b.name}
                  className={`belt-dot${belt === b.id ? " on" : ""}`}
                  style={{ ["--bc" as string]: b.color, ["--bar" as string]: b.bar }}
                  onClick={() => setBelt(b.id)}
                />
              ))}
            </div>
            {kind === "partner" ? <Seg label="Größe" value={size} onChange={setSize} options={SIZES} /> : null}
            <Seg label="Gi oder No-Gi" value={attire} onChange={setAttire} options={ATTIRE} />
          </div>
          <p className="sc-k">{kind === "partner" ? "Partner" : label ?? "Gegner"}, geschätzt nach Gürtel{kind === "partner" ? " und Größe" : ""}</p>
          <p className="sc-pl">{nf0.format(s.power)}</p>
          <p className="sc-tier">
            {s.tier}
            <span className={`sc-delta ${s.gap >= 0 ? "up" : "down"}`}>Du {signed(s.gap)}</span>
          </p>
          <Rows rows={[{ label: kind === "partner" ? "Deine Erwartung im Roll" : "Deine Siegchance", value: pct(s.E), bar: s.E * 100 }]} />
        </div>
      </div>
      <div className="sc-cols">
        <section className="sc-sec">
          <h3>Was auf dem Spiel steht</h3>
          <p className="small">Änderung deines Power Levels{kind === "gegner" ? " (Turnierkämpfe zählen doppelt)" : ""}:</p>
          <Stakes stakes={s.stakes} />
        </section>
        <section className="sc-sec">
          <h3>Bisher gegen {BELT[belt].name}gurte</h3>
          {p ? (
            p.record.rolls ? (
              <Rows
                rows={[
                  { label: size === "schwerer" ? "Rolls gegen Schwerere" : size === "leichter" ? "Rolls gegen Leichtere" : "Rolls, gleich schwer", value: nf0.format(p.record.rolls) },
                  { label: "Deine Subs", value: nf0.format(p.record.sf) },
                  { label: "Getappt", value: nf0.format(p.record.sa) },
                  { label: "Kontrolle", value: p.record.ctrl > 0.6 ? "meist du" : p.record.ctrl < 0.4 ? "meist der Partner" : "ausgeglichen" },
                ]}
              />
            ) : (
              <p className="small">Noch kein Roll gegen diese Kombination eingetragen.</p>
            )
          ) : o ? (
            <Rows
              rows={[
                { label: "Turnierkämpfe", value: `${o.matches.w} Siege, ${o.matches.l} Niederlagen${o.matches.d ? `, ${o.matches.d} unentschieden` : ""}` },
                { label: "Rolls im Training", value: `${o.rolls.rolls}, davon ${o.rolls.sf} Subs und ${o.rolls.sa}× getappt` },
              ]}
            />
          ) : null}
        </section>
        {p ? (
          <section className="sc-sec wide">
            <h3>Plan für diesen Roll</h3>
            <PlanBox plan={p.plan} st={st} onTech={onTech} />
          </section>
        ) : o ? (
          <section className="sc-sec wide">
            <h3>Deine Waffen im {attire === "gi" ? "Gi" : "No-Gi"}</h3>
            <TechChips ids={o.weapons} st={st} onTech={onTech} />
            <p className="small">
              <b>Achtung:</b> {o.watch}
            </p>
            {legCaution ? <p className="small">Beinhebel sind je nach Regelwerk und Gürtel verboten. Prüf die Regeln deines Turniers.</p> : null}
          </section>
        ) : null}
      </div>
      <p className="sc-foot">Die Schätzung kennt nur Gürtel{kind === "partner" ? " und Größe" : ""}. Wie gut jemand wirklich ist, zeigt erst der Roll.</p>
    </>
  );
}

// ── Boss ──────────────────────────────────────────────────────────────────

function BossView({ st, onTech }: { st: ArcState; onTech: (id: string) => void }) {
  const b = bossScan(st);
  if (!b) {
    return (
      <div className="sc-grid">
        <Target>
          <BossGlyph calm />
        </Target>
        <div className="sc-read">
          <p className="sc-k">Kein Boss in Reichweite</p>
          <p className="sc-name">Ruhe im Dōjō</p>
          <p className="small">In den letzten 14 Tagen hast du nirgends festgehangen. Trag bei der Notiz ein, wo du feststeckst, dann taucht hier ein Boss auf.</p>
        </div>
      </div>
    );
  }
  const max = Math.max(b.hp, b.prev, 4);
  return (
    <>
      <div className="sc-grid">
        <Target>
          <BossGlyph />
        </Target>
        <div className="sc-read">
          <p className="sc-k">Wochenboss</p>
          <p className="sc-name">{b.boss}</p>
          <p className="sc-tier">{b.position}</p>
          <p className="sc-k">Lebenspunkte</p>
          <div className="sc-hp" role="img" aria-label={`${b.hp} von ${max} Lebenspunkten`}>
            {Array.from({ length: max }, (_, i) => (
              <i key={i} className={i < b.hp ? "on" : ""} />
            ))}
          </div>
          <Rows
            rows={[
              { label: "Festgehangen, 14 Tage", value: `${b.hp}×` },
              { label: "Die 14 Tage davor", value: `${b.prev}×` },
              { label: "Der Boss", value: b.trend },
            ]}
          />
        </div>
      </div>
      <section className="sc-sec wide">
        <h3>So besiegst du ihn</h3>
        <p className="small">
          {b.goal ? `Besiegt, wenn du in den nächsten 14 Tagen höchstens ${b.goal}× hier festhängst.` : "Besiegt, wenn du in den nächsten 14 Tagen hier nicht mehr festhängst."} Diese Techniken helfen, die Quest-Karten schlagen sie dir auch vor:
        </p>
        <TechChips ids={b.counters.map((c) => c.id)} st={st} onTech={onTech} />
      </section>
    </>
  );
}

/** Dark silhouette for partners and opponents: belt in its colour, build by size. */
export function Silhouette({ width = 180, belt, build = "gleich" }: { width?: number; belt?: Belt; build?: Size }) {
  const sx = build === "schwerer" ? 1.14 : build === "leichter" ? 0.88 : 1;
  const b = belt ? BELT[belt] : null;
  return (
    <svg width={width} height={(width * 4) / 3} viewBox="0 0 240 320" className="avatar silhouette">
      <g transform={`translate(120 0) scale(${sx} 1) translate(-120 0)`}>
        <g fill="#16171c">
          <ellipse cx={120} cy={96} rx={46} ry={48} />
          <rect x={110} y={126} width={20} height={26} />
          <path d="M78 150 Q120 141 162 150 Q172 156 170 172 L158 233 L82 233 L70 172 Q68 156 78 150 Z" />
          <path d="M80 160 L62 232 L78 238 L92 176 Z M160 160 L178 232 L162 238 L148 176 Z" />
          <path d="M84 226 L118 226 L114 296 L90 296 Z M122 226 L156 226 L150 296 L126 296 Z" />
        </g>
        {b ? (
          <g>
            <rect x={80} y={214} width={80} height={13} fill={b.color} stroke="#16171c" strokeWidth={2} />
            <rect x={132} y={214} width={16} height={13} fill={b.bar} />
          </g>
        ) : null}
      </g>
      <g fill="#f3b000">
        <circle cx={101} cy={104} r={4} />
        <circle cx={139} cy={104} r={4} />
      </g>
    </svg>
  );
}

function BossGlyph({ calm }: { calm?: boolean }) {
  return (
    <svg width={180} height={200} viewBox="0 0 180 200" className="avatar boss-glyph">
      <path d="M20 170 Q30 90 70 110 Q96 124 104 80 Q114 30 150 56 Q170 70 160 100" fill="none" stroke="#16171c" strokeWidth={30} strokeLinecap="round" opacity={calm ? 0.35 : 1} />
      <path d="M20 170 Q30 90 70 110 Q96 124 104 80 Q114 30 150 56 Q170 70 160 100" fill="none" stroke={calm ? "#f2f3ee" : "#c8203f"} strokeWidth={8} strokeLinecap="round" strokeDasharray={calm ? "4 10" : undefined} opacity={calm ? 0.5 : 1} />
      {calm ? null : (
        <g fill="#f3b000">
          <circle cx={150} cy={62} r={5} />
          <circle cx={162} cy={78} r={4} />
        </g>
      )}
      <path d="M8 188 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="#f2f3ee" strokeWidth={3} opacity={0.6} />
    </svg>
  );
}
