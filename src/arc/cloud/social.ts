// Friends, crew and gym for the UI. Loads through the cloud engine on demand;
// players without an account never download it. One call brings everything
// the player may see; it is repeated when a social screen opens, when the tab
// comes back and every two minutes while one is open.

import { useEffect, useSyncExternalStore } from "react";
import { cloudState, loadCloud, useCloud } from "./state.ts";
import { readSnapshot } from "../core/social.ts";
import type { SocialSnapshot } from "../core/social.ts";

type Engine = typeof import("./engine.ts");

export interface SocialView extends SocialSnapshot {
  /** idle: not signed in (or not loaded yet); error: the last load failed. */
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  /** Account the data belongs to. */
  uid: string | null;
  at: number;
}

const EMPTY: SocialView = { status: "idle", error: null, uid: null, at: 0, me: null, friends: [], incoming: [], outgoing: [], crew: null, gym: null };
let st: SocialView = EMPTY;
const listeners = new Set<() => void>();
const set = (patch: Partial<SocialView>) => {
  st = { ...st, ...patch };
  listeners.forEach((l) => l());
};

export const socialStore = {
  get: () => st,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

cloudState.subscribe(() => {
  const c = cloudState.get();
  if (st.uid && (c.status !== "signedIn" || c.user?.id !== st.uid)) {
    st = EMPTY;
    listeners.forEach((l) => l());
  }
});

let inflight: Promise<void> | null = null;
/** A forced load waiting for the running one: that one may have started before a change. */
let queued: Promise<void> | null = null;
const FRESH = 60_000;

/** Load the state from the server. Without `force`, a load from the last minute is kept. */
export function refreshSocial(force = false): Promise<void> {
  const c = cloudState.get();
  const uid = c.status === "signedIn" && !c.mfa ? c.user?.id ?? null : null;
  if (!uid) return Promise.resolve();
  if (!force && st.uid === uid && st.status === "ready" && Date.now() - st.at < FRESH) return Promise.resolve();
  if (inflight) {
    if (!force) return inflight;
    queued ??= inflight.then(() => {
      queued = null;
      return refreshSocial(true);
    });
    return queued;
  }
  if (st.uid !== uid) set({ ...EMPTY, uid, status: "loading" });
  else if (st.status !== "ready") set({ status: "loading" });
  inflight = loadCloud()
    .then(async (m) => {
      try {
        const raw = await m.socialState();
        if (cloudState.get().user?.id === uid) set({ ...readSnapshot(raw), status: "ready", error: null, at: Date.now(), uid });
      } catch (e) {
        if (cloudState.get().user?.id === uid) set({ status: "error", error: m.message(e), at: Date.now() });
      }
    })
    .catch(() => set({ status: "error", error: "Keine Verbindung zum Konto.", at: Date.now() }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Run a change on the server, then load the new state. Errors come back as readable text. */
export async function socialAct<T>(fn: (m: Engine) => Promise<T>): Promise<T> {
  const m = await loadCloud();
  try {
    const r = await fn(m);
    await refreshSocial(true);
    return r;
  } catch (e) {
    throw new Error(m.message(e));
  }
}

/**
 * The social state for screens. `live` keeps it fresh while the screen is
 * open (every two minutes and when the tab comes back).
 */
export function useSocial(live = false): SocialView {
  const cloud = useCloud();
  const v = useSyncExternalStore(socialStore.subscribe, socialStore.get);
  const uid = cloud.status === "signedIn" && !cloud.mfa ? cloud.user?.id ?? null : null;
  useEffect(() => {
    if (uid) void refreshSocial();
  }, [uid]);
  useEffect(() => {
    if (!live || !uid) return;
    const on = () => {
      if (document.visibilityState === "visible") void refreshSocial();
    };
    const id = window.setInterval(() => document.visibilityState === "visible" && void refreshSocial(true), 120_000);
    document.addEventListener("visibilitychange", on);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", on);
    };
  }, [live, uid]);
  return v.uid === uid ? v : EMPTY;
}
