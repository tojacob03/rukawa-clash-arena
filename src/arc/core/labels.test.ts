import { test } from "node:test";
import assert from "node:assert/strict";
import { labelWidth, placeLabels, spotBox } from "./labels.ts";
import type { PlacedLabel } from "./labels.ts";

const box = (p: PlacedLabel, text: string, fs: number) => {
  const w = labelWidth(text, fs);
  const x0 = p.anchor === "middle" ? p.x - w / 2 : p.anchor === "start" ? p.x : p.x - w;
  return { x0, x1: x0 + w, y0: p.y - fs, y1: p.y + fs * 0.2 };
};

test("labels: close neighbours move aside instead of overlapping", () => {
  const reqs = [
    { id: "a", text: "Nebelwald von Hakenstein", x: 600, y: 380, prio: 10 },
    { id: "b", text: "Tor der vier Strömungen", x: 610, y: 386, prio: 5 },
  ];
  const out = placeLabels(reqs, 12);
  assert.ok(out.a && out.b);
  const [ba, bb] = [box(out.a, reqs[0].text, 12), box(out.b, reqs[1].text, 12)];
  const hit = ba.x0 < bb.x1 && ba.x1 > bb.x0 && ba.y0 < bb.y1 && ba.y1 > bb.y0;
  assert.equal(hit, false, JSON.stringify(out));
  // The more important label keeps its preferred place below the island.
  assert.equal(out.a.anchor, "middle");
  assert.ok(out.a.y > 380);
});

test("labels: forced labels always appear, others give way", () => {
  const reqs = Array.from({ length: 10 }, (_, i) => ({ id: `i${i}`, text: "Hafen", x: 100, y: 100, prio: i, force: i === 0 }));
  const out = placeLabels(reqs, 12);
  // Around one point the diagonals overlap the four sides: four fit, plus the forced one.
  assert.deepEqual(Object.keys(out).sort(), ["i0", "i6", "i7", "i8", "i9"]);
});

test("labels: bigger font (zoomed out) needs more room", () => {
  const reqs = [
    { id: "a", text: "Muschelstrand", x: 100, y: 100, prio: 2 },
    { id: "b", text: "Leuchtturm Sonnwacht", x: 230, y: 100, prio: 1 },
  ];
  assert.ok(placeLabels(reqs, 10).b.y > 100, "fits below at a small font");
  assert.ok(placeLabels(reqs, 24).b.y < 100, "moves above at a big font");
});

test("labels: own spots are tried in order, obstacles are avoided", () => {
  const spots = [
    { x: 100, y: 100, anchor: "middle" as const },
    { x: 400, y: 100, anchor: "middle" as const },
  ];
  const island = { x0: 60, y0: 80, x1: 140, y1: 110 };
  const out = placeLabels([{ id: "sea", text: "Morgenmeer", x: 0, y: 0, prio: 1, spots }], 12, [island]);
  assert.equal(out.sea.x, 400);
});

test("labels: nothing is cut off at the edge of the view", () => {
  const view = { x0: 0, y0: 0, x1: 300, y1: 300 };
  const reqs = [{ id: "a", text: "Leuchtturm Sonnwacht", x: 290, y: 150, prio: 1 }];
  const out = placeLabels(reqs, 12, [], view);
  const b = spotBox(out.a, reqs[0].text, 12);
  assert.ok(b.x1 <= 300 && b.x0 >= 0, JSON.stringify(out.a));
  assert.equal(out.a.anchor, "end", "moves to the left of the island");
  // Far outside: left out, unless forced.
  assert.deepEqual(placeLabels([{ ...reqs[0], x: 330 }], 12, [], view), {});
  assert.ok(placeLabels([{ ...reqs[0], x: 330, force: true }], 12, [], view).a);
});

test("labels: bigger labels need more room, vertical ones run downwards", () => {
  const big = spotBox({ x: 0, y: 0, anchor: "start" }, "Frostmeer", 24);
  const small = spotBox({ x: 0, y: 0, anchor: "start" }, "Frostmeer", 12);
  assert.ok(big.x1 > small.x1 * 1.9);
  const v = spotBox({ x: 50, y: 10, anchor: "start", vertical: true }, "Scharlachkamm", 12);
  assert.ok(v.y1 - v.y0 > 80 && v.x1 - v.x0 < 20);
});

test("labels: an island's own shape does not block its label", () => {
  const own = { x0: 80, y0: 80, x1: 120, y1: 130, owner: "a" };
  const out = placeLabels([{ id: "a", text: "Wirbelinsel", x: 100, y: 100, prio: 1 }], 12, [own]);
  assert.ok(out.a.y > 100, "stays below its island");
  const other = placeLabels([{ id: "b", text: "Wirbelinsel", x: 100, y: 100, prio: 1 }], 12, [own]);
  assert.notEqual(other.b?.y, out.a.y);
});

test("labels: a forced label without room takes the spot it covers least", () => {
  // Markers above and below the island, a small one to the right.
  const obstacles = [
    { x0: 40, y0: 60, x1: 160, y1: 92 },
    { x0: 40, y0: 108, x1: 160, y1: 150 },
    { x0: 116, y0: 94, x1: 124, y1: 106 },
  ];
  const out = placeLabels([{ id: "a", text: "Nebelwald von Hakenstein", x: 100, y: 100, prio: 1, force: true }], 12, obstacles);
  assert.equal(out.a.anchor, "end", JSON.stringify(out.a));
});
