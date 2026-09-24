import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Fragrance log for /off-the-clock. Reading is public (public.fragrance_status),
// writing needs the personal token (public.log_fragrance) and happens on the
// unlisted page /off-the-clock/log.

export interface FragranceStatus {
  today: string; // YYYY-MM-DD, German local date
  latest: { worn_on: string; id: number; name: string; house: string | null } | null;
  /** [date, fragrance id] for the last 35 days */
  recent: [string, number][];
  collection: { id: number; name: string; house: string | null; worn_total: number; worn_recent: number }[];
  days_logged: number;
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

// Muted, distinguishable colours; a fragrance keeps its colour via its id.
const PALETTE = ["#E0B04A", "#6FA8DC", "#C27BA0", "#7FBF7F", "#E07B5A", "#9A8CF0", "#5BC0BE", "#D9D27E"];
export const fragranceColor = (id: number) => PALETTE[(id - 1 + PALETTE.length) % PALETTE.length];

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
