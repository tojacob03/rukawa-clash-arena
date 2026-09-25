// Crew flag options for the sea chart: a flag of your own, built from a
// background, an emblem, what crosses behind it and what the emblem wears.
// The skull and crossbones is the old public pirate sign; everything else is
// our own and tied to the mat (belt knot, headband, the Waza star).

import type { FlagDesign } from "./types.ts";

export const FLAG_BG: { name: string; hex: string }[] = [
  { name: "Tusche", hex: "#16171c" },
  { name: "Indigo", hex: "#2a3a8f" },
  { name: "Karmin", hex: "#c8203f" },
  { name: "Petrol", hex: "#177384" },
  { name: "Pflaume", hex: "#5b3a8e" },
  { name: "Papier", hex: "#f2f3ee" },
];
export const FLAG_FG: { name: string; hex: string }[] = [
  { name: "Knochenweiß", hex: "#f2f3ee" },
  { name: "Gold", hex: "#f3b000" },
  { name: "Karmin", hex: "#c8203f" },
  { name: "Tusche", hex: "#16171c" },
];
export const EMBLEMS = ["Totenkopf", "Faust", "Gürtelknoten", "Waza-Stern", "Welle", "Oni-Maske"];
export const CROSSES = ["Nichts", "Knochen", "Säbel", "Anker", "Ruder", "Gürtel"];
export const HEADS = ["Nichts", "Stirnband", "Kopftuch", "Dreispitz", "Samurai-Knoten", "Krone"];
/** Emblems that can wear something on their head. */
export const WEARS = new Set([0, 5]);

export const DEFAULT_FLAG: FlagDesign = { bg: 0, fg: 0, emblem: 0, cross: 1, head: 1 };

export function normalizeFlag(f?: Partial<FlagDesign> | null): FlagDesign {
  const pick = (v: unknown, n: number, d: number) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < n ? v : d);
  return {
    bg: pick(f?.bg, FLAG_BG.length, DEFAULT_FLAG.bg),
    fg: pick(f?.fg, FLAG_FG.length, DEFAULT_FLAG.fg),
    emblem: pick(f?.emblem, EMBLEMS.length, DEFAULT_FLAG.emblem),
    cross: pick(f?.cross, CROSSES.length, DEFAULT_FLAG.cross),
    head: pick(f?.head, HEADS.length, DEFAULT_FLAG.head),
  };
}
