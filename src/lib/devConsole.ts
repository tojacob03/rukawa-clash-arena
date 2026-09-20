/**
 * A quiet console easter egg for people who actually open devtools.
 *
 * Deliberately does NOT log anything automatically on load - no banner, no
 * hint, nothing to see just from opening the console. window.rukawa sits
 * there silently; nothing happens until someone explicitly calls one of its
 * methods themselves. The only pointer to it lives as an HTML comment in
 * index.html (visible only via "View Page Source"), which is uninteresting
 * to anyone who isn't already the type to look at page source.
 */

declare global {
  interface Window {
    rukawa?: Record<string, (...args: unknown[]) => unknown>;
  }
}

const STATS_URL = "https://rudopohqygznwhudyohf.supabase.co/functions/v1/public-stats";

const gold = "color:#FFCC33;font-weight:bold;";
const purple = "color:#B39DFF;";
const dim = "color:#7A7A85;";
const red = "color:#ff6b6b;";

function printLines(title: string, lines: string[]) {
  console.log(`%c${title}`, gold);
  lines.forEach((line) => console.log(`%c${line}`, purple));
}

export function installDevConsole() {
  if (typeof window === "undefined" || window.rukawa) return;

  window.rukawa = {
    help() {
      printLines("rukawa devtools", [
        "rukawa.help()    - this list",
        "rukawa.about()   - who built this",
        "rukawa.stats()   - live numbers behind this site",
        "rukawa.source()  - open the repo",
        "rukawa.hire()    - say hi",
      ]);
    },

    about() {
      printLines("About", [
        "Clash Royale analyst, and the person who built the tooling behind this site.",
        "Currently supporting Solo CRL prep for Tier-1 players on the road to Worlds 2026.",
      ]);
    },

    async stats() {
      console.log("%cFetching live stats…", dim);
      try {
        const res = await fetch(STATS_URL, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();
        console.log("%crukawa live stats", gold, {
          battlesAnalyzed30d: data.battlesAnalyzed30d ?? null,
          activeDossiers: data.activeDossiers ?? null,
          topFriendlyPlayer: data.topFriendlyPlayer?.name ?? data.topFriendlyPlayer?.tag ?? null,
          topMetaDeck: data.topMetaDeck?.cards?.map((c: { name: string }) => c.name) ?? null,
        });
      } catch {
        console.log("%cCouldn't reach the live stats endpoint right now.", red);
      }
    },

    source() {
      window.open("https://github.com/tojacob03/rukawa-clash-arena", "_blank", "noopener,noreferrer");
    },

    hire() {
      window.location.href = "mailto:to_jacob@me.com?subject=Let%27s%20talk";
    },
  };
}
