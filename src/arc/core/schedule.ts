// The weekly training plan: when you usually train, reminders before each
// training, and a calendar file. Pure functions on plain data, no imports:
// the reminder Edge Function uses a byte-identical copy of this file
// (supabase/functions/_shared/schedule.ts, checked by a test).

/** 0 = Monday … 6 = Sunday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface PlanSlot {
  id: string;
  day: Weekday;
  /** Wall-clock start in the plan's time zone, "HH:MM". */
  start: string;
  minutes: number;
  /** "bjj" or a side sport id (ringen, judo, kraft …). */
  sport: string;
  attire?: "gi" | "nogi";
  /** Name of the class, e.g. "Fundamentals" or "Open Mat". */
  title?: string;
  place?: string;
  /** Shown in reminders and the calendar: the title, or the sport with Gi / No-Gi. */
  label: string;
  remind: boolean;
}

/** Quest line for one upcoming training, written by the app so a reminder can name the quest. */
export interface QuestPreview {
  /** `${date}/${slotId}` */
  key: string;
  body: string;
}

export interface TrainingPlan {
  slots: PlanSlot[];
  /** IANA time zone the times are meant in, e.g. "Europe/Berlin". */
  tz: string;
  /** Minutes before the start. */
  lead: number;
  push: boolean;
  email: boolean;
  preview?: QuestPreview[];
}

/** One training on a concrete day. */
export interface Occurrence {
  slot: PlanSlot;
  /** Local date of the training, YYYY-MM-DD. */
  date: string;
  start: number;
  end: number;
}

export const DAY_NAMES = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
export const DAY_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const LEADS = [15, 30, 60, 90];
const ICS_DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const MIN = 60_000;
const DAY = 24 * 60 * MIN;

export const emptyPlan = (tz: string): TrainingPlan => ({ slots: [], tz, lead: 30, push: false, email: false });

/** "19:30" → 1170, or null. */
export function parseHm(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  return h < 24 && mm < 60 ? h * 60 + mm : null;
}

export const fmtHm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Checks a plan read from storage or the server; unknown shapes become null. */
export function normalizePlan(p: unknown): TrainingPlan | null {
  if (!p || typeof p !== "object") return null;
  const x = p as Partial<TrainingPlan>;
  if (!Array.isArray(x.slots) || typeof x.tz !== "string") return null;
  const slots = x.slots.filter(
    (s): s is PlanSlot =>
      !!s && typeof s.id === "string" && Number.isInteger(s.day) && s.day >= 0 && s.day <= 6 && parseHm(String(s.start)) !== null && typeof s.sport === "string",
  );
  return {
    slots: slots.map((s) => ({ ...s, minutes: Number.isFinite(s.minutes) && s.minutes > 0 ? Math.min(s.minutes, 600) : 90, label: s.label || s.sport, remind: s.remind !== false })),
    tz: validZone(x.tz) ? x.tz : "UTC",
    lead: Number.isFinite(x.lead) && (x.lead as number) >= 0 && (x.lead as number) <= 240 ? (x.lead as number) : 30,
    push: !!x.push,
    email: !!x.email,
    preview: Array.isArray(x.preview) ? x.preview.filter((q) => q && typeof q.key === "string" && typeof q.body === "string").slice(0, 40) : undefined,
  };
}

export function validZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// ── Time zones ─────────────────────────────────────────────────────────────

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    fmtCache.set(tz, f);
  }
  return f;
}

/** Wall-clock parts of an instant in a time zone. */
export function localParts(ms: number, tz: string) {
  const p: Record<string, number> = {};
  for (const x of fmt(tz).formatToParts(new Date(ms))) if (x.type !== "literal") p[x.type] = Number(x.value);
  const date = isoDate(p.year, p.month, p.day);
  return { date, minute: (p.hour % 24) * 60 + p.minute, second: p.second };
}

/** Offset of the zone from UTC at an instant, in ms (Berlin in summer: +2 h). */
function offsetAt(ms: number, tz: string) {
  const { date, minute, second } = localParts(ms, tz);
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) + minute * MIN + second * 1000 - Math.floor(ms / 1000) * 1000;
}

/** The instant of a wall-clock time. A time skipped by the spring change moves an hour later. */
export function zonedToUtc(date: string, minute: number, tz: string) {
  const [y, m, d] = date.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d) + minute * MIN;
  let t = wall - offsetAt(wall, tz);
  const o2 = offsetAt(t, tz);
  if (wall - o2 !== t) t = wall - o2;
  return t;
}

const isoDate = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
export const addDays = (iso: string, n: number) => new Date(Date.parse(iso + "T12:00:00Z") + n * DAY).toISOString().slice(0, 10);
export const weekdayOf = (iso: string) => ((new Date(iso + "T12:00:00Z").getUTCDay() + 6) % 7) as Weekday;

/** Week number of a date, the same count the app uses for paused weeks (Heilungsmodus). */
export const weekNumber = (iso: string) => Math.floor((Math.floor(Date.parse(iso + "T12:00:00Z") / DAY) - 4) / 7);

// ── Occurrences and reminders ─────────────────────────────────────────────

/** Trainings starting in [from, to), in time order. */
export function occurrences(plan: TrainingPlan, from: number, to: number): Occurrence[] {
  const out: Occurrence[] = [];
  const first = addDays(localParts(from, plan.tz).date, -1);
  const last = addDays(localParts(to, plan.tz).date, 1);
  for (let day = first; day <= last; day = addDays(day, 1)) {
    const wd = weekdayOf(day);
    for (const slot of plan.slots) {
      if (slot.day !== wd) continue;
      const start = zonedToUtc(day, parseHm(slot.start) ?? 0, plan.tz);
      if (start >= from && start < to) out.push({ slot, date: day, start, end: start + slot.minutes * MIN });
    }
  }
  return out.sort((a, b) => a.start - b.start || a.slot.id.localeCompare(b.slot.id));
}

/** The training running now, or the next one within a week. */
export function nextTraining(plan: TrainingPlan, now: number): Occurrence | null {
  return occurrences(plan, now - 10 * 60 * MIN, now + 8 * DAY).find((o) => o.end > now) ?? null;
}

/** Reminders to send at `now`: the fire time (start minus lead) passed less than `windowMin` ago. */
export function dueReminders(plan: TrainingPlan, now: number, windowMin = 15): Occurrence[] {
  const lead = plan.lead * MIN;
  return occurrences(plan, now - windowMin * MIN, now + lead + windowMin * MIN).filter((o) => {
    if (!o.slot.remind) return false;
    const fire = o.start - lead;
    return fire <= now && now < fire + windowMin * MIN && now < o.start + 5 * MIN;
  });
}

/** Title, text and link of the reminder for one training. */
export function reminderMessage(plan: TrainingPlan, o: Occurrence) {
  const at = fmtHm(parseHm(o.slot.start) ?? 0);
  const where = o.slot.place ? `, ${o.slot.place}` : "";
  const title = plan.lead ? `In ${plan.lead} Minuten: ${o.slot.label}` : `Jetzt: ${o.slot.label}`;
  const preview = plan.preview?.find((q) => q.key === `${o.date}/${o.slot.id}`);
  const body = `${at} Uhr${where}. ${preview?.body ?? (o.slot.sport === "bjj" ? "Zieh vor dem Training deine Tagesquest." : "Trag die Einheit danach als Nebensport ein.")}`;
  return { title, body, url: o.slot.sport === "bjj" ? "/arc/#/matte" : "/arc/#/heute", tag: `arc-${o.date}-${o.slot.id}` };
}

// ── Calendar file ──────────────────────────────────────────────────────────

const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Folds lines longer than 75 bytes as RFC 5545 asks. */
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  let len = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (len + n > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      len = 0;
    }
    cur += ch;
    len += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const localStamp = (date: string, minute: number) => `${date.replace(/-/g, "")}T${fmtHm(minute).replace(":", "")}00`;
const offsetStr = (ms: number) => {
  const m = Math.round(ms / MIN);
  const a = Math.abs(m);
  return `${m < 0 ? "-" : "+"}${String(Math.floor(a / 60)).padStart(2, "0")}${String(a % 60).padStart(2, "0")}`;
};

/** VTIMEZONE for the zone, from the transitions of the given year. */
function vtimezone(tz: string, year: number): string[] {
  const jan = offsetAt(Date.UTC(year, 0, 15, 12), tz);
  const jul = offsetAt(Date.UTC(year, 6, 15, 12), tz);
  if (jan === jul) return ["BEGIN:VTIMEZONE", `TZID:${tz}`, "BEGIN:STANDARD", "DTSTART:19700101T000000", `TZOFFSETFROM:${offsetStr(jan)}`, `TZOFFSETTO:${offsetStr(jan)}`, "END:STANDARD", "END:VTIMEZONE"];
  // Find both changes of the year to the minute: first the hour, then the minute.
  const changes: { at: number; from: number; to: number }[] = [];
  let prev = offsetAt(Date.UTC(year, 0, 1), tz);
  for (let h = 1; h <= 366 * 24; h++) {
    const t = Date.UTC(year, 0, 1) + h * 60 * MIN;
    const o = offsetAt(t, tz);
    if (o !== prev) {
      let lo = t - 60 * MIN;
      let hi = t;
      while (hi - lo > MIN) {
        const mid = lo + Math.floor((hi - lo) / MIN / 2) * MIN;
        if (offsetAt(mid, tz) === prev) lo = mid;
        else hi = mid;
      }
      changes.push({ at: hi, from: prev, to: o });
      prev = o;
    }
  }
  const std = Math.min(jan, jul);
  const part = (c: { at: number; from: number; to: number }) => {
    const local = c.at + c.from;
    const d = new Date(local);
    const day = d.getUTCDate();
    const month = d.getUTCMonth() + 1;
    const dim = new Date(Date.UTC(d.getUTCFullYear(), month, 0)).getUTCDate();
    const nth = day + 7 > dim ? -1 : Math.ceil(day / 7);
    const kind = c.to === std ? "STANDARD" : "DAYLIGHT";
    return [
      `BEGIN:${kind}`,
      `DTSTART:${localStamp(new Date(local).toISOString().slice(0, 10), d.getUTCHours() * 60 + d.getUTCMinutes())}`,
      `RRULE:FREQ=YEARLY;BYMONTH=${month};BYDAY=${nth}${ICS_DAYS[(d.getUTCDay() + 6) % 7]}`,
      `TZOFFSETFROM:${offsetStr(c.from)}`,
      `TZOFFSETTO:${offsetStr(c.to)}`,
      `END:${kind}`,
    ];
  };
  return ["BEGIN:VTIMEZONE", `TZID:${tz}`, ...changes.flatMap(part), "END:VTIMEZONE"];
}

/** An .ics file: one weekly event per training, each with an alarm `lead` minutes before. */
export function toIcs(plan: TrainingPlan, now: number, url: string) {
  const today = localParts(now, plan.tz).date;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Waza Arc//Wochenplan//DE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Waza Arc Training", ...vtimezone(plan.tz, Number(today.slice(0, 4)))];
  for (const s of plan.slots) {
    let first = today;
    while (weekdayOf(first) !== s.day) first = addDays(first, 1);
    const desc = s.sport === "bjj" ? `Zieh vorher deine Tagesquest in Waza Arc: ${url}` : `Danach als Nebensport in Waza Arc eintragen: ${url}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.id}@waza-arc`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;TZID=${plan.tz}:${localStamp(first, parseHm(s.start) ?? 0)}`,
      `DURATION:PT${s.minutes}M`,
      `RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAYS[s.day]}`,
      `SUMMARY:${icsText(s.label)}`,
      ...(s.place ? [`LOCATION:${icsText(s.place)}`] : []),
      `DESCRIPTION:${icsText(desc)}`,
      `URL:${url}`,
    );
    if (s.remind && plan.lead > 0) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `TRIGGER:-PT${plan.lead}M`, `DESCRIPTION:${icsText(s.label)}`, "END:VALARM");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
