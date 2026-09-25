import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Anchor, BookOpen, Compass, Flag as FlagIcon, Lock, Map as MapIcon, Sailboat, Swords, Wind } from "lucide-react";
import type { ArcData, ArcState, FlagDesign, SeaId } from "../core/types.ts";
import { DEFAULT_SEA, ISLAND, SEA, SEAS, SHIPS, islandAt, rankIndex, route } from "../core/sea.ts";
import type { Island } from "../core/sea.ts";
import { ITEMS, RARITY } from "../core/items.ts";
import { CLASS } from "../core/classes.ts";
import { STUCK, rankOf } from "../core/lore.ts";
import { TECHS } from "../core/techniques.ts";
import { dayNum, rankAt } from "../core/model.ts";
import { bounty } from "../core/bounty.ts";
import { exploration, logbook, passage, seaMiles, weather } from "../core/voyage.ts";
import type { Explored, LogEntry, Weather } from "../core/voyage.ts";
import { CROSSES, EMBLEMS, FLAG_BG, FLAG_FG, HEADS, WEARS, normalizeFlag } from "../core/crewflag.ts";
import { BELT, nf0, shortDate } from "../format.ts";
import { go } from "../store.ts";
import { useGear } from "../useGear.ts";
import { PLACE_NAME } from "../compText.ts";
import { setFlag, setShipName } from "../actions.ts";
import SeaMap from "../components/SeaMap.tsx";
import Wanted from "../components/Wanted.tsx";
import Avatar from "../components/Avatar.tsx";
import ItemIcon from "../components/ItemIcon.tsx";
import CrewFlag from "../components/CrewFlag.tsx";
import Ship from "../components/ShipArt.tsx";
import { HeroKoma, Seg } from "../components/ui.tsx";

export function MapSwitch({ value }: { value: "karte" | "meer" }) {
  return (
    <Seg
      label="Karte wählen"
      value={value}
      onChange={(v) => go(v)}
      options={[
        { v: "karte", label: "Sternkarte" },
        { v: "meer", label: "Seekarte" },
      ]}
    />
  );
}

type View = "karte" | "schiff" | "logbuch";
const VIEWS: { id: View; label: string; icon: ReactNode }[] = [
  { id: "karte", label: "Karte", icon: <MapIcon size={16} aria-hidden="true" /> },
  { id: "schiff", label: "Schiff", icon: <Sailboat size={16} aria-hidden="true" /> },
  { id: "logbuch", label: "Logbuch", icon: <BookOpen size={16} aria-hidden="true" /> },
];

export default function SeaPage({ data, st, today, arg }: { data: ArcData; st: ArcState; today: string; arg: string | null }) {
  const p = data.profile!;
  const view: View = arg === "schiff" || arg === "logbuch" ? arg : "karte";
  const sea = p.homeSea ?? DEFAULT_SEA;
  const r = route(sea);
  const current = rankIndex(p.belt, p.stripes);
  const g = useGear(data, st);
  const pas = useMemo(() => passage(data, today), [data, today]);
  const wx = useMemo(() => weather(data, today, st.paused), [data, today, st.paused]);
  const expl = useMemo(() => exploration(data, today), [data, today]);
  const here = r[current];
  const next = r[current + 1];
  const moving = !!next && pas.progress >= 0.08 && pas.idx === current;
  const miles = seaMiles(data, today);

  return (
    <div className="page sea-page">
      <div className="map-head">
        <div>
          <MapSwitch value="meer" />
          <p className="eyebrow">Seekarte, Heimat {SEA[sea].name}</p>
          <h1 className="page-h">{moving ? `Unterwegs nach ${next.name}` : `Dein Schiff liegt vor ${here.name}`}</h1>
        </div>
        <ul className="map-stats">
          <li>
            <Anchor size={15} aria-hidden="true" /> Insel {current + 1} von {r.length}
          </li>
          {next ? (
            <li>
              <Compass size={16} aria-hidden="true" /> Nächste Insel: {next.name}, {rankLabel(next)}
            </li>
          ) : (
            <li>Ziel erreicht: Kap Kuro</li>
          )}
          <li>
            <Wind size={15} aria-hidden="true" /> {wx.name}, {nf0.format(miles)} Seemeilen
          </li>
          <li>
            <Swords size={15} aria-hidden="true" /> {st.comps.events} Turniere
          </li>
        </ul>
      </div>
      <nav className="tabs" aria-label="Seekarte">
        {VIEWS.map((v) => (
          <button key={v.id} type="button" className={view === v.id ? "on" : ""} aria-current={view === v.id ? "page" : undefined} onClick={() => go("meer", v.id === "karte" ? undefined : v.id)}>
            {v.icon} {v.label}
          </button>
        ))}
      </nav>
      {view === "schiff" ? (
        <ShipView data={data} st={st} today={today} wx={wx} />
      ) : view === "logbuch" ? (
        <LogView data={data} today={today} />
      ) : (
        <ChartView data={data} st={st} today={today} arg={arg} expl={expl} progress={pas.idx === current ? pas.progress : 0} wx={wx} avatar={<Avatar look={g.character.look} mode={g.character.mode} gear={g.gear} belt={p.belt} stripes={p.stripes} weightKg={p.weightKg} size={150} crop="head" />} />
      )}
    </div>
  );
}

const rankLabel = (is: Island) => `${BELT[is.belt].name}gurt${is.stripe ? `, ${is.stripe}. Streifen` : ""}`;
const shipSail = (data: ArcData, st: ArcState) => (data.profile?.cls ? CLASS[data.profile.cls].color : CLASS[st.clsDetected].color) ?? "#f1bf57";
const rustCount = (st: ArcState) => TECHS.filter((x) => st.nodes[x.id].rust).length;

// ── Chart ─────────────────────────────────────────────────────────────────

function ChartView({ data, st, today, arg, expl, progress, wx, avatar }: { data: ArcData; st: ArcState; today: string; arg: string | null; expl: Explored[]; progress: number; wx: Weather; avatar: ReactNode }) {
  const p = data.profile!;
  const sea = p.homeSea ?? DEFAULT_SEA;
  const r = route(sea);
  const current = rankIndex(p.belt, p.stripes);
  const start = Math.min(current, rankIndex(p.startBelt, p.startStripes ?? 0));
  const scroller = useRef<HTMLDivElement>(null);
  const comps: Record<string, { n: number; best: number; list: NonNullable<ArcData["competitions"]> }> = {};
  for (const c of data.competitions ?? []) {
    const rk = rankAt(data, dayNum(c.date));
    const is = islandAt(rk.belt, rk.stripes, sea);
    const e = (comps[is.id] ??= { n: 0, best: 0, list: [] });
    e.n++;
    if (c.place && (!e.best || c.place < e.best)) e.best = c.place;
    e.list.push(c);
  }
  const selected = arg && ISLAND[arg] ? arg : r[current].id;
  const here = r[current];
  const explored = Object.fromEntries(expl.map((e) => [e.island.id, e.found.filter((f) => f.date).length]));

  useEffect(() => {
    const el = scroller.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = (here.x / 1200) * el.scrollWidth - el.clientWidth / 2;
  }, [here.x]);

  return (
    <>
      <div className="sea-layout">
        <div className="sea-scroll" ref={scroller}>
          <SeaMap
            marks={{
              sea,
              current,
              start,
              comps: Object.fromEntries(Object.entries(comps).map(([k, v]) => [k, { n: v.n, best: v.best }])),
              shipColor: shipSail(data, st),
              boss: st.boss ? STUCK[st.boss.key].boss : null,
              belt: p.belt,
              flag: data.character?.flag,
              progress,
              weather: wx.kind,
              explored,
              hull: st.body.kraft,
              sails: st.body.ausdauer,
              barnacles: rustCount(st),
            }}
            selected={selected}
            onSelect={(id) => go("meer", id)}
          />
        </div>
        <aside className="sea-side">
          <IslandCard is={ISLAND[selected]} data={data} sea={sea} current={current} start={start} comps={comps[selected]?.list ?? []} explored={expl.find((e) => e.island.id === selected) ?? null} />
          <Wanted name={p.name} bounty={bounty(data, st)} line={`${rankOf(st.lvl)}, ${BELT[p.belt].name}gurt, ${p.cls ? CLASS[p.cls].name : CLASS[st.clsDetected].name}`} portrait={avatar} />
        </aside>
      </div>

      <section className="panel sea-lore">
        <h2 className="h3">Die Welt</h2>
        <p className="muted small">
          Ein roter Gebirgskamm teilt die Welt von Norden nach Süden, die Große Strömung umrundet sie von Westen nach Osten. Wo sich beide kreuzen, liegt das Tor der vier
          Strömungen. Zu beiden Seiten der Strömung liegen die windstillen Kalmengürtel. Jeder Streifen ist eine Insel: Als Weißgurt segelst du in deinem Heimatmeer, mit
          dem Blaugurt geht es durchs Tor in die Äußere Strömung, mit dem Braungurt über den Kammpass in die Tiefe Strömung und am Ende nach Kap Kuro. Mit jedem Training
          segelt dein Schiff ein Stück weiter zur nächsten Insel und erkundet die, an der es liegt: erst die Anlegestelle, nach acht Trainings ein Wahrzeichen, nach
          fünfzehn das Geheimnis der Insel. Turniere erscheinen als gekreuzte Klingen, dein Wochenboss als Seeungeheuer neben dem Schiff.
        </p>
        <div className="sea-legend">
          {SEAS.map((s) => (
            <div key={s.id} className={s.id === sea ? "mine" : ""} style={{ ["--sc" as string]: s.color }}>
              <b>{s.name}</b>
              <small>{s.desc}</small>
            </div>
          ))}
        </div>
        <button type="button" className="linkish" onClick={() => go("held", "steckbrief")}>
          Heimatmeer im Steckbrief ändern
        </button>
      </section>
    </>
  );
}

function IslandCard({
  is,
  data,
  sea,
  current,
  start,
  comps,
  explored,
}: {
  is: Island;
  data: ArcData;
  sea: SeaId;
  current: number;
  start: number;
  comps: NonNullable<ArcData["competitions"]>;
  explored: Explored | null;
}) {
  const idx = route(sea).findIndex((x) => x.id === is.id);
  const onRoute = idx >= 0;
  const p = data.profile!;
  let status: string;
  if (!onRoute) status = `Liegt im ${SEA[is.sea!].name}. Nicht auf deiner Route, aber andere starten hier.`;
  else if (idx === current) status = "Hier liegt dein Schiff.";
  else if (idx < current) {
    if (idx < start) status = "Erreicht vor der App.";
    else {
      const pr = [...data.promotions].sort((a, b) => (a.date < b.date ? -1 : 1)).find((x) => rankIndex(x.belt, x.stripes) >= idx);
      status = pr ? `Erreicht am ${shortDate(pr.date)} ${pr.date.slice(0, 4)}.` : "Erreicht.";
    }
  } else {
    const steps = idx - current;
    status = steps === 1 ? "Nächstes Ziel: der nächste Streifen." : `Noch ${steps} Streifen entfernt.`;
  }
  const items = ITEMS.filter((x) => x.src.t === "rank" && x.src.belt === is.belt && x.src.stripes === is.stripe && (is.belt !== "weiss" || is.sea === sea));
  const nextFind = explored?.found.find((f) => !f.date);
  return (
    <section className="panel isle-card">
      <p className="eyebrow">
        {is.sea ? SEA[is.sea].name : is.belt === "blau" || is.belt === "lila" ? "Äußere Strömung" : "Tiefe Strömung"}, {rankLabel(is)}
      </p>
      <h2 className="isle-title">{is.name}</h2>
      <p className="small">{is.desc}</p>
      <p className={`isle-status${onRoute && idx === current ? " here" : ""}`}>{status}</p>
      {explored ? (
        <div className="isle-explore">
          <p className="k">
            Landgang: {explored.trainings} {explored.trainings === 1 ? "Training" : "Trainings"} hier
          </p>
          <ul>
            {explored.found.map((f) => (
              <li key={f.need} className={f.date ? "found" : ""}>
                {f.date ? <FlagIcon size={15} aria-hidden="true" /> : <Lock size={15} aria-hidden="true" />}
                <span>{f.date ? f.name : "Noch verborgen"}</span>
                <small>{f.date ? shortDate(f.date) : `ab ${f.need} Trainings`}</small>
              </li>
            ))}
          </ul>
          {nextFind && idx === current ? (
            <p className="small muted">
              Noch {nextFind.need - explored.trainings} {nextFind.need - explored.trainings === 1 ? "Training" : "Trainings"} bis zur nächsten Entdeckung.
            </p>
          ) : null}
        </div>
      ) : onRoute && idx < start ? (
        <p className="small muted">Vor der App erreicht: unerkundet, deine Erinnerung kennt sie besser.</p>
      ) : null}
      {items.length ? (
        <div className="isle-items">
          <p className="k">Wartet hier</p>
          {items.map((x) => (
            <span key={x.id} className="isle-item" style={{ ["--rc" as string]: RARITY[x.rarity].color }}>
              <ItemIcon item={x} belt={p.belt} size={30} />
              {x.name}
            </span>
          ))}
        </div>
      ) : null}
      {comps.length ? (
        <div className="isle-items">
          <p className="k">Turniere hier</p>
          {comps.map((c) => (
            <span key={c.id} className="isle-item">
              {c.place ? <span className={`medal m${c.place}`}>{c.place}</span> : <Swords size={16} aria-hidden="true" />}
              {c.name}, {PLACE_NAME[c.place]}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

// ── Ship ──────────────────────────────────────────────────────────────────

function Bar({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <li>
      <span>{label}</span>
      <b>{nf0.format(value)}</b>
      <i aria-hidden="true">
        <em style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </i>
      <small>{hint}</small>
    </li>
  );
}

function ShipView({ data, st, today, wx }: { data: ArcData; st: ArcState; today: string; wx: Weather }) {
  const p = data.profile!;
  const sea = p.homeSea ?? DEFAULT_SEA;
  const r = route(sea);
  const current = rankIndex(p.belt, p.stripes);
  const pas = passage(data, today);
  const flag = normalizeFlag(data.character?.flag);
  const barnacles = rustCount(st);
  const defaultName = `Die ${p.name}`;
  const [name, setName] = useState(data.character?.shipName ?? defaultName);
  const cls = SHIPS[p.belt];
  const nextBelt = (["blau", "lila", "braun", "schwarz"] as const).find((b) => rankIndex(b, 0) > current);
  const next = r[current + 1];
  const since = pas.idx === current ? pas.miles : 0;
  const pct = Math.round((pas.idx === current ? pas.progress : 0) * 100);
  const noCross = !st.body.total;

  return (
    <>
      <HeroKoma label="Dein Schiff" className="ship-koma">
        <div className="ship-hero">
          <div className="ship-pic">
            <Ship look={{ belt: p.belt, sail: shipSail(data, st), flag, hull: st.body.kraft, sails: st.body.ausdauer, barnacles }} width={420} label={`${cls.name} mit deiner Flagge`} />
          </div>
          <div className="ship-id">
            <label className="field ship-name">
              <span className="fl">Name deines Schiffs</span>
              <input id="arc-ship-name" value={name} maxLength={28} onChange={(e) => setName(e.target.value)} onBlur={() => setShipName(name === defaultName ? "" : name)} />
            </label>
            <p className="ship-class">
              {cls.name}, {BELT[p.belt].name}gurt
            </p>
            <p className="small">{cls.desc}</p>
            {nextBelt ? (
              <p className="small muted">
                Mit dem {BELT[nextBelt].name}gurt wird daraus eine {SHIPS[nextBelt].name}.
              </p>
            ) : null}
            <div className={`wx wx-${wx.kind}`}>
              <Wind size={18} aria-hidden="true" />
              <div>
                <b>{wx.name}</b>
                <p className="small">{wx.text}</p>
              </div>
            </div>
          </div>
        </div>
      </HeroKoma>

      <div className="ship-cols">
        <section className="panel">
          <h2 className="h3">Reise</h2>
          <ul className="ship-bars">
            <li>
              <span>Seemeilen gesamt</span>
              <b>{nf0.format(seaMiles(data, today))}</b>
            </li>
            <li>
              <span>Seit der letzten Insel</span>
              <b>{nf0.format(since)}</b>
            </li>
            {next ? <Bar label={`Auf dem Weg nach ${next.name}`} value={pct} hint="Ankommen tut dein Schiff erst mit dem nächsten Streifen." /> : null}
          </ul>
          <p className="small muted">Jedes Training bringt 10 Seemeilen, ein Turnier 20, eine Einheit Nebensport 3.</p>
        </section>

        <section className="panel">
          <h2 className="h3">Zustand</h2>
          <ul className="ship-bars">
            <Bar label="Rumpf" value={st.body.kraft} hint="Kraft aus dem Nebensport" />
            <Bar label="Segel" value={st.body.ausdauer} hint="Ausdauer aus dem Nebensport" />
            <Bar label="Takelage" value={st.body.beweglichkeit} hint="Beweglichkeit aus dem Nebensport" />
          </ul>
          <p className="small">
            {barnacles
              ? `${barnacles} ${barnacles === 1 ? "Muschel hängt" : "Muscheln hängen"} am Rumpf: so viele Techniken rosten. Eine Schmiede-Quest kratzt sie ab.`
              : "Der Rumpf ist sauber: keine Technik rostet."}
          </p>
          {noCross ? (
            <button type="button" className="linkish" onClick={() => go("log", "nebensport")}>
              Nebensport eintragen und das Schiff stärken
            </button>
          ) : null}
        </section>
      </div>

      <FlagEditor flag={flag} />
    </>
  );
}

function Swatch({ hex, on, label, onClick }: { hex: string; on: boolean; label: string; onClick: () => void }) {
  return <button type="button" role="radio" aria-checked={on} aria-label={label} title={label} className={`swatch${on ? " on" : ""}`} style={{ ["--sw" as string]: hex }} onClick={onClick} />;
}

function FlagEditor({ flag }: { flag: FlagDesign }) {
  const set = (patch: Partial<FlagDesign>) => setFlag({ ...flag, ...patch });
  const group = (title: string, names: string[], key: "emblem" | "cross" | "head") => (
    <div className="flag-group">
      <span className="fl" id={`flag-${key}`}>
        {title}
      </span>
      <div className="flag-opts" role="radiogroup" aria-labelledby={`flag-${key}`}>
        {names.map((n, i) => (
          <button key={n} type="button" role="radio" aria-checked={flag[key] === i} className={`flag-opt${flag[key] === i ? " on" : ""}`} onClick={() => set({ [key]: i })}>
            <CrewFlag design={{ ...flag, [key]: i, ...(key === "head" && !WEARS.has(flag.emblem) ? { emblem: 0 } : {}) }} width={64} />
            <span>{n}</span>
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <section className="panel flag-editor">
      <div className="flag-head">
        <div>
          <h2 className="h3">Deine Flagge</h2>
          <p className="small muted">Sie weht auf deinem Schiff auf der Seekarte.</p>
        </div>
        <CrewFlag design={flag} width={180} label={`Deine Flagge: ${EMBLEMS[flag.emblem]}`} />
      </div>
      <div className="flag-group">
        <span className="fl" id="flag-bg">
          Tuch
        </span>
        <div className="swatches" role="radiogroup" aria-labelledby="flag-bg">
          {FLAG_BG.map((c, i) => (
            <Swatch key={c.name} hex={c.hex} label={c.name} on={flag.bg === i} onClick={() => set({ bg: i })} />
          ))}
        </div>
      </div>
      <div className="flag-group">
        <span className="fl" id="flag-fg">
          Farbe des Zeichens
        </span>
        <div className="swatches" role="radiogroup" aria-labelledby="flag-fg">
          {FLAG_FG.map((c, i) => (
            <Swatch key={c.name} hex={c.hex} label={c.name} on={flag.fg === i} onClick={() => set({ fg: i })} />
          ))}
        </div>
      </div>
      {group("Zeichen", EMBLEMS, "emblem")}
      {group("Dahinter", CROSSES, "cross")}
      {WEARS.has(flag.emblem) ? group("Auf dem Kopf", HEADS, "head") : null}
    </section>
  );
}

// ── Log ───────────────────────────────────────────────────────────────────

const LOG_ICON: Record<LogEntry["kind"], ReactNode> = {
  start: <Sailboat size={16} aria-hidden="true" />,
  island: <Anchor size={16} aria-hidden="true" />,
  land: <FlagIcon size={16} aria-hidden="true" />,
  mark: <Compass size={16} aria-hidden="true" />,
  comp: <Swords size={16} aria-hidden="true" />,
  milestone: <BookOpen size={16} aria-hidden="true" />,
  cross: <Wind size={16} aria-hidden="true" />,
  dock: <Anchor size={16} aria-hidden="true" />,
};

function LogView({ data, today }: { data: ArcData; today: string }) {
  const all = useMemo(() => logbook(data, today), [data, today]);
  const [n, setN] = useState(40);
  const shown = all.slice(0, n);
  const months: { key: string; label: string; items: LogEntry[] }[] = [];
  for (const e of shown) {
    const key = e.date.slice(0, 7);
    let m = months[months.length - 1];
    if (!m || m.key !== key) {
      m = { key, label: new Date(e.date + "T12:00:00").toLocaleDateString("de-DE", { month: "long", year: "numeric" }), items: [] };
      months.push(m);
    }
    m.items.push(e);
  }
  return (
    <section className="panel logbook">
      <h2 className="h3">Logbuch</h2>
      <p className="small muted">Was auf der Reise passiert ist, neueste Einträge oben.</p>
      {months.map((m) => (
        <div key={m.key} className="log-month">
          <h3>{m.label}</h3>
          <ol>
            {m.items.map((e, i) => (
              <li key={`${e.date}-${i}`} className={`log-${e.kind}`}>
                <span className="log-day">{new Date(e.date + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</span>
                <span className="log-ico">{LOG_ICON[e.kind]}</span>
                <span className="log-text">{e.text}</span>
                {e.island ? (
                  <button type="button" className="icon-btn log-map" onClick={() => go("meer", e.island)} aria-label="Auf der Karte zeigen" title="Auf der Karte zeigen">
                    <MapIcon size={16} aria-hidden="true" />
                  </button>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ol>
        </div>
      ))}
      {all.length > n ? (
        <button type="button" className="btn ghost" onClick={() => setN(n + 60)}>
          Ältere Einträge
        </button>
      ) : null}
    </section>
  );
}
