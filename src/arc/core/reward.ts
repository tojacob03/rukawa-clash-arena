// What one entry moved on the voyage, for the chapter end: the miles it
// sailed, the islands it reached, and how far the next one still is.

import type { ArcData } from "./types.ts";
import type { Island } from "./sea.ts";
import { DEFAULT_SEA, route, stepIndex } from "./sea.ts";
import { voyage } from "./voyage.ts";

export interface SeaStep {
  gained: number;
  /** Islands reached with this entry, in order. */
  arrived: Island[];
  /** The island the ship last left, and the one ahead. */
  from: Island;
  to: Island;
  /** Where the ship stood on this leg before and after (0 … 1); before is 0 after an arrival. */
  before: number;
  after: number;
  /** Miles still to the island ahead. */
  left: number;
  /** Logged on board a crew ship: its name; the miles went there, not to your own ship. */
  crew?: string;
}

export function seaStep(before: ArcData, after: ArcData, asOf: string, crew?: { name: string; miles: number }): SeaStep {
  const r = route(after.profile?.homeSea ?? DEFAULT_SEA);
  const a = voyage(before, asOf);
  const b = voyage(after, asOf);
  const arrived: Island[] = [];
  for (let k = a.step + 1; k <= b.step; k++) arrived.push(r[stepIndex(k)]);
  return {
    gained: crew ? crew.miles : Math.max(0, b.miles - a.miles),
    crew: crew?.name,
    arrived,
    from: r[stepIndex(b.step)],
    to: r[stepIndex(b.step + 1)],
    before: b.step > a.step ? 0 : a.progress,
    after: b.progress,
    left: b.leg - b.into,
  };
}
