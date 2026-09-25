// The skill tree as a plum branch on a handscroll (emakimono). One stem runs
// along the scroll; each sector grows from it as a limb, in the order of a
// match (stand, guard, passing, control, submission, defence), alternately
// upwards and downwards. A limb carries one twig per branch of the sector,
// and the techniques sit on it as buds, tier by tier from the limb outwards.
// Deterministic: the same library always grows the same branch.

import type { SectorId, Technique } from "./types.ts";
import { SECTOR, TECHS } from "./techniques.ts";

export type Pt = [number, number];

export interface Stroke {
  id: string;
  /** Centre line, sampled. */
  pts: Pt[];
  /** Brush width at the start and at the end. */
  w0: number;
  w1: number;
  /** 0 stem, 1 limb, 2 twig of a branch, 3 stalk of a bud. */
  depth: number;
  /** When the stroke is drawn while the branch grows, 0 … 1. */
  at: number;
  sector?: SectorId;
}

export interface BudSpot {
  id: string;
  x: number;
  y: number;
  /** Direction the bud points (degrees), away from its stalk. */
  deg: number;
  sector: SectorId;
  at: number;
}

export interface LimbInfo {
  id: SectorId;
  /** Where the limb leaves the stem. */
  x: number;
  y: number;
  up: boolean;
  /** Bounds of everything on the limb, for flying to a sector. */
  box: { x0: number; y0: number; x1: number; y1: number };
}

/** Order of the limbs along the scroll: the course of a match. */
export const LIMB_ORDER: SectorId[] = ["stand", "guard", "pass", "ctrl", "sub", "def"];

const H = 1100;
const MID = 560;

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rad = (d: number) => (d * Math.PI) / 180;
const dirPt = (p: Pt, deg: number, len: number): Pt => [p[0] + Math.cos(rad(deg)) * len, p[1] + Math.sin(rad(deg)) * len];

/** A slightly bent line from a to b, sampled into n points (quadratic curve). */
function bent(a: Pt, b: Pt, bend: number, n = 18): Pt[] {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const c: Pt = [mx - (dy / len) * bend * len, my + (dx / len) * bend * len];
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
  }
  return out;
}

/**
 * A plum twig grows in angular steps: a few segments, each turning a little
 * against the one before, each slightly bent.
 */
function zigzag(a: Pt, deg: number, len: number, steps: number, zig: number, r: () => number, bend = 0.06): Pt[] {
  const out: Pt[] = [a];
  let p = a;
  let d = deg;
  for (let i = 0; i < steps; i++) {
    const seg = (len / steps) * (0.8 + 0.4 * r());
    const q = dirPt(p, d, seg);
    out.push(...bent(p, q, bend * (i % 2 ? 1 : -1), 8).slice(1));
    p = q;
    d += (i % 2 ? -1 : 1) * zig * (0.6 + 0.8 * r());
  }
  return out;
}

/** Keep a point on the scroll, with a margin. */
const inside = (p: Pt, m = 70): boolean => p[1] > m && p[1] < H - m;

/** The point at a fraction of a polyline's length, and the direction there. */
export function along(pts: Pt[], f: number): { p: Pt; deg: number } {
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d);
    total += d;
  }
  let want = Math.max(0, Math.min(1, f)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? Math.min(1, want / seg[i]) : 0;
      const a = pts[i];
      const b = pts[i + 1];
      return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], deg: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI };
    }
    want -= seg[i];
  }
  return { p: pts[pts.length - 1], deg: 0 };
}

function grow() {
  const strokes: Stroke[] = [];
  const buds: Record<string, BudSpot> = {};
  const limbs: LimbInfo[] = [];
  const bySector = (id: SectorId) => TECHS.filter((x) => x.sector === id);
  const weight = (id: SectorId) => Math.pow(bySector(id).length, 0.95);
  const total = LIMB_ORDER.reduce((a, id) => a + weight(id), 0);
  const X0 = 170;
  const SPAN = 3500;
  const stemY = (x: number) => MID + 30 * Math.sin(x / 430) + 11 * Math.sin(x / 131 + 1.3);

  // The stem: from the left end of the scroll to the right, thinning out.
  const stemPts: Pt[] = [];
  for (let x = 30; x <= X0 + SPAN + 140; x += 40) stemPts.push([x, stemY(x)]);
  strokes.push({ id: "stem", pts: stemPts, w0: 34, w1: 9, depth: 0, at: 0 });

  let cursor = X0;
  LIMB_ORDER.forEach((sid, li) => {
    const s = SECTOR[sid];
    const techs = bySector(sid);
    const span = (SPAN * weight(sid)) / total;
    const up = li % 2 === 0;
    const r = rng(sid);
    const bx = cursor + span * 0.14;
    const base: Pt = [bx, stemY(bx)];
    const sign = up ? -1 : 1;
    const limbDeg = sign * (44 + r() * 22);
    let limbLen = Math.min(520, 250 + 5 * techs.length);
    let limbPts = zigzag(base, limbDeg, limbLen, 3, 16, r);
    while (!limbPts.every((p) => inside(p, 150)) && limbLen > 200) {
      limbLen -= 20;
      limbPts = zigzag(base, limbDeg, limbLen, 3, 16, rng(sid));
    }
    const tip = limbPts[limbPts.length - 1];
    const at = 0.12 + (li / LIMB_ORDER.length) * 0.35;
    strokes.push({ id: `limb-${sid}`, pts: limbPts, w0: 22, w1: 5, depth: 1, at, sector: sid });
    let box = { x0: base[0], y0: Math.min(base[1], tip[1]), x1: tip[0], y1: Math.max(base[1], tip[1]) };
    const extend = (p: Pt) => {
      box = { x0: Math.min(box.x0, p[0]), y0: Math.min(box.y0, p[1]), x1: Math.max(box.x1, p[0]), y1: Math.max(box.y1, p[1]) };
    };

    // The fundament technique of the sector sits on the stem, before its limb.
    for (const f of TECHS.filter((x) => x.sector === "fund" && x.dir === sid)) {
      const fx = bx - 70;
      const a: Pt = [fx, stemY(fx)];
      const deg = -sign * 90 + (r() - 0.5) * 20;
      const b = dirPt(a, deg, 34);
      strokes.push({ id: `stalk-${f.id}`, pts: bent(a, b, 0.1, 6), w0: 3.2, w1: 1.4, depth: 3, at: at - 0.04, sector: sid });
      buds[f.id] = { id: f.id, x: b[0], y: b[1], deg, sector: sid, at: at + 0.02 };
      extend(b);
    }

    // One twig per branch of the sector, leaving the limb on alternating sides.
    const branches = s.branches.filter((b) => techs.some((x) => x.branch === b.id));
    branches.forEach((b, bi) => {
      const list = techs.filter((x) => x.branch === b.id);
      const tiers = [1, 2, 3, 4].map((t) => list.filter((x) => x.tier === t)).filter((g) => g.length);
      const f = 0.2 + (0.74 * (bi + 0.5)) / branches.length;
      const on = along(limbPts, f);
      const side = bi % 2 === 0 ? -1 : 1;
      const deg = on.deg + side * (38 + r() * 30);
      let len = 70 + 44 * tiers.length + 9 * list.length;
      let twig = zigzag(on.p, deg, len, 2, 22, r, 0.1);
      while (!twig.every((p) => inside(p)) && len > 80) {
        len -= 12;
        twig = zigzag(on.p, deg, len, 2, 22, rng(sid + b.id), 0.1);
      }
      const end = twig[twig.length - 1];
      const tAt = at + 0.06 + 0.1 * (bi / branches.length);
      strokes.push({ id: `twig-${sid}-${b.id}`, pts: twig, w0: 8.5, w1: 2.4, depth: 2, at: tAt, sector: sid });
      extend(end);

      tiers.forEach((group, ti) => {
        const last = ti === tiers.length - 1;
        const place = along(twig, last ? 1 : 0.26 + (0.62 * ti) / Math.max(1, tiers.length - 1));
        const n = group.length;
        // Mid tiers spray to one side of the twig, the last tier fans out at the tip.
        const alt = ti % 2 === 0 ? 1 : -1;
        const centre = last ? place.deg : place.deg + alt * 62;
        const spread = Math.min(36 * (n - 1), last ? 160 : 120);
        group.forEach((x, k) => {
          const d = n === 1 ? centre : centre - spread / 2 + (spread * k) / (n - 1);
          const stalk = n === 1 && !last ? 28 : 38 + (n >= 4 ? (k % 2) * 18 : 0);
          const pt = dirPt(place.p, d, stalk);
          const bAt = tAt + 0.08 + 0.05 * ti + 0.01 * k;
          strokes.push({ id: `stalk-${x.id}`, pts: bent(place.p, pt, 0.12 * (k % 2 ? 1 : -1), 6), w0: 3, w1: 1.2, depth: 3, at: bAt - 0.03, sector: sid });
          buds[x.id] = { id: x.id, x: pt[0], y: pt[1], deg: d, sector: sid, at: bAt };
          extend(pt);
        });
      });
    });
    limbs.push({ id: sid, x: base[0], y: base[1], up, box });
    cursor += span;
  });

  relax(buds, strokes);
  // Bounds after relaxing, with room for labels.
  for (const l of limbs) {
    const own = Object.values(buds).filter((b) => b.sector === l.id);
    for (const b of own) l.box = { x0: Math.min(l.box.x0, b.x), y0: Math.min(l.box.y0, b.y), x1: Math.max(l.box.x1, b.x), y1: Math.max(l.box.y1, b.y) };
  }
  const W = X0 + SPAN + 180;
  return { W, H, strokes, buds, limbs };
}

/**
 * Buds that came to lie too close together are pushed apart, a little at a
 * time, each held back by a spring to where it grew; its stalk follows it.
 */
function relax(buds: Record<string, BudSpot>, strokes: Stroke[]) {
  const list = Object.values(buds);
  const home = new Map(list.map((b) => [b.id, [b.x, b.y] as Pt]));
  const MIN = 50;
  for (let it = 0; it < 90; it++) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d >= MIN) continue;
        const push = (MIN - d) / 2 / d;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
      }
    }
    for (const b of list) {
      const [hx, hy] = home.get(b.id)!;
      b.x += (hx - b.x) * 0.04;
      b.y += (hy - b.y) * 0.04;
      b.y = Math.max(40, Math.min(H - 40, b.y));
    }
  }
  for (const s of strokes) {
    if (s.depth !== 3) continue;
    const b = buds[s.id.slice(6)];
    if (!b) continue;
    const a = s.pts[0];
    s.pts = bent(a, [b.x, b.y], 0.12, 6);
    const last = s.pts[s.pts.length - 2];
    b.deg = (Math.atan2(b.y - last[1], b.x - last[0]) * 180) / Math.PI;
  }
}

export const TREE = grow();

/** Where a technique grows: its bud. */
export const budOf = (x: Technique) => TREE.buds[x.id];

/**
 * The outline of a brush stroke along a centre line: pressed down at the
 * start, thinning towards the end, with the small unevenness of ink on paper.
 */
export function brushPath(s: Stroke): string {
  const r = rng(s.id);
  const n = s.pts.length;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = s.pts[Math.max(0, i - 1)];
    const b = s.pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const press = 1 + 0.28 * Math.exp(-Math.pow((t - 0.06) / 0.07, 2));
    const w = (s.w0 + (s.w1 - s.w0) * Math.pow(t, 0.8)) * press * (0.92 + 0.16 * r());
    const [x, y] = s.pts[i];
    left.push([x + (nx * w) / 2, y + (ny * w) / 2]);
    right.push([x - (nx * w) / 2, y - (ny * w) / 2]);
  }
  const f = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  const tipW = Math.hypot(left[n - 1][0] - right[n - 1][0], left[n - 1][1] - right[n - 1][1]) / 2;
  return `M${f(left[0])}${left
    .slice(1)
    .map((p) => `L${f(p)}`)
    .join("")}A${tipW.toFixed(1)} ${tipW.toFixed(1)} 0 0 1 ${f(right[n - 1])}${right
    .slice(0, -1)
    .reverse()
    .map((p) => `L${f(p)}`)
    .join("")}Z`;
}

/** The centre line as a path, for growing a stroke with a dash. */
export const linePath = (pts: Pt[]) => `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L")}`;

/** Paper fibres of the washi scroll: short, faint, in every direction. */
export function fibres(w: number, h: number, count: number): string[] {
  const r = rng("washi");
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = r() * w;
    const y = r() * h;
    const deg = r() * 360;
    const len = 18 + r() * 70;
    const b = dirPt([x, y], deg, len);
    const c = dirPt([x, y], deg + (r() - 0.5) * 50, len * 0.5);
    out.push(`M${x.toFixed(0)} ${y.toFixed(0)}Q${c[0].toFixed(0)} ${c[1].toFixed(0)} ${b[0].toFixed(0)} ${b[1].toFixed(0)}`);
  }
  return out;
}
