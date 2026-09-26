// Label placement for maps: each label tries its candidate spots (by default
// below, above, right and left of its point) and takes the first one that
// covers neither a label placed before it nor an obstacle (islands, ships),
// and that lies inside the visible part of the map. Higher priority goes
// first; forced labels always appear.

export interface Spot {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  /** Text runs top to bottom (rotated by 90°). */
  vertical?: boolean;
}

export interface LabelReq {
  id: string;
  text: string;
  x: number;
  y: number;
  prio: number;
  /** Always shown, even if every spot is taken. */
  force?: boolean;
  /** Try above first (islands north of the current). */
  above?: boolean;
  /** Font size relative to `fs` (sea names are bigger, calm belts smaller). */
  size?: number;
  /** Own candidate spots instead of the four around the point. */
  spots?: Spot[];
}

export interface PlacedLabel {
  id: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  vertical?: boolean;
  /** The box the text covers, in map units. */
  box: Rect;
}

/** A line on the map (a route leg) that text should rather not sit on. */
export type Segment = [x0: number, y0: number, x1: number, y1: number];

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** An obstacle that belongs to this label (its own island) does not block it. */
  owner?: string;
}

const overlaps = (a: Rect, b: Rect, pad: number) => a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.y0 < b.y1 + pad && a.y1 > b.y0 - pad;
const inside = (a: Rect, v: Rect) => a.x0 >= v.x0 && a.x1 <= v.x1 && a.y0 >= v.y0 && a.y1 <= v.y1;

/**
 * Width of a label in map units, for a font of size `fs`: bold rounded sans
 * measures 0.55 em per character on average and up to 0.62 with wide letters,
 * plus the outline around the text.
 */
export const labelWidth = (text: string, fs: number) => text.length * fs * 0.6 + fs * 0.3;

/** The box a label covers at a spot, for text of size `fs`. */
export function spotBox(s: Spot, text: string, fs: number): Rect {
  const w = labelWidth(text, fs);
  if (s.vertical) {
    // Rotated 90° clockwise around its start: runs down from (x, y), glyphs to the right of x.
    return { x0: s.x - fs * 0.25, y0: s.y, x1: s.x + fs * 0.95, y1: s.y + w };
  }
  const x0 = s.anchor === "middle" ? s.x - w / 2 : s.anchor === "start" ? s.x : s.x - w;
  return { x0, y0: s.y - fs * 0.85, x1: x0 + w, y1: s.y + fs * 0.25 };
}

/** The spots around a point: below, above, right, left, then the four diagonals. */
function around(r: LabelReq, fs: number): Spot[] {
  const gap = 12 + fs * 0.2;
  const d = gap * 0.75;
  const below: Spot = { x: r.x, y: r.y + gap + fs * 0.85, anchor: "middle" };
  const above: Spot = { x: r.x, y: r.y - gap, anchor: "middle" };
  const right: Spot = { x: r.x + gap + 4, y: r.y + fs * 0.35, anchor: "start" };
  const left: Spot = { x: r.x - gap - 4, y: r.y + fs * 0.35, anchor: "end" };
  const diagonal: Spot[] = [
    { x: r.x + d, y: r.y + d + fs * 0.85, anchor: "start" },
    { x: r.x - d, y: r.y + d + fs * 0.85, anchor: "end" },
    { x: r.x + d, y: r.y - d, anchor: "start" },
    { x: r.x - d, y: r.y - d, anchor: "end" },
  ];
  return [...(r.above ? [above, below] : [below, above]), right, left, ...(r.above ? [diagonal[2], diagonal[3], diagonal[0], diagonal[1]] : diagonal)];
}

/** Whether a line segment passes through a box (Liang–Barsky clipping). */
export function crosses(b: Rect, [x0, y0, x1, y1]: Segment) {
  let t0 = 0;
  let t1 = 1;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const edges: [number, number][] = [
    [-dx, x0 - b.x0],
    [dx, b.x1 - x0],
    [-dy, y0 - b.y0],
    [dy, b.y1 - y0],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return false;
  }
  return true;
}

const area = (a: Rect, b: Rect) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

/**
 * Places labels in map units. `fs` is the font size in map units (it grows
 * when zoomed out, so the text stays the same size on screen). With `view`,
 * labels that would be cut off at its edges look for another spot; if there
 * is none they are left out (forced ones stay). A spot that no line in
 * `lines` runs through wins over one that is only free of boxes; the map
 * breaks the lines under the text where that cannot be helped.
 */
export function placeLabels(reqs: LabelReq[], fs: number, obstacles: Rect[] = [], view?: Rect, lines: Segment[] = []): Record<string, PlacedLabel> {
  const out: Record<string, PlacedLabel> = {};
  const taken: Rect[] = [];
  for (const r of [...reqs].sort((a, b) => b.prio - a.prio)) {
    const size = fs * (r.size ?? 1);
    const tries = (r.spots ?? around(r, fs)).map((s) => ({ s, box: spotBox(s, r.text, size) }));
    const free = (t: { box: Rect }) => !taken.some((b) => overlaps(t.box, b, 2)) && !obstacles.some((b) => b.owner !== r.id && overlaps(t.box, b, 0));
    // A forced label with no free spot takes the one it covers least of.
    const cost = (t: { box: Rect }) =>
      taken.reduce((a, b) => a + area(t.box, b), 0) + obstacles.reduce((a, b) => a + (b.owner === r.id ? 0 : area(t.box, b)), 0) + (view && !inside(t.box, view) ? 1e6 : 0);
    const clear = (t: { box: Rect }) => !lines.some((l) => crosses(t.box, l));
    const ok = (t: { box: Rect }) => free(t) && (!view || inside(t.box, view));
    const pick = tries.find((t) => ok(t) && clear(t)) ?? tries.find(ok) ?? (r.force ? [...tries].sort((a, b) => cost(a) - cost(b))[0] : null);
    if (!pick) continue;
    out[r.id] = { id: r.id, ...pick.s, box: pick.box };
    taken.push(pick.box);
  }
  return out;
}
