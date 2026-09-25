// Local-first storage. All data lives in this browser (localStorage). With
// an account the cloud engine (cloud/engine.ts) keeps it in step with the
// server; every account gets its own storage slot, so two people sharing a
// browser never mix their data. The device slot (no account) is the default.

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ArcData, Attire } from "./core/types.ts";
import { compute, todayIso } from "./core/model.ts";

const KEY = "waza-arc.v1";
/** null: the device slot (no account), otherwise an account id. */
let ns: string | null = null;
const keyOf = (n: string | null) => (n ? `${KEY}:u:${n}` : KEY);
/** The last active account, so a signed-in start opens its slot before the account module has loaded. */
const ACTIVE_KEY = "waza-arc.active";

export const emptyData = (): ArcData => ({ v: 1, profile: null, onboarding: null, sessions: [], pauses: [], promotions: [], ui: {} });

export function isArcData(d: unknown): d is ArcData {
  if (!d || typeof d !== "object") return false;
  const x = d as ArcData;
  return x.v === 1 && Array.isArray(x.sessions) && Array.isArray(x.pauses) && typeof x.ui === "object";
}

function read(n: string | null = ns): ArcData {
  try {
    const raw = window.localStorage.getItem(keyOf(n));
    if (!raw) return emptyData();
    const d = JSON.parse(raw);
    return isArcData(d) ? { ...emptyData(), ...d, promotions: d.promotions ?? [], ui: d.ui ?? {} } : emptyData();
  } catch {
    return emptyData();
  }
}

let data: ArcData = read();
let saved = true;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function write() {
  try {
    window.localStorage.setItem(keyOf(ns), JSON.stringify(data));
    saved = true;
  } catch {
    saved = false;
  }
}

export const arcStore = {
  get: () => data,
  set(next: ArcData | ((d: ArcData) => ArcData)) {
    data = typeof next === "function" ? next(data) : next;
    write();
    notify();
  },
  clear() {
    data = emptyData();
    try {
      window.localStorage.removeItem(keyOf(ns));
    } catch {
      /* storage unavailable: nothing to clear */
    }
    notify();
  },
  /** The active slot: null for the device, otherwise an account id. */
  namespace: () => ns,
  /** Switch to another slot (sign-in, sign-out). */
  switchTo(n: string | null) {
    try {
      if (n) window.localStorage.setItem(ACTIVE_KEY, n);
      else window.localStorage.removeItem(ACTIVE_KEY);
    } catch {
      /* storage blocked */
    }
    if (n === ns) return;
    ns = n;
    data = read();
    notify();
  },
  /** Account slot that was active when the app was last used, if any. */
  lastActive(): string | null {
    try {
      return window.localStorage.getItem(ACTIVE_KEY);
    } catch {
      return null;
    }
  },
  /** Read a slot without switching to it. */
  peek: (n: string | null) => read(n),
  /** Remove a slot's data from this browser (not the active one). */
  drop(n: string | null) {
    if (n === ns) return arcStore.clear();
    try {
      window.localStorage.removeItem(keyOf(n));
    } catch {
      /* storage unavailable */
    }
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  /** False when the last write failed (private mode, storage full). */
  saved: () => saved,
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === keyOf(ns)) {
      data = read();
      notify();
    }
  });
}

export const useArcData = () => useSyncExternalStore(arcStore.subscribe, arcStore.get);

/** Today's date as YYYY-MM-DD, refreshed when the tab comes back or the day rolls over. */
export function useToday() {
  const [today, setToday] = useState(todayIso());
  useEffect(() => {
    const tick = () => setToday(todayIso());
    const id = window.setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  return today;
}

export function useArcState(d: ArcData, today: string, attire?: Attire) {
  return useMemo(() => compute(d, today, attire ? { attire } : {}), [d, today, attire]);
}

export type Route = "heute" | "log" | "karte" | "meer" | "codex" | "held" | "profil" | "konto" | "plan" | "matte" | "gym" | "einladung";
const ROUTES: Route[] = ["heute", "log", "karte", "meer", "codex", "held", "profil", "konto", "plan", "matte", "gym", "einladung"];

function parseHash(): { route: Route; arg: string | null } {
  const parts = window.location.hash.replace(/^#\/?/, "").split("/");
  const route = (ROUTES as string[]).includes(parts[0]) ? (parts[0] as Route) : "heute";
  return { route, arg: parts[1] ? decodeURIComponent(parts[1]) : null };
}

export function useRoute() {
  const [r, setR] = useState(parseHash);
  useEffect(() => {
    const on = () => setR(parseHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return r;
}

export const go = (route: Route, arg?: string) => {
  window.location.hash = `#/${route}${arg ? "/" + encodeURIComponent(arg) : ""}`;
};

export const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
