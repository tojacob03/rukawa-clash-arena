// Scouter readouts for yourself and for an opponent.

import type { ArcData, ArcState, Belt } from "./core/types.ts";
import type { ScanRow } from "./components/Scouter.tsx";
import { SECTORS } from "./core/techniques.ts";
import { CLASS } from "./core/classes.ts";
import { BELT_R, expected } from "./core/model.ts";
import { bounty } from "./core/bounty.ts";
import { ageDivision } from "./character.ts";
import { BELT, nf0, pct } from "./format.ts";

const TIERS: [number, string][] = [
  [1075, "Weißgurt-Niveau"],
  [1225, "Blaugurt-Niveau"],
  [1360, "Lilagurt-Niveau"],
  [1470, "Braungurt-Niveau"],
  [Infinity, "Schwarzgurt-Niveau"],
];

export const powerTier = (ru: number) => TIERS.find(([t]) => ru < t)![1];
export const powerOf = (ru: number) => Math.round(ru * 10);

export function selfRows(data: ArcData, st: ArcState, today: string): ScanRow[] {
  const p = data.profile;
  const rows: ScanRow[] = SECTORS.map((s) => ({ label: s.name, value: nf0.format(st.attrs[s.id].val), bar: st.attrs[s.id].val }));
  rows.push({ label: "Level", value: String(st.lvl) });
  rows.push({ label: "Klasse", value: p?.cls ? CLASS[p.cls].name : CLASS[st.clsDetected].name });
  const div = ageDivision(p?.birthYear, Number(today.slice(0, 4)));
  if (div || p?.weightKg) rows.push({ label: "Division", value: [div?.name, p?.weightKg ? `${nf0.format(p.weightKg)} kg` : null].filter(Boolean).join(" · ") });
  if (st.comps.events) rows.push({ label: "Turnierbilanz", value: `${st.comps.w}-${st.comps.l}-${st.comps.d}` });
  rows.push({ label: "Kopfgeld", value: `${nf0.format(bounty(data, st))} G` });
  return rows;
}

export function opponentRows(ru: number, belt: Belt): { power: number; rows: ScanRow[]; tier: string } {
  const rp = BELT_R[belt];
  const win = expected(ru, rp);
  return {
    power: powerOf(rp),
    tier: powerTier(rp),
    rows: [
      { label: "Gürtel", value: BELT[belt].name },
      { label: "Deine Siegchance", value: pct(win), bar: win * 100 },
      { label: "Differenz", value: `${ru >= rp ? "+" : "−"}${nf0.format(Math.abs(powerOf(ru) - powerOf(rp)))}` },
    ],
  };
}
