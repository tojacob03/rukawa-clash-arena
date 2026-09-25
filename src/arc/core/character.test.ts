// Onboarding self-assessment, prologue, classes and items.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TECH, TECHS } from "./techniques.ts";
import { SEALS } from "./lore.ts";
import { CLASSES } from "./classes.ts";
import { COUNTRIES } from "./countries.ts";
import { ITEM, ITEMS, SLOTS, inventory, talismanBonus, unlockText } from "./items.ts";
import { buildDemo } from "./demo.ts";
import { compXp, compute, crossXp, dayNum, diff, prologXp, questShape, rankAt, xpParts } from "./model.ts";
import { CROSS_W } from "./sports.ts";
import { ORGS } from "../compText.ts";
import { bounty } from "./bounty.ts";
import { ISLANDS, rankIndex, route } from "./sea.ts";
import { normalizeLook } from "../avatarOptions.ts";
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

test("prologue: belt and stripes set the start level and Power Level", () => {
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

test("countries: the requested ones are in, every custom flag is drawn", async () => {
  const codes = new Set(COUNTRIES.map((c) => c.code));
  for (const c of ["IR", "PS", "AZ", "AL", "XK", "KUR", "DAG"]) assert.ok(codes.has(c), c);
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../components/Flag.tsx", import.meta.url), "utf8");
  for (const c of COUNTRIES.filter((x) => x.flag.t === "custom")) assert.ok(src.includes(`case "${c.code}"`), `flag ${c.code}`);
});

test("look: old saves migrate, missing fields get defaults", () => {
  const old = normalizeLook({ skin: 3, hair: 2, hairColor: 1, eyeColor: 4, face: 1, beard: 2 } as never);
  assert.equal(old.eyeShape, 0);
  assert.equal(old.mouth, 1);
  assert.equal(old.skin, 3);
  assert.equal(old.height, 0);
  assert.deepEqual(old.marks, ["blush"]);
  assert.equal("face" in old, false);
});

test("competitions: count double for the Power Level, submission wins are evidence, XP and seals", () => {
  const d = base();
  const before = compute(d, TODAY);
  const comp = {
    id: "c1",
    date: "2026-09-20",
    name: "Test Open",
    attire: "gi" as const,
    place: 1,
    matches: [
      { result: "win" as const, method: "sub" as const, tech: "s_triangle", oppBelt: "blau" as const },
      { result: "win" as const, method: "points" as const, oppBelt: "blau" as const },
    ],
    createdAt: 1,
  };
  const withComp = { ...d, competitions: [comp] };
  const after = compute(withComp, TODAY);
  assert.ok(after.ru - before.ru > 20, "two wins against equals move the rating a lot");
  assert.equal(after.nodes.s_triangle.rawSucc, 1);
  assert.equal(after.nodes.s_triangle.sStrong, 1);
  assert.equal(after.comps.w, 2);
  assert.deepEqual(after.comps.medals, [1, 0, 0]);
  assert.ok(after.seals.find((s) => s.id === "arena")?.got && after.seals.find((s) => s.id === "podium")?.got);
  assert.ok(after.xp - before.xp >= compXp(comp));
  const inv = inventory(withComp, after);
  assert.ok(inv.has("ex_gold") && inv.has("pa_arena") && inv.has("pa_finisher") && inv.has("rg_champion"));
  assert.ok(bounty(withComp, after) > bounty(d, before));
});

test("sea chart: 25 islands per route, island items by voyage or by belt", () => {
  assert.equal(ISLANDS.length, 40);
  assert.equal(new Set(ISLANDS.map((x) => x.id)).size, 40);
  for (const sea of ["frost", "morgen", "abend", "glut"] as const) {
    const r = route(sea);
    assert.equal(r.length, 25);
    // The islands still follow the old belt order, as places along the way.
    r.forEach((is, i) => assert.equal(rankIndex(is.belt, is.stripe), i));
    assert.equal(r[5].name, "Tor der vier Strömungen");
    assert.equal(r[24].name, "Kap Kuro");
  }
  const d = base();
  d.promotions = [{ date: "2026-09-10", belt: "blau", stripes: 1 }];
  assert.deepEqual(rankAt(d, dayNum("2026-09-05")), { belt: "blau", stripes: 0 });
  assert.deepEqual(rankAt(d, dayNum("2026-09-12")), { belt: "blau", stripes: 1 });
  // Blue belt profile without a voyage: the gate item still comes with the belt, the purple one not.
  const inv = inventory(d, compute(d, TODAY));
  assert.ok(inv.has("rg_stroemung") && !inv.has("sp_kamm"));
  // A white belt who never gets a stripe sails through the gate on trainings alone.
  const white: ArcData = { ...base(), profile: { ...base().profile!, belt: "weiss", startBelt: "weiss" } };
  white.sessions = Array.from({ length: 30 }, (_, i) => sess(new Date(Date.parse("2026-06-01T12:00:00Z") + i * 3 * 864e5).toISOString().slice(0, 10)));
  const winv = inventory(white, compute(white, TODAY));
  assert.ok(winv.has("rg_stroemung"), "reached the gate");
  assert.ok(winv.has("pa_anker") && winv.has("hd_piratentuch"), "home sea items on the way");
  assert.ok(!winv.has("sp_kamm"), "the ridge is still far");
  assert.match(unlockText(ITEM.rg_stroemung.src, "frost"), /^Insel Tor der vier Strömungen erreichen oder Blaugurt$/);
});

test("other sports: XP and body values, but not the BJJ weekly goal", () => {
  const d = base();
  const before = compute(d, TODAY);
  const kraft = { id: "k1", date: TODAY, sport: "kraft" as const, minutes: 60, intensity: 2, createdAt: 1 };
  const after = compute({ ...d, cross: [kraft] }, TODAY);
  assert.equal(after.weekNow, before.weekNow, "does not count for the weekly goal");
  assert.equal(after.xp - before.xp, crossXp(kraft));
  assert.ok(after.body.kraft > 0 && after.body.beweglichkeit === 0);
  assert.equal(after.body.week, 1);
});

test("other sports: wrestling takedowns count for stand-up techniques at 0.75", () => {
  const d = base();
  const ringen = { id: "r1", date: "2026-09-20", sport: "ringen" as const, minutes: 90, intensity: 3, tech: "t_double", att: 4, succ: 2, createdAt: 1 };
  const st = compute({ ...d, cross: [ringen] }, TODAY);
  assert.equal(st.nodes.t_double.rawAtt, 4);
  assert.equal(st.nodes.t_double.rawSucc, 2);
  assert.ok(Math.abs(st.nodes.t_double.nw - 4 * CROSS_W) < 1e-9);
  // Strength training cannot claim a takedown, and a guard technique does not count.
  const kraft = { ...ringen, id: "k", sport: "kraft" as const };
  const guard = { ...ringen, id: "g", tech: "g_closed" };
  const st2 = compute({ ...d, cross: [kraft, guard] }, TODAY);
  assert.equal(st2.nodes.t_double.rawAtt, 0);
  assert.equal(st2.nodes.g_closed.rawAtt, 0);
  // Gi / No-Gi comparisons leave other sports out.
  assert.equal(compute({ ...d, cross: [ringen] }, TODAY, { attire: "nogi" }).nodes.t_double.rawAtt, 0);
});

test("competition organisers include AGF", () => {
  assert.ok(ORGS.includes("AGF"));
});
