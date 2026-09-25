// The voyage on the sea chart: where the ship lay and when, how far it has
// sailed, the weather from your training rhythm, and what you discovered on
// the way. Pure functions over the data; ISO dates compare as strings.
//
// - Sea miles: 10 per BJJ training, 20 per competition, 3 per other-sport
//   session.
// - Between two islands the ship moves toward the next one with every mile,
//   but never arrives before the stripe: at most 85 % of the way.
// - Weather: the last 14 days against the weekly goal. No training in two
//   weeks means a calm (the ship drifts in the calm belt); healing mode puts
//   it in dry dock.
// - Exploration: while the ship lies at an island, your trainings there
//   uncover its landing (1), a landmark (8) and its secret (15).

import type { ArcData, Belt } from "./types.ts";
import { DEFAULT_SEA, landmarksOf, rankIndex, route } from "./sea.ts";
import type { Island } from "./sea.ts";

export const MILES = { session: 10, comp: 20, cross: 3 };
/** The ship covers this share of the way to the next island at most. */
export const MAX_PASSAGE = 0.85;
/** Sea miles for about 63 % of the way. */
export const PASSAGE_SCALE = 150;

const ORDER: Belt[] = ["weiss", "blau", "lila", "braun", "schwarz"];
const DAY = 864e5;
const dayOf = (iso: string) => Math.floor(Date.parse(iso + "T12:00:00Z") / DAY);
const isoDay = (d: number) => new Date(d * DAY).toISOString().slice(0, 10);

export const rankFromIndex = (idx: number): { belt: Belt; stripes: number } => ({ belt: ORDER[Math.min(4, Math.floor(idx / 5))], stripes: idx % 5 });

export interface Stay {
  /** Route index: 0 white belt no stripe … 24 black belt 4 stripes. */
  idx: number;
  from: string;
  /** Date of the next promotion, null for the current stay. */
  to: string | null;
  /** Dates of BJJ trainings logged while the ship lay there. */
  sessions: string[];
}

/** Where the ship lay and when: one stay per rank, with the trainings logged there. */
export function stays(data: ArcData, asOf: string): Stay[] {
  const p = data.profile;
  if (!p) return [];
  const dates = data.sessions
    .map((s) => s.date)
    .filter((d) => d <= asOf)
    .sort();
  let from = data.onboarding?.date ?? p.createdAt;
  if (dates[0] && dates[0] < from) from = dates[0];
  let idx = rankIndex(p.startBelt, p.startStripes ?? 0);
  const out: Stay[] = [];
  const promos = data.promotions.filter((x) => x.date <= asOf).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const pr of promos) {
    const next = rankIndex(pr.belt, pr.stripes);
    if (next === idx) continue;
    out.push({ idx, from, to: pr.date, sessions: [] });
    idx = next;
    from = pr.date;
  }
  out.push({ idx, from, to: null, sessions: [] });
  for (const d of dates) {
    for (let i = out.length - 1; i >= 0; i--) {
      if (out[i].from <= d || i === 0) {
        out[i].sessions.push(d);
        break;
      }
    }
  }
  return out;
}

export interface Explored {
  idx: number;
  island: Island;
  trainings: number;
  /** The three landmarks; date is when it was found, null while hidden. */
  found: { name: string; need: number; date: string | null }[];
}

/** Every island the ship lay at since the app started, with its landmarks. */
export function exploration(data: ArcData, asOf: string): Explored[] {
  const sea = data.profile?.homeSea ?? DEFAULT_SEA;
  const r = route(sea);
  const by = new Map<number, string[]>();
  for (const s of stays(data, asOf)) by.set(s.idx, [...(by.get(s.idx) ?? []), ...s.sessions]);
  return [...by.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([idx, dates]) => {
      const sorted = [...dates].sort();
      const island = r[Math.min(idx, r.length - 1)];
      return {
        idx,
        island,
        trainings: sorted.length,
        found: landmarksOf(island.id).map((l) => ({ ...l, date: sorted[l.need - 1] ?? null })),
      };
    });
}

/** Islands with all three landmarks found. */
export const fullyExplored = (data: ArcData, asOf: string) => exploration(data, asOf).filter((e) => e.found.every((f) => f.date)).length;

/** Sea miles sailed up to a day, optionally only from a day on. */
export function seaMiles(data: ArcData, asOf: string, since = ""): number {
  const inRange = (d: string) => d >= since && d <= asOf;
  return (
    MILES.session * data.sessions.filter((s) => inRange(s.date)).length +
    MILES.comp * (data.competitions ?? []).filter((c) => inRange(c.date)).length +
    MILES.cross * (data.cross ?? []).filter((c) => inRange(c.date)).length
  );
}

export interface Passage {
  /** Route index of the island the ship came from. */
  idx: number;
  next: Island | null;
  /** Miles since the last island. */
  miles: number;
  /** 0 … MAX_PASSAGE of the way to the next island. */
  progress: number;
}

export function passage(data: ArcData, asOf: string): Passage {
  const sea = data.profile?.homeSea ?? DEFAULT_SEA;
  const r = route(sea);
  const all = stays(data, asOf);
  const cur = all[all.length - 1] ?? { idx: 0, from: asOf };
  const next = r[cur.idx + 1] ?? null;
  const miles = seaMiles(data, asOf, cur.from);
  return { idx: cur.idx, next, miles, progress: next ? Math.min(MAX_PASSAGE, 1 - Math.exp(-miles / PASSAGE_SCALE)) : 0 };
}

export type WeatherKind = "dock" | "calm" | "light" | "breeze" | "tailwind";

export interface Weather {
  kind: WeatherKind;
  name: string;
  text: string;
  /** BJJ trainings and competitions in the last 14 days. */
  n14: number;
}

export function weather(data: ArcData, asOf: string, paused: boolean): Weather {
  const goal = data.profile?.weeklyGoal ?? 2;
  const a = dayOf(asOf);
  const recent = (d: string) => {
    const x = dayOf(d);
    return x > a - 14 && x <= a;
  };
  const n14 = data.sessions.filter((s) => recent(s.date)).length + (data.competitions ?? []).filter((c) => recent(c.date)).length;
  const ratio = n14 / (2 * goal);
  const n = `${n14} ${n14 === 1 ? "Training" : "Trainings"} in 14 Tagen`;
  if (paused) return { kind: "dock", name: "Trockendock", text: "Heilungsmodus: Das Schiff liegt im Dock und wird repariert. Deine Flamme ist sicher.", n14 };
  if (n14 === 0) return { kind: "calm", name: "Flaute", text: "Seit 14 Tagen kein Training. Das Schiff treibt in den Kalmen. Ein Training bringt den Wind zurück.", n14 };
  if (ratio >= 1.25) return { kind: "tailwind", name: "Starker Rückenwind", text: `${n}, mehr als dein Ziel. Volle Fahrt.`, n14 };
  if (ratio >= 0.75) return { kind: "breeze", name: "Frische Brise", text: `${n}, ziemlich genau dein Ziel.`, n14 };
  return { kind: "light", name: "Leichter Wind", text: `${n}. Etwas mehr Wind, und das Schiff zieht an.`, n14 };
}

export interface LogEntry {
  date: string;
  kind: "start" | "island" | "land" | "mark" | "comp" | "milestone" | "dock" | "cross";
  text: string;
  /** Island id, when the entry belongs to one. */
  island?: string;
}

const PLACE = ["", "Gold", "Silber", "Bronze"];
const BELT_NAME: Record<Belt, string> = { weiss: "Weiß", blau: "Blau", lila: "Lila", braun: "Braun", schwarz: "Schwarz" };
const MILESTONES = [10, 25, 50, 100, 150, 200, 300, 400, 500, 750, 1000];

/** The ship's log, newest first. */
export function logbook(data: ArcData, asOf: string): LogEntry[] {
  const p = data.profile;
  if (!p) return [];
  const sea = p.homeSea ?? DEFAULT_SEA;
  const r = route(sea);
  const out: LogEntry[] = [];
  const all = stays(data, asOf);
  const first = all[0];
  if (first) {
    const is = r[first.idx];
    out.push({
      date: first.from,
      kind: "start",
      text: first.idx === 0 ? `Leinen los im ${is.name}. Die Reise beginnt.` : `Das Logbuch beginnt vor ${is.name}. Die Reise davor kennt nur deine Erinnerung.`,
      island: is.id,
    });
  }
  for (let i = 1; i < all.length; i++) {
    const is = r[all[i].idx];
    const rank = rankFromIndex(all[i].idx);
    const prev = rankFromIndex(all[i - 1].idx);
    const beltUp = rank.belt !== prev.belt;
    out.push({
      date: all[i].from,
      kind: "island",
      text: `${beltUp ? `${BELT_NAME[rank.belt]}gurt! ` : ""}Anker geworfen vor ${is.name}${rank.stripes ? `, ${rank.stripes}. Streifen` : ""}.`,
      island: is.id,
    });
  }
  for (const e of exploration(data, asOf)) {
    e.found.forEach((f, k) => {
      if (!f.date) return;
      out.push({
        date: f.date,
        kind: k === 0 ? "land" : "mark",
        text: k === 0 ? `An Land gegangen auf ${e.island.name}.` : `${k === 2 ? "Geheimnis gefunden" : "Entdeckt"} auf ${e.island.name}: ${f.name}.`,
        island: e.island.id,
      });
    });
  }
  const at = (d: string) => {
    let idx = first?.idx ?? 0;
    for (const s of all) if (s.from <= d) idx = s.idx;
    return r[idx];
  };
  for (const c of (data.competitions ?? []).filter((x) => x.date <= asOf)) {
    const is = at(c.date);
    out.push({ date: c.date, kind: "comp", text: `Turnier bei ${is.name}: ${c.name}${c.place ? `, ${PLACE[c.place]}` : ""}.`, island: is.id });
  }
  const dates = data.sessions
    .map((s) => s.date)
    .filter((d) => d <= asOf)
    .sort();
  for (const n of MILESTONES) if (dates[n - 1]) out.push({ date: dates[n - 1], kind: "milestone", text: `${n}. Training an Bord.` });
  const cross = (data.cross ?? [])
    .map((c) => c.date)
    .filter((d) => d <= asOf)
    .sort();
  for (const n of [10, 50, 100]) if (cross[n - 1]) out.push({ date: cross[n - 1], kind: "cross", text: `${n}. Einheit Nebensport: Rumpf und Segel werden stärker.` });
  for (const w of data.pauses) {
    const d = isoDay(w * 7 + 4);
    if (d <= asOf) out.push({ date: d, kind: "dock", text: "Eine Woche im Trockendock (Heilungsmodus)." });
  }
  const rank: Record<LogEntry["kind"], number> = { start: 0, island: 1, land: 2, mark: 3, comp: 4, milestone: 5, cross: 6, dock: 7 };
  return out.sort((a, b) => (a.date === b.date ? rank[b.kind] - rank[a.kind] : a.date < b.date ? 1 : -1));
}
