// Where you last saw your ship on the chart, per storage slot and ship (your
// own, or a crew's). When trainings have moved it on since, the chart shows
// the voyage: the ship sails from there to where it is now and the sea miles
// count up. Positions are steps of the voyage, laps included.

import { useLayoutEffect, useRef, useState } from "react";
import type { SeaId } from "./core/types.ts";
import type { Voyage } from "./components/SeaMap.tsx";

interface Seen {
  /** Route position: island index plus the share of the way to the next one. */
  u: number;
  miles: number;
  sea: SeaId;
}

export interface Leg extends Voyage {
  /** Sea miles when you last looked. */
  miles: number;
  /** Your first look at the chart on this device: the ship sails out of the harbour. */
  first: boolean;
}

const read = (key: string): Seen | null => {
  try {
    const v = JSON.parse(window.localStorage.getItem(key) ?? "null") as Partial<Seen> | null;
    return v && typeof v.u === "number" && typeof v.miles === "number" && typeof v.sea === "string" ? (v as Seen) : null;
  } catch {
    return null;
  }
};
const write = (key: string, v: Seen) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage full or blocked: the voyage simply plays again next time */
  }
};

let ids = 0;

/**
 * The voyage to show on the chart, or null. `harbour` is the miles count
 * when the ship left its current island: a first look shows it sailing out
 * from there. At most the last three islands are sailed again.
 */
export function useVoyage({ slot, active, sea, u, miles, harbour }: { slot: string; active: boolean; sea: SeaId; u: number; miles: number; harbour: number }) {
  const key = `waza-arc.voyage:${slot}`;
  const [leg, setLeg] = useState<Leg | null>(null);
  const seen = useRef<{ key: string; v: Seen | null } | null>(null);

  // Before paint, so the ship never shows at its new place first.
  useLayoutEffect(() => {
    if (!active) {
      setLeg(null);
      return;
    }
    const prev = seen.current?.key === key ? seen.current.v : read(key);
    const now = { u, miles, sea };
    seen.current = { key, v: now };
    write(key, now);
    const round = (x: number) => Math.round(x * 1000) / 1000;
    if (!prev) {
      // First look: out of the harbour, if the ship has left it.
      if (u - Math.floor(u) > 0.05) setLeg({ id: ++ids, from: Math.floor(u), to: u, miles: harbour, first: true });
    } else if (prev.sea === sea && round(u) - round(prev.u) >= 0.01) {
      setLeg({ id: ++ids, from: Math.max(prev.u, Math.floor(u) - 3), to: u, miles: Math.min(prev.miles, miles), first: false });
    }
  }, [active, key, sea, u, miles, harbour]);

  return [leg, () => setLeg(null)] as const;
}
