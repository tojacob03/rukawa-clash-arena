// Friends, crews and gyms: the card others see of a player, built from game
// values only (no training log), and the checks for cards that come back from
// the server. Those were written by other people's apps, so every field is
// validated before it reaches the drawing code.

import type { Attire, Belt, ClassId, FlagDesign, Look, SeaId, Slot } from "./types.ts";
import type { TrainingPlan, Weekday } from "./schedule.ts";
import { weekNumber, weekdayOf } from "./schedule.ts";
import { ITEM, SLOTS, dynamicItem } from "./items.ts";
import type { ItemDef } from "./items.ts";
import { CLASSES } from "./classes.ts";
import { powerOf } from "./model.ts";
import { SEAS, route } from "./sea.ts";
import { normalizeFlag } from "./crewflag.ts";
import type { Body } from "./body.ts";
import {
  BEARDS,
  BROWS,
  EARRINGS,
  EARS,
  EYE_COLORS,
  EYE_SHAPES,
  FACE_SHAPES,
  HAIR_COLORS,
  HAIR_STYLES,
  LASHES,
  MARKS,
  MOUTHS,
  NOSES,
  SKIN,
  TATTOOS,
} from "../avatarOptions.ts";

export interface SocialCard {
  belt: Belt;
  stripes: number;
  lvl: number;
  /** Power level, as shown in the HUD. */
  pl: number;
  /** Weeks in a row with the weekly goal met. */
  flame: number;
  /** Trainings this week and the weekly goal, for the week `wk`. */
  week: number;
  goal: number;
  wk: number;
  bounty: number;
  cls: ClassId | null;
  /** The ship they sail on (a crew ship, or their own): its sea, the route index of the island it came from, how far it has sailed on, and laps round the world. */
  sea: SeaId;
  island: number;
  progress: number;
  lap: number;
  /** Their miles on board their current crew ship, since they joined it. */
  aboard: { id: string; miles: number } | null;
  /** Figure height and build of their character, from height and weight (no raw numbers). */
  body: Body | null;
  ship: string;
  sail: string;
  flag: FlagDesign;
  look: Partial<Look>;
  mode: Attire;
  gear: Partial<Record<Slot, string>>;
}

/** A training time from the weekly plan, without title or place. */
export interface SharedSlot {
  day: Weekday;
  start: string;
  minutes: number;
  sport: string;
}

export interface Peer {
  id: string;
  name: string;
  card: SocialCard | null;
  /** Only when the player shares training times. */
  slots: SharedSlot[] | null;
  updated: string | null;
  captain?: boolean;
  since?: string | null;
  /** Crew members: when they came on board. */
  joined?: string | null;
}

export interface CrewInfo {
  id: string;
  name: string;
  flag: FlagDesign;
  code: string;
  captain: boolean;
  members: Peer[];
  /** Sea miles of former members, kept by the ship when they left. */
  banked: number;
}

export interface GymInfo {
  id: string;
  name: string;
  city: string;
  code: string;
  visible: boolean;
  count: number;
  members: Peer[];
}

export interface SocialSnapshot {
  me: { id: string; code: string; name: string; shareTimes: boolean } | null;
  friends: Peer[];
  incoming: Peer[];
  outgoing: { id: string; name: string; at: string | null }[];
  crew: CrewInfo | null;
  gym: GymInfo | null;
}

export interface GymHit {
  id: string;
  name: string;
  city: string;
  count: number;
}

// ── Checks ────────────────────────────────────────────────────────────────

const BELTS: Belt[] = ["weiss", "blau", "lila", "braun", "schwarz"];
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const int = (v: unknown, lo: number, hi: number, d: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : d);
const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d);
const hex = (v: unknown) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : undefined);
/** Plain text for display: no control characters, trimmed, bounded. */
// Control characters, zero-width marks and bidi overrides (they can flip how a name reads).
// eslint-disable-next-line no-control-regex
const HIDDEN = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g;
export const cleanText = (v: unknown, max: number) => (typeof v === "string" ? v.replace(HIDDEN, "").trim().slice(0, max) : "");
const uuid = (v: unknown) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null);
const date = (v: unknown) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : null);

/** A look from someone else's card, with every index inside the known lists. */
export function safeLook(raw: unknown): Partial<Look> {
  const l = obj(raw);
  const idx = (k: keyof Look, n: number, d: number, lo = 0) => int(l[k], lo, n - 1, d);
  const marks = Array.isArray(l.marks) ? l.marks.filter((m): m is string => typeof m === "string" && MARKS.some((x) => x.id === m)).slice(0, MARKS.length) : [];
  return {
    skin: idx("skin", SKIN.length, 1),
    skinHex: hex(l.skinHex),
    height: int(l.height, -2, 2, 0),
    build: int(l.build, -2, 2, 0),
    muscle: int(l.muscle, 0, 3, 1),
    faceShape: idx("faceShape", FACE_SHAPES.length, 0),
    ears: idx("ears", EARS.length, 0),
    eyeShape: idx("eyeShape", EYE_SHAPES.length, 3),
    eyeColor: idx("eyeColor", EYE_COLORS.length, 0),
    eyeHex: hex(l.eyeHex),
    eyeColor2: idx("eyeColor2", EYE_COLORS.length, -1, -1),
    eyeSize: int(l.eyeSize, -2, 2, 0),
    eyeGap: int(l.eyeGap, -2, 2, 0),
    lashes: idx("lashes", LASHES.length, 0),
    brows: idx("brows", BROWS.length, 0),
    nose: idx("nose", NOSES.length, 0),
    mouth: idx("mouth", MOUTHS.length, 2),
    hair: idx("hair", HAIR_STYLES.length, 1),
    hairColor: idx("hairColor", HAIR_COLORS.length, 0),
    hairHex: hex(l.hairHex),
    hairTips: idx("hairTips", HAIR_COLORS.length, -1, -1),
    beard: idx("beard", BEARDS.length, 0),
    marks,
    tattoo: idx("tattoo", TATTOOS.length, 0),
    tattooSide: int(l.tattooSide, 0, 2, 1),
    neckTattoo: l.neckTattoo === true,
    earring: idx("earring", EARRINGS.length, 0),
  };
}

/** Worn items by id: only known items that fit their slot. */
export function safeGear(raw: unknown): Partial<Record<Slot, string>> {
  const g = obj(raw);
  const out: Partial<Record<Slot, string>> = {};
  for (const s of SLOTS) {
    const id = g[s.id];
    if (id === "") out[s.id] = "";
    if (typeof id !== "string" || !id) continue;
    const item = own(ITEM, id) ? ITEM[id] : dynamicItem(id);
    if (item && item.slot === s.accepts) out[s.id] = id;
  }
  return out;
}

/** The items to draw for worn ids (same fallback rules as your own avatar). */
export function gearItems(gear: Partial<Record<Slot, string>>): Partial<Record<Slot, ItemDef>> {
  const out: Partial<Record<Slot, ItemDef>> = {};
  for (const s of SLOTS) {
    const id = gear[s.id];
    if (!id) continue;
    const item = own(ITEM, id) ? ITEM[id] : dynamicItem(id);
    if (item) out[s.id] = item;
  }
  return out;
}

export function readCard(raw: unknown): SocialCard | null {
  const c = obj(raw);
  if (typeof c.belt !== "string" || !BELTS.includes(c.belt as Belt)) return null;
  const sea = SEAS.some((s) => s.id === c.sea) ? (c.sea as SeaId) : "morgen";
  return {
    belt: c.belt as Belt,
    stripes: int(c.stripes, 0, 4, 0),
    lvl: int(c.lvl, 1, 999, 1),
    pl: int(c.pl, 0, 1e7, 0),
    flame: int(c.flame, 0, 9999, 0),
    week: int(c.week, 0, 99, 0),
    goal: int(c.goal, 1, 14, 3),
    wk: int(c.wk, 0, 1e6, 0),
    bounty: int(c.bounty, 0, 1e12, 0),
    cls: CLASSES.some((x) => x.id === c.cls) ? (c.cls as ClassId) : null,
    sea,
    island: int(c.island, 0, route(sea).length - 1, 0),
    progress: num(c.progress, 0, 1, 0),
    lap: int(c.lap, 0, 9999, 0),
    aboard: uuid(obj(c.aboard).id) ? { id: obj(c.aboard).id as string, miles: num(obj(c.aboard).miles, 0, 1e6, 0) } : null,
    body: readBody(c.body),
    ship: cleanText(c.ship, 40),
    sail: hex(c.sail) ?? "#f1bf57",
    flag: normalizeFlag(obj(c.flag) as Partial<FlagDesign>),
    look: safeLook(c.look),
    mode: c.mode === "nogi" ? "nogi" : "gi",
    gear: safeGear(c.gear),
  };
}

export function readSlots(raw: unknown): SharedSlot[] | null {
  if (!Array.isArray(raw)) return null;
  const out: SharedSlot[] = [];
  for (const x of raw.slice(0, 40)) {
    const s = obj(x);
    const start = typeof s.start === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s.start) ? s.start : null;
    const sport = typeof s.sport === "string" && /^[a-z0-9_-]{1,24}$/.test(s.sport) ? s.sport : null;
    if (!start || !sport) continue;
    out.push({ day: int(s.day, 0, 6, 0) as Weekday, start, minutes: int(s.minutes, 15, 480, 90), sport });
  }
  return out;
}

export function readPeer(raw: unknown): Peer | null {
  const p = obj(raw);
  const id = uuid(p.id);
  if (!id) return null;
  return {
    id,
    name: cleanText(p.name, 32) || "Unbenannt",
    card: readCard(p.card),
    slots: readSlots(p.slots),
    updated: date(p.updated),
    ...(typeof p.captain === "boolean" ? { captain: p.captain } : {}),
    ...(p.since !== undefined ? { since: date(p.since) } : {}),
    ...(p.joined !== undefined ? { joined: date(p.joined) } : {}),
  };
}

function readBody(raw: unknown): Body | null {
  const b = obj(raw);
  return typeof b.h === "number" && typeof b.b === "number" ? { h: num(b.h, 0.84, 1.16, 1), b: num(b.b, 0.86, 1.25, 1) } : null;
}

const peers = (v: unknown) => (Array.isArray(v) ? v.map(readPeer).filter((x): x is Peer => !!x) : []);
const code = (v: unknown) => (typeof v === "string" && /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(v) ? v : "");

/** The answer of arc_social_state, checked. */
export function readSnapshot(raw: unknown): SocialSnapshot {
  const r = obj(raw);
  const me = obj(r.me);
  const crew = r.crew ? obj(r.crew) : null;
  const gym = r.gym ? obj(r.gym) : null;
  return {
    me: uuid(me.id) && code(me.code) ? { id: me.id as string, code: me.code as string, name: cleanText(me.name, 32), shareTimes: me.share_times === true } : null,
    friends: peers(r.friends),
    incoming: peers(r.incoming),
    outgoing: Array.isArray(r.outgoing)
      ? r.outgoing
          .map(obj)
          .filter((o) => uuid(o.id))
          .map((o) => ({ id: o.id as string, name: cleanText(o.name, 32) || "Unbenannt", at: date(o.at) }))
      : [],
    crew:
      crew && uuid(crew.id)
        ? { id: crew.id as string, name: cleanText(crew.name, 40), flag: normalizeFlag(obj(crew.flag) as Partial<FlagDesign>), code: code(crew.code), captain: crew.captain === true, members: peers(crew.members), banked: num(crew.banked, 0, 1e7, 0) }
        : null,
    gym:
      gym && uuid(gym.id)
        ? { id: gym.id as string, name: cleanText(gym.name, 60), city: cleanText(gym.city, 40), code: code(gym.code), visible: gym.visible !== false, count: int(gym.count, 0, 1e6, 0), members: peers(gym.members) }
        : null,
  };
}

export function readGymHits(raw: unknown): GymHit[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(obj)
    .filter((g) => uuid(g.id))
    .map((g) => ({ id: g.id as string, name: cleanText(g.name, 60), city: cleanText(g.city, 40), count: int(g.count, 0, 1e6, 0) }));
}

// ── Building your own card ────────────────────────────────────────────────

export interface CardInput {
  belt: Belt;
  stripes: number;
  lvl: number;
  ru: number;
  streak: number;
  weekNow: number;
  weekGoal: number;
  bounty: number;
  cls: ClassId | null;
  sea: SeaId;
  island: number;
  progress: number;
  lap: number;
  aboard: { id: string; miles: number } | null;
  body: Body | null;
  ship?: string;
  sail: string;
  flag?: Partial<FlagDesign> | null;
  look: Look;
  mode: Attire;
  equipped: Partial<Record<Slot, string>>;
  today: string;
}

export function buildCard(x: CardInput): SocialCard {
  return {
    belt: x.belt,
    stripes: x.stripes,
    lvl: x.lvl,
    pl: powerOf(x.ru),
    flame: x.streak,
    week: x.weekNow,
    goal: x.weekGoal,
    wk: weekNumber(x.today),
    bounty: x.bounty,
    cls: x.cls,
    sea: x.sea,
    island: x.island,
    // Two decimals are plenty for a ship on the chart, and keep the card stable.
    progress: Math.round(x.progress * 100) / 100,
    lap: x.lap,
    aboard: x.aboard ? { id: x.aboard.id, miles: Math.round(x.aboard.miles * 10) / 10 } : null,
    body: x.body ? { h: Math.round(x.body.h * 100) / 100, b: Math.round(x.body.b * 100) / 100 } : null,
    ship: cleanText(x.ship ?? "", 40),
    sail: hex(x.sail) ?? "#f1bf57",
    flag: normalizeFlag(x.flag),
    look: safeLook(x.look),
    mode: x.mode,
    gear: safeGear(x.equipped),
  };
}

/** Training times to share: day, start, length and sport. Titles and places stay private. */
export function sharedSlots(plan: TrainingPlan | null | undefined): SharedSlot[] {
  return (plan?.slots ?? [])
    .map((s) => ({ day: s.day, start: s.start, minutes: s.minutes, sport: s.sport }))
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))
    .slice(0, 40);
}

// ── Reading the crew and the gym ──────────────────────────────────────────

export interface CrewShip {
  miles: number;
  /** The captain's home sea: the crew ship's route starts there. */
  sea: SeaId;
  /** Ship class of the best belt on board. */
  belt: Belt;
  sail: string;
}

/**
 * The crew's ship: the miles every member logged on board since joining,
 * yours counted from your own data (the published card may lag), plus the
 * miles former members left with the ship.
 */
export function crewShip(crew: CrewInfo, me: string | null, mine: number): CrewShip {
  let miles = crew.banked;
  let best = 0;
  for (const m of crew.members) {
    if (m.id === me) miles += mine;
    else if (m.card?.aboard?.id === crew.id) miles += m.card.aboard.miles;
    if (m.card) best = Math.max(best, BELTS.indexOf(m.card.belt));
  }
  const captain = crew.members.find((m) => m.captain) ?? crew.members[0];
  return { miles, sea: captain?.card?.sea ?? "morgen", belt: BELTS[best], sail: captain?.card?.sail ?? "#f1bf57" };
}

/** This week's trainings of a card; an old card counts as none. */
export const weekOf = (c: SocialCard | null, today: string) => (c && c.wk === weekNumber(today) ? c.week : 0);

/** The crew's week: trainings so far against the sum of everyone's goal. */
export function crewWeek(members: Peer[], today: string) {
  let done = 0;
  let goal = 0;
  let met = 0;
  for (const m of members) {
    if (!m.card) continue;
    const w = weekOf(m.card, today);
    done += Math.min(w, m.card.goal);
    goal += m.card.goal;
    if (w >= m.card.goal) met++;
  }
  return { done, goal, met, of: members.length };
}

/** Who from the gym trains on this day, by start time and sport. */
export function gymDay(members: Peer[], iso: string, self?: string) {
  const day = weekdayOf(iso);
  const map = new Map<string, { start: string; sport: string; names: string[] }>();
  for (const m of members) {
    if (m.id === self) continue;
    for (const s of m.slots ?? []) {
      if (s.day !== day) continue;
      const k = `${s.start}/${s.sport}`;
      const e = map.get(k) ?? { start: s.start, sport: s.sport, names: [] };
      if (!e.names.includes(m.name)) e.names.push(m.name);
      map.set(k, e);
    }
  }
  return [...map.values()].sort((a, b) => a.start.localeCompare(b.start) || a.sport.localeCompare(b.sport));
}

// ── Codes and invitations ─────────────────────────────────────────────────

export type InviteKind = "f" | "c" | "g";

/** "abcd efgh", "ABCD-EFGH" … to ABCD-EFGH, or null. */
export function cleanCode(s: string): string | null {
  const c = s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^[A-Z2-9]{8}$/.test(c)) return null;
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}

export function parseInvite(arg: string | null): { kind: InviteKind; code: string } | null {
  const m = /^([fcg])-(.+)$/i.exec(arg ?? "");
  const code = m ? cleanCode(m[2]) : null;
  return m && code ? { kind: m[1].toLowerCase() as InviteKind, code } : null;
}

export const inviteArg = (kind: InviteKind, code: string) => `${kind}-${code}`;
