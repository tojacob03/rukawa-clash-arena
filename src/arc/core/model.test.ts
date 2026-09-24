// Run with: npm run test:arc  (node --test, type stripping, no extra deps)
import { test } from "node:test";
import assert from "node:assert/strict";
import { COMBOS, TECH, TECHS } from "./techniques.ts";
import { POS } from "./layout.ts";
import { STUCK } from "./lore.ts";
import { buildDemo } from "./demo.ts";
import { compute, dayNum, diff, pickCards, posterior, weekOf, xpParts } from "./model.ts";
import type { ArcData, Session } from "./types.ts";

const TODAY = "2026-09-24";

test("library: ids are unique and every reference resolves", () => {
  assert.equal(new Set(TECHS.map((x) => x.id)).size, TECHS.length);
  for (const x of TECHS) for (const p of x.pre) assert.ok(TECH[p], `${x.id} needs unknown ${p}`);
  for (const [a, b] of COMBOS) assert.ok(TECH[a] && TECH[b], `combo ${a} → ${b}`);
  for (const s of Object.values(STUCK)) for (const id of s.nodes) assert.ok(TECH[id], `boss node ${id}`);
  assert.ok(TECHS.length >= 72, "at least 72 techniques");
});

test("library: prerequisites never point outward", () => {
  for (const x of TECHS) for (const p of x.pre) assert.ok(TECH[p].tier <= x.tier, `${x.id} (ring ${x.tier}) needs ${p} (ring ${TECH[p].tier})`);
});

test("layout: every technique has a distinct position", () => {
  const pts = TECHS.map((x) => POS[x.id]);
  assert.ok(pts.every(Boolean));
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      assert.ok(d > 24, `${TECHS[i].id} and ${TECHS[j].id} overlap (${d.toFixed(1)})`);
    }
});

test("weekOf: Monday starts a new week", () => {
  assert.equal(weekOf(dayNum("2026-09-21")), weekOf(dayNum("2026-09-27")));
  assert.equal(weekOf(dayNum("2026-09-28")), weekOf(dayNum("2026-09-21")) + 1);
});

const base = (): ArcData => ({
  v: 1,
  profile: { name: "Test", belt: "blau", stripes: 0, startBelt: "blau", weeklyGoal: 2, createdAt: "2026-09-01" },
  onboarding: { date: "2026-09-01", known: ["g_closed"] },
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

test("three out of three is not mastery yet", () => {
  const q = (att: number, succ: number) => ({ node: "s_triangle", kind: "jagd" as const, xp: 50, att, succ, done: true });
  const lucky = base();
  lucky.sessions.push(sess("2026-09-20", { quest: q(3, 3) }));
  const steady = base();
  for (const date of ["2026-09-08", "2026-09-10", "2026-09-13", "2026-09-15", "2026-09-17", "2026-09-20"]) steady.sessions.push(sess(date, { quest: q(5, 2) }));
  const a = compute(lucky, TODAY).nodes.s_triangle;
  const b = compute(steady, TODAY).nodes.s_triangle;
  assert.ok(a.level < 3, "three attempts are not enough for Erprobt");
  assert.ok(a.M < b.M, "30 attempts at 40 % beat a lucky 3 of 3");
  assert.ok(posterior(0.18, 3, 3).mu > posterior(0.18, 30, 12).mu, "even though the lucky rate looks higher");
});

test("levels: onboarding is provisional, five live attempts make Erprobt", () => {
  const d = base();
  assert.equal(compute(d, TODAY).nodes.g_closed.level, 2);
  assert.ok(compute(d, TODAY).nodes.g_closed.prov);
  d.sessions.push(sess("2026-09-20", { quest: { node: "g_closed", kind: "jagd", xp: 50, att: 5, succ: 2, done: true } }));
  const st = compute(d, TODAY).nodes.g_closed;
  assert.equal(st.level, 3);
  assert.ok(!st.prov);
});

test("rust: sixty days without training", () => {
  const d = base();
  d.sessions.push(sess("2026-06-01", { quest: { node: "s_triangle", kind: "jagd", xp: 50, att: 6, succ: 2, done: true } }));
  assert.ok(compute(d, TODAY).nodes.s_triangle.rust);
  assert.ok(!compute(d, "2026-07-15").nodes.s_triangle.rust);
});

test("xp parts add up to the XP difference", () => {
  const d = base();
  d.sessions.push(sess("2026-09-21"));
  const A = compute(d, TODAY);
  const s = sess(TODAY, { quest: { node: "g_closed", kind: "jagd", xp: 50, att: 5, succ: 2, done: true }, stuck: "sidebottom" });
  const B = compute({ ...d, sessions: [...d.sessions, s] }, TODAY);
  const D = diff(A, B);
  assert.equal(xpParts(s, D).reduce((a, [, v]) => a + v, 0), D.xp);
});

test("cards: three sectors, no gi-only card on a no-gi day", () => {
  const d = buildDemo(TODAY);
  const st = compute(d, TODAY);
  const cards = pickCards(st.offers, { attire: "nogi" });
  assert.equal(cards.length, 3);
  assert.equal(new Set(cards.map((c) => TECH[c.node].sector)).size, 3);
  assert.ok(cards.every((c) => TECH[c.node].nogi));
});

test("demo: shows every state the app can show", () => {
  const st = compute(buildDemo(TODAY), TODAY);
  const lv = (l: number) => TECHS.filter((x) => st.nodes[x.id].level === l).length;
  assert.ok(lv(5) >= 1, "a Tokui-Waza");
  assert.ok(lv(4) >= 2, "Geschärft techniques");
  assert.ok(TECHS.some((x) => st.nodes[x.id].rust), "rust");
  assert.ok(st.boss, "a weekly boss");
  assert.equal(st.weekNow, 1, "one training this week, so logging today reaches the goal");
});
