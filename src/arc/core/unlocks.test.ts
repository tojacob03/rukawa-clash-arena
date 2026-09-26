// Progressive disclosure: the ways open one by one with the first trainings.
import { test } from "node:test";
import assert from "node:assert/strict";
import { OPENINGS, isOpen, newlyOpen, stillClosed } from "./unlocks.ts";
import { emptySave } from "./records.ts";
import type { ArcData, Session } from "./types.ts";

const ses = (i: number): Session => ({ id: `s${i}`, date: `2026-03-0${i + 1}`, format: "class", attire: "gi", taught: null, rolls: [], quest: null, worked: null, stuck: null, createdAt: i });
const withN = (n: number): ArcData => ({ ...emptySave(), sessions: Array.from({ length: n }, (_, i) => ses(i)) });

test("a new player starts with everything still to open, in order", () => {
  assert.deepEqual(
    stillClosed(withN(0)).map((o) => o.id),
    OPENINGS.map((o) => o.id),
  );
  for (let i = 1; i < OPENINGS.length; i++) assert.ok(OPENINGS[i].after >= OPENINGS[i - 1].after);
});

test("each training opens what it reaches, once", () => {
  assert.deepEqual(
    newlyOpen(withN(0), withN(1)).map((o) => o.id),
    ["sea"],
  );
  assert.deepEqual(
    newlyOpen(withN(1), withN(2)).map((o) => o.id),
    ["power"],
  );
  assert.deepEqual(newlyOpen(withN(5), withN(6)), []);
  assert.equal(stillClosed(withN(4)).length, 0);
});

test("tournaments count, and the demo shows everything", () => {
  const d = { ...withN(0), competitions: [{ id: "c", date: "2026-03-01", name: "Open", attire: "gi" as const, matches: [], place: 0, createdAt: 1 }] };
  assert.ok(isOpen(d, "sea"));
  assert.ok(isOpen({ ...withN(0), demo: true }, "hexagon"));
});
