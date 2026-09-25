import type { Belt } from "./core/types.ts";

export const nf0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
export const nf1 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const pct = (x: number) => `${nf0.format(x * 100)} %`;
export const signed = (x: number, digits = 0) => {
  const f = digits ? nf1 : nf0;
  const r = digits ? Math.round(x * 10) / 10 : Math.round(x);
  return `${r > 0 ? "+" : r < 0 ? "−" : "±"}${f.format(Math.abs(r))}`;
};
/** Power Level: the Elo rating times ten. */
export const power = (ru: number) => nf0.format(Math.round(ru * 10));

export const BELTS: { id: Belt; name: string; color: string; bar: string }[] = [
  { id: "weiss", name: "Weiß", color: "#f1eee6", bar: "#15151a" },
  { id: "blau", name: "Blau", color: "#2f64cc", bar: "#15151a" },
  { id: "lila", name: "Lila", color: "#7d4fbb", bar: "#15151a" },
  { id: "braun", name: "Braun", color: "#7c5334", bar: "#15151a" },
  { id: "schwarz", name: "Schwarz", color: "#121216", bar: "#c0302b" },
];
export const BELT = Object.fromEntries(BELTS.map((b) => [b.id, b])) as Record<Belt, (typeof BELTS)[number]>;

export const longDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
export const shortDate = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short" });
