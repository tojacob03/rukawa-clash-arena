// Fixed radial layout of the star map. Every sector covers 60 degrees and is
// split into slots for its branches, so each branch grows outward as its own
// arm of the constellation. Deterministic: the same library always gives the
// same map.

import type { SectorId } from "./types.ts";
import { SECTORS, TECHS } from "./techniques.ts";

export const RING_R = [110, 230, 355, 485, 610];
export const VIEW = 720;
const USABLE = 54;

export const sectorAngle = (id: SectorId) => -90 + 60 * SECTORS.findIndex((s) => s.id === id);

export const polar = (r: number, deg: number): [number, number] => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];

export interface Placed {
  x: number;
  y: number;
}

export const POS: Record<string, Placed> = {};

for (const x of TECHS) {
  if (x.sector === "fund" && x.dir) {
    const [px, py] = polar(RING_R[0], sectorAngle(x.dir));
    POS[x.id] = { x: px, y: py };
  }
}

for (const s of SECTORS) {
  const center = sectorAngle(s.id);
  const inSector = TECHS.filter((x) => x.sector === s.id);
  const weights = s.branches.map((b) => {
    let m = 1;
    for (let tier = 1; tier <= 4; tier++) m = Math.max(m, inSector.filter((x) => x.branch === b.id && x.tier === tier).length);
    return m;
  });
  const total = weights.reduce((a, w) => a + w, 0);
  const widths = weights.map((w) => (USABLE * w) / total);
  // A crowded ring alternates inner and outer positions. The alternation runs
  // across branch borders, so neighbours from two branches never share a radius.
  const crowded = [1, 2, 3, 4].map((tier) =>
    s.branches.some((b, bi) => {
      const k = inSector.filter((x) => x.branch === b.id && x.tier === tier).length;
      return k > 1 && ((widths[bi] / k) * Math.PI * RING_R[tier]) / 180 < 70;
    }),
  );
  const seen = [0, 0, 0, 0, 0];
  let start = center - USABLE / 2;
  s.branches.forEach((b, bi) => {
    const width = widths[bi];
    for (let tier = 1; tier <= 4; tier++) {
      const list = inSector.filter((x) => x.branch === b.id && x.tier === tier);
      const step = width / Math.max(list.length, 1);
      list.forEach((x, j) => {
        const ang = start + (j + 0.5) * step;
        const stagger = crowded[tier - 1] ? (seen[tier]++ % 2 ? 30 : -30) : 0;
        const [px, py] = polar(RING_R[tier] + stagger, ang);
        POS[x.id] = { x: px, y: py };
      });
    }
    start += width;
  });
}
