// Scouter plumbing for the app: open it from anywhere, and the profile rows
// for the self scan. The readouts themselves live in core/scouter.ts.

import type { ArcData, ArcState, Attire, Belt, Size } from "./core/types.ts";
import { CLASS } from "./core/classes.ts";
import { bounty } from "./core/bounty.ts";
import { ageDivision } from "./character.ts";
import { nf0 } from "./format.ts";

export { powerOf, powerTier } from "./core/scouter.ts";

export type ScoutMode = "du" | "partner" | "gegner" | "boss";

export interface ScoutRequest {
  mode: ScoutMode;
  belt?: Belt;
  size?: Size;
  attire?: Attire;
  /** Heading for an opponent, e.g. "Gegner 2". */
  label?: string;
}

/** Open the scouter from any screen; the app shell renders it. */
export function openScouter(req: ScoutRequest = { mode: "du" }) {
  window.dispatchEvent(new CustomEvent<ScoutRequest>("arc:scan", { detail: req }));
}

export interface ScanRow {
  label: string;
  value: string;
  /** 0 … 100, drawn as a bar. */
  bar?: number;
}

export function selfRows(data: ArcData, st: ArcState, today: string): ScanRow[] {
  const p = data.profile;
  const rows: ScanRow[] = [];
  rows.push({ label: "Level", value: String(st.lvl) });
  rows.push({ label: "Klasse", value: p?.cls ? CLASS[p.cls].name : CLASS[st.clsDetected].name });
  const div = ageDivision(p?.birthYear, Number(today.slice(0, 4)));
  if (div || p?.weightKg) rows.push({ label: "Division", value: [div?.name, p?.weightKg ? `${nf0.format(p.weightKg)} kg` : null].filter(Boolean).join(", ") });
  if (st.comps.events) rows.push({ label: "Turnierbilanz", value: `${st.comps.w}-${st.comps.l}-${st.comps.d}` });
  rows.push({ label: "Kopfgeld", value: `${nf0.format(bounty(data, st))} G` });
  return rows;
}
