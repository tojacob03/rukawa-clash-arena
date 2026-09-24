import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Race Strategy Lab: everything is pre-computed in the database (schema
// "racing", data: OpenF1). The page only reads three public functions.

export type Compound = "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET" | string;

export interface RaceDriver {
  number: number;
  code: string | null;
  name: string | null;
  team: string | null;
  colour: string | null;
  position: number | null;
  status: "DNF" | "DNS" | "DSQ" | null;
  points: number | null;
  gap: string | null;
  laps: number | null;
  /** [compound, lap_start, lap_end, tyre_age_at_start] */
  stints: [Compound, number, number, number][] | null;
  /** [lap, pit lane seconds, stationary seconds] */
  pits: [number, number | null, number | null][] | null;
  /** median fuel-corrected clean lap minus the best driver's, seconds */
  pace_delta: number | null;
}

export interface RacePayload {
  race: {
    session_key: number;
    year: number;
    name: string | null;
    circuit: string | null;
    country: string | null;
    date: string;
    total_laps: number;
    clean_laps: number;
    fuel_correction: number;
  };
  drivers: RaceDriver[];
  degradation: { compound: Compound; sec_per_lap: number; stints: number; laps: number }[];
  /** compound -> [tyre age, seconds relative to the driver's own median] */
  tyre_curve: Record<string, [number, number][]>;
  built_at: string;
}

export interface SeasonRace {
  session_key: number;
  name: string | null;
  circuit: string | null;
  date: string;
  loaded: boolean;
  winner: { code: string; team: string; colour: string | null } | null;
}

export interface SeasonPayload {
  year: number;
  races: SeasonRace[];
  pit_crews: { team: string; colour: string | null; median_stop: number; best_stop: number; median_lane: number; stops: number }[];
  degradation: { compound: Compound; sec_per_lap: number; races: number }[];
  stops_per_race: { session_key: number; circuit: string; avg_stops: number }[];
  built_at: string;
}

export interface RacingIndex {
  seasons: { year: number; races: SeasonRace[] }[];
  latest_session_key: number | null;
}

type UntypedRpc = (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

const rpc = async <T,>(fn: string, args?: Record<string, unknown>) => {
  const { data, error } = await (supabase.rpc as unknown as UntypedRpc).call(supabase, fn, args);
  if (error) throw new Error(error.message);
  return data as T;
};

const STALE = 30 * 60 * 1000;

export const useRacingIndex = () =>
  useQuery({ queryKey: ["racing-index"], queryFn: () => rpc<RacingIndex>("racing_index"), staleTime: STALE });

export const useRacingRace = (sessionKey: number | null) =>
  useQuery({
    queryKey: ["racing-race", sessionKey],
    queryFn: () => rpc<RacePayload | null>("racing_race", { p_session_key: sessionKey }),
    enabled: sessionKey !== null,
    staleTime: STALE,
  });

export const useRacingSeason = (year: number | null) =>
  useQuery({
    queryKey: ["racing-season", year],
    queryFn: () => rpc<SeasonPayload | null>("racing_season", { p_year: year }),
    enabled: year !== null,
    staleTime: STALE,
  });

// ---------- presentation helpers ----------

export const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#E8002D",
  MEDIUM: "#FFD12E",
  HARD: "#EDEDE8",
  INTERMEDIATE: "#43B047",
  WET: "#2F7FD0",
};
export const compoundColor = (c: Compound | null | undefined) => (c && COMPOUND_COLORS[c]) || "#6B7280";
export const compoundLabel = (c: Compound | null | undefined) =>
  c ? c.charAt(0) + c.slice(1).toLowerCase() : "Unknown";
export const COMPOUND_ORDER = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"];

export const teamColor = (hex: string | null | undefined) => (hex ? `#${hex.replace("#", "")}` : "#6B7280");

/** "Max VERSTAPPEN" -> "Max Verstappen" */
export const displayName = (name: string | null | undefined) =>
  (name ?? "")
    .split(" ")
    .map((w) => (w.length > 1 && w === w.toUpperCase() ? w.charAt(0) + w.slice(1).toLowerCase() : w))
    .join(" ");

export const lastName = (name: string | null | undefined) => {
  const parts = displayName(name).split(" ");
  return parts[parts.length - 1] || "";
};

const STOP_WORDS = ["no-stop", "one-stop", "two-stop", "three-stop", "four-stop"];
export const stopWord = (n: number) => STOP_WORDS[n] ?? `${n}-stop`;

const num = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num3 = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
export const fmtSec = (v: number, digits: 2 | 3 = 2) => (digits === 3 ? num3 : num).format(v);
export const fmtSigned = (v: number, digits: 2 | 3 = 2) => `${v >= 0 ? "+" : "\u2212"}${fmtSec(Math.abs(v), digits)}`;

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const fmtDate = (iso: string) => dateFmt.format(new Date(iso));
