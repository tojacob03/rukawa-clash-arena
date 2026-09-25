// Other sports next to BJJ. They do not count for the BJJ weekly goal, but
// they earn a little XP and build the body values (strength, endurance,
// mobility). Takedowns from wrestling, judo and sambo count as evidence for
// the stand-up techniques, at a lower weight than BJJ rolls, because the
// rule sets differ (no guard pull, different scoring, often no gi).

import type { SportId } from "./types.ts";

export interface Sport {
  id: SportId;
  name: string;
  /** Takedowns can be logged and count for stand-up techniques. */
  grappling: boolean;
}

export const SPORTS: Sport[] = [
  { id: "ringen", name: "Ringen", grappling: true },
  { id: "judo", name: "Judo", grappling: true },
  { id: "sambo", name: "Sambo", grappling: true },
  { id: "kraft", name: "Kraftsport", grappling: false },
  { id: "ausdauer", name: "Ausdauer", grappling: false },
  { id: "striking", name: "Boxen / Muay Thai", grappling: false },
  { id: "mma", name: "MMA", grappling: false },
  { id: "mobility", name: "Mobility / Yoga", grappling: false },
];
export const SPORT = Object.fromEntries(SPORTS.map((s) => [s.id, s])) as Record<SportId, Sport>;

/** Weight of takedowns from other grappling sports compared to a BJJ roll. */
export const CROSS_W = 0.75;

export type BodyStat = "kraft" | "ausdauer" | "beweglichkeit";
export const BODY: { id: BodyStat; name: string; hint: string }[] = [
  { id: "kraft", name: "Kraft", hint: "vor allem Kraftsport, etwas Ringen und MMA" },
  { id: "ausdauer", name: "Ausdauer", hint: "Ausdauer, Boxen, MMA und die Ringkampfsportarten" },
  { id: "beweglichkeit", name: "Beweglichkeit", hint: "Mobility und Yoga, etwas Judo" },
];

/** How much a minute of each sport feeds each body value. */
export const BODY_W: Record<BodyStat, Partial<Record<SportId, number>>> = {
  kraft: { kraft: 1, ringen: 0.35, judo: 0.25, sambo: 0.3, mma: 0.3 },
  ausdauer: { ausdauer: 1, striking: 0.85, mma: 0.85, ringen: 0.7, judo: 0.6, sambo: 0.6, kraft: 0.15 },
  beweglichkeit: { mobility: 1, judo: 0.15, sambo: 0.1, striking: 0.1 },
};
export const INTENSITY = [0, 0.7, 1, 1.3];
export const INTENSITY_NAME = ["", "locker", "mittel", "hart"];
