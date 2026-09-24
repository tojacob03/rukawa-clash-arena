import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SectionIntro from "@/components/portfolio/SectionIntro";

const EASE = [0.16, 1, 0.3, 1] as const;

// All numbers below are an anonymized example of what the private tool
// shows - the process is real, the player isn't identifiable.
const STEPS = [
  {
    tag: "01 · Ingest",
    title: "Player tag → battle log",
    body: "Profiles, alternate accounts, recent battles and friendly sets arrive in one place, instead of being assembled by hand before every session.",
  },
  {
    tag: "02 · Profile",
    title: "Habits per game slot",
    body: "Decks and cards are split by Game 1, 2 and 3, filtered by mode and season - repeatable habits instead of one-off results.",
  },
  {
    tag: "03 · Decision",
    title: "Remaining decks under bans",
    body: "Once cards and slots are burned mid-set, a compact ranking shows what the opponent most likely still has.",
  },
];

// A battle log as the tool groups it: duels are sets of several games
// (one deck per game), and at this level most games end 1-0 in crowns.
const LOG = [
  {
    mode: "CRL Duel · Bo3",
    result: "W 2-1",
    games: [
      ["Miner Poison", "1-0"],
      ["Hog 2.6", "0-1"],
      ["Lava Clone", "1-0"],
    ],
  },
  {
    mode: "Friendly duel · Bo3",
    result: "L 1-2",
    games: [
      ["Giant Double Prince", "0-1"],
      ["Miner Poison", "1-0"],
      ["Hog 2.6", "0-1"],
    ],
  },
  { mode: "Ladder", result: "W", games: [["Miner Poison", "1-0"]] },
];

const SLOTS = [
  { game: "Game 1", decks: [["Miner Poison", 46], ["Hog 2.6", 28], ["Lava Clone", 14]] },
  { game: "Game 2", decks: [["Giant Double Prince", 38], ["Miner Poison", 31], ["Hog 2.6", 19]] },
  { game: "Game 3", decks: [["Hog 2.6", 41], ["Lava Clone", 33], ["Giant Double Prince", 12]] },
] as const;

const REMAINING = [
  ["Lava Clone", 1.0],
  ["Giant Double Prince", 0.81],
  ["Royal Recruits", 0.47],
] as const;

const Panel = ({ step }: { step: number }) => (
  <div className="relative h-[26rem] overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 font-mono text-sm shadow-card backdrop-blur sm:p-8">
    <div className="mb-6 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
      <span>Player analysis · #········</span>
      <span className="text-clash-gold">{STEPS[step].tag}</span>
    </div>
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        {step === 0 && (
          <div className="space-y-3">
            {LOG.map((set, i) => (
              <motion.div
                key={set.mode}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12, duration: 0.35 }}
                className="rounded-lg bg-secondary/40 px-3 py-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{set.mode}</span>
                  <span className={set.result.startsWith("W") ? "text-green-400" : "text-red-400"}>{set.result}</span>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {set.games.map(([deck, crowns], g) => (
                    <li key={g} className="grid grid-cols-[2rem_1fr_2.5rem] gap-2 text-xs">
                      <span className="text-muted-foreground/60">{set.games.length > 1 ? `G${g + 1}` : ""}</span>
                      <span className="truncate text-foreground">{deck}</span>
                      <span className={`text-right ${crowns.startsWith("1") ? "text-green-400" : "text-red-400"}`}>
                        {crowns}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-5">
            {SLOTS.map((slot, s) => (
              <div key={slot.game}>
                <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{slot.game}</p>
                <div className="space-y-1.5">
                  {slot.decks.map(([deck, pct], i) => (
                    <div key={deck} className="flex items-center gap-3">
                      <span className="w-32 truncate text-xs text-foreground sm:w-44">{deck}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                        <motion.div
                          className={`h-full rounded-full ${i === 0 ? "bg-clash-gold" : "bg-clash-blue/60"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: s * 0.12 + i * 0.05, duration: 0.7, ease: EASE }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {step === 2 && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Burned this set</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Hog Rider", "Miner", "Poison"].map((card) => (
                <span key={card} className="rounded-full border border-red-400/40 px-3 py-1 text-xs text-red-300 line-through">
                  {card}
                </span>
              ))}
            </div>
            <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Most likely remaining</p>
            <div className="mt-3 space-y-4">
              {REMAINING.map(([deck, score], i) => (
                <div key={deck}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-foreground">{deck}</span>
                    <span className={i === 0 ? "text-clash-gold" : "text-muted-foreground"}>{score.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className={`h-full rounded-full ${i === 0 ? "bg-clash-gold" : "bg-clash-blue/60"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${score * 100}%` }}
                      transition={{ delay: i * 0.1, duration: 0.8, ease: EASE }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  </div>
);

const SystemStory = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  // Desktop: the section is three screens tall and its content sticks to the
  // viewport; scroll progress picks the step. Plain CSS sticky instead of a
  // GSAP pin, so it can't interfere with the pinned Experience section.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setStep(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
  });

  return (
    <section id="work" className="scroll-mt-20 bg-muted/20">
      {/* Desktop: sticky scroll story */}
      <div ref={ref} className="relative hidden h-[300vh] lg:block">
        <div className="sticky top-0 flex h-screen items-center">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-12 items-center gap-12 px-8">
            <div className="col-span-5">
              <SectionIntro
                eyebrow="Featured system"
                title="From battle log to set decision"
                description="The private tool behind my prep, in three steps. Example data is anonymized; the process is real."
              />
              <ol className="mt-10 space-y-2">
                {STEPS.map((s, i) => (
                  <li
                    key={s.tag}
                    className={`rounded-xl border-l-2 py-3 pl-5 transition-all duration-500 ${
                      i === step ? "border-clash-gold opacity-100" : "border-border opacity-40"
                    }`}
                  >
                    <p className="label-caps text-clash-gold">{s.tag}</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">{s.title}</p>
                    <p
                      className={`overflow-hidden text-sm leading-relaxed text-muted-foreground transition-all duration-500 ${
                        i === step ? "mt-2 max-h-32" : "max-h-0"
                      }`}
                    >
                      {s.body}
                    </p>
                  </li>
                ))}
              </ol>
              <Link
                to="/work"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-clash-gold transition-colors hover:text-foreground"
              >
                Read the case studies <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="col-span-7">
              <Panel step={step} />
              <div className="mt-4 h-0.5 overflow-hidden rounded-full bg-border">
                <motion.div className="h-full origin-left bg-clash-gold" style={{ scaleX: progress }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile and tablet: the same three steps, stacked */}
      <div className="px-5 py-14 sm:px-6 sm:py-20 lg:hidden">
        <SectionIntro
          eyebrow="Featured system"
          title="From battle log to set decision"
          description="The private tool behind my prep, in three steps. Example data is anonymized; the process is real."
        />
        <div className="mt-10 space-y-10">
          {STEPS.map((s, i) => (
            <div key={s.tag}>
              <p className="label-caps text-clash-gold">{s.tag}</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{s.title}</p>
              <p className="mb-4 mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              <Panel step={i} />
            </div>
          ))}
        </div>
        <Link
          to="/work"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-clash-gold transition-colors hover:text-foreground"
        >
          Read the case studies <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

export default SystemStory;
