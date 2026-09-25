// The voyage on the sea chart: how far the ship has sailed, where it lies,
// the weather from your training rhythm, what you discovered on the way and
// the ship's log. Pure functions over the data; ISO dates compare as strings.
//
// - Every training moves the ship, whatever you wear and whatever your belt:
//   10 sea miles per BJJ training (gi, no-gi, open mat), 20 per competition,
//   5 per session of another sport, each times the wind on that day (your
//   rhythm of the 14 days up to it: fresh breeze ×1.25, strong tailwind ×1.5).
//   A new stripe is a gust of 25 miles from astern, a new belt one of 50.
// - The route: the home sea (legs of 30 to 80 miles, the first islands come
//   quickly), through the gate into the great current and round the world
//   (70 miles a leg, 90 over the ridge pass and from Kap Kuro back through the
//   gate), and round again. At the weekly goal that is an island about every
//   two weeks.
// - On board a crew ship (entries with `aboard`) your miles move the crew's
//   ship; your own ship waits where you left it.
// - Weather: the last 14 days against the weekly goal. No training in two
//   weeks means a calm (the ship drifts in the calm belt); healing mode puts
//   it in dry dock.
// - Exploration: every BJJ training counts for the island whose waters the
//   ship is in; the first lands, the third finds its landmark, the sixth its
//   secret. Laps add up.

import type { Aboard, ArcData, Belt } from "./types.ts";
import { DEFAULT_SEA, ISLAND, LOOP_START, ROUTE_LEN, landmarksOf, lapOf, rankIndex, route, stepIndex } from "./sea.ts";
import type { Island } from "./sea.ts";

export const MILES = { session: 10, comp: 20, cross: 5, stripe: 25, belt: 50 };
/** How much faster the ship sails in each wind. */
export const SPEED: Record<WeatherKind, number> = { dock: 1, calm: 1, light: 1, breeze: 1.25, tailwind: 1.5 };
const HOME_LEGS = [30, 45, 60, 70, 80];

const DAY = 864e5;
const dayOf = (iso: string) => Math.floor(Date.parse(iso + "T12:00:00Z") / DAY);
const isoDay = (d: number) => new Date(d * DAY).toISOString().slice(0, 10);

/** Sea miles from the island at a step to the next one. */
export function legMiles(step: number): number {
  if (step < LOOP_START) return HOME_LEGS[step];
  const j = (step - LOOP_START) % (ROUTE_LEN - LOOP_START);
  // Over the ridge pass, and from Kap Kuro back through the gate.
  return j === 9 || j === 19 ? 90 : 70;
}

export interface Position {
  miles: number;
  /** Islands reached so far (0: still at the harbour), laps included. */
  step: number;
  /** Route index of the island the ship came from (0 … 24). */
  idx: number;
  /** Laps round the world completed. */
  lap: number;
  /** Miles since that island, and the length of the leg to the next one. */
  into: number;
  leg: number;
  progress: number;
  /** step + progress: the whole voyage as one number. */
  u: number;
}

/** Sea miles from a position to an island of the route (its next visit), null if the route does not pass it again. */
export function milesTo(pos: Position, idx: number): number | null {
  let m = pos.leg - pos.into;
  for (let k = pos.step + 1; k <= pos.step + ROUTE_LEN; k++) {
    if (stepIndex(k) === idx) return m;
    m += legMiles(k);
  }
  return null;
}

/** Where a ship is after a number of sea miles. */
export function positionAt(miles: number): Position {
  const m = Math.max(0, miles);
  let step = 0;
  let rest = m;
  while (rest >= legMiles(step)) {
    rest -= legMiles(step);
    step++;
  }
  const leg = legMiles(step);
  return { miles: m, step, idx: stepIndex(step), lap: lapOf(step), into: rest, leg, progress: rest / leg, u: step + rest / leg };
}

/** The wind on a day, from the trainings in the 14 days up to it. */
function rhythm(data: ArcData, extra: string[] = []): (date: string) => WeatherKind {
  const goal = data.profile?.weeklyGoal ?? 2;
  const days = [...data.sessions.map((s) => s.date), ...(data.competitions ?? []).map((c) => c.date), ...extra].map(dayOf).sort((a, b) => a - b);
  const upTo = (x: number) => {
    let lo = 0;
    let hi = days.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (days[mid] <= x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  return (date) => {
    const a = dayOf(date);
    const ratio = (upTo(a) - upTo(a - 14)) / (2 * goal);
    return ratio >= 1.25 ? "tailwind" : ratio >= 0.75 ? "breeze" : "light";
  };
}

export interface MileEntry {
  date: string;
  kind: "session" | "comp" | "cross" | "stripe" | "belt";
  miles: number;
  wind: WeatherKind;
  /** For promotions: the new rank. */
  belt?: Belt;
  stripes?: number;
  aboard?: Aboard;
  /** Order within a day. */
  at: number;
  /** Id of the session, competition or other-sport session. */
  id?: string;
}

/** Everything that moved a ship, oldest first, with its miles. */
export function mileEntries(data: ArcData, asOf: string): MileEntry[] {
  const p = data.profile;
  if (!p) return [];
  const wind = rhythm(data);
  const out: MileEntry[] = [];
  const add = (x: { id: string; date: string; createdAt: number; aboard?: Aboard }, kind: "session" | "comp" | "cross", base: number) => {
    if (x.date > asOf) return;
    const w = wind(x.date);
    out.push({ date: x.date, kind, miles: base * SPEED[w], wind: w, aboard: x.aboard, at: x.createdAt, id: x.id });
  };
  for (const s of data.sessions) add(s, "session", MILES.session);
  for (const c of data.competitions ?? []) add(c, "comp", MILES.comp);
  for (const c of data.cross ?? []) add(c, "cross", MILES.cross);
  // Promotions: a gust from astern (only upward, corrections do not count).
  let rank = rankIndex(p.startBelt, p.startStripes ?? 0);
  const promos = data.promotions.filter((x) => x.date <= asOf).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const pr of promos) {
    const next = rankIndex(pr.belt, pr.stripes);
    if (next > rank) {
      const belt = Math.floor(next / 5) > Math.floor(rank / 5);
      out.push({ date: pr.date, kind: belt ? "belt" : "stripe", miles: belt ? MILES.belt : MILES.stripe * Math.min(4, next - rank), wind: "tailwind", belt: pr.belt, stripes: pr.stripes, aboard: pr.aboard, at: 0 });
    }
    rank = next;
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.at - b.at));
}

interface Walked extends MileEntry {
  /** Island id whose waters the ship was in after this entry. */
  isle: string;
}

/** Your own ship along all entries, and where each entry happened. */
function walk(data: ArcData, asOf: string) {
  const r = route(data.profile?.homeSea ?? DEFAULT_SEA);
  let step = 0;
  let into = 0;
  let miles = 0;
  const arrivals: { step: number; date: string }[] = [];
  const entries: Walked[] = [];
  for (const e of mileEntries(data, asOf)) {
    if (e.aboard) {
      entries.push({ ...e, isle: ISLAND[e.aboard.isle] ? e.aboard.isle : r[stepIndex(step)].id });
      continue;
    }
    miles += e.miles;
    into += e.miles;
    while (into >= legMiles(step)) {
      into -= legMiles(step);
      step++;
      arrivals.push({ step, date: e.date });
    }
    entries.push({ ...e, isle: r[stepIndex(step)].id });
  }
  return { entries, miles, arrivals };
}

export interface Voyage extends Position {
  /** The day each island was reached, from step 1 on. */
  arrivals: { step: number; date: string }[];
}

/** Your own ship: every entry not logged on board a crew ship. */
export function voyage(data: ArcData, asOf: string): Voyage {
  const w = walk(data, asOf);
  return { ...positionAt(w.miles), arrivals: w.arrivals };
}

/** All your sea miles, on your own ship and on crew ships. */
export const seaMiles = (data: ArcData, asOf: string) => mileEntries(data, asOf).reduce((s, e) => s + e.miles, 0);

/** Your miles on board one crew ship, from a day on (the day you joined it). */
export const crewMiles = (data: ArcData, asOf: string, crew: string, since = "") =>
  mileEntries(data, asOf)
    .filter((e) => e.aboard?.crew === crew && e.date >= since)
    .reduce((s, e) => s + e.miles, 0);

/** The miles one new entry would bring today. */
export function entryMiles(data: ArcData, date: string, kind: "session" | "comp" | "cross"): number {
  const base = kind === "session" ? MILES.session : kind === "comp" ? MILES.comp : MILES.cross;
  // A new training counts for the wind of its own day.
  return base * SPEED[rhythm(data, kind === "cross" ? [] : [date])(date)];
}

export interface Explored {
  island: Island;
  trainings: number;
  /** First training in its waters. */
  first: string;
  /** The three landmarks; date is when it was found, null while hidden. */
  found: { name: string; need: number; date: string | null }[];
}

/** Every island you trained in the waters of, with its landmarks, in the order you came there. */
export function exploration(data: ArcData, asOf: string): Explored[] {
  const by = new Map<string, string[]>();
  for (const e of walk(data, asOf).entries) if (e.kind === "session") by.set(e.isle, [...(by.get(e.isle) ?? []), e.date]);
  return [...by.entries()]
    .map(([id, dates]) => {
      const sorted = [...dates].sort();
      return {
        island: ISLAND[id],
        trainings: sorted.length,
        first: sorted[0],
        found: landmarksOf(id).map((l) => ({ ...l, date: sorted[l.need - 1] ?? null })),
      };
    })
    .sort((a, b) => (a.first < b.first ? -1 : a.first > b.first ? 1 : 0));
}

/** For each competition: the island whose waters the ship was in that day. */
export function competitionIsles(data: ArcData, asOf: string): Map<string, string> {
  return new Map(
    walk(data, asOf)
      .entries.filter((e) => e.kind === "comp" && e.id)
      .map((e) => [e.id!, e.isle]),
  );
}

/** Every island your ship reached, or a crew ship you trained on. */
export function reachedIsles(data: ArcData, asOf: string): Set<string> {
  const r = route(data.profile?.homeSea ?? DEFAULT_SEA);
  const w = walk(data, asOf);
  const out = new Set<string>([r[0].id]);
  for (const a of w.arrivals) out.add(r[stepIndex(a.step)].id);
  for (const e of w.entries) out.add(e.isle);
  return out;
}

/** Islands with all three landmarks found. */
export const fullyExplored = (data: ArcData, asOf: string) => exploration(data, asOf).filter((e) => e.found.every((f) => f.date)).length;

export type WeatherKind = "dock" | "calm" | "light" | "breeze" | "tailwind";

/** Wind strength 0 … 1 for each kind of weather: how hard flags fly and ships roll. */
export const WIND: Record<WeatherKind, number> = { dock: 0, calm: 0.05, light: 0.35, breeze: 0.65, tailwind: 1 };

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
  kind: "start" | "island" | "lap" | "gust" | "crew" | "land" | "mark" | "comp" | "milestone" | "dock" | "cross";
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
  const r = route(p.homeSea ?? DEFAULT_SEA);
  const out: LogEntry[] = [];
  const w = walk(data, asOf);
  const dates = data.sessions
    .map((s) => s.date)
    .filter((d) => d <= asOf)
    .sort();
  let start = data.onboarding?.date ?? p.createdAt;
  if (dates[0] && dates[0] < start) start = dates[0];
  out.push({ date: start, kind: "start", text: `Leinen los im ${r[0].name}. Die Reise beginnt.`, island: r[0].id });
  for (const a of w.arrivals) {
    const is = r[stepIndex(a.step)];
    if (a.step >= ROUTE_LEN && stepIndex(a.step) === LOOP_START) {
      out.push({ date: a.date, kind: "lap", text: `Einmal um die Welt! Wieder am ${is.name}, die ${lapOf(a.step) + 1}. Runde beginnt.`, island: is.id });
    } else {
      out.push({ date: a.date, kind: "island", text: `Anker geworfen vor ${is.name}.`, island: is.id });
    }
  }
  const crews = new Set<string>();
  const crewIsles = new Set<string>();
  for (const e of w.entries) {
    if (e.kind === "stripe" || e.kind === "belt") {
      const what = e.kind === "belt" ? `${BELT_NAME[e.belt!]}gurt` : `${e.stripes}. Streifen`;
      out.push({ date: e.date, kind: "gust", text: `${what}! Kräftiger Rückenwind: +${Math.round(e.miles)} Seemeilen${e.aboard ? ` für die Crew „${e.aboard.name}“` : ""}.` });
    }
    if (!e.aboard) continue;
    if (!crews.has(e.aboard.crew)) {
      crews.add(e.aboard.crew);
      out.push({ date: e.date, kind: "crew", text: `An Bord der Crew „${e.aboard.name}“ gegangen. Ab jetzt segelt ihr gemeinsam, dein eigenes Schiff wartet im Hafen.` });
    }
    const key = `${e.aboard.crew}:${e.isle}`;
    if (e.kind === "session" && !crewIsles.has(key) && ISLAND[e.isle]) {
      crewIsles.add(key);
      out.push({ date: e.date, kind: "island", text: `Mit der Crew „${e.aboard.name}“ vor ${ISLAND[e.isle].name}.`, island: e.isle });
    }
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
  // Where each competition took place: the island whose waters the ship was in that day.
  const isleOf = new Map(w.entries.filter((e) => e.kind === "comp" && e.id).map((e) => [e.id!, e.isle]));
  for (const c of (data.competitions ?? []).filter((x) => x.date <= asOf)) {
    const is = ISLAND[isleOf.get(c.id) ?? r[0].id];
    out.push({ date: c.date, kind: "comp", text: `Turnier bei ${is.name}: ${c.name}${c.place ? `, ${PLACE[c.place]}` : ""}.`, island: is.id });
  }
  for (const n of MILESTONES) if (dates[n - 1]) out.push({ date: dates[n - 1], kind: "milestone", text: `${n}. Training an Bord.` });
  const cross = (data.cross ?? [])
    .map((c) => c.date)
    .filter((d) => d <= asOf)
    .sort();
  for (const n of [10, 50, 100]) if (cross[n - 1]) out.push({ date: cross[n - 1], kind: "cross", text: `${n}. Einheit Nebensport: Rumpf und Segel werden stärker.` });
  for (const wk of data.pauses) {
    const d = isoDay(wk * 7 + 4);
    if (d <= asOf) out.push({ date: d, kind: "dock", text: "Eine Woche im Trockendock (Heilungsmodus)." });
  }
  const rank: Record<LogEntry["kind"], number> = { start: 0, crew: 1, gust: 2, island: 3, lap: 3, land: 4, mark: 5, comp: 6, milestone: 7, cross: 8, dock: 9 };
  return out.sort((a, b) => (a.date === b.date ? rank[b.kind] - rank[a.kind] : a.date < b.date ? 1 : -1));
}
