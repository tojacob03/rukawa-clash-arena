import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Fragrance log for /off-the-clock. Reading is public (public.fragrance_status),
// writing needs the personal token (public.log_fragrance) and happens on the
// unlisted page /off-the-clock/log.

export interface Fragrance {
  id: number;
  name: string;
  house: string | null;
  /** "Eau de Parfum", "Perfume Oil", ... (null when unknown) */
  concentration?: string | null;
  worn_total: number;
  worn_recent: number;
  last_worn?: string | null;
}

export interface FragranceStatus {
  today: string; // YYYY-MM-DD, German local date
  latest: { worn_on: string; id: number; name: string; house: string | null } | null;
  /** [date, fragrance id] for the last 35 days */
  recent: [string, number][];
  /** The whole shelf, most worn (last 35 days, then overall) first */
  collection: Fragrance[];
  days_logged: number;
  /** [date, fragrance id, daily mean °C, rain mm] for every logged day with weather */
  weather?: [string, number, number, number | null][];
  weather_place?: string;
}

type UntypedRpc = (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>;

const rpc = (fn: string, args?: Record<string, unknown>) =>
  (supabase.rpc as unknown as UntypedRpc).call(supabase, fn, args);

export const FRAGRANCE_QUERY_KEY = ["fragrance-status"];

export const useFragranceStatus = () =>
  useQuery({
    queryKey: FRAGRANCE_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await rpc("fragrance_status");
      if (error) throw new Error(error.message);
      return data as FragranceStatus;
    },
    staleTime: 5 * 60 * 1000,
  });

export const logFragrance = async (token: string, name: string, house?: string) => {
  const { data, error } = await rpc("log_fragrance", { p_token: token, p_name: name, p_house: house ?? null });
  if (error) {
    throw new Error(error.code === "28000" ? "Wrong token." : error.message);
  }
  return data as FragranceStatus;
};

// In the calendar any two colours can sit side by side, so every pair has to
// stay tellable apart - including with colour-vision deficiency. On the dark
// surface only four hues pass that check together (validated all-pairs:
// normal-vision ΔE >= 19, CVD ΔE >= 6.9 with hover/legend as second cue).
// The four most-worn scents of the window get one; everything else is
// "Other" grey and still identifiable by hover, title and legend.
const PALETTE = ["#3987e5", "#d55181", "#c98500", "#008300"];
export const OTHER_COLOR = "#6b7382";

/** id -> colour for the current window. `collection` arrives most-worn first. */
export const fragranceColors = (collection: Fragrance[]) =>
  new Map(
    collection
      .filter((f) => f.worn_recent > 0)
      .slice(0, PALETTE.length)
      .map((f, i) => [f.id, PALETTE[i]] as const),
  );

export const colorOf = (colors: Map<number, string>, id: number) => colors.get(id) ?? OTHER_COLOR;

const DAY_MS = 24 * 60 * 60 * 1000;
export const addDays = (isoDate: string, days: number) =>
  new Date(Date.parse(`${isoDate}T12:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** ISO weekday 1 (Mon) .. 7 (Sun) for a YYYY-MM-DD date */
export const isoWeekday = (isoDate: string) => {
  const d = new Date(`${isoDate}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
};

const weekdayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
export const fmtWeekday = (isoDate: string) => weekdayFmt.format(new Date(`${isoDate}T12:00:00Z`));
export const fmtShortDate = (isoDate: string) => shortFmt.format(new Date(`${isoDate}T12:00:00Z`));
