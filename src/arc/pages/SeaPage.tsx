import { useEffect, useRef } from "react";
import { Anchor, Compass, Swords } from "lucide-react";
import type { ArcData, ArcState, SeaId } from "../core/types.ts";
import { DEFAULT_SEA, ISLAND, SEA, SEAS, islandAt, rankIndex, route } from "../core/sea.ts";
import type { Island } from "../core/sea.ts";
import { ITEMS, RARITY } from "../core/items.ts";
import { CLASS } from "../core/classes.ts";
import { STUCK, rankOf } from "../core/lore.ts";
import { dayNum, rankAt } from "../core/model.ts";
import { bounty } from "../core/bounty.ts";
import { BELT, shortDate } from "../format.ts";
import { go } from "../store.ts";
import { useGear } from "../useGear.ts";
import { PLACE_NAME } from "../compText.ts";
import SeaMap from "../components/SeaMap.tsx";
import Wanted from "../components/Wanted.tsx";
import Avatar from "../components/Avatar.tsx";
import ItemIcon from "../components/ItemIcon.tsx";
import { Seg } from "../components/ui.tsx";

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

export default function SeaPage({ data, st, arg }: { data: ArcData; st: ArcState; today: string; arg: string | null }) {
  const p = data.profile!;
  const sea = p.homeSea ?? DEFAULT_SEA;
  const r = route(sea);
  const current = rankIndex(p.belt, p.stripes);
  const start = Math.min(current, rankIndex(p.startBelt, p.startStripes ?? 0));
  const g = useGear(data, st);
  const scroller = useRef<HTMLDivElement>(null);

  const comps: Record<string, { n: number; best: number; list: typeof data.competitions }> = {};
  for (const c of data.competitions ?? []) {
    const rk = rankAt(data, dayNum(c.date));
    const is = islandAt(rk.belt, rk.stripes, sea);
    const e = (comps[is.id] ??= { n: 0, best: 0, list: [] });
    e.n++;
    if (c.place && (!e.best || c.place < e.best)) e.best = c.place;
    e.list!.push(c);
  }
  const selected = arg && ISLAND[arg] ? arg : r[current].id;
  const here = r[current];
  const next = r[current + 1];

  useEffect(() => {
    const el = scroller.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = (here.x / 1200) * el.scrollWidth - el.clientWidth / 2;
  }, [here.x]);

  return (
    <div className="page sea-page">
      <div className="map-head">
        <div>
          <MapSwitch value="meer" />
          <p className="eyebrow sea-eyebrow">Seekarte · Heimat: {SEA[sea].name}</p>
          <h1 className="page-h">Dein Schiff liegt vor {here.name}</h1>
        </div>
        <ul className="map-stats">
          <li>
            <Anchor size={15} aria-hidden="true" /> Insel {current + 1} von {r.length}
          </li>
          {next ? (
            <li>
              <Compass size={15} aria-hidden="true" /> Nächste: {next.name} · {rankLabel(next)}
            </li>
          ) : (
            <li>Ziel erreicht: Kap Kuro</li>
          )}
          <li>
            <Swords size={15} aria-hidden="true" /> {st.comps.events} Turniere
          </li>
        </ul>
      </div>

      <div className="sea-layout">
        <div className="sea-scroll" ref={scroller}>
          <SeaMap
            marks={{
              sea,
              current,
              start,
              comps: Object.fromEntries(Object.entries(comps).map(([k, v]) => [k, { n: v.n, best: v.best }])),
              shipColor: p.cls ? CLASS[p.cls].color : "#f1bf57",
              boss: st.boss ? STUCK[st.boss.key].boss : null,
            }}
            selected={selected}
            onSelect={(id) => go("meer", id)}
          />
        </div>
        <aside className="sea-side">
          <IslandCard is={ISLAND[selected]} data={data} sea={sea} current={current} start={start} comps={comps[selected]?.list ?? []} />
          <Wanted
            name={p.name}
            bounty={bounty(data, st)}
            line={`${rankOf(st.lvl)} · ${BELT[p.belt].name}gurt · ${p.cls ? CLASS[p.cls].name : CLASS[st.clsDetected].name}`}
            portrait={<Avatar look={g.character.look} mode={g.character.mode} gear={g.gear} belt={p.belt} stripes={p.stripes} weightKg={p.weightKg} size={150} crop="head" />}
          />
        </aside>
      </div>

      <section className="panel sea-lore">
        <h2 className="h3">Die Welt</h2>
        <p className="muted small">
          Ein roter Gebirgskamm teilt die Welt von Norden nach Süden, die Große Strömung umrundet sie von Westen nach Osten. Wo sich beide kreuzen, liegt das Tor der vier
          Strömungen. Zu beiden Seiten der Strömung liegen die windstillen Kalmengürtel. Jeder Streifen ist eine Insel: Als Weißgurt segelst du in deinem Heimatmeer, mit
          dem Blaugurt geht es durchs Tor in die Äußere Strömung, mit dem Braungurt über den Kammpass in die Tiefe Strömung und am Ende nach Kap Kuro. Turniere erscheinen
          als gekreuzte Klingen auf der Insel, an der du damals lagst, dein Wochenboss als Seeungeheuer neben deinem Schiff.
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
    </div>
  );
}

const rankLabel = (is: Island) => `${BELT[is.belt].name}gurt${is.stripe ? `, ${is.stripe}. Streifen` : ""}`;

function IslandCard({ is, data, sea, current, start, comps }: { is: Island; data: ArcData; sea: SeaId; current: number; start: number; comps: NonNullable<ArcData["competitions"]> }) {
  const idx = route(sea).findIndex((x) => x.id === is.id);
  const onRoute = idx >= 0;
  const p = data.profile!;
  let status: string;
  if (!onRoute) status = `Liegt im ${SEA[is.sea!].name}. Nicht auf deiner Route, aber andere starten hier.`;
  else if (idx === current) status = "Hier liegt dein Schiff.";
  else if (idx < current) {
    if (idx <= start) status = "Erreicht vor der App.";
    else {
      const pr = [...data.promotions].sort((a, b) => (a.date < b.date ? -1 : 1)).find((x) => rankIndex(x.belt, x.stripes) >= idx);
      status = pr ? `Erreicht am ${shortDate(pr.date)} ${pr.date.slice(0, 4)}.` : "Erreicht.";
    }
  } else {
    const steps = idx - current;
    status = steps === 1 ? "Nächstes Ziel: der nächste Streifen." : `Noch ${steps} Streifen entfernt.`;
  }
  const items = ITEMS.filter((x) => x.src.t === "rank" && x.src.belt === is.belt && x.src.stripes === is.stripe && (is.belt !== "weiss" || is.sea === sea));
  return (
    <section className="panel isle-card">
      <p className="eyebrow">
        {is.sea ? SEA[is.sea].name : is.belt === "blau" || is.belt === "lila" ? "Äußere Strömung" : "Tiefe Strömung"} · {rankLabel(is)}
      </p>
      <h2 className="isle-title">{is.name}</h2>
      <p className="small">{is.desc}</p>
      <p className={`isle-status${onRoute && idx === current ? " here" : ""}`}>{status}</p>
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
              {c.name} · {PLACE_NAME[c.place]}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
