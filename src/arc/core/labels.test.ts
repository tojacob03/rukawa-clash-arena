import { test } from "node:test";
import assert from "node:assert/strict";
import { labelWidth, placeLabels } from "./labels.ts";
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
  const reqs = Array.from({ length: 6 }, (_, i) => ({ id: `i${i}`, text: "Hafen", x: 100, y: 100, prio: i, force: i === 0 }));
  const out = placeLabels(reqs, 12);
  // Four sides for the four most important, plus the forced one on top.
  assert.deepEqual(Object.keys(out).sort(), ["i0", "i2", "i3", "i4", "i5"]);
});

test("labels: bigger font (zoomed out) needs more room", () => {
  const reqs = [
    { id: "a", text: "Muschelstrand", x: 100, y: 100, prio: 2 },
    { id: "b", text: "Leuchtturm Sonnwacht", x: 230, y: 100, prio: 1 },
  ];
  assert.ok(placeLabels(reqs, 10).b.y > 100, "fits below at a small font");
  assert.ok(placeLabels(reqs, 24).b.y < 100, "moves above at a big font");
});
