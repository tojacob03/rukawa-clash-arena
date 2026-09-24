// Classes: your play style. You pick one at the start; the data also points
// to one (the class whose techniques you master best), and the app shows both
// when they differ. The chosen class gives quest XP in its techniques a bonus.
// Names are original.

import type { ClassId, Technique } from "./types.ts";

export interface ClassDef {
  id: ClassId;
  name: string;
  style: string;
  desc: string;
  perk: string;
  /** Quest XP factor for matching techniques. */
  mult: number;
  color: string;
  match: (x: Technique) => boolean;
}

const LEG_ENTRY = new Set(["g_slx", "g_5050", "g_outsideashi", "g_saddle", "t_imanari"]);

export const CLASSES: ClassDef[] = [
  {
    id: "netzweber",
    name: "Netzweber",
    style: "Guard-Spieler",
    desc: "Du kämpfst gern von unten. Guards, Sweeps und Haken sind dein Netz.",
    perk: "+20 % Quest-XP auf Guard-Techniken",
    mult: 1.2,
    color: "#5f90ea",
    match: (x) => x.sector === "guard" && !LEG_ENTRY.has(x.id),
  },
  {
    id: "druckwalze",
    name: "Druckwalze",
    style: "Passer",
    desc: "Oben, schwer, geduldig. Keine Guard hält dich lange auf.",
    perk: "+20 % Quest-XP auf Passing",
    mult: 1.2,
    color: "#e0843c",
    match: (x) => x.sector === "pass",
  },
  {
    id: "anker",
    name: "Anker",
    style: "Top-Kontrolle",
    desc: "Side Control, Mount, Knee on Belly: Wer unter dir liegt, bleibt dort.",
    perk: "+20 % Quest-XP auf Pins und Mount",
    mult: 1.2,
    color: "#8fd48a",
    match: (x) => x.sector === "ctrl" && (x.branch === "pin" || x.branch === "mount"),
  },
  {
    id: "schatten",
    name: "Schattenläufer",
    style: "Rücken-Spezialist",
    desc: "Du tauchst hinter dem Gegner auf. Rückennahmen, Seatbelt, Hooks.",
    perk: "+20 % Quest-XP auf Rücken und Rückennahmen",
    mult: 1.2,
    color: "#9a73f0",
    match: (x) => (x.sector === "ctrl" && (x.branch === "back" || x.branch === "ride")) || x.kind === "backtake",
  },
  {
    id: "jaeger",
    name: "Jäger",
    style: "Submission-Jäger",
    desc: "Jede Position ist nur ein Weg zum Finish. Hebel, Würger, Dreiecke.",
    perk: "+20 % Quest-XP auf Submissions (ohne Beinhebel)",
    mult: 1.2,
    color: "#e0453c",
    match: (x) => x.sector === "sub" && x.branch !== "leg",
  },
  {
    id: "ferse",
    name: "Fersenjäger",
    style: "Beinhebel-Spieler",
    desc: "Beine sind Ziele. Ashi Garami, Saddle, Heel Hooks.",
    perk: "+20 % Quest-XP auf Beinhebel und Beinverknotungen",
    mult: 1.2,
    color: "#f1bf57",
    match: (x) => (x.sector === "sub" && x.branch === "leg") || LEG_ENTRY.has(x.id),
  },
  {
    id: "sturm",
    name: "Sturmbrecher",
    style: "Ringer & Werfer",
    desc: "Der Kampf beginnt im Stand, und dort gewinnst du ihn.",
    perk: "+20 % Quest-XP auf Takedowns und Würfe",
    mult: 1.2,
    color: "#4fc3c9",
    match: (x) => x.sector === "stand",
  },
  {
    id: "festung",
    name: "Festung",
    style: "Verteidiger",
    desc: "Dich zu beenden kostet Kraft. Frames, Escapes, Geduld.",
    perk: "+20 % Quest-XP auf Escapes und Abwehr",
    mult: 1.2,
    color: "#c3cbe0",
    match: (x) => x.sector === "def",
  },
  {
    id: "wandler",
    name: "Wandler",
    style: "Allrounder",
    desc: "Kein Lieblingsgebiet, sondern von allem etwas. Du passt dich an.",
    perk: "+8 % Quest-XP auf alles",
    mult: 1.08,
    color: "#ede5d1",
    match: () => true,
  },
];

export const CLASS = Object.fromEntries(CLASSES.map((c) => [c.id, c])) as Record<ClassId, ClassDef>;

/** Quest XP after the class bonus, rounded to 5. */
export function classXp(base: number, x: Technique, cls: ClassId | undefined) {
  if (!cls) return base;
  const c = CLASS[cls];
  return c.match(x) ? Math.round((base * c.mult) / 5) * 5 : base;
}
