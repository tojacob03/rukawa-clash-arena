// The voyage: stays, exploration, sea miles, passage, weather and the log.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDemo } from "./demo.ts";
import { compute } from "./model.ts";
import { MAX_PASSAGE, MILES, exploration, fullyExplored, logbook, passage, seaMiles, stays, weather } from "./voyage.ts";
import { LANDMARK, SECRET, WORLD, rankIndex, route, shipPos, smoothPath, voyageLegs } from "./sea.ts";
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

test("stays: every training belongs to the island the ship lay at", () => {
  const d = base([...days("2026-01-06", 10).map(sess), ...days("2026-03-01", 5).map(sess)], [{ date: "2026-03-01", belt: "weiss", stripes: 1 }]);
  const s = stays(d, TODAY);
  assert.equal(s.length, 2);
  assert.equal(s[0].idx, 0);
  assert.equal(s[0].sessions.length, 10);
  assert.equal(s[1].idx, 1);
  assert.equal(s[1].sessions.length, 5);
  assert.equal(s[1].to, null);
});

test("exploration: landing, landmark and secret after 1, 8 and 15 trainings", () => {
  const d = base(days("2026-01-06", 15).map(sess));
  const e = exploration(d, TODAY)[0];
  assert.equal(e.island.id, "frost0");
  assert.ok(e.found.every((f) => f.date));
  assert.equal(e.found[1].date, days("2026-01-06", LANDMARK)[LANDMARK - 1]);
  assert.equal(e.found[2].date, days("2026-01-06", SECRET)[SECRET - 1]);
  assert.equal(fullyExplored(d, TODAY), 1);
  const less = base(days("2026-01-06", 7).map(sess));
  assert.deepEqual(
    exploration(less, TODAY)[0].found.map((f) => !!f.date),
    [true, false, false],
  );
  // Nothing counts after the day asked for.
  assert.equal(exploration(d, "2026-01-05")[0].trainings, 0);
});

test("passage: the ship moves with the miles but never arrives before the stripe", () => {
  const few = base(days("2026-09-01", 2).map(sess));
  const many = base(days("2025-01-01", 200, 2).map(sess));
  const p1 = passage(few, TODAY);
  const p2 = passage(many, TODAY);
  assert.equal(p1.miles, 2 * MILES.session);
  assert.ok(p1.progress > 0 && p1.progress < p2.progress);
  assert.equal(p2.progress, MAX_PASSAGE);
  assert.equal(p1.next?.id, "frost1");
  // After a promotion the count starts again.
  const promoted = base(days("2026-01-06", 30).map(sess), [{ date: "2026-09-20", belt: "weiss", stripes: 1 }]);
  assert.equal(passage(promoted, TODAY).idx, 1);
  assert.equal(passage(promoted, TODAY).miles, seaMiles(promoted, TODAY, "2026-09-20"));
});

test("weather: calm without training, dock in healing mode, tailwind above the goal", () => {
  assert.equal(weather(base([]), TODAY, false).kind, "calm");
  assert.equal(weather(base([]), TODAY, true).kind, "dock");
  assert.equal(weather(base(days("2026-09-11", 7, 2).map(sess)), TODAY, false).kind, "tailwind");
  assert.equal(weather(base(days("2026-09-12", 4, 3).map(sess)), TODAY, false).kind, "breeze");
  assert.equal(weather(base([sess("2026-09-20")]), TODAY, false).kind, "light");
});

test("logbook: newest first, with start, islands, discoveries and milestones", () => {
  const demo = buildDemo(TODAY);
  const log = logbook(demo, TODAY);
  assert.ok(log.length > 5);
  for (let i = 1; i < log.length; i++) assert.ok(log[i - 1].date >= log[i].date, `${log[i - 1].date} before ${log[i].date}`);
  assert.equal(log[log.length - 1].kind, "start");
  assert.ok(log.some((e) => e.kind === "island"));
  assert.ok(log.some((e) => e.kind === "milestone" && e.text.startsWith("10.")));
  // The demo starts as a blue belt: no harbour departure, the log begins at sea.
  assert.equal(stays(demo, TODAY)[0].idx, rankIndex(demo.profile!.startBelt, demo.profile!.startStripes ?? 0));
  assert.match(log[log.length - 1].text, /beginnt vor/);
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
