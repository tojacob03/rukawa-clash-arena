import type { Look } from "./core/types.ts";

export const SKIN = ["#f8dcc4", "#efc49f", "#d9a276", "#b97c52", "#8e5a3a", "#5f3b27"];
export const HAIR_COLORS = ["#1b1a22", "#4a2f22", "#8a5a2b", "#e2c16b", "#b23a2a", "#c9ced6", "#3a6ee8", "#e46aa6"];
export const EYE_COLORS = ["#4a2e1f", "#2f6fb5", "#3f8a5a", "#6b6f7a", "#b8872a", "#8a4fd0"];
export const HAIR_STYLES = ["Kurz", "Stachelig", "Undercut", "Dutt", "Pferdeschwanz", "Lang", "Locken", "Glatze"];
export const FACES = ["Entschlossen", "Freundlich", "Müde nach dem Training"];
export const BEARDS = ["Ohne", "Stoppeln", "Bart"];

export const DEFAULT_LOOK: Look = { skin: 1, hair: 1, hairColor: 0, eyeColor: 0, face: 0, beard: 0 };

export function randomLook(): Look {
  const r = (n: number) => Math.floor(Math.random() * n);
  return { skin: r(SKIN.length), hair: r(HAIR_STYLES.length), hairColor: r(HAIR_COLORS.length), eyeColor: r(EYE_COLORS.length), face: r(FACES.length), beard: r(BEARDS.length) };
}

/** Mix a hex colour with black (t < 0) or white (t > 0). */
export function shade(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(t < 0 ? c * (1 + t) : c + (255 - c) * t));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
