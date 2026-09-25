// The ship you sail on. In a crew (with an account and social features on)
// it is the crew's ship: every member's miles move it. Otherwise it is your
// own, which waits in the harbour while you sail with a crew. The last crew
// seen is kept on this device, so the chart and new trainings still know the
// crew ship while the server is loading or out of reach.

import type { Aboard, ArcData, Belt, FlagDesign, SeaId } from "./core/types.ts";
import { DEFAULT_SEA, route } from "./core/sea.ts";
import { MILES, crewMiles, entryMiles, positionAt, voyage } from "./core/voyage.ts";
import type { Position } from "./core/voyage.ts";
import { crewShip } from "./core/social.ts";
import type { Peer } from "./core/social.ts";
import { normalizeFlag } from "./core/crewflag.ts";
import { cloudState } from "./cloud/state.ts";
import { socialStore } from "./cloud/social.ts";
import type { SocialView } from "./cloud/social.ts";

export interface CrewNow {
  id: string;
  name: string;
  flag: FlagDesign;
  captain: boolean;
  /** Empty when only the cached crew is known. */
  members: Peer[];
  /** The day you came on board; your miles count from then on. */
  joined: string;
  sea: SeaId;
  belt: Belt;
  sail: string;
  /** Miles of everyone else on board, and of former members. */
  others: number;
}

export interface ShipNow {
  crew: CrewNow | null;
  /** Your miles on board the crew ship (0 without a crew). */
  mine: number;
  sea: SeaId;
  pos: Position;
  /** Ship class. */
  belt: Belt;
  sail: string;
  flag: Partial<FlagDesign> | null;
}

const KEY = (uid: string) => `waza-arc.crew:${uid}`;
/** A cached crew older than this is not trusted any more. */
const STALE = 14 * 864e5;

function readCache(uid: string): CrewNow | null {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY(uid)) ?? "null") as (CrewNow & { at: number }) | null;
    if (!v || typeof v.id !== "string" || typeof v.others !== "number" || Date.now() - v.at > STALE) return null;
    return { ...v, flag: normalizeFlag(v.flag), members: [] };
  } catch {
    return null;
  }
}

function writeCache(uid: string, c: CrewNow | null) {
  try {
    if (c) window.localStorage.setItem(KEY(uid), JSON.stringify({ ...c, members: [], at: Date.now() }));
    else window.localStorage.removeItem(KEY(uid));
  } catch {
    /* storage blocked: the crew ship shows once the server answers */
  }
}

const signedIn = () => {
  const c = cloudState.get();
  return c.status === "signedIn" && !c.mfa ? (c.user?.id ?? null) : null;
};

let memo: { view: SocialView; uid: string | null; out: CrewNow | null } | null = null;

/** Your crew from the loaded state, or the cached one while it loads. */
export function crewNow(view: SocialView = socialStore.get(), uid: string | null = signedIn()): CrewNow | null {
  if (memo && memo.view === view && memo.uid === uid) return memo.out;
  const out = findCrew(view, uid);
  memo = { view, uid, out };
  return out;
}

function findCrew(view: SocialView, uid: string | null): CrewNow | null {
  if (!uid) return null;
  if (view.uid !== uid || view.status !== "ready") return readCache(uid);
  const c = view.crew;
  if (!c) {
    writeCache(uid, null);
    return null;
  }
  const me = view.me?.id ?? uid;
  const joined = (c.members.find((m) => m.id === me)?.joined ?? "").slice(0, 10);
  const ship = crewShip(c, me, 0);
  const out: CrewNow = { id: c.id, name: c.name, flag: c.flag, captain: c.captain, members: c.members, joined, sea: ship.sea, belt: ship.belt, sail: ship.sail, others: ship.miles };
  writeCache(uid, out);
  return out;
}

/** The ship you sail on today. */
export function shipNow(data: ArcData, today: string, own: { sail: string; flag: Partial<FlagDesign> | null }, crew: CrewNow | null): ShipNow {
  const p = data.profile;
  if (crew) {
    const mine = crewMiles(data, today, crew.id, crew.joined);
    return { crew, mine, sea: crew.sea, pos: positionAt(crew.others + mine), belt: crew.belt, sail: crew.sail, flag: crew.flag };
  }
  return { crew: null, mine: 0, sea: p?.homeSea ?? DEFAULT_SEA, pos: voyage(data, today), belt: p?.belt ?? "weiss", sail: own.sail, flag: own.flag };
}

/**
 * For a new entry: on board the crew ship, if you are in a crew and the day
 * is not before you joined it. The island is where the crew ship will be
 * with this entry's miles.
 */
export function aboardFor(data: ArcData, date: string, kind: "session" | "comp" | "cross" | "stripe" | "belt"): Aboard | undefined {
  const crew = crewNow();
  if (!crew || date < crew.joined) return undefined;
  const add = kind === "stripe" ? MILES.stripe : kind === "belt" ? MILES.belt : entryMiles(data, date, kind);
  const pos = positionAt(crew.others + crewMiles(data, date, crew.id, crew.joined) + add);
  return { crew: crew.id, name: crew.name, isle: route(crew.sea)[pos.idx].id };
}
