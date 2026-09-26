// Progressive disclosure: a new player starts with the training book, the
// daily quest and the branch. The other ways open one by one with the first
// trainings, each at the moment it has something to show: the ship leaves
// harbour after the first training, the Scouter needs a few rolls to measure,
// the boss needs a place you got stuck, the hexagon needs a shape.
//
// Counted is everything logged: trainings, tournaments and other sports (they
// sail the ship too). The demo shows everything.

import type { ArcData } from "./types.ts";

export type Feature = "sea" | "power" | "boss" | "hexagon";

export interface Opening {
  id: Feature;
  /** Entries logged before it opens. */
  after: number;
  kanji: string;
  name: string;
  /** What it shows, said once when it opens. */
  says: string;
}

export const OPENINGS: Opening[] = [
  { id: "sea", after: 1, kanji: "海", name: "Seekarte", says: "Dein Schiff legt ab. Jedes Training bringt Seemeilen, Gürtel und Streifen sind Häfen." },
  { id: "power", after: 2, kanji: "測", name: "Power Level und Scouter", says: "Aus deinen Rolls misst der Scouter, wie stark du gerade bist, und vergleicht dich mit Partnern." },
  { id: "boss", after: 3, kanji: "狩", name: "Wochenboss", says: "Wo du im Roll feststeckst, taucht eine Seeschlange auf. Jede Quest dagegen drückt sie unter Wasser." },
  { id: "hexagon", after: 4, kanji: "型", name: "Hexagon", says: "Die Form deines Spiels über sechs Achsen: wo du stark bist und wo schwach." },
];

export const OPENING = Object.fromEntries(OPENINGS.map((o) => [o.id, o])) as Record<Feature, Opening>;

/** Trainings, tournaments and other-sport sessions logged so far. */
export const logged = (data: ArcData) => data.sessions.length + (data.competitions?.length ?? 0) + (data.cross?.length ?? 0);

export function isOpen(data: ArcData, id: Feature): boolean {
  return !!data.demo || logged(data) >= OPENING[id].after;
}

/** What opened between two saves, e.g. with the training just logged. */
export function newlyOpen(before: ArcData, after: ArcData): Opening[] {
  return OPENINGS.filter((o) => !isOpen(before, o.id) && isOpen(after, o.id));
}

/** Everything still closed, in the order it opens. */
export const stillClosed = (data: ArcData) => OPENINGS.filter((o) => !isOpen(data, o.id));
