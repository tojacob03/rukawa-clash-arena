import type { Look } from "./core/types.ts";

// Palettes. New entries are only ever appended, so saved indices stay valid.
export const SKIN = [
  "#f8dcc4", "#efc49f", "#d9a276", "#b97c52", "#8e5a3a", "#5f3b27",
  "#fde7d6", "#f3cfa8", "#e0b48a", "#c68e5f", "#a86b43", "#7a4a2e", "#4a2c1d", "#3a2217",
];
export const HAIR_COLORS = [
  "#1b1a22", "#4a2f22", "#8a5a2b", "#e2c16b", "#b23a2a", "#c9ced6", "#3a6ee8", "#e46aa6",
  "#0c0c10", "#6b3e26", "#c47a3a", "#f3e1a0", "#f2f2ee", "#2f7a4a", "#7b4fd0", "#e0a020", "#26b5b0", "#ff6a3d",
];
export const EYE_COLORS = [
  "#4a2e1f", "#2f6fb5", "#3f8a5a", "#6b6f7a", "#b8872a", "#8a4fd0",
  "#1f1a17", "#6aa7d8", "#2a8a8a", "#9a6b3a", "#c0392b", "#d4d8e0",
];

export const HAIR_STYLES = [
  "Kurz", "Stachelig", "Undercut", "Dutt", "Pferdeschwanz", "Lang", "Locken", "Glatze",
  "Buzzcut", "Seitenscheitel", "Pony", "Irokese", "Cornrows", "Afro", "Wuschelkopf", "Samurai-Knoten",
  "Bob", "Dreadlocks", "Zurückgegelt", "Zwei Dutts", "Langer Zopf", "Mittelscheitel",
];
export const FACE_SHAPES = ["Oval", "Rund", "Kantig", "Herz", "Lang", "Breit"];
export const EYE_SHAPES = ["Groß", "Mandel", "Schmal", "Scharf", "Müde", "Lächelnd", "Punkte"];
export const LASHES = ["Keine", "Dezent", "Lang"];
export const BROWS = ["Gerade", "Geschwungen", "Buschig", "Schmal", "Wütend", "Besorgt", "Geschlitzt"];
export const NOSES = ["Klein", "Spitz", "Breit", "Adler", "Stups", "Boxernase", "Angedeutet"];
export const MOUTHS = ["Neutral", "Lächeln", "Schiefes Grinsen", "Entschlossen", "Kampfschrei", "Zähne", "Mundschutz", "Zunge"];
export const EARS = ["Normal", "Klein", "Abstehend", "Spitz"];
export const BEARDS = ["Ohne", "Stoppeln", "Vollbart", "Kinnbart", "Schnurrbart", "Goatee", "Langer Bart", "Koteletten"];
export const EARRINGS = ["Keine", "Stecker", "Ringe", "Einzelner Ring"];
export const TATTOOS = ["Keins", "Tribal", "Welle", "Schriftzug", "Ranken", "Drachenschuppen", "Sleeve"];
export const TATTOO_SIDES = ["Links", "Rechts", "Beide"];
export const MARKS: { id: string; name: string }[] = [
  { id: "blush", name: "Wangenröte" },
  { id: "freckles", name: "Sommersprossen" },
  { id: "mole", name: "Muttermal" },
  { id: "bags", name: "Augenringe" },
  { id: "scarCheek", name: "Narbe Wange" },
  { id: "scarEye", name: "Narbe Auge" },
  { id: "bandage", name: "Pflaster" },
  { id: "matburn", name: "Mattenbrand" },
  { id: "paint", name: "Kriegsbemalung" },
];

export const DEFAULT_LOOK: Look = {
  skin: 1,
  height: 0,
  build: 0,
  muscle: 1,
  faceShape: 0,
  ears: 0,
  eyeShape: 3,
  eyeColor: 0,
  eyeColor2: -1,
  eyeSize: 0,
  eyeGap: 0,
  lashes: 0,
  brows: 0,
  nose: 0,
  mouth: 2,
  hair: 1,
  hairColor: 0,
  hairTips: -1,
  beard: 0,
  marks: ["blush"],
  tattoo: 0,
  tattooSide: 1,
  neckTattoo: false,
  earring: 0,
};

/** Fill in fields that older saves do not have. The first editor had one "face" expression. */
export function normalizeLook(l: Partial<Look> | undefined): Look {
  const out: Look = { ...DEFAULT_LOOK, ...(l ?? {}) };
  if (l && l.eyeShape === undefined && l.face !== undefined) {
    out.eyeShape = [3, 0, 4][l.face] ?? 3;
    out.mouth = [2, 1, 4][l.face] ?? 2;
  }
  if (!Array.isArray(out.marks)) out.marks = [...DEFAULT_LOOK.marks];
  delete out.face;
  return out;
}

export function randomLook(): Look {
  const r = (n: number) => Math.floor(Math.random() * n);
  const between = (a: number, b: number) => a + r(b - a + 1);
  return {
    ...DEFAULT_LOOK,
    skin: r(SKIN.length),
    height: between(-2, 2),
    build: between(-1, 1),
    muscle: r(4),
    faceShape: r(FACE_SHAPES.length),
    ears: Math.random() < 0.85 ? 0 : r(EARS.length),
    eyeShape: r(EYE_SHAPES.length),
    eyeColor: r(EYE_COLORS.length),
    eyeColor2: Math.random() < 0.08 ? r(EYE_COLORS.length) : -1,
    eyeSize: between(-1, 2),
    eyeGap: between(-1, 1),
    lashes: r(LASHES.length),
    brows: r(BROWS.length),
    nose: r(NOSES.length),
    mouth: r(MOUTHS.length),
    hair: r(HAIR_STYLES.length),
    hairColor: r(HAIR_COLORS.length),
    hairTips: Math.random() < 0.2 ? r(HAIR_COLORS.length) : -1,
    beard: Math.random() < 0.5 ? 0 : r(BEARDS.length),
    marks: MARKS.filter(() => Math.random() < 0.18).map((m) => m.id),
    tattoo: Math.random() < 0.6 ? 0 : r(TATTOOS.length),
    tattooSide: r(3),
    neckTattoo: Math.random() < 0.1,
    earring: Math.random() < 0.7 ? 0 : r(EARRINGS.length),
  };
}

export const skinOf = (l: Look) => l.skinHex ?? SKIN[l.skin] ?? SKIN[1];
export const hairOf = (l: Look) => l.hairHex ?? HAIR_COLORS[l.hairColor] ?? HAIR_COLORS[0];
export const eyeOf = (l: Look) => l.eyeHex ?? EYE_COLORS[l.eyeColor] ?? EYE_COLORS[0];

/** Mix a hex colour with black (t < 0) or white (t > 0). */
export function shade(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(t < 0 ? c * (1 + t) : c + (255 - c) * t));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
