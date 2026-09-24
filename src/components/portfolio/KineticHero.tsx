import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { scrollToSection } from "@/lib/smoothScroll";
import { usePublicStats } from "@/hooks/usePublicStats";

// Same curve as --ease-out-expo in index.css.
const EASE = [0.16, 1, 0.3, 1] as const;

// The last word of the headline cycles through what the analysis produces.
const OUTCOMES = ["set decisions.", "Game 1 reads.", "ban plans.", "Game 3 calls."];

const MARQUEE = "Battle logs · Duel detection · Game 1 tendencies · Remaining decks · Solo CRL · ";

// Proof first, decoration second: these carry the hero, not artwork.
const PROOF = [
  { value: "Top 2, 3 & 4", label: "CRL Monthly Finals results of players I prepared" },
  { value: "2 players", label: "qualified for the CRL World Finals 2026" },
  { value: "Since 2019", label: "analyst for teams, a national team and players" },
];

const CountUp = ({ value }: { value: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduce) {
      ref.current.textContent = value.toLocaleString("en-US");
      return;
    }
    const controls = animate(0, value, {
      duration: 2,
      ease: EASE,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString("en-US");
      },
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return <span ref={ref}>0</span>;
};

// One headline line: the text slides up out of a clipping mask on load.
const Line = ({ children, delay, className = "" }: { children: React.ReactNode; delay: number; className?: string }) => (
  <span className="block overflow-hidden pb-[0.08em]">
    <motion.span
      className={`block ${className}`}
      initial={{ y: "105%" }}
      animate={{ y: "0%" }}
      transition={{ duration: 1, ease: EASE, delay }}
    >
      {children}
    </motion.span>
  </span>
);

const KineticHero = () => {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { data } = usePublicStats();
  const [outcome, setOutcome] = useState(0);

  // Scroll-linked motion: the two big lines drift apart, the whole block
  // fades and lifts as the section leaves the viewport.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const driftLeft = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-18%"]);
  const driftRight = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "12%"]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, reduce ? 1 : 0]);
  const marqueeShift = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-25%"]);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setOutcome((i) => (i + 1) % OUTCOMES.length), 2600);
    return () => clearInterval(id);
  }, [reduce]);

  // A soft light that follows the pointer - written straight to CSS
  // variables, so moving the mouse never re-renders React.
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  const battles = data?.battlesAnalyzed30d ?? 0;

  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pb-16 pt-28 sm:pt-32"
      style={{ ["--spot-x" as string]: "70%", ["--spot-y" as string]: "30%" }}
    >
      {/* Background: no artwork and no purple - a quiet grid and a faint
          gold light that follows the pointer. */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.5)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.5)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(600px circle at var(--spot-x) var(--spot-y), hsl(var(--clash-gold) / 0.07), transparent 60%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" aria-hidden />

      {/* Outline marquee behind the headline */}
      <motion.div
        style={{ x: marqueeShift }}
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap"
        aria-hidden
      >
        <div className="flex w-max animate-marquee motion-reduce:animate-none">
          {[0, 1].map((i) => (
            <span
              key={i}
              className="pr-8 text-[clamp(5rem,16vw,15rem)] font-semibold uppercase leading-none tracking-tight text-transparent [-webkit-text-stroke:1px_hsl(var(--foreground)/0.07)]"
            >
              {MARQUEE}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div style={{ opacity: fade }} className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="label-caps text-clash-gold"
        >
          Till Oscar Jacob, known as Rukawa
        </motion.p>

        <h1 className="mt-6 text-[clamp(3rem,9.5vw,9rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-foreground">
          <motion.span style={{ x: driftLeft }} className="block">
            <Line delay={0.1}>I turn</Line>
            <Line delay={0.2}>battle logs</Line>
          </motion.span>
          <motion.span style={{ x: driftRight }} className="block">
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span
                className="flex flex-wrap items-baseline gap-x-[0.25em]"
                initial={{ y: "105%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1, ease: EASE, delay: 0.3 }}
              >
                <span className="text-muted-foreground/70">into</span>
                <span className="relative inline-grid overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={OUTCOMES[outcome]}
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      exit={{ y: "-100%", opacity: 0 }}
                      transition={{ duration: 0.55, ease: EASE }}
                      className="pb-[0.08em] text-clash-gold"
                    >
                      {OUTCOMES[outcome]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </motion.span>
            </span>
          </motion.span>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
          className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Clash Royale analyst for Solo CRL, currently preparing two players for the CRL World Finals. I build
            the data tooling behind it myself, and use the same approach beyond esports.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => scrollToSection("work")}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-7 py-4 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
            >
              See the system
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("contact")}
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-foreground/25 px-7 py-4 text-sm font-semibold text-foreground transition-colors hover:border-foreground/60"
            >
              Work together
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-14 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-border/60 pt-6 md:grid-cols-4"
        >
          {battles > 0 && (
            <div className="flex flex-col">
              <dt className="mt-2 flex max-w-[16rem] items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <span className="relative mt-[0.6em] flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                </span>
                battles parsed by my pipeline, last 30 days
              </dt>
              <dd className="tabular-stat order-first text-3xl font-semibold tracking-tight text-foreground">
                <CountUp value={battles} />
              </dd>
            </div>
          )}
          {PROOF.map((item) => (
            <div key={item.value} className="flex flex-col">
              <dt className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">{item.label}</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-foreground">{item.value}</dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  );
};

export default KineticHero;
