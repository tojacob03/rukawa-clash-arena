// Account and sync state for the UI. The Supabase client and the sync engine
// live in engine.ts and load on demand, so people without an account never
// download them. This module stays tiny.

import { useSyncExternalStore } from "react";
import { arcStore } from "../store.ts";
import type { Route } from "../store.ts";

export interface CloudUser {
  id: string;
  email: string | null;
  phone: string | null;
  /** Guest account: no email, phone or provider yet. */
  anonymous: boolean;
  /** Sign-in methods linked to the account (email, google, apple …). */
  providers: string[];
  createdAt: string | null;
}

export interface SaveSummary {
  name: string | null;
  sessions: number;
  last: string | null;
}

export type SyncPhase = "idle" | "syncing" | "offline" | "error" | "paused";

export interface CloudState {
  /** Supabase URL and key are set for this build. */
  configured: boolean;
  status: "off" | "loading" | "signedOut" | "signedIn";
  user: CloudUser | null;
  /** The account has a second factor and this session has not passed it yet. */
  mfa: boolean;
  /** Opened from a password reset link: ask for a new password. */
  recovery: boolean;
  sync: { phase: SyncPhase; last: number | null; pending: number; error: string | null };
  /** First sign-in with data on this device and in the account: the player decides. */
  choice: { device: SaveSummary; account: SaveSummary } | null;
  /** Message to show once, e.g. an error from a sign-in redirect. */
  notice: string | null;
}

const env = import.meta.env as Record<string, string | undefined>;
export const CLOUD_URL = env.VITE_SUPABASE_URL;
export const CLOUD_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
/** Optional Cloudflare Turnstile site key, when the project requires a CAPTCHA. */
export const TURNSTILE_SITEKEY = env.VITE_ARC_TURNSTILE_SITEKEY;
export const cloudConfigured = !!(CLOUD_URL && CLOUD_KEY);
/** Where the Arc session lives; separate from the portfolio's session on the same domain. */
export const AUTH_STORAGE_KEY = "waza-arc.auth";

let st: CloudState = {
  configured: cloudConfigured,
  status: cloudConfigured ? "loading" : "off",
  user: null,
  mfa: false,
  recovery: false,
  sync: { phase: "idle", last: null, pending: 0, error: null },
  choice: null,
  notice: null,
};
const listeners = new Set<() => void>();

export const cloudState = {
  get: () => st,
  set(patch: Partial<CloudState>) {
    st = { ...st, ...patch };
    listeners.forEach((l) => l());
  },
  setSync(patch: Partial<CloudState["sync"]>) {
    cloudState.set({ sync: { ...st.sync, ...patch } });
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export const useCloud = () => useSyncExternalStore(cloudState.subscribe, cloudState.get);

const AFTER_SIGN_IN_KEY = "waza-arc.after-sign-in";
const AFTER_SIGN_IN_TTL = 30 * 60 * 1000;

/** Where to go once the next sign-in succeeds, e.g. back to the Dōjō after creating a character. Survives the provider redirect. */
export function afterSignIn(route: Route, arg?: string) {
  try {
    window.sessionStorage.setItem(AFTER_SIGN_IN_KEY, JSON.stringify({ route, arg, at: Date.now() }));
  } catch {
    /* storage blocked: stay on the account page */
  }
}

/** The pending target, read once. Stale entries (an abandoned sign-in) are dropped. */
export function takeAfterSignIn(): { route: Route; arg?: string } | null {
  try {
    const raw = window.sessionStorage.getItem(AFTER_SIGN_IN_KEY);
    window.sessionStorage.removeItem(AFTER_SIGN_IN_KEY);
    const v = raw ? (JSON.parse(raw) as { route?: unknown; arg?: unknown; at?: unknown }) : null;
    if (!v || typeof v.route !== "string" || typeof v.at !== "number" || Date.now() - v.at >= AFTER_SIGN_IN_TTL) return null;
    return { route: v.route as Route, ...(typeof v.arg === "string" ? { arg: v.arg } : {}) };
  } catch {
    return null;
  }
}

type Engine = typeof import("./engine.ts");
let engine: Promise<Engine> | null = null;

/** Load the engine (Supabase client, sign-in, sync). Resolves once the session state is known. */
export function loadCloud(): Promise<Engine> {
  if (!cloudConfigured) return Promise.reject(new Error("Konto ist in dieser Version nicht eingerichtet."));
  engine ??= import("./engine.ts").then(async (m) => {
    await m.start();
    return m;
  });
  engine.catch(() => {
    engine = null;
    cloudState.set({ status: "signedOut", notice: "Das Konto-Modul konnte nicht geladen werden. Bist du offline?" });
  });
  return engine;
}

/** At startup: load the engine only when there is a stored session or a sign-in redirect to finish. */
export function bootCloud() {
  if (!cloudConfigured) return;
  let stored = false;
  try {
    stored = !!window.localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    /* storage blocked: no stored session */
  }
  const q = new URLSearchParams(window.location.search);
  const redirect = ["code", "error", "error_description", "token_hash"].some((k) => q.has(k));
  // Open the account's slot right away; the engine switches back if the session turns out invalid.
  const active = arcStore.lastActive();
  if (stored && active) arcStore.switchTo(active);
  if (stored || redirect) void loadCloud().catch(() => undefined);
  else cloudState.set({ status: "signedOut" });
}
