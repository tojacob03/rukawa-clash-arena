// Label placement for maps: each label tries below, above, right and left of
// its point and takes the first spot that does not cover a label placed
// before it. Higher priority goes first; forced labels always appear.

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
}

export interface PlacedLabel {
  id: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
}

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const overlaps = (a: Rect, b: Rect, pad: number) => a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.y0 < b.y1 + pad && a.y1 > b.y0 - pad;

/** Width of a label in map units, for a font of size `fs` (rough, for bold sans). */
export const labelWidth = (text: string, fs: number) => text.length * fs * 0.56 + 2;

/**
 * Places labels in map units. `fs` is the font size in map units (it grows
 * when zoomed out, so the text stays the same size on screen).
 */
export function placeLabels(reqs: LabelReq[], fs: number, obstacles: Rect[] = []): Record<string, PlacedLabel> {
  const out: Record<string, PlacedLabel> = {};
  const taken: Rect[] = [];
  const gap = 12 + fs * 0.2;
  for (const r of [...reqs].sort((a, b) => b.prio - a.prio)) {
    const w = labelWidth(r.text, fs);
    const below = { p: { id: r.id, x: r.x, y: r.y + gap + fs * 0.85, anchor: "middle" as const }, box: { x0: r.x - w / 2, y0: r.y + gap, x1: r.x + w / 2, y1: r.y + gap + fs * 1.1 } };
    const above = { p: { id: r.id, x: r.x, y: r.y - gap, anchor: "middle" as const }, box: { x0: r.x - w / 2, y0: r.y - gap - fs * 0.9, x1: r.x + w / 2, y1: r.y - gap + fs * 0.25 } };
    const right = { p: { id: r.id, x: r.x + gap + 4, y: r.y + fs * 0.35, anchor: "start" as const }, box: { x0: r.x + gap + 4, y0: r.y - fs * 0.6, x1: r.x + gap + 4 + w, y1: r.y + fs * 0.5 } };
    const left = { p: { id: r.id, x: r.x - gap - 4, y: r.y + fs * 0.35, anchor: "end" as const }, box: { x0: r.x - gap - 4 - w, y0: r.y - fs * 0.6, x1: r.x - gap - 4, y1: r.y + fs * 0.5 } };
    const tries = r.above ? [above, below, right, left] : [below, above, right, left];
    const free = tries.find((t) => !taken.some((b) => overlaps(t.box, b, 2)) && !obstacles.some((b) => overlaps(t.box, b, 0)));
    const pick = free ?? (r.force ? tries[0] : null);
    if (!pick) continue;
    out[r.id] = pick.p;
    taken.push(pick.box);
  }
  return out;
}
