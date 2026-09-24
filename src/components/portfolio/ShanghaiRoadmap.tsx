import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SectionIntro from "@/components/portfolio/SectionIntro";
import { MILESTONES, WORLDS, worldsPhase, type Milestone } from "@/data/roadToWorlds";

// The map (world topology + d3-geo) is the heaviest thing on the homepage,
// so it is its own chunk and only loads when the section is about a screen
// away. The map box has a fixed height, so nothing moves when it arrives.
const WorldRouteMap = lazy(() => import("@/components/portfolio/WorldRouteMap"));

// On phones and tablets the whole world leaves the route as a short line
// in a big empty map: crop to Europe - East Asia (16:10, same as the box).
const ROUTE_CROP = "160 150 480 300";

// Where the milestones sit along the route (0 = Germany, 1 = Shanghai).
const STATIONS = MILESTONES.map((_, i) => (i + 1) / (MILESTONES.length + 1));

const pad = (n: number) => String(n).padStart(2, "0");

const Countdown = () => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.max(0, Math.floor((WORLDS.start.getTime() - now) / 1000));
  const parts = [
    [Math.floor(s / 86400), "days"],
    [Math.floor((s % 86400) / 3600), "hrs"],
    [Math.floor((s % 3600) / 60), "min"],
    [s % 60, "sec"],
  ] as const;
  return (
    <div className="flex gap-4 sm:gap-6" aria-label={`${parts[0][0]} days until the World Finals`}>
      {parts.map(([v, label], i) => (
        <div key={label}>
          <div className="tabular-stat text-3xl font-semibold text-foreground sm:text-4xl">
            {i === 0 ? v : pad(v)}
          </div>
          <div className="label-caps mt-1 text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
};

const StatusCard = () => {
  const phase = worldsPhase(new Date());
  return (
    <div className="rounded-xl border border-border/60 bg-background/85 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        {phase !== "done" && (
          <span className="h-2 w-2 animate-pulse rounded-full bg-clash-gold motion-reduce:animate-none" />
        )}
        <span className="label-caps text-muted-foreground">
          {phase === "upcoming" ? "Countdown" : phase === "live" ? "Live now" : "Result"}
        </span>
      </div>
      <h3 className="text-xl font-semibold text-foreground sm:text-2xl">{WORLDS.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        <span className="font-medium text-clash-gold">{WORLDS.city}</span> · {WORLDS.dates} · {WORLDS.qualified} qualified
      </p>
      <div className="mt-5">
        {phase === "upcoming" && <Countdown />}
        {phase === "live" && <p className="text-lg font-semibold text-foreground">Sets are being played right now.</p>}
        {phase === "done" && (
          <p className="text-lg font-semibold text-foreground">{WORLDS.result ?? "Results will be added here shortly."}</p>
        )}
        {phase === "done" && WORLDS.caseStudy && (
          <Link
            to={WORLDS.caseStudy}
            className="pointer-events-auto mt-3 inline-flex items-center gap-2 text-sm font-medium text-clash-gold hover:text-foreground"
          >
            How the prep worked <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
};

const MilestoneList = ({
  reached,
}: {
  reached: number;
}) => (
  <ol className="space-y-3">
    {MILESTONES.map((m: Milestone, i) => (
      <li
        key={m.month}
        className={`border-l-2 py-2 pl-4 transition-all duration-500 ${
          i <= reached ? "border-clash-gold opacity-100" : "border-border opacity-40"
        }`}
      >
        <p className="label-caps text-clash-gold">{m.month}</p>
        <p className="mt-1 text-sm text-muted-foreground">{m.event}</p>
        <p className="mt-1 text-base font-semibold text-foreground">
          {m.results.map((r) => `${r.player} ${r.place}`).join(" · ")}
        </p>
      </li>
    ))}
    <li
      className={`border-l-2 py-2 pl-4 transition-all duration-500 ${
        reached >= MILESTONES.length ? "border-clash-gold opacity-100" : "border-border opacity-40"
      }`}
    >
      <p className="label-caps text-clash-gold">November 2026</p>
      <p className="mt-1 text-sm text-muted-foreground">{WORLDS.name}</p>
      <p className="mt-1 text-base font-semibold text-foreground">
        {WORLDS.city} · {WORLDS.qualified} qualified
      </p>
    </li>
  </ol>
);

// Phones: one milestone at a time under the pinned map, with a stepper
// showing where on the road we are.
const STEPS = [
  ...MILESTONES.map((m) => ({
    key: m.month,
    short: m.month.slice(0, 3),
    label: m.month,
    event: m.event,
    line: m.results.map((r) => `${r.player} ${r.place}`).join(" · "),
  })),
  {
    key: "worlds",
    short: "Worlds",
    label: "November 2026",
    event: WORLDS.name,
    line: `${WORLDS.city} · ${WORLDS.qualified} qualified`,
  },
];

const MilestoneStepper = ({ reached }: { reached: number }) => {
  const current = STEPS[Math.max(reached, 0)];
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <ol className="grid grid-cols-4 gap-2" aria-hidden="true">
        {STEPS.map((step, i) => (
          <li key={step.key}>
            <span
              className={`block h-0.5 rounded-full transition-colors duration-500 ${
                i <= reached ? "bg-clash-gold" : "bg-border"
              }`}
            />
            <span
              className={`label-caps mt-2 block transition-colors duration-500 ${
                i <= reached ? "text-clash-gold" : "text-muted-foreground/60"
              }`}
            >
              {step.short}
            </span>
          </li>
        ))}
      </ol>
      <div className="relative mt-4 h-[4.5rem]" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: reached < 0 ? 0.45 : 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <p className="text-sm text-muted-foreground">
              {current.label} · {current.event}
            </p>
            <p className="mt-1 text-lg font-semibold leading-snug text-foreground">{current.line}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const MapBox = ({
  progress,
  near,
  crop,
  className,
}: {
  progress: MotionValue<number>;
  near: boolean;
  crop?: string;
  className: string;
}) => (
  <div className={`relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card/40 ${className}`}>
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
    {near && (
      <Suspense fallback={null}>
        <WorldRouteMap progress={progress} stations={STATIONS} viewBox={crop} />
      </Suspense>
    )}
  </div>
);

const ShanghaiRoadmap = () => {
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const near = useInView(desktopRef, { once: true, margin: "800px 0px" });
  const nearMobile = useInView(mobileRef, { once: true, margin: "800px 0px" });
  // Separate state per layout: the hidden one must not overwrite the visible one.
  const [reachedDesktop, setReachedDesktop] = useState(-1);
  const [reachedMobile, setReachedMobile] = useState(-1);

  // Both layouts fly on scroll, never on their own: the visitor sets the
  // pace, nothing can play before the map has loaded, and there is no
  // autonomous motion to switch off - the plane only moves while the page
  // is being scrolled, like any other content.
  // Desktop: the section is 2.5 screens tall and sticks.
  const { scrollYProgress } = useScroll({ target: desktopRef, offset: ["start start", "end end"] });
  const desktopProgress = useTransform(scrollYProgress, [0.05, 0.9], [0, 1], { clamp: true });

  // Phones and tablets: same idea. Map and current milestone stick under
  // the nav; the block is ~2.6 screens tall, so the whole route takes about
  // one and a half screens of scrolling.
  const { scrollYProgress: mobileScroll } = useScroll({ target: mobileRef, offset: ["start 0.08", "end end"] });
  const mobileProgress = useTransform(mobileScroll, [0.02, 0.92], [0, 1], { clamp: true });

  const toReached = (p: number) => {
    let n = -1;
    STATIONS.forEach((s, i) => {
      if (p >= s - 0.001) n = i;
    });
    return p >= 0.999 ? MILESTONES.length : n;
  };
  useMotionValueEvent(desktopProgress, "change", (p) => setReachedDesktop(toReached(p)));
  useMotionValueEvent(mobileProgress, "change", (p) => setReachedMobile(toReached(p)));
  const intro = (
    <SectionIntro
      eyebrow="Road to Worlds"
      title="From Monthly Finals to the biggest stage."
      description={"I started preparing Morten and Viiper in May 2026. Both qualified for the World Finals in Shanghai."}
    />
  );

  return (
    <section id="worlds" className="scroll-mt-14 lg:scroll-mt-0">
      {/* Desktop */}
      <div ref={desktopRef} className="relative hidden h-[250vh] lg:block">
        <div className="sticky top-0 flex h-screen items-center">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-12 items-center gap-10 px-8">
            <div className="col-span-4">
              {intro}
              <div className="mt-8">
                <MilestoneList reached={reachedDesktop} />
              </div>
            </div>
            <div className="relative col-span-8">
              <MapBox progress={desktopProgress} near={near} className="h-[460px]" />
              <div className="absolute bottom-5 left-5 max-w-sm">
                <StatusCard />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile and tablet */}
      <div className="px-5 pb-20 pt-20 sm:px-6 lg:hidden">
        {intro}
        <div ref={mobileRef} className="relative mt-10 h-[260vh]">
          <div className="sticky top-16 space-y-3">
            <MapBox progress={mobileProgress} near={nearMobile} crop={ROUTE_CROP} className="aspect-[16/10]" />
            <MilestoneStepper reached={reachedMobile} />
          </div>
        </div>
        <div className="mt-6">
          <StatusCard />
        </div>
      </div>
    </section>
  );
};

export default ShanghaiRoadmap;
