import { useMemo } from "react";
import type { ArcData, ArcState } from "./core/types.ts";
import { COMPARE_MIN_ROLLS, compute } from "./core/model.ts";

/** Gi and No-Gi states, but only once both sides have enough recent rolls. */
export function useCompare(data: ArcData, today: string): { gi: ArcState; nogi: ArcState } | null {
  return useMemo(() => {
    const gi = compute(data, today, { attire: "gi" });
    const nogi = compute(data, today, { attire: "nogi" });
    return gi.recentRolls >= COMPARE_MIN_ROLLS && nogi.recentRolls >= COMPARE_MIN_ROLLS ? { gi, nogi } : null;
  }, [data, today]);
}
