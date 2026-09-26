import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Anchor,
  BookOpen,
  Compass,
  Flag as FlagIcon,
  Lock,
  Map as MapIcon,
  Sailboat,
  Swords,
  Users,
  Wind,
} from "lucide-react";
import type { ArcData, ArcState, FlagDesign, SeaId } from "../core/types.ts";
import {
  DEFAULT_SEA,
  ISLAND,
  LOOP_START,
  SEA,
  SEAS,
  SHIPS,
  nextIndex,
  rankIndex,
  route,
  stepIndex,
} from "../core/sea.ts";
import type { Island } from "../core/sea.ts";
import { ITEMS, RARITY } from "../core/items.ts";
import { CLASS } from "../core/classes.ts";
import { STUCK, rankOf } from "../core/lore.ts";
import { TECHS } from "../core/techniques.ts";
import { dayNum, rankAt } from "../core/model.ts";
import { bounty } from "../core/bounty.ts";
import {
  MILES,
  SPEED,
  competitionIsles,
  exploration,
  logbook,
  milesTo,
  seaMiles,
  voyage,
  weather,
} from "../core/voyage.ts";
import type { Explored, LogEntry, Weather } from "../core/voyage.ts";
import { WIND } from "../core/voyage.ts";
import {
  CROSSES,
  EMBLEMS,
  FLAG_BG,
  FLAG_FG,
  HEADS,
  WEARS,
  normalizeFlag,
} from "../core/crewflag.ts";
import { BELT, nf0, shortDate } from "../format.ts";
import { arcStore, go } from "../store.ts";
import { useGear } from "../useGear.ts";
import { PLACE_NAME } from "../compText.ts";
import { setFlag, setShipName } from "../actions.ts";
import SeaMap from "../components/SeaMap.tsx";
import type { OtherShip, Voyage, VoyageEvent } from "../components/SeaMap.tsx";
import { useVoyage } from "../useVoyage.ts";
import { loadMotion } from "../motion.ts";
import type { Tween } from "../motion.ts";
import Wanted from "../components/Wanted.tsx";
import Avatar from "../components/Avatar.tsx";
import ItemIcon from "../components/ItemIcon.tsx";
import CrewFlag from "../components/CrewFlag.tsx";
import Flag3D from "../components/Flag3D.tsx";
import { HeroKoma, Seg } from "../components/ui.tsx";
import { useSocial } from "../cloud/social.ts";
import { shipsOf } from "../socialCard.ts";
import { crewNow, shipNow } from "../ship.ts";
import type { ShipNow } from "../ship.ts";
import { gearItems } from "../core/social.ts";
import { figureFactors } from "../core/body.ts";
import type { Spec } from "../fighter3d/figure.ts";
import { cardSpec } from "../fighter3d/specs.ts";
import { isOpen } from "../core/unlocks.ts";
import { ShipOnWater } from "../components/Sea3D.tsx";

export function MapSwitch({ value }: { value: "karte" | "meer" | "codex" }) {
  return (
    <Seg
      label="Karte wählen"
      value={value}
      onChange={(v) => go(v)}
      options={[
        { v: "karte", label: "Zweig" },
        { v: "meer", label: "Seekarte" },
        { v: "codex", label: "Codex" },
      ]}
    />
  );
}

type View = "karte" | "schiff" | "logbuch";
const VIEWS: { id: View; label: string; icon: ReactNode }[] = [
  {
    id: "karte",
    label: "Karte",
    icon: <MapIcon size={16} aria-hidden="true" />,
  },
  {
    id: "schiff",
    label: "Schiff",
    icon: <Sailboat size={16} aria-hidden="true" />,
  },
  {
    id: "logbuch",
    label: "Logbuch",
    icon: <BookOpen size={16} aria-hidden="true" />,
  },
];

type SeaProps = {
  data: ArcData;
  st: ArcState;
  today: string;
  arg: string | null;
};

function MovedToFriends() {
  useEffect(() => go("freunde", "crew"), []);
  return null;
}

/** Before the first training the ship is still in harbour: the chart opens with it. */
export default function SeaPage(props: SeaProps) {
  // The crew moved to the friends page (友); old links still get there.
  if (props.arg === "crew") return <MovedToFriends />;
  if (isOpen(props.data, "sea")) return <OpenSea {...props} />;
  const harbour = route(props.data.profile?.homeSea ?? DEFAULT_SEA)[0];
  return (
    <div className="page sea-page">
      <MapSwitch value="meer" />
      <section className="harbour">
        <span className="harbour-k" aria-hidden="true">
          海
        </span>
        <div>
          <h1 className="h2">Dein Schiff liegt noch vor Anker</h1>
          <p className="lede">
            {harbour.name}. {harbour.desc}
          </p>
          <p>Mit deinem ersten Training legt es ab. Jedes Training bringt Seemeilen, auch Nebensport, und mit regelmäßigem Rhythmus kommt Rückenwind dazu. Gürtel und Streifen sind Häfen auf dem Weg.</p>
          <button type="button" className="btn primary" onClick={() => go("log")}>
            Erstes Training eintragen
          </button>
        </div>
      </section>
    </div>
  );
}

function OpenSea({ data, st, today, arg }: SeaProps) {
  const p = data.profile!;
  const view: View =
    arg === "schiff" || arg === "logbuch" ? arg : "karte";
  // The crew ship moves with the others' trainings: keep it fresh while the chart is open.
  const social = useSocial(true);
  const others = useMemo(
    () => shipsOf(social.me?.id ?? null, social.crew, social.friends),
    [social.me, social.crew, social.friends],
  );
  const g = useGear(data, st);
  const wx = useMemo(
    () => weather(data, today, st.paused),
    [data, today, st.paused],
  );
  const expl = useMemo(() => exploration(data, today), [data, today]);
  // The ship you sail on: your crew's, or your own.
  const crew = crewNow(social);
  const ship = useMemo(
    () =>
      shipNow(
        data,
        today,
        { sail: shipSail(data, st), flag: data.character?.flag ?? null },
        crew,
      ),
    [data, st, today, crew],
  );
  // Who stands on deck: on your own ship you, on the crew ship everyone who
  // shares a card, the captain at the helm.
  const mine = useMemo<Spec>(() => {
    const { b, lf } = figureFactors(g.character.look.height, p.heightCm, p.weightKg);
    return { look: g.character.look, mode: g.character.mode, gear: g.gear, belt: p.belt, stripes: p.stripes, b, lf };
  }, [g.character.look, g.character.mode, g.gear, p.belt, p.stripes, p.heightCm, p.weightKg]);
  const meId = social.me?.id ?? null;
  const deck = useMemo<Spec[]>(() => {
    if (!crew) return [mine];
    const aboard = [...crew.members].sort((a, b) => Number(!!b.captain) - Number(!!a.captain));
    return aboard.flatMap((m) => (m.id === meId ? [mine] : m.card ? [cardSpec(m.card)] : []));
  }, [crew, mine, meId]);
  const sea = ship.sea;
  const r = route(sea);
  const pos = ship.pos;
  const current = pos.idx;
  const here = r[current];
  const next = r[nextIndex(current)];
  const moving = pos.progress >= 0.08;
  const miles = pos.miles;
  const [leg, landed] = useVoyage({
    slot: `${data.demo ? "demo" : (arcStore.namespace() ?? "device")}:${crew?.id ?? "own"}`,
    active: view === "karte",
    sea,
    u: pos.u,
    miles,
    harbour: miles - pos.into,
  });
  const [sail, setSail] = useState<{ id: number; seconds: number } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const onVoyage = (e: VoyageEvent) => {
    if (e.kind === "done") return landed();
    if (!leg) return;
    setSail({ id: leg.id, seconds: e.seconds });
    const n = miles - leg.miles;
    const reached = Math.floor(leg.from) < pos.step;
    setNote(
      leg.first
        ? `Seit dem Ablegen vor ${here.name}: ${nf0.format(n)} Seemeilen.`
        : `Seit deinem letzten Blick auf die Karte: ${n > 0 ? `+${nf0.format(n)} Seemeilen` : "ein Stück weiter"}${reached ? `, angekommen vor ${here.name}` : ""}.`,
    );
  };

  return (
    <div className={`page sea-page${view === "karte" ? " chart" : ""}`}>
      <div className="map-head">
        <div>
          <MapSwitch value="meer" />
          <p className="eyebrow">
            {crew
              ? `Seekarte, an Bord der Crew „${crew.name}“`
              : `Seekarte, Heimat ${SEA[sea].name}`}
          </p>
          <h1 className="page-h">
            {moving
              ? `${crew ? "Mit der Crew unterwegs" : "Unterwegs"} nach ${next.name}`
              : `${crew ? "Das Crew-Schiff" : "Dein Schiff"} liegt vor ${here.name}`}
          </h1>
        </div>
        <ul className="map-stats">
          <li>
            <Anchor size={15} aria-hidden="true" /> Insel {current + 1} von{" "}
            {r.length}
            {pos.lap ? `, ${pos.lap + 1}. Runde um die Welt` : ""}
          </li>
          <li>
            <Compass size={16} aria-hidden="true" /> Nächste Insel:{" "}
            {next.name}, noch {nf0.format(Math.ceil(pos.leg - pos.into))}{" "}
            Seemeilen
          </li>
          <li>
            <Wind size={15} aria-hidden="true" /> {wx.name},{" "}
            <Tally
              value={miles}
              from={leg?.miles ?? null}
              seconds={sail && sail.id === leg?.id ? sail.seconds : null}
            />{" "}
            Seemeilen
          </li>
          <li>
            <Swords size={15} aria-hidden="true" /> {st.comps.events} Turniere
          </li>
        </ul>
      </div>
      <nav className="tabs" aria-label="Seekarte">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={view === v.id ? "on" : ""}
            aria-current={view === v.id ? "page" : undefined}
            onClick={() => go("meer", v.id === "karte" ? undefined : v.id)}
          >
            {v.icon} {v.label}
          </button>
        ))}
      </nav>
      {view === "schiff" ? (
        <ShipView data={data} st={st} today={today} wx={wx} crew={crew?.name ?? null} />
      ) : view === "logbuch" ? (
        <LogView data={data} today={today} />
      ) : (
        <ChartView
          data={data}
          st={st}
          today={today}
          arg={arg}
          expl={expl}
          ship={ship}
          meId={meId}
          deck={deck}
          wx={wx}
          others={others}
          voyage={leg}
          onVoyage={onVoyage}
          note={note}
          avatar={
            <Avatar
              look={g.character.look}
              mode={g.character.mode}
              gear={g.gear}
              belt={p.belt}
              stripes={p.stripes}
              weightKg={p.weightKg}
              heightCm={p.heightCm}
              size={240}
              crop="bust"
            />
          }
        />
      )}
    </div>
  );
}

/** The sea miles in the header: while the ship sails, they count up with it. */
function Tally({
  value,
  from,
  seconds,
}: {
  value: number;
  from: number | null;
  seconds: number | null;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const text = ref.current?.firstChild;
    if (from == null || seconds == null || !(text instanceof Text)) return;
    let tw: Tween | null = null;
    let dead = false;
    loadMotion()
      .then(({ gsap }) => {
        if (dead) return;
        const o = { v: from };
        tw = gsap.to(o, {
          v: value,
          duration: seconds,
          ease: "power1.inOut",
          onUpdate: () => {
            text.data = nf0.format(Math.round(o.v));
          },
        });
      })
      .catch(() => {});
    return () => {
      dead = true;
      tw?.kill();
    };
  }, [from, seconds, value]);
  return (
    <span ref={ref} className="tally">
      {nf0.format(from ?? value)}
    </span>
  );
}

const rankLabel = (is: Island) =>
  `${BELT[is.belt].name}gurt${is.stripe ? `, ${is.stripe}. Streifen` : ""}`;
const shipSail = (data: ArcData, st: ArcState) =>
  (data.profile?.cls
    ? CLASS[data.profile.cls].color
    : CLASS[st.clsDetected].color) ?? "#d4a94f";
const rustCount = (st: ArcState) =>
  TECHS.filter((x) => st.nodes[x.id].rust).length;

// ── Chart ─────────────────────────────────────────────────────────────────

function ChartView({
  data,
  st,
  today,
  arg,
  expl,
  ship,
  meId,
  deck,
  wx,
  avatar,
  others = [],
  voyage,
  onVoyage,
  note,
}: {
  data: ArcData;
  st: ArcState;
  today: string;
  arg: string | null;
  expl: Explored[];
  ship: ShipNow;
  meId: string | null;
  deck: Spec[];
  wx: Weather;
  avatar: ReactNode;
  others?: OtherShip[];
  voyage: Voyage | null;
  onVoyage: (e: VoyageEvent) => void;
  note: string | null;
}) {
  const p = data.profile!;
  const sea = ship.sea;
  const r = route(sea);
  const pos = ship.pos;
  const current = pos.idx;
  const compIsle = useMemo(() => competitionIsles(data, today), [data, today]);
  const comps: Record<
    string,
    { n: number; best: number; list: NonNullable<ArcData["competitions"]> }
  > = {};
  for (const c of data.competitions ?? []) {
    const id = compIsle.get(c.id);
    if (!id) continue;
    const e = (comps[id] ??= { n: 0, best: 0, list: [] });
    e.n++;
    if (c.place && (!e.best || c.place < e.best)) e.best = c.place;
    e.list.push(c);
  }
  const selected = arg && ISLAND[arg] ? arg : r[current].id;
  const explored = Object.fromEntries(
    expl.map((e) => [e.island.id, e.found.filter((f) => f.date).length]),
  );
  const strip = useRef<HTMLOListElement>(null);
  const selIdx = r.findIndex((x) => x.id === selected);
  const nextI = nextIndex(current);

  // Keep the chosen island visible in the route strip.
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>(
      `[data-id="${selected}"]`,
    );
    const box = strip.current;
    if (el && box)
      box.scrollLeft = el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2;
  }, [selected]);

  const away = (i: number) => milesTo(pos, i);
  const shortStatus =
    selIdx < 0
      ? `${SEA[ISLAND[selected].sea!].name}, nicht auf dieser Route`
      : selIdx === current
        ? ship.crew
          ? "Hier liegt das Crew-Schiff."
          : "Hier liegt dein Schiff."
        : selIdx === nextI
          ? `Das nächste Ziel, noch ${nf0.format(Math.ceil(away(selIdx) ?? 0))} Seemeilen.`
          : away(selIdx) === null || selIdx <= pos.step
            ? "Schon erreicht."
            : `Noch ${nf0.format(Math.ceil(away(selIdx)!))} Seemeilen.`;

  return (
    <>
      <div className="sea-room">
        <div className="sea-stage">
          <div className="sea-frame">
            <SeaMap
              marks={{
                sea,
                current,
                lap: pos.lap,
                comps: Object.fromEntries(
                  Object.entries(comps).map(([k, v]) => [
                    k,
                    { n: v.n, best: v.best },
                  ]),
                ),
                shipColor: ship.sail,
                boss: st.boss ? STUCK[st.boss.key].boss : null,
                bossHp: st.boss?.hp,
                bossMax: st.boss?.raw,
                belt: ship.belt,
                flag: ship.flag,
                progress: pos.progress,
                weather: wx.kind,
                explored,
                hull: st.body.kraft,
                sails: st.body.ausdauer,
                barnacles: rustCount(st),
                crew: deck,
              }}
              selected={selected}
              onSelect={(id) => go("meer", id)}
              others={others}
              voyage={voyage}
              onVoyage={onVoyage}
              note={note}
            />
            <div className="sea-callout" aria-live="polite">
              <p>
                <b>{ISLAND[selected].name}</b>
                {shortStatus}
              </p>
              <button
                type="button"
                className="btn small"
                onClick={() =>
                  document
                    .querySelector(".isle-card")
                    ?.scrollIntoView({ block: "start" })
                }
              >
                Details
              </button>
            </div>
          </div>
          <ol className="route-strip" ref={strip} aria-label="Die Route">
            {r.map((is, i) => {
              const m = away(i);
              return (
                <li
                  key={is.id}
                  data-id={is.id}
                  className={`${i === current ? "here" : i <= pos.step ? "past" : "future"}${is.id === selected ? " sel" : ""}`}
                >
                  <button
                    type="button"
                    aria-current={is.id === selected ? "true" : undefined}
                    onClick={() => go("meer", is.id)}
                  >
                    {is.name}
                    <small>
                      {i + 1}.{" "}
                      {i === current
                        ? "Hier liegt das Schiff"
                        : i > pos.step && m !== null
                          ? `in ${nf0.format(Math.ceil(m))} Seemeilen`
                          : "erreicht"}
                    </small>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <aside className="sea-card">
          <IslandCard
            is={ISLAND[selected]}
            data={data}
            today={today}
            ship={ship}
            wx={wx}
            comps={comps[selected]?.list ?? []}
            explored={expl.find((e) => e.island.id === selected) ?? null}
          />
        </aside>
      </div>

      <div className="sea-below">
        {ship.crew ? (
          <CrewShipCard data={data} today={today} ship={ship} />
        ) : (
          <Wanted
            name={p.name}
            bounty={bounty(data, st)}
            line={`${rankOf(st.lvl)}, ${BELT[p.belt].name}gurt, ${p.cls ? CLASS[p.cls].name : CLASS[st.clsDetected].name}`}
            portrait={avatar}
          />
        )}
      </div>

      {ship.crew && ship.crew.members.length ? (
        <CrewPosters data={data} st={st} ship={ship} meId={meId} avatar={avatar} />
      ) : null}

      <section className="panel sea-lore">
        <h2 className="h3">Die Welt</h2>
        <p className="muted small">
          Ein roter Gebirgskamm teilt die Welt von Norden nach Süden, die Große
          Strömung umrundet sie von Westen nach Osten. Wo sich beide kreuzen,
          liegt das Tor der vier Strömungen. Zu beiden Seiten der Strömung
          liegen die windstillen Kalmengürtel. Jede Reise beginnt im Hafen
          eines der vier Meere und führt durchs Tor in die Äußere Strömung,
          über den Kammpass in die Tiefe Strömung bis Kap Kuro und von dort
          wieder durchs Tor, Runde um Runde. Jedes Training bringt das Schiff
          weiter, ob Gi, No-Gi oder Open Mat: 10 Seemeilen, ein Turnier 20,
          Nebensport 5, und wer regelmäßig trainiert, segelt mit frischer Brise
          oder Rückenwind bis zur Hälfte schneller. Ein neuer Streifen oder
          Gürtel ist ein kräftiger Windstoß. In einer Crew segelt ihr auf einem
          gemeinsamen Schiff, und jedes Training an Bord bringt es voran. In
          den Gewässern einer Insel erkundest du sie: Das erste Training dort
          geht an Land, das dritte findet ein Wahrzeichen, das sechste ihr
          Geheimnis. Was du bei schneller Fahrt verpasst, wartet auf die
          nächste Runde. Turniere erscheinen als gekreuzte Klingen, dein
          Wochenboss als Seeungeheuer neben dem Schiff.
        </p>
        <div className="sea-legend">
          {SEAS.map((s) => (
            <div
              key={s.id}
              className={s.id === sea ? "mine" : ""}
              style={{ ["--sc" as string]: s.color }}
            >
              <b>{s.name}</b>
              <small>{s.desc}</small>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="linkish"
          onClick={() => go("held", "steckbrief")}
        >
          Heimatmeer im Steckbrief ändern
        </button>
      </section>
    </>
  );
}

/** Items that wait on an island: the ones you get for reaching it. */
const itemsOn = (is: Island, sea: SeaId) =>
  ITEMS.filter(
    (x) =>
      x.src.t === "rank" &&
      !!x.src.isle &&
      (x.src.isle === is.id ||
        (x.src.isle.startsWith("home:") &&
          is.sea === sea &&
          String(is.stripe) === x.src.isle.slice(5))),
  );

function IslandCard({
  is,
  data,
  today,
  ship,
  wx,
  comps,
  explored,
}: {
  is: Island;
  data: ArcData;
  today: string;
  ship: ShipNow;
  wx: Weather;
  comps: NonNullable<ArcData["competitions"]>;
  explored: Explored | null;
}) {
  const r = route(ship.sea);
  const pos = ship.pos;
  const idx = r.findIndex((x) => x.id === is.id);
  const onRoute = idx >= 0;
  const p = data.profile!;
  const away = onRoute ? milesTo(pos, idx) : null;
  // About how many trainings in the current wind.
  const perTraining = MILES.session * SPEED[wx.kind];
  let status: string;
  if (!onRoute)
    status = `Liegt im ${SEA[is.sea!].name}. Nicht auf dieser Route, aber andere legen hier ab.`;
  else if (idx === pos.idx)
    status = ship.crew ? "Hier liegt das Crew-Schiff." : "Hier liegt dein Schiff.";
  else if (away === null || idx <= pos.step) {
    const arrival = ship.crew
      ? null
      : [...voyageOf(data, today)].reverse().find((a) => a.idx === idx);
    status = arrival
      ? `Erreicht am ${shortDate(arrival.date)} ${arrival.date.slice(0, 4)}.`
      : "Erreicht.";
    if (away !== null && pos.step >= LOOP_START && idx >= LOOP_START)
      status += ` In der nächsten Runde in ${nf0.format(Math.ceil(away))} Seemeilen wieder.`;
  } else {
    const n = Math.max(1, Math.ceil(away / perTraining));
    status = `Noch ${nf0.format(Math.ceil(away))} Seemeilen, bei diesem Wind etwa ${n} ${n === 1 ? "Training" : "Trainings"}.`;
  }
  const items = itemsOn(is, p.homeSea ?? DEFAULT_SEA);
  const nextFind = explored?.found.find((f) => !f.date);
  return (
    <section className="panel isle-card">
      <p className="eyebrow">
        {is.sea
          ? SEA[is.sea].name
          : Number(is.id.slice(1)) < 10
            ? "Äußere Strömung"
            : "Tiefe Strömung"}
      </p>
      <h2 className="isle-title">{is.name}</h2>
      <p className="small">{is.desc}</p>
      <p className={`isle-status${onRoute && idx === pos.idx ? " here" : ""}`}>
        {status}
      </p>
      {explored ? (
        <div className="isle-explore">
          <p className="k">
            Landgang: {explored.trainings}{" "}
            {explored.trainings === 1 ? "Training" : "Trainings"} in ihren
            Gewässern
          </p>
          <ul>
            {explored.found.map((f) => (
              <li key={f.need} className={f.date ? "found" : ""}>
                {f.date ? (
                  <FlagIcon size={15} aria-hidden="true" />
                ) : (
                  <Lock size={15} aria-hidden="true" />
                )}
                <span>{f.date ? f.name : "Noch verborgen"}</span>
                <small>
                  {f.date ? shortDate(f.date) : `ab ${f.need} Trainings`}
                </small>
              </li>
            ))}
          </ul>
          {nextFind && idx === pos.idx ? (
            <p className="small muted">
              Noch {nextFind.need - explored.trainings}{" "}
              {nextFind.need - explored.trainings === 1
                ? "Training"
                : "Trainings"}{" "}
              hier bis zur nächsten Entdeckung, bevor das Schiff weiterzieht.
            </p>
          ) : null}
        </div>
      ) : null}
      {items.length ? (
        <div className="isle-items">
          <p className="k">Wartet hier</p>
          {items.map((x) => (
            <span
              key={x.id}
              className="isle-item"
              style={{ ["--rc" as string]: RARITY[x.rarity].color }}
            >
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
              {c.place ? (
                <span className={`medal m${c.place}`}>{c.place}</span>
              ) : (
                <Swords size={16} aria-hidden="true" />
              )}
              {c.name}, {PLACE_NAME[c.place]}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/** Arrivals of your own ship with the route index of each island. */
function voyageOf(data: ArcData, today: string) {
  return voyage(data, today).arrivals.map((a) => ({ idx: stepIndex(a.step), date: a.date }));
}

/** The crew ship: everyone's miles on board, yours among them, and where your own ship waits. */
function CrewShipCard({ data, today, ship }: { data: ArcData; today: string; ship: ShipNow }) {
  const own = useMemo(() => voyage(data, today), [data, today]);
  const home = route(data.profile?.homeSea ?? DEFAULT_SEA);
  const crew = ship.crew!;
  return (
    <section className="panel crew-ship">
      <p className="eyebrow">Crew-Schiff</p>
      <h2 className="isle-title">{crew.name}</h2>
      <CrewFlag design={crew.flag} width={120} />
      <p className="small">
        <b>{nf0.format(ship.pos.miles)} Seemeilen</b>, davon{" "}
        {nf0.format(ship.mine)} von dir seit du an Bord bist. Jedes Training
        an Bord bringt das Schiff weiter, eine größere Crew segelt schneller.
      </p>
      <p className="small muted">
        Dein eigenes Schiff wartet vor {home[own.idx].name} und segelt weiter,
        wenn du die Crew verlässt.
      </p>
    </section>
  );
}

/** Wanted posters of everyone on board, with what each has brought the ship. */
function CrewPosters({
  data,
  st,
  ship,
  meId,
  avatar,
}: {
  data: ArcData;
  st: ArcState;
  ship: ShipNow;
  meId: string | null;
  avatar: ReactNode;
}) {
  const crew = ship.crew!;
  const p = data.profile!;
  return (
    <section className="crew-wanted" aria-label={`Steckbriefe der Crew ${crew.name}`}>
      <h2 className="h2">Steckbriefe der Crew</h2>
      <div className="crew-wanted-grid">
        {crew.members.map((m) => {
          const mine = m.id === meId;
          const c = m.card;
          const onBoard = mine ? ship.mine : c?.aboard?.id === crew.id ? c.aboard.miles : 0;
          const line = mine
            ? `${rankOf(st.lvl)}, ${BELT[p.belt].name}gurt`
            : c
              ? `${rankOf(c.lvl)}, ${BELT[c.belt].name}gurt`
              : "Noch keine Karte";
          return (
            <div key={m.id} className={`crew-poster${mine ? " me" : ""}`}>
              <Wanted
                name={m.name}
                bounty={mine ? bounty(data, st) : (c?.bounty ?? 0)}
                line={`${line}${m.captain ? ", Kapitän" : ""}`}
                portrait={
                  mine ? (
                    avatar
                  ) : c ? (
                    <Avatar
                      look={c.look}
                      mode={c.mode}
                      gear={gearItems(c.gear)}
                      belt={c.belt}
                      stripes={c.stripes}
                      body={c.body}
                      size={240}
                      crop="bust"
                      label={`${m.name}s Charakter`}
                    />
                  ) : null
                }
              />
              <p className="crew-poster-miles">
                {nf0.format(onBoard)} Seemeilen an Bord
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Ship ──────────────────────────────────────────────────────────────────

function Bar({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
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

function ShipView({
  data,
  st,
  today,
  wx,
  crew,
}: {
  data: ArcData;
  st: ArcState;
  today: string;
  wx: Weather;
  /** The crew you sail with, if any: your own ship waits meanwhile. */
  crew: string | null;
}) {
  const p = data.profile!;
  const sea = p.homeSea ?? DEFAULT_SEA;
  const r = route(sea);
  const rank = rankIndex(p.belt, p.stripes);
  const own = useMemo(() => voyage(data, today), [data, today]);
  const flag = normalizeFlag(data.character?.flag);
  const barnacles = rustCount(st);
  const defaultName = `Die ${p.name}`;
  const [name, setName] = useState(data.character?.shipName ?? defaultName);
  const cls = SHIPS[p.belt];
  const nextBelt = (["blau", "lila", "braun", "schwarz"] as const).find(
    (b) => rankIndex(b, 0) > rank,
  );
  const next = r[nextIndex(own.idx)];
  const left = Math.ceil(own.leg - own.into);
  const perTraining = MILES.session * SPEED[wx.kind];
  const noCross = !st.body.total;

  return (
    <>
      <HeroKoma label="Dein Schiff" className="ship-koma">
        <div className="ship-hero">
          <div className="ship-pic">
            <ShipOnWater
              look={{
                belt: p.belt,
                sail: shipSail(data, st),
                flag,
                hull: st.body.kraft,
                sails: st.body.ausdauer,
                barnacles,
              }}
              width={420}
              weather={wx.kind}
              label={`${cls.name} mit deiner Flagge`}
            />
          </div>
          <div className="ship-id">
            <label className="field ship-name">
              <span className="fl">Name deines Schiffs</span>
              <input
                id="arc-ship-name"
                value={name}
                maxLength={28}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setShipName(name === defaultName ? "" : name)}
              />
            </label>
            <p className="ship-class">
              {cls.name}, {BELT[p.belt].name}gurt
            </p>
            <p className="small">{cls.desc}</p>
            {nextBelt ? (
              <p className="small muted">
                Mit dem {BELT[nextBelt].name}gurt wird daraus eine{" "}
                {SHIPS[nextBelt].name}.
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
              <span>Dein Schiff liegt vor</span>
              <b>
                {r[own.idx].name}
                {own.lap ? `, ${own.lap + 1}. Runde` : ""}
              </b>
            </li>
            <Bar
              label={`Auf dem Weg nach ${next.name}`}
              value={Math.round(own.progress * 100)}
              hint={
                crew
                  ? `Du segelst gerade mit der Crew „${crew}“: deine Trainings bringen das Crew-Schiff voran, dein eigenes wartet hier.`
                  : `Noch ${nf0.format(left)} Seemeilen, bei diesem Wind etwa ${Math.max(1, Math.ceil(left / perTraining))} Trainings.`
              }
            />
          </ul>
          <p className="small muted">
            Jedes Training bringt 10 Seemeilen, ob Gi oder No-Gi, ein Turnier
            20, eine Einheit Nebensport 5. Bei frischer Brise segelst du ein
            Viertel schneller, bei starkem Rückenwind die Hälfte. Ein neuer
            Streifen gibt 25 Seemeilen Rückenwind, ein neuer Gürtel 50.
          </p>
        </section>

        <section className="panel">
          <h2 className="h3">Zustand</h2>
          <ul className="ship-bars">
            <Bar
              label="Rumpf"
              value={st.body.kraft}
              hint="Kraft aus dem Nebensport"
            />
            <Bar
              label="Segel"
              value={st.body.ausdauer}
              hint="Ausdauer aus dem Nebensport"
            />
            <Bar
              label="Takelage"
              value={st.body.beweglichkeit}
              hint="Beweglichkeit aus dem Nebensport"
            />
          </ul>
          <p className="small">
            {barnacles
              ? `${barnacles} ${barnacles === 1 ? "Muschel hängt" : "Muscheln hängen"} am Rumpf: so viele Techniken rosten. Eine Schmiede-Quest kratzt sie ab.`
              : "Der Rumpf ist sauber: keine Technik rostet."}
          </p>
          {noCross ? (
            <button
              type="button"
              className="linkish"
              onClick={() => go("log", "nebensport")}
            >
              Nebensport eintragen und das Schiff stärken
            </button>
          ) : null}
        </section>
      </div>

      <FlagEditor flag={flag} wind={WIND[wx.kind]} />
    </>
  );
}

function Swatch({
  hex,
  on,
  label,
  onClick,
}: {
  hex: string;
  on: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={label}
      title={label}
      className={`swatch sq${on ? " on" : ""}`}
      style={{ ["--c" as string]: hex }}
      onClick={onClick}
    />
  );
}

function FlagEditor({ flag, wind }: { flag: FlagDesign; wind: number }) {
  const set = (patch: Partial<FlagDesign>) => setFlag({ ...flag, ...patch });
  const group = (
    title: string,
    names: string[],
    key: "emblem" | "cross" | "head",
  ) => (
    <div className="flag-group">
      <span className="fl" id={`flag-${key}`}>
        {title}
      </span>
      <div
        className="flag-opts"
        role="radiogroup"
        aria-labelledby={`flag-${key}`}
      >
        {names.map((n, i) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={flag[key] === i}
            className={`flag-opt${flag[key] === i ? " on" : ""}`}
            onClick={() => set({ [key]: i })}
          >
            <CrewFlag
              design={{
                ...flag,
                [key]: i,
                ...(key === "head" && !WEARS.has(flag.emblem)
                  ? { emblem: 0 }
                  : {}),
              }}
              width={64}
            />
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
          <p className="small muted">
            Sie weht auf deinem Schiff auf der Seekarte, so kräftig wie dein
            Wind: je regelmäßiger du trainierst, desto mehr Fahrt.
          </p>
        </div>
        <Flag3D design={flag} wind={wind} width={220} label={`Deine Flagge: ${EMBLEMS[flag.emblem]}`} />
      </div>
      <div className="flag-group">
        <span className="fl" id="flag-bg">
          Tuch
        </span>
        <div className="swatches" role="radiogroup" aria-labelledby="flag-bg">
          {FLAG_BG.map((c, i) => (
            <Swatch
              key={c.name}
              hex={c.hex}
              label={c.name}
              on={flag.bg === i}
              onClick={() => set({ bg: i })}
            />
          ))}
        </div>
      </div>
      <div className="flag-group">
        <span className="fl" id="flag-fg">
          Farbe des Zeichens
        </span>
        <div className="swatches" role="radiogroup" aria-labelledby="flag-fg">
          {FLAG_FG.map((c, i) => (
            <Swatch
              key={c.name}
              hex={c.hex}
              label={c.name}
              on={flag.fg === i}
              onClick={() => set({ fg: i })}
            />
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
  lap: <Compass size={16} aria-hidden="true" />,
  gust: <Wind size={16} aria-hidden="true" />,
  crew: <Users size={16} aria-hidden="true" />,
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
      m = {
        key,
        label: new Date(e.date + "T12:00:00").toLocaleDateString("de-DE", {
          month: "long",
          year: "numeric",
        }),
        items: [],
      };
      months.push(m);
    }
    m.items.push(e);
  }
  return (
    <section className="panel logbook">
      <h2 className="h3">Logbuch</h2>
      <p className="small muted">
        Was auf der Reise passiert ist, neueste Einträge oben.
      </p>
      {months.map((m) => (
        <div key={m.key} className="log-month">
          <h3>{m.label}</h3>
          <ol>
            {m.items.map((e, i) => (
              <li key={`${e.date}-${i}`} className={`log-${e.kind}`}>
                <span className="log-day">
                  {new Date(e.date + "T12:00:00").toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="log-ico">{LOG_ICON[e.kind]}</span>
                <span className="log-text">{e.text}</span>
                {e.island ? (
                  <button
                    type="button"
                    className="icon-btn log-map"
                    onClick={() => go("meer", e.island)}
                    aria-label="Auf der Karte zeigen"
                    title="Auf der Karte zeigen"
                  >
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
        <button
          type="button"
          className="btn ghost"
          onClick={() => setN(n + 60)}
        >
          Ältere Einträge
        </button>
      ) : null}
    </section>
  );
}
