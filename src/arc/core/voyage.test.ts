// The voyage: stays, exploration, sea miles, passage, weather and the log.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDemo } from "./demo.ts";
import { compute } from "./model.ts";
import { MILES, SPEED, crewMiles, entryMiles, exploration, fullyExplored, legMiles, logbook, mileEntries, positionAt, seaMiles, voyage, weather } from "./voyage.ts";
import { LOOP_START, ROUTE_LEN, WORLD, route, shipPos, smoothPath, stepIndex, voyageLegs } from "./sea.ts";
import { normalizeFlag, DEFAULT_FLAG } from "./crewflag.ts";
import type { ArcData, Session } from "./types.ts";

const TODAY = "2026-09-24";
const sess = (date: string): Session => ({ id: date + Math.random(), date, format: "class", attire: "gi", taught: null, rolls: [], quest: null, worked: null, stuck: null, createdAt: Date.parse(date) });
const base = (sessions: Session[], promotions: ArcData["promotions"] = []): ArcData => ({
  v: 1,
  profile: { name: "Kai", belt: "weiss", stripes: 0, startBelt: "weiss", startStripes: 0, weeklyGoal: 2, createdAt: "2026-01-05", homeSea: "frost" },
  onboarding: { date: "2026-01-05", known: [] },
  sessions,
  pauses: [],
  promotions,
  ui: {},
});
const days = (from: string, n: number, step = 3) => Array.from({ length: n }, (_, i) => new Date(Date.parse(from + "T12:00:00Z") + i * step * 864e5).toISOString().slice(0, 10));

const aboard = { crew: "00000000-0000-4000-8000-000000000009", name: "Strohhüte", isle: "c3" };

test("miles: every training counts, gi or no-gi, times the wind", () => {
  const one = base([sess("2026-09-20")]);
  assert.equal(seaMiles(one, TODAY), MILES.session);
  const nogi = base([{ ...sess("2026-09-20"), attire: "nogi" }]);
  assert.equal(seaMiles(nogi, TODAY), MILES.session);
  // Every other day with a goal of two a week: the wind picks up.
  const busy = base(days("2026-09-01", 8, 2).map(sess));
  const e = mileEntries(busy, TODAY);
  assert.equal(e[0].wind, "light");
  assert.equal(e[e.length - 1].wind, "tailwind");
  assert.equal(e[e.length - 1].miles, MILES.session * SPEED.tailwind);
  // Other sports and competitions count too.
  const mixed = { ...base([]), cross: [{ id: "x", date: "2026-09-20", sport: "kraft", minutes: 60, intensity: 2, createdAt: 1 }], competitions: [{ id: "c", date: "2026-09-21", name: "Open", attire: "gi", matches: [], place: 0, createdAt: 2 }] } as ArcData;
  assert.equal(seaMiles(mixed, TODAY), MILES.cross + MILES.comp);
  // The next training would bring the wind of its own day.
  assert.equal(entryMiles(busy, "2026-09-16", "session"), MILES.session * SPEED.tailwind);
});

test("position: the first islands come quickly, then the current, then round again", () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(legMiles), [30, 45, 60, 70, 80]);
  assert.equal(positionAt(29.9).step, 0);
  assert.equal(positionAt(30).step, 1);
  const gate = 30 + 45 + 60 + 70 + 80;
  assert.equal(positionAt(gate).step, LOOP_START);
  const lap = Array.from({ length: ROUTE_LEN - LOOP_START }, (_, i) => legMiles(LOOP_START + i)).reduce((a, b) => a + b, 0);
  assert.equal(lap, 18 * 70 + 2 * 90);
  const again = positionAt(gate + lap + 35);
  assert.equal(again.step, ROUTE_LEN);
  assert.equal(again.idx, LOOP_START);
  assert.equal(again.lap, 1);
  assert.equal(again.progress, 0.5);
  assert.equal(again.u, ROUTE_LEN + 0.5);
});

test("promotions: a stripe is a gust, a belt a strong one, corrections are not", () => {
  const d = base([], [
    { date: "2026-03-01", belt: "weiss", stripes: 1 },
    { date: "2026-05-01", belt: "weiss", stripes: 3 },
    { date: "2026-06-01", belt: "weiss", stripes: 2 },
    { date: "2026-08-01", belt: "blau", stripes: 0 },
  ]);
  const gusts = mileEntries(d, TODAY).map((e) => [e.kind, e.miles]);
  assert.deepEqual(gusts, [
    ["stripe", MILES.stripe],
    ["stripe", 2 * MILES.stripe],
    ["belt", MILES.belt],
  ]);
  assert.equal(voyage(d, TODAY).miles, 3 * MILES.stripe + MILES.belt);
});

test("crew: miles logged on board move the crew ship, not your own", () => {
  const d = base([...days("2026-06-01", 3, 7).map(sess), ...days("2026-09-01", 2, 7).map((x) => ({ ...sess(x), aboard }))]);
  assert.equal(voyage(d, TODAY).miles, 3 * MILES.session);
  assert.equal(crewMiles(d, TODAY, aboard.crew), 2 * MILES.session);
  assert.equal(crewMiles(d, TODAY, aboard.crew, "2026-09-05"), MILES.session);
  assert.equal(seaMiles(d, TODAY), 5 * MILES.session);
  // Trainings on board count for the island the crew ship lay at.
  assert.equal(exploration(d, TODAY).find((e) => e.island.id === "c3")?.trainings, 2);
});

test("exploration: the waters of an island, landing, landmark and secret after 1, 3 and 6", () => {
  // One training a week: 10 miles each, light wind.
  const d = base(days("2026-01-06", 8, 7).map(sess));
  const e = exploration(d, TODAY);
  // Two trainings in the harbour, the third reaches the next island.
  assert.deepEqual(
    e.map((x) => [x.island.id, x.trainings]),
    [
      ["frost0", 2],
      ["frost1", 5],
      ["frost2", 1],
    ],
  );
  // Five trainings there: landmark found, the secret stays hidden for the next lap.
  assert.deepEqual(
    e[1].found.map((f) => !!f.date),
    [true, true, false],
  );
  assert.equal(fullyExplored(d, TODAY), 0);
  assert.equal(voyage(d, TODAY).arrivals.length, 2);
  // Nothing counts after the day asked for.
  assert.equal(exploration(d, "2026-01-05").length, 0);
});

test("weather: calm without training, dock in healing mode, tailwind above the goal", () => {
  assert.equal(weather(base([]), TODAY, false).kind, "calm");
  assert.equal(weather(base([]), TODAY, true).kind, "dock");
  assert.equal(weather(base(days("2026-09-11", 7, 2).map(sess)), TODAY, false).kind, "tailwind");
  assert.equal(weather(base(days("2026-09-12", 4, 3).map(sess)), TODAY, false).kind, "breeze");
  assert.equal(weather(base([sess("2026-09-20")]), TODAY, false).kind, "light");
});

test("logbook: newest first, with start, islands, gusts, discoveries and milestones", () => {
  const demo = buildDemo(TODAY);
  const log = logbook(demo, TODAY);
  assert.ok(log.length > 5);
  for (let i = 1; i < log.length; i++) assert.ok(log[i - 1].date >= log[i].date, `${log[i - 1].date} before ${log[i].date}`);
  assert.equal(log[log.length - 1].kind, "start");
  assert.match(log[log.length - 1].text, /^Leinen los/);
  assert.ok(log.some((e) => e.kind === "island"));
  assert.ok(log.some((e) => e.kind === "milestone" && e.text.startsWith("10.")));
  // Every island reached is in the log.
  assert.equal(log.filter((e) => e.kind === "island" || e.kind === "lap").length, voyage(demo, TODAY).arrivals.length);
});

test("demo: the explorer seal follows the exploration", () => {
  const demo = buildDemo(TODAY);
  const st = compute(demo, TODAY);
  const got = st.seals.find((s) => s.id === "entdecker")?.got;
  assert.equal(got, fullyExplored(demo, TODAY) >= 3);
});

test("crew flag: unknown values fall back to the default", () => {
  assert.deepEqual(normalizeFlag(undefined), DEFAULT_FLAG);
  assert.deepEqual(normalizeFlag({ bg: 99, fg: 1, emblem: -1 }), { ...DEFAULT_FLAG, fg: 1 });
});

test("voyage: the course runs through every island reached and wraps at the ridge", () => {
  const r = route("frost");
  // Half way to the next island, two islands on, a little out again.
  const legs = voyageLegs(r, 1.5, 3.25);
  assert.equal(legs.length, 1);
  const pts = legs[0];
  assert.deepEqual(pts[0], { x: shipPos(r, 1, 0.5).x, y: shipPos(r, 1, 0.5).y });
  assert.deepEqual(pts[1], { x: shipPos(r, 2, 0).x, y: shipPos(r, 2, 0).y });
  assert.deepEqual(pts[2], { x: shipPos(r, 3, 0).x, y: shipPos(r, 3, 0).y });
  assert.equal(pts.length, 4);
  assert.match(smoothPath(pts), /^M[\d.]+ [\d.]+( C[\d. -]+){3}$/);
  // Nothing to sail: no legs.
  assert.deepEqual(voyageLegs(r, 3.25, 3.25), []);
  // Over the ridge from c9 to c10: out at the east edge, in at the west.
  const c9 = r.findIndex((x) => x.id === "c9");
  const wrap = voyageLegs(r, c9, c9 + 1);
  assert.equal(wrap.length, 2);
  assert.equal(wrap[0][wrap[0].length - 1].x, WORLD.w - 10);
  assert.equal(wrap[1][0].x, 10);
});

test("voyage: from Kap Kuro through the gate into the next lap", () => {
  const r = route("glut");
  const legs = voyageLegs(r, ROUTE_LEN - 0.5, ROUTE_LEN + 0.5);
  assert.equal(legs.length, 1);
  const gate = shipPos(r, stepIndex(ROUTE_LEN), 0);
  assert.ok(legs[0].some((p) => p.x === gate.x && p.y === gate.y));
});

test("the chapter end sees the miles one training sailed and the islands it reached", async () => {
  const { seaStep } = await import("./reward.ts");
  const { emptySave } = await import("./records.ts");
  const prof = { name: "T", belt: "weiss" as const, stripes: 0, startBelt: "weiss" as const, weeklyGoal: 2, createdAt: "2026-01-01" };
  const ses = (id: string, date: string) => ({ id, date, format: "class" as const, attire: "gi" as const, taught: null, rolls: [], quest: null, worked: null, stuck: null, createdAt: 1 });
  const before = { ...emptySave(), profile: prof, sessions: [ses("a", "2026-03-01")] };
  const after = { ...before, sessions: [...before.sessions, ses("c", "2026-03-05")] };
  const s = seaStep(before, after, "2026-03-05");
  assert.ok(s.gained >= 10, `${s.gained}`);
  assert.equal(s.arrived.length, 0);
  assert.ok(s.after > s.before);
  assert.ok(s.left > 0);
  // Enough trainings to cross the first leg (30 miles): the arrival is reported and the ship starts the next leg.
  const many = { ...before, sessions: [ses("a", "2026-03-01"), ses("b", "2026-03-02")] };
  const more = { ...many, sessions: [...many.sessions, ses("c", "2026-03-03")] };
  const t = seaStep(many, more, "2026-03-03");
  assert.equal(t.arrived.length, 1);
  assert.equal(t.before, 0);
  assert.equal(t.from.id, t.arrived[0].id);
});
