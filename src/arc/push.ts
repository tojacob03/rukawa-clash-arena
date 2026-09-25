// Browser side of reminders: the service worker, the push subscription of
// this device and the install prompt. Small and free of the Supabase client.

import { useSyncExternalStore } from "react";

export type PushState = "unsupported" | "install" | "denied" | "off" | "on";

export const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Registers the service worker (offline start, push). Safe to call more than once. */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("/arc/sw.js", { scope: "/arc/" })
    .then(() => navigator.serviceWorker.ready)
    .then((reg) => {
      // Files loaded before the worker took over: cache them for the next offline start.
      const urls = performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((u) => u.startsWith(`${location.origin}/assets/`));
      reg.active?.postMessage({ type: "precache", urls });
    })
    .catch(() => undefined);
  // A notification tapped while the app is open: go to its screen.
  navigator.serviceWorker.addEventListener("message", (e: MessageEvent<{ type?: string; hash?: string }>) => {
    if (e.data?.type === "open" && e.data.hash) window.location.hash = e.data.hash;
  });
}

async function registration() {
  if (!("serviceWorker" in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration("/arc/")) ?? null;
}

export async function pushState(): Promise<PushState> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return isIos() && !isStandalone() ? "install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  const sub = await (await registration())?.pushManager.getSubscription();
  return sub ? "on" : "off";
}

function keyBytes(b64url: string) {
  const b64 = (b64url + "=".repeat((4 - (b64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

const sameKey = (a: ArrayBuffer | null | undefined, b: Uint8Array) => !!a && a.byteLength === b.length && new Uint8Array(a).every((x, i) => x === b[i]);

/** Asks for permission, subscribes this device and hands the subscription to `save`. */
export async function enablePush(vapid: string, save: (sub: PushSubscriptionJSON) => Promise<void>) {
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error(perm === "denied" ? "Benachrichtigungen sind für diese Seite blockiert." : "Ohne Erlaubnis kommen keine Benachrichtigungen.");
  const reg = await navigator.serviceWorker.ready;
  const key = keyBytes(vapid);
  let sub = await reg.pushManager.getSubscription();
  if (sub && !sameKey(sub.options.applicationServerKey, key)) {
    await sub.unsubscribe();
    sub = null;
  }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  await save(sub.toJSON());
}

export async function disablePush(drop: (endpoint: string) => Promise<void>) {
  const sub = await (await registration())?.pushManager.getSubscription();
  if (!sub) return;
  await drop(sub.endpoint).catch(() => undefined);
  await sub.unsubscribe();
}

// ── Install prompt (Chrome, Edge, Android) ────────────────────────────────

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function watchInstall() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export function useInstallPrompt() {
  const can = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => !!deferred,
  );
  return {
    can,
    async install() {
      const e = deferred;
      if (!e) return;
      await e.prompt();
      await e.userChoice.catch(() => undefined);
      deferred = null;
      notify();
    },
  };
}

/** The number on the app icon: 1 while a planned training today is not logged yet. */
export function setBadge(n: number) {
  const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
  try {
    if (n > 0) void nav.setAppBadge?.(n).catch(() => undefined);
    else void nav.clearAppBadge?.().catch(() => undefined);
  } catch {
    /* not supported */
  }
}
