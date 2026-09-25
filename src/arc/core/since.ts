// "Training since": a year, optionally with the month ("2003" or "2003-05").
// Older entries may hold anything a browser without a month field let
// through; what cannot be read counts as not entered.

export interface Since {
  y: number;
  /** 1 … 12, null when only the year is known. */
  m: number | null;
}

/** The stored value, checked; null when missing or unreadable. */
export function parseSince(v: string | null | undefined): Since | null {
  const hit = typeof v === "string" ? /^(\d{4})(?:-(\d{2}))?$/.exec(v.trim()) : null;
  if (!hit) return null;
  const y = Number(hit[1]);
  const m = hit[2] ? Number(hit[2]) : null;
  if (y < 1900 || y > 2200 || (m !== null && (m < 1 || m > 12))) return null;
  return { y, m };
}

/** The value to store: "YYYY" or "YYYY-MM". */
export const formatSince = (s: Since) => (s.m ? `${s.y}-${String(s.m).padStart(2, "0")}` : String(s.y));

/** Years on the mat up to today; without a month, whole years. Null when nothing readable is entered. */
export function yearsSince(v: string | null | undefined, today: string): number | null {
  const s = parseSince(v);
  if (!s) return null;
  const ty = Number(today.slice(0, 4));
  const tm = Number(today.slice(5, 7));
  return Math.max(0, s.m ? ty - s.y + (tm - s.m) / 12 : ty - s.y);
}
