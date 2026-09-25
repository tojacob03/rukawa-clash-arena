// Local-first storage. All data lives in this browser (localStorage) until
// the Supabase schema "arc" is live; export/import moves it between devices.

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ArcData, Attire } from "./core/types.ts";
import { compute, todayIso } from "./core/model.ts";

const KEY = "waza-arc.v1";

export const emptyData = (): ArcData => ({ v: 1, profile: null, onboarding: null, sessions: [], pauses: [], promotions: [], ui: {} });

export function isArcData(d: unknown): d is ArcData {
  if (!d || typeof d !== "object") return false;
  const x = d as ArcData;
  return x.v === 1 && Array.isArray(x.sessions) && Array.isArray(x.pauses) && typeof x.ui === "object";
}

function read(): ArcData {
  try {
    const raw = window.localStorage.getItem(KEY);
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
    window.localStorage.setItem(KEY, JSON.stringify(data));
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
      window.localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable: nothing to clear */
    }
    notify();
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
    if (e.key === KEY) {
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

export type Route = "heute" | "log" | "karte" | "meer" | "codex" | "held" | "profil";
const ROUTES: Route[] = ["heute", "log", "karte", "meer", "codex", "held", "profil"];

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
