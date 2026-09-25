// Waza Arc service worker (scope /arc/).
// - Offline start: the page is fetched fresh when online and served from the
//   cache when not; built files under /assets/ never change their content,
//   so they come from the cache first.
// - Reminders: shows push messages and opens the right screen on tap.
// Everything else (Supabase, the portfolio pages) passes through untouched.

const SHELL = "arc-shell-v2";
const ASSETS = "arc-assets-v1";
const KEEP = [SHELL, ASSETS];
const MAX_ASSETS = 120;
const PAGE = "/arc/";
const STATIC = ["/arc/", "/arc/manifest.webmanifest", "/arc/icon.svg", "/arc/icon-192.png", "/arc/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(STATIC))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("arc-") && !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim() {
  const c = await caches.open(ASSETS);
  const keys = await c.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_ASSETS))) await c.delete(k);
}

async function cacheAssets(urls) {
  const c = await caches.open(ASSETS);
  await Promise.all(
    urls.map(async (u) => {
      if (await c.match(u)) return;
      const res = await fetch(u).catch(() => null);
      if (res && res.ok) await c.put(u, res);
    }),
  );
  await trim();
}

self.addEventListener("message", (event) => {
  const d = event.data || {};
  if (d.type === "precache" && Array.isArray(d.urls)) event.waitUntil(cacheAssets(d.urls.filter((u) => typeof u === "string" && new URL(u).origin === self.location.origin)));
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // The app page: network first, cache as fallback (fresh deploys win when online).
  if (req.mode === "navigate" && url.pathname.startsWith("/arc")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            void caches.open(SHELL).then((c) => c.put(PAGE, copy));
          }
          return res;
        })
        .catch(() => caches.match(PAGE).then((r) => r || Response.error())),
    );
    return;
  }

  // Built files carry a content hash in their name: cache first.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              void caches
                .open(ASSETS)
                .then((c) => c.put(req, copy))
                .then(trim);
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Icons and the manifest: stale while revalidate.
  if (STATIC.includes(url.pathname)) {
    event.respondWith(
      caches.open(SHELL).then(async (c) => {
        const hit = await c.match(url.pathname);
        const fresh = fetch(req)
          .then((res) => {
            if (res.ok) void c.put(url.pathname, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || fresh;
      }),
    );
  }
});

// ── Reminders ───────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch {
    d = { body: event.data ? event.data.text() : "" };
  }
  const title = d.title || "Waza Arc";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: d.body || "",
      tag: d.tag || "arc",
      renotify: !!d.tag,
      icon: "/arc/icon-192.png",
      badge: "/arc/icon-192.png",
      lang: "de",
      data: { url: d.url || "/arc/#/heute" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/arc/#/heute", self.location.origin);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (new URL(c.url).pathname.startsWith("/arc")) {
          c.postMessage({ type: "open", hash: target.hash });
          return c.focus();
        }
      }
      return self.clients.openWindow(target.href);
    }),
  );
});
