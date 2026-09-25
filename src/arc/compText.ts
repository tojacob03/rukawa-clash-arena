// Labels and lists for the competition log and record.

import type { CompMethod, CompResult } from "./core/types.ts";
import { TECHS } from "./core/techniques.ts";

export const ORGS = ["IBJJF", "AJP", "ADCC", "Grappling Industries", "NAGA", "Verband", "Hausturnier"];
export const WEIGHTS = ["-57,5 kg", "-64 kg", "-70 kg", "-76 kg", "-82,3 kg", "-88,3 kg", "-94,3 kg", "-100,5 kg", "+100,5 kg", "Absolute"];
export const RESULTS: { v: CompResult; label: string }[] = [
  { v: "win", label: "Sieg" },
  { v: "loss", label: "Niederlage" },
  { v: "draw", label: "Unentschieden" },
];
export const METHODS: { v: CompMethod; label: string }[] = [
  { v: "sub", label: "Aufgabe" },
  { v: "points", label: "Punkte" },
  { v: "adv", label: "Vorteile" },
  { v: "ref", label: "Kampfrichter" },
  { v: "dq", label: "DQ" },
  { v: "wo", label: "kampflos" },
];
export const METHOD_NAME = Object.fromEntries(METHODS.map((m) => [m.v, m.label])) as Record<CompMethod, string>;
export const SUBS = TECHS.filter((x) => x.sector === "sub").sort((a, b) => a.name.localeCompare(b.name, "de"));
export const PLACE_NAME = ["keine Platzierung", "Gold", "Silber", "Bronze"];

