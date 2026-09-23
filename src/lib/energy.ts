import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Strompreis-Kompass: all numbers come pre-computed from the database
// function public.energy_dashboard() (schema "energy", data: SMARD / BNetzA).

export type PricePoint = [timestampMs: number, eurPerMwh: number];

export interface EnergyDay {
  date: string; // YYYY-MM-DD (German local date)
  points: PricePoint[];
  stats: { avg: number; min: number; max: number; negative_qh: number; n: number };
}

export interface EnergyDashboard {
  meta: {
    source: string;
    license: string;
    last_ingest_at: string | null;
    errors_24h: number;
    latest_price_at: string | null;
    today: string;
  };
  days: EnergyDay[];
  /** [isoWeekday 1-7, hour 0-23, average €/MWh] for the last 90 days */
  heatmap: [number, number, number][];
  monthly: {
    month: string;
    avg_price: number;
    neg_hours: number;
    re_share: number | null;
    solar_share: number | null;
    hours: number;
  }[];
  daily: { date: string; avg_price: number; re_share: number | null; spread: number }[];
  summary_365: {
    days: number;
    avg_price: number;
    avg_spread: number;
    neg_hours: number;
    days_with_negative: number;
    corr_price_re: number | null;
  } | null;
  built_at: string;
}

// The function isn't part of the generated Supabase types, so call it untyped.
type UntypedRpc = (fn: string) => Promise<{ data: unknown; error: { message: string } | null }>;

export const useEnergyDashboard = () =>
  useQuery({
    queryKey: ["energy-dashboard"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as UntypedRpc).call(supabase, "energy_dashboard");
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Noch keine Daten vorhanden.");
      return data as EnergyDashboard;
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

// ---------- formatting (German locale, German time zone) ----------

const TZ = "Europe/Berlin";

const numberFormats = new Map<number, Intl.NumberFormat>();
export const fmtNumber = (value: number, digits = 1) => {
  if (!numberFormats.has(digits)) {
    numberFormats.set(
      digits,
      new Intl.NumberFormat("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits }),
    );
  }
  // Typographic minus sign instead of a hyphen for negative prices.
  return numberFormats.get(digits)!.format(value).replace("-", "\u2212");
};

export const fmtEuro = (value: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(value);

/** €/MWh -> ct/kWh (divide by 10) */
export const toCentPerKwh = (eurPerMwh: number) => eurPerMwh / 10;

const timeFormat = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
export const fmtTime = (ms: number) => timeFormat.format(new Date(ms));

// formatToParts, because a plain hour format in German comes back as "00 Uhr".
const hmFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ });
const berlinPart = (ms: number, type: "hour" | "minute") =>
  Number(hmFormat.formatToParts(new Date(ms)).find((p) => p.type === type)?.value ?? NaN);
export const berlinHour = (ms: number) => berlinPart(ms, "hour");
export const berlinMinute = (ms: number) => berlinPart(ms, "minute");

const weekdayFormat = new Intl.DateTimeFormat("de-DE", { weekday: "long", timeZone: TZ });
const longDateFormat = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

// Noon UTC keeps a YYYY-MM-DD string on the same calendar day in Berlin.
const dateFromIso = (isoDate: string) => new Date(`${isoDate}T12:00:00Z`);
export const fmtWeekday = (isoDate: string) => weekdayFormat.format(dateFromIso(isoDate));
export const fmtLongDate = (isoDate: string) => longDateFormat.format(dateFromIso(isoDate));
export const fmtDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));

const monthFormat = new Intl.DateTimeFormat("de-DE", { month: "short", year: "2-digit", timeZone: "UTC" });
export const fmtMonth = (yyyyMm: string) => monthFormat.format(new Date(`${yyyyMm}-15T00:00:00Z`));

// ---------- analysis ----------

export const QUARTER_HOUR_MS = 15 * 60 * 1000;

export interface PriceWindow {
  startIndex: number;
  endIndex: number; // inclusive
  start: number; // ms
  end: number; // ms, end of the last quarter hour
  avg: number; // €/MWh
}

/**
 * Finds the cheapest (or most expensive) block of consecutive quarter hours.
 * `fromMs` limits the search to blocks that start at or after that moment
 * (used for "today", where the past is no longer useful).
 */
export const findWindow = (
  points: PricePoint[],
  quarterHours: number,
  mode: "min" | "max",
  fromMs = -Infinity,
): PriceWindow | null => {
  if (quarterHours <= 0 || points.length < quarterHours) return null;

  let best: PriceWindow | null = null;
  let sum = 0;

  for (let i = 0; i < points.length; i++) {
    sum += points[i][1];
    if (i >= quarterHours) sum -= points[i - quarterHours][1];
    if (i < quarterHours - 1) continue;

    const startIndex = i - quarterHours + 1;
    const start = points[startIndex][0];
    if (start < fromMs) continue;

    // Only accept truly consecutive quarter hours.
    if (points[i][0] - start !== (quarterHours - 1) * QUARTER_HOUR_MS) continue;

    const avg = sum / quarterHours;
    if (!best || (mode === "min" ? avg < best.avg : avg > best.avg)) {
      best = { startIndex, endIndex: i, start, end: points[i][0] + QUARTER_HOUR_MS, avg };
    }
  }

  return best;
};

// ---------- colour scale shared by curve, heatmap and legend ----------

export const ENERGY_COLORS = {
  negative: "#6CC7FF",
  cheap: "#3DBE9E",
  mid: "#5B6474",
  expensive: "#E8705F",
  window: "hsl(45 100% 60%)",
} as const;

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${c(r1, r2)}, ${c(g1, g2)}, ${c(b1, b2)})`;
};

/** Colour for a price relative to the range [min, max]; negatives get their own colour. */
export const priceColor = (value: number, min: number, max: number) => {
  if (value < 0) return ENERGY_COLORS.negative;
  const lo = Math.max(0, min);
  const t = max > lo ? Math.min(1, Math.max(0, (value - lo) / (max - lo))) : 0.5;
  return t < 0.5
    ? mix(ENERGY_COLORS.cheap, ENERGY_COLORS.mid, t / 0.5)
    : mix(ENERGY_COLORS.mid, ENERGY_COLORS.expensive, (t - 0.5) / 0.5);
};
