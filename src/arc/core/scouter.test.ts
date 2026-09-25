// Scouter readouts: stakes, records, plans and the self scan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDemo } from "./demo.ts";
import { BELT_R, compute, expected, K_COMP, powerOf } from "./model.ts";
import { bossScan, defences, matchStakes, opponentScan, partnerScan, plan, powerTier, recordVs, rollStakes, selfScan, weapons } from "./scouter.ts";
import { TECH } from "./techniques.ts";
import { STUCK } from "./lore.ts";

const TODAY = "2026-09-24";
const demo = buildDemo(TODAY);
const st = compute(demo, TODAY);

test("stakes: a stronger partner risks little and offers a lot", () => {
  const [win, draw, loss] = rollStakes(1150, 1420);
  assert.ok(win.delta > 0 && draw.delta > 0 && loss.delta <= 0);
  // Against a much stronger partner even a draw gains, a loss costs little.
  assert.ok(win.delta > Math.abs(loss.delta));
  // Against a weaker partner it is the other way round.
  const [w2, , l2] = rollStakes(1420, 1150);
  assert.ok(Math.abs(l2.delta) > w2.delta);
  // Competition matches weigh double and use win/draw/loss.
  const m = matchStakes(1150, 1150);
  assert.equal(m[0].delta, powerOf(1150 + K_COMP * 0.5) - powerOf(1150));
  assert.equal(m[1].delta, 0);
  assert.equal(rollStakes(1150, 1150)[1].delta, 0);
});

test("power level: belts are far apart, 100 rating points double it", () => {
  assert.equal(powerOf(BELT_R.weiss), 1000);
  assert.equal(powerOf(1100), 2000);
  assert.ok(powerOf(BELT_R.schwarz) / powerOf(BELT_R.weiss) > 30);
  assert.ok(powerOf(BELT_R.blau) > 2500 && powerOf(BELT_R.lila) === 8000);
  // Losing still works: below the white belt start the value keeps falling.
  assert.ok(powerOf(900) === 500);
});

test("records: rolls and matches against a belt add up", () => {
  const all = (["weiss", "blau", "lila", "braun", "schwarz"] as const).reduce((a, b) => a + recordVs(demo, b).rolls, 0);
  assert.equal(all, demo.sessions.reduce((a, s) => a + s.rolls.length, 0));
  const blue = recordVs(demo, "blau");
  assert.ok(blue.ctrl >= 0 && blue.ctrl <= 1);
});

test("plan: survive against much stronger, experiment against much weaker", () => {
  assert.equal(plan(0.2, st).title, "Überleben und lernen");
  assert.equal(plan(0.5, st).title, "Dein A-Game");
  assert.equal(plan(0.85, st).title, "Neues ausprobieren");
  for (const id of plan(0.2, st, "nogi").focus) assert.ok(["escape", "defense"].includes(TECH[id].kind), id);
  assert.match(plan(0.5, st, undefined, "schwerer").text, /Schwerer Partner/);
});

test("techniques: weapons are proven, defences start with the boss, no-gi drops gi-only moves", () => {
  for (const id of weapons(st)) assert.ok(st.nodes[id].dataLevel >= 3, id);
  for (const id of weapons(st, "nogi", 10)) assert.ok(TECH[id].nogi, id);
  if (st.boss) {
    const first = defences(st)[0];
    assert.ok(STUCK[st.boss.key].nodes.includes(first), first);
  }
});

test("partner and opponent scans agree with the Elo model", () => {
  const p = partnerScan(demo, st, "braun", "schwerer", "gi");
  assert.equal(p.power, Math.round(1000 * Math.pow(2, (1420 + 60 - 1000) / 100)));
  assert.ok(Math.abs(p.E - expected(st.ru, 1480)) < 1e-9);
  assert.equal(p.tier, powerTier(1480));
  const o = opponentScan(demo, st, "blau", "nogi");
  assert.equal(o.stakes.length, 3);
  for (const id of o.weapons) assert.ok(TECH[id].nogi, id);
  assert.ok(o.watch.length > 0);
});

test("self scan: series of 17 weekly points ending today, peak not below today", () => {
  const s = selfScan(demo, st);
  assert.equal(s.series.length, 17);
  assert.equal(s.series[16].power, s.power);
  assert.ok(s.peak.power >= Math.min(...s.series.map((x) => x.power)));
  assert.ok(s.strongest.val >= s.weakest.val);
  assert.equal(s.byBelt.reduce((a, b) => a + b.rolls, 0), demo.sessions.reduce((a, x) => a + x.rolls.length, 0));
});

test("boss scan: goal is half the cases, counters come from the position", () => {
  const b = bossScan(st);
  if (!b) return;
  assert.equal(b.goal, Math.floor(b.hp / 2));
  assert.deepEqual(
    b.counters.map((c) => c.id),
    STUCK[b.key].nodes,
  );
});
