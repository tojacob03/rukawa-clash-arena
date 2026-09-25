// Your own card for friends, crew and gym, and keeping it up to date on the
// server while social features are on.

import { useEffect, useMemo } from "react";
import type { ArcData, ArcState } from "./core/types.ts";
import { SLOTS, inventory } from "./core/items.ts";
import { CLASS } from "./core/classes.ts";
import { bodyOf } from "./core/body.ts";
import { bounty } from "./core/bounty.ts";
import { normalizePlan } from "./core/schedule.ts";
import { buildCard, inviteArg, sharedSlots } from "./core/social.ts";
import type { InviteKind, Peer, SocialCard } from "./core/social.ts";
import { BELT } from "./format.ts";
import { getCharacter, resolveGear } from "./character.ts";
import { cloudState, loadCloud } from "./cloud/state.ts";
import { refreshSocial, socialStore, useSocial } from "./cloud/social.ts";
import type { SocialView } from "./cloud/social.ts";
import { crewNow, shipNow } from "./ship.ts";
import type { OtherShip } from "./components/SeaMap.tsx";
import type { CrewInfo } from "./core/social.ts";

export function cardFor(data: ArcData, st: ArcState, today: string, view: SocialView = socialStore.get()): SocialCard | null {
  const p = data.profile;
  if (!p) return null;
  const ch = getCharacter(data);
  const gear = resolveGear(data, st, inventory(data, st));
  const cls = p.cls ?? st.clsDetected;
  // Where the ship you sail on is: the crew's ship, or your own.
  const ship = shipNow(data, today, { sail: CLASS[cls]?.color ?? "#d4a94f", flag: ch.flag }, crewNow(view));
  return buildCard({
    belt: p.belt,
    stripes: p.stripes,
    lvl: st.lvl,
    ru: st.ru,
    streak: st.streak,
    weekNow: st.weekNow,
    weekGoal: st.weekGoal,
    bounty: bounty(data, st),
    cls,
    sea: ship.sea,
    island: ship.pos.idx,
    progress: ship.pos.progress,
    lap: ship.pos.lap,
    aboard: ship.crew ? { id: ship.crew.id, miles: ship.mine } : null,
    body: p.heightCm || p.weightKg ? bodyOf(p.heightCm, p.weightKg) : null,
    ship: ch.shipName,
    sail: CLASS[cls]?.color ?? "#d4a94f",
    flag: ch.flag,
    look: ch.look,
    mode: ch.mode,
    // What is actually drawn, so friends see the same fighter.
    equipped: Object.fromEntries(SLOTS.map((s) => [s.id, gear[s.id]?.id ?? ""])),
    today,
  });
}

const PUB_KEY = (uid: string) => `waza-arc.social-pub:${uid}`;
const pubSig = (card: SocialCard, shared: unknown[]) => JSON.stringify([card, shared]);
/** The last card sent from this tab, also while the request is still under way. */
let sent: string | null = null;

function lastPublished(uid: string) {
  try {
    return window.localStorage.getItem(PUB_KEY(uid));
  } catch {
    return null;
  }
}

function markPublished(uid: string, sig: string) {
  sent = sig;
  try {
    window.localStorage.setItem(PUB_KEY(uid), sig);
  } catch {
    /* storage blocked: the next start sends it once more */
  }
}

/**
 * While social features are on, publishes the card a few seconds after it
 * changes (a training, a new belt, new gear). Nothing is sent in the demo.
 */
export function useSocialPublish(data: ArcData, st: ArcState, today: string) {
  const social = useSocial();
  // The crew ship moves with the others' miles too, so the card follows the loaded state.
  const card = useMemo(() => (data.profile && !data.demo ? cardFor(data, st, today, social) : null), [data, st, today, social]);
  const slots = useMemo(() => sharedSlots(normalizePlan(data.plan)), [data.plan]);
  const me = social.me;
  const uid = social.uid;
  useEffect(() => {
    if (!me || !uid || !card) return;
    const shared = me.shareTimes ? slots : [];
    const sig = pubSig(card, shared);
    if (sent === sig || lastPublished(uid) === sig) return;
    const t = window.setTimeout(() => {
      sent = sig;
      void loadCloud()
        .then((m) => m.socialPublish(null, card, shared, null, false))
        .then(() => markPublished(uid, sig))
        .catch((e: { message?: string }) => {
          sent = null;
          // Switched off on another device: forget it here too.
          if (String(e?.message).includes("arc_social_off")) void refreshSocial(true);
        });
    }, 4000);
    return () => window.clearTimeout(t);
  }, [me, uid, card, slots]);
}

/** Switch on (or, with `create` false, change name and shared times), then load what others share. */
export async function enableSocial(data: ArcData, st: ArcState, today: string, name: string, shareTimes: boolean, create = true) {
  const card = cardFor(data, st, today);
  if (!card) throw new Error("Leg zuerst deinen Charakter an.");
  const m = await loadCloud();
  const slots = shareTimes ? sharedSlots(normalizePlan(data.plan)) : [];
  try {
    await m.socialPublish(name, card, slots, shareTimes, create);
  } catch (e) {
    if (!create) void refreshSocial(true);
    throw new Error(m.message(e));
  }
  const uid = cloudState.get().user?.id;
  if (uid) markPublished(uid, pubSig(card, slots));
  await refreshSocial(true);
}

/**
 * Friends as ships on the sea chart, where the ship they sail on is.
 * Crewmates sail on your crew ship with you, so they get no ship of their own.
 */
export function shipsOf(self: string | null, crew: CrewInfo | null, friends: Peer[]): OtherShip[] {
  const out: OtherShip[] = [];
  const seen = new Set<string>([...(self ? [self] : []), ...(crew?.members ?? []).map((m) => m.id)]);
  for (const f of friends) {
    if (seen.has(f.id) || !f.card) continue;
    seen.add(f.id);
    const c = f.card;
    out.push({ id: f.id, name: f.name, sea: c.sea, island: c.island, progress: c.progress, belt: c.belt, sail: c.sail, flag: c.flag, crew: false });
  }
  return out;
}

export const beltLine = (p: Peer) => (p.card ? `${BELT[p.card.belt].name}gurt${p.card.stripes ? `, ${p.card.stripes}. Streifen` : ""}, Level ${p.card.lvl}` : "Noch keine Karte");

export const inviteLink = (kind: InviteKind, code: string) => `${window.location.origin}/arc/#/einladung/${inviteArg(kind, code)}`;
