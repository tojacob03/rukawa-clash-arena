// The mat passport: every gym you trained in away from home.
//
// Two sources feed it. Gyms from before (or ones you forgot to log) are
// entered by hand and kept in `data.visits`. Guest trainings logged from now
// on carry the gym on the session itself. The same gym from both sources is
// one stamp. Each country with a stamp unlocks its traditional headwear.

import type { ArcData, GuestGym, GymVisit } from "./types.ts";
import { COUNTRY } from "./countries.ts";

export interface Stamp {
  /** Gym and country, normalised: the same gym typed twice is one stamp. */
  key: string;
  gym: string;
  city?: string;
  country: string;
  /** First visit. */
  first: string;
  /** Last visit. */
  last: string;
  /** Guest trainings logged there (entries by hand count as one visit). */
  times: number;
  /** Ids of the entries by hand, so they can be removed again. */
  manual: string[];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const stampKey = (g: Pick<GuestGym, "gym" | "country">) => `${g.country}|${norm(g.gym)}`;

/** A guest gym as typed, trimmed; null when the name or the country is missing or unknown. */
export function cleanGuest(g: Partial<GuestGym> | null | undefined): GuestGym | null {
  const str = (x: unknown) => (typeof x === "string" ? x : "");
  const gym = str(g?.gym).trim().replace(/\s+/g, " ").slice(0, 60);
  const country = str(g?.country);
  if (!gym || !norm(gym) || !Object.prototype.hasOwnProperty.call(COUNTRY, country)) return null;
  const city = str(g?.city).trim().replace(/\s+/g, " ").slice(0, 40);
  return city ? { gym, country, city } : { gym, country };
}

/** All stamps up to a day (inclusive), oldest first. */
export function stamps(data: ArcData, upTo?: string): Stamp[] {
  const by = new Map<string, Stamp>();
  const add = (g: GuestGym, date: string, manual?: string) => {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || (upTo && date > upTo)) return;
    const clean = cleanGuest(g);
    if (!clean) return;
    const key = stampKey(clean);
    const s = by.get(key);
    if (!s) {
      by.set(key, { key, gym: clean.gym, city: clean.city, country: clean.country, first: date, last: date, times: 1, manual: manual ? [manual] : [] });
      return;
    }
    s.times += 1;
    if (date < s.first) s.first = date;
    if (date > s.last) s.last = date;
    if (!s.city && clean.city) s.city = clean.city;
    if (manual) s.manual.push(manual);
  };
  for (const v of Array.isArray(data.visits) ? data.visits : []) if (v && typeof v === "object") add(v, v.date, typeof v.id === "string" ? v.id : undefined);
  for (const s of data.sessions) if (s.guest && typeof s.guest === "object") add(s.guest, s.date);
  return [...by.values()].sort((a, b) => (a.first === b.first ? a.gym.localeCompare(b.gym, "de") : a.first < b.first ? -1 : 1));
}

/** Countries with at least one stamp, with the day of the first one. */
export function visitedCountries(data: ArcData, upTo?: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const s of stamps(data, upTo)) {
    const d = out.get(s.country);
    if (!d || s.first < d) out.set(s.country, s.first);
  }
  return out;
}

/** Gyms you have been to, most recent first, for quick picks when logging. */
export function knownGyms(data: ArcData): GuestGym[] {
  return [...stamps(data)].sort((a, b) => (a.last < b.last ? 1 : a.last > b.last ? -1 : 0)).map(({ gym, country, city }) => (city ? { gym, country, city } : { gym, country }));
}

export function newVisit(g: GuestGym, date: string, id: string, now = Date.now()): GymVisit {
  return { ...g, id, date, createdAt: now };
}
