import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SquareTerminal, X } from "lucide-react";
import { BJJ, COFFEE, READING } from "@/data/offTheClock";

const STATS_URL = "https://rudopohqygznwhudyohf.supabase.co/functions/v1/public-stats";
const PROMPT = "rukawa@portfolio:~$";
const EASE = [0.16, 1, 0.3, 1] as const;

type Line = { type: "input" | "output" | "error"; text: string };

const HELP_LINES = [
  "available commands:",
  "  help     - this list",
  "  about    - who built this",
  "  stats    - live numbers behind this site",
  "  source   - open the repo",
  "  hire     - say hi",
  "  whoami   - off the clock",
  "  roll     - on the mat",
  "  brew     - in the cup",
  "  reading  - on the nightstand",
  "  clear    - clear the screen",
];

const ABOUT_LINES = [
  "Clash Royale analyst, and the person who built the tooling behind this site.",
  "Currently supporting Solo CRL prep for Tier-1 players on the road to Worlds 2026.",
];

async function runCommand(raw: string): Promise<Line[]> {
  const cmd = raw.trim().toLowerCase();

  switch (cmd) {
    case "help":
      return HELP_LINES.map((text) => ({ type: "output", text }));

    case "about":
      return ABOUT_LINES.map((text) => ({ type: "output", text }));

    case "stats": {
      try {
        const res = await fetch(STATS_URL, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return [
          { type: "output", text: `battles analyzed (30d): ${data.battlesAnalyzed30d ?? "—"}` },
          { type: "output", text: `active dossiers: ${data.activeDossiers ?? "—"}` },
          {
            type: "output",
            text: `top friendly grinder: ${data.topFriendlyPlayer?.name ?? data.topFriendlyPlayer?.tag ?? "—"}`,
          },
          {
            type: "output",
            text: `top meta deck: ${data.topMetaDeck?.cards?.map((c: { name: string }) => c.name).join(", ") ?? "—"}`,
          },
        ];
      } catch {
        return [{ type: "error", text: "couldn't reach the live stats endpoint right now." }];
      }
    }

    case "source":
      window.open("https://github.com/tojacob03/rukawa-clash-arena", "_blank", "noopener,noreferrer");
      return [{ type: "output", text: "opening github.com/tojacob03/rukawa-clash-arena…" }];

    case "whoami":
      return [
        { type: "output", text: "grappler (no-gi), espresso drinker, detective-novel reader, fragrance person." },
        { type: "output", text: "full version: /off-the-clock" },
      ];

    case "roll":
      return [
        { type: "output", text: `${BJJ.belt.toLowerCase()} since ${BJJ.since}, ${BJJ.style.toLowerCase()}.` },
        { type: "output", text: `home: ${BJJ.home} · ${BJJ.visited.length} gyms visited on the road.` },
        { type: "output", text: `current favourite: ${BJJ.favourite.toLowerCase()} (subject to change).` },
      ];

    case "brew":
      return [{ type: "output", text: `${COFFEE.method.toLowerCase()} · ${COFFEE.bean} · ${COFFEE.roaster}, ${COFFEE.from}.` }];

    case "reading":
      return [{ type: "output", text: `${READING.title} - ${READING.author}.` }];

    case "hire":
      window.location.href = "mailto:to_jacob@me.com?subject=Let%27s%20talk";
      return [{ type: "output", text: "opening your mail client…" }];

    case "":
      return [];

    default:
      return [{ type: "error", text: `command not found: ${cmd} (try 'help')` }];
  }
}

/**
 * The gimmick, in-page instead of in the browser console: a small terminal
 * panel that unfolds from a prompt line in the footer. Reads as decoration
 * at rest; anyone who clicks it gets a real (tiny) command line.
 */
const Terminal = () => {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([{ type: "output", text: "Type 'help' to see available commands." }]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, busy]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cmd = value.trim();
    setValue("");
    if (!cmd) return;

    if (cmd.toLowerCase() === "clear") {
      setLines([]);
      return;
    }

    setLines((prev) => [...prev, { type: "input", text: cmd }]);
    setBusy(true);
    const result = await runCommand(cmd);
    setLines((prev) => [...prev, ...result]);
    setBusy(false);
  };

  return (
    <div className="mt-10 pt-6 border-t border-border/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group mx-auto flex items-center gap-2 font-mono text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
      >
        <SquareTerminal className="h-3.5 w-3.5" />
        <span className="text-clash-gold/40 transition-colors group-hover:text-clash-gold/70">rukawa@portfolio</span>
        <span className="text-muted-foreground/40">:~$</span>
        {!open && <span className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.15em] animate-caret bg-current" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mx-auto mt-4 max-w-xl overflow-hidden rounded-lg border border-border/50 bg-background/95 shadow-card">
              {/* Title bar */}
              <div className="flex items-center gap-1.5 border-b border-border/40 bg-secondary/30 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2 font-mono text-[10px] text-muted-foreground">rukawa — zsh</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close terminal"
                  className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Output - data-lenis-prevent lets the wheel scroll this box
                  natively instead of Lenis hijacking it to scroll the page. */}
              <div
                ref={scrollRef}
                data-lenis-prevent
                className="h-64 space-y-0.5 overflow-y-auto overscroll-contain px-4 py-3 font-mono text-xs leading-relaxed"
              >
                {lines.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.type === "input"
                        ? "text-foreground"
                        : line.type === "error"
                        ? "text-red-400"
                        : "text-clash-purple/90"
                    }
                  >
                    {line.type === "input" ? `${PROMPT} ${line.text}` : line.text}
                  </div>
                ))}
                {busy && <div className="text-muted-foreground">…</div>}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border/40 px-4 py-2.5">
                <span className="shrink-0 font-mono text-xs text-clash-gold">{PROMPT}</span>
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="type a command…"
                  className="flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/40"
                />
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Terminal;
