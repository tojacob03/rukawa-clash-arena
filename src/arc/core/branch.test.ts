// The plum branch of the skill tree: every technique grows as a bud on the
// scroll, none lies on another, and the same library grows the same branch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TECHS } from "./techniques.ts";
import { LIMB_ORDER, TREE, brushPath } from "./branch.ts";

test("every technique has a bud on the scroll, and nothing else does", () => {
  const ids = new Set(TECHS.map((x) => x.id));
  assert.equal(Object.keys(TREE.buds).length, TECHS.length);
  for (const b of Object.values(TREE.buds)) {
    assert.ok(ids.has(b.id), b.id);
    assert.ok(b.x > 0 && b.x < TREE.W, `${b.id} x ${b.x}`);
    assert.ok(b.y >= 40 && b.y <= TREE.H - 40, `${b.id} y ${b.y}`);
  }
});

test("buds keep their distance, so none covers another", () => {
  const list = Object.values(TREE.buds);
  let min = Infinity;
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) min = Math.min(min, Math.hypot(list[i].x - list[j].x, list[i].y - list[j].y));
  assert.ok(min >= 40, `closest buds ${min.toFixed(1)} apart`);
});

test("one limb per sector, in the order of a match, alternately up and down", () => {
  assert.deepEqual(
    TREE.limbs.map((l) => l.id),
    LIMB_ORDER,
  );
  TREE.limbs.forEach((l, i) => assert.equal(l.up, i % 2 === 0));
  for (let i = 1; i < TREE.limbs.length; i++) assert.ok(TREE.limbs[i].x > TREE.limbs[i - 1].x);
});

test("every bud hangs on a stalk that starts on the branch", () => {
  for (const x of TECHS) {
    const s = TREE.strokes.find((k) => k.id === `stalk-${x.id}`);
    assert.ok(s, x.id);
    const end = s.pts[s.pts.length - 1];
    const b = TREE.buds[x.id];
    assert.ok(Math.hypot(end[0] - b.x, end[1] - b.y) < 0.5, x.id);
  }
});

test("brush strokes are closed outlines", () => {
  for (const s of TREE.strokes) {
    const d = brushPath(s);
    assert.match(d, /^M[\d.-]+ [\d.-]+/);
    assert.ok(d.endsWith("Z"), s.id);
    assert.ok(!d.includes("NaN"), s.id);
  }
});
