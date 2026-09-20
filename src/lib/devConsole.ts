/**
 * A quiet console easter egg for people who actually open devtools.
 *
 * Deliberately does NOT log anything automatically on load - no banner, no
 * hint, nothing to see just from opening the console. window.rukawa sits
 * there silently; nothing happens until someone explicitly reaches for it.
 * The pointers to it are an HTML comment in index.html ("View Page Source")
 * and the terminal prompt line in the site footer.
 *
 * Commands are exposed as GETTERS, not plain methods. Typing `rukawa.stats`
 * without parentheses is the single most likely way someone interacts with
 * this - and with plain methods that just dumps the (minified) function
 * source instead of doing anything. As getters, both `rukawa.stats` and
 * `rukawa.stats()` run the command: the getter does the work, and returns a
 * silent no-op so the trailing `()` is harmless rather than a double run.
 */

declare global {
  interface Window {
    rukawa?: Record<string, unknown>;
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

// Returned by every command so an optional trailing "()" does nothing extra.
// Named so the console shows a tidy "f noop()" rather than a code dump.
const noop = function noop() {};

function showHelp() {
  printLines("rukawa devtools", [
    "rukawa.help     - this list",
    "rukawa.about    - who built this",
    "rukawa.stats    - live numbers behind this site",
    "rukawa.source   - open the repo",
    "rukawa.hire     - say hi",
    "",
    "(parentheses optional - rukawa.stats and rukawa.stats() both work)",
  ]);
}

function showAbout() {
  printLines("About", [
    "Clash Royale analyst, and the person who built the tooling behind this site.",
    "Currently supporting Solo CRL prep for Tier-1 players on the road to Worlds 2026.",
  ]);
}

async function showStats() {
  console.log("%cFetching live stats…", dim);
  try {
    const res = await fetch(STATS_URL, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("%crukawa live stats", gold, {
      battlesAnalyzed30d: data.battlesAnalyzed30d ?? null,
      activeDossiers: data.activeDossiers ?? null,
      topFriendlyPlayer: data.topFriendlyPlayer?.name ?? data.topFriendlyPlayer?.tag ?? null,
      topMetaDeck: data.topMetaDeck?.cards?.map((c: { name: string }) => c.name) ?? null,
    });
  } catch (err) {
    // Surface the actual reason instead of a generic failure - if this ever
    // breaks, whoever is poking at it should be able to see why.
    console.log("%cCouldn't reach the live stats endpoint right now.", red, err);
  }
}

export function installDevConsole() {
  if (typeof window === "undefined" || window.rukawa) return;

  const rukawa = {};

  const command = (name: string, run: () => void) =>
    Object.defineProperty(rukawa, name, {
      get() {
        run();
        return noop;
      },
      enumerable: true,
    });

  command("help", showHelp);
  command("about", showAbout);
  command("stats", () => void showStats());
  command("source", () => {
    console.log("%cOpening github.com/tojacob03/rukawa-clash-arena…", dim);
    window.open("https://github.com/tojacob03/rukawa-clash-arena", "_blank", "noopener,noreferrer");
  });
  command("hire", () => {
    console.log("%cOpening your mail client…", dim);
    window.location.href = "mailto:to_jacob@me.com?subject=Let%27s%20talk";
  });

  window.rukawa = rukawa;
}
