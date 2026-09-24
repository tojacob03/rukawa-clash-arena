// Onboarding self-assessment, prologue, classes and items.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TECH, TECHS } from "./techniques.ts";
import { SEALS } from "./lore.ts";
import { CLASSES } from "./classes.ts";
import { COUNTRIES } from "./countries.ts";
import { ITEM, ITEMS, SLOTS, inventory, talismanBonus } from "./items.ts";
import { buildDemo } from "./demo.ts";
import { compute, diff, prologXp, questShape, xpParts } from "./model.ts";
import { ageDivision } from "../character.ts";
import type { ArcData, Session } from "./types.ts";

const TODAY = "2026-09-24";

const base = (claims?: Record<string, number>): ArcData => ({
  v: 1,
  profile: { name: "Test", belt: "blau", stripes: 0, startBelt: "blau", weeklyGoal: 2, createdAt: "2026-09-01" },
  onboarding: { date: "2026-09-01", known: ["g_closed", ...Object.keys(claims ?? {})], claims },
  sessions: [],
  pauses: [],
  promotions: [],
  ui: {},
});
const sess = (date: string, extra: Partial<Session> = {}): Session => ({
  id: date + Math.random(),
  date,
  format: "class",
  attire: "gi",
  taught: null,
  rolls: [{ belt: "blau", size: "gleich", sf: 0, sa: 0, c: 0.5 }],
  quest: null,
  worked: null,
  stuck: null,
  createdAt: 0,
  ...extra,
});

test("claims: shown as provisional level, no XP until the rolls confirm them", () => {
  const plain = compute(base(), TODAY);
  const d = base({ s_triangle: 4, g_scissor: 3 });
  const st = compute(d, TODAY);
  assert.equal(st.nodes.s_triangle.level, 4);
  assert.equal(st.nodes.s_triangle.dataLevel, 2);
  assert.ok(st.nodes.s_triangle.prov);
  assert.equal(st.xp, plain.xp, "a self-assessment earns nothing");
  assert.ok(st.attrs.sub.claimed);

  const s = sess(TODAY, { quest: { node: "g_scissor", kind: "jagd", xp: 60, att: 5, succ: 2, done: true } });
  const after = compute({ ...d, sessions: [s] }, TODAY);
  const D = diff(st, after);
  assert.equal(after.nodes.g_scissor.dataLevel, 3);
  assert.ok(!after.nodes.g_scissor.prov);
  assert.deepEqual(D.confirmed, ["g_scissor"]);
  assert.equal(xpParts(s, D).reduce((a, [, v]) => a + v, 0), D.xp, "confirming pays the level XP");
});

test("prologue: belt and stripes set the start level and Ki", () => {
  const d = base();
  d.profile = { ...d.profile!, startStripes: 2, stripes: 2 };
  const st = compute(d, TODAY);
  assert.equal(prologXp("blau", 2), 3240);
  assert.equal(st.prologXp, 3240);
  assert.equal(st.lvl, 10);
  assert.equal(st.ru, 1190);
  assert.equal(compute({ ...d, profile: { ...d.profile!, startBelt: "weiss", startStripes: 0 } }, TODAY).lvl, 1);
});

test("classes: the data points to the leg-lock game, the chosen class boosts quest XP", () => {
  const legs = TECHS.filter((x) => x.sector === "sub" && x.branch === "leg").slice(0, 3);
  const d = base();
  const days = ["2026-08-04", "2026-08-11", "2026-08-18", "2026-08-25", "2026-09-01", "2026-09-08", "2026-09-15", "2026-09-22"];
  for (const day of days) for (const x of legs) d.sessions.push(sess(day, { quest: { node: x.id, kind: "jagd", xp: 50, att: 6, succ: 4, done: true } }));
  assert.equal(compute(d, TODAY).clsDetected, "ferse");

  const tri = TECH.s_triangle;
  const lv = { level: 3, rust: false };
  assert.ok(questShape(tri, lv, false, "jaeger").xp > questShape(tri, lv).xp);
  assert.equal(questShape(tri, lv, false, "druckwalze").xp, questShape(tri, lv).xp);
  assert.equal(new Set(CLASSES.map((c) => c.id)).size, CLASSES.length);
});

test("items: ids unique, references valid, every drop rarity has a pool", () => {
  assert.equal(new Set(ITEMS.map((x) => x.id)).size, ITEMS.length);
  const slots = new Set(SLOTS.map((s) => s.accepts));
  const seals = new Set(SEALS.map((s) => s.id));
  for (const x of ITEMS) {
    assert.ok(slots.has(x.slot), `${x.id}: slot`);
    if (x.src.t === "seal") assert.ok(seals.has(x.src.id), `${x.id}: seal ${x.src.id}`);
  }
  for (const r of ["common", "rare", "epic", "legendary"] as const) assert.ok(ITEMS.some((x) => x.src.t === "drop" && x.rarity === r), r);
  assert.equal(new Set(COUNTRIES.map((c) => c.code)).size, COUNTRIES.length);
  assert.ok(COUNTRIES.length >= 50);
});

test("loot: same data, same drops; the demo has found something", () => {
  const d = buildDemo(TODAY);
  const st = compute(d, TODAY);
  const a = inventory(d, st);
  const b = inventory(structuredClone(d), compute(structuredClone(d), TODAY));
  assert.deepEqual([...a.keys()].sort(), [...b.keys()].sort());
  assert.ok([...a.values()].some((o) => o.via === "Beute nach dem Training"));
  assert.ok(a.has("flag:DE") && a.has("flag:BR"));
});

test("talismans: bonus only on matching sessions", () => {
  const kata = sess(TODAY, { quest: { node: "g_closed", kind: "kata", xp: 30, att: 0, succ: 0, done: true } });
  assert.equal(talismanBonus(ITEM.tl_rolle, kata), 15);
  assert.equal(talismanBonus(ITEM.tl_zahn, kata), 0);
  assert.equal(talismanBonus(ITEM.tl_omamori, kata), 10);
  assert.equal(talismanBonus(ITEM.tl_flamme, { ...kata, rolls: [...kata.rolls, ...kata.rolls] }), 6);
  assert.equal(talismanBonus(undefined, kata), 0);
});

test("age division follows IBJJF", () => {
  assert.equal(ageDivision(2000, 2026)?.name, "Adult");
  assert.equal(ageDivision(1996, 2026)?.name, "Master 1");
  assert.equal(ageDivision(1991, 2026)?.name, "Master 1");
  assert.equal(ageDivision(1990, 2026)?.name, "Master 2");
  assert.equal(ageDivision(1985, 2026)?.name, "Master 3");
  assert.equal(ageDivision(1965, 2026)?.name, "Master 7");
  assert.equal(ageDivision(undefined), null);
});
