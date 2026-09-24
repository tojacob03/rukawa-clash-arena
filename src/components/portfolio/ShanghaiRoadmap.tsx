import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
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

const MilestoneList = ({ reached }: { reached: number }) => (
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
  const reduce = useReducedMotion();
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const near = useInView(desktopRef, { once: true, margin: "800px 0px" });
  const nearMobile = useInView(mobileRef, { once: true, margin: "800px 0px" });
  const mobileInView = useInView(mobileRef, { once: true, amount: 0.5 });
  // Separate state per layout: the hidden one must not overwrite the visible one.
  const [reachedDesktop, setReachedDesktop] = useState(-1);
  const [reachedMobile, setReachedMobile] = useState(-1);

  // Desktop: the section is 2.5 screens tall and sticks; scrolling flies the
  // plane. Reduced motion: the whole journey is shown as done.
  const { scrollYProgress } = useScroll({ target: desktopRef, offset: ["start start", "end end"] });
  const flown = useTransform(scrollYProgress, [0.05, 0.9], [0, 1], { clamp: true });
  const desktopProgress = useTransform(flown, (v) => (reduce ? 1 : v));

  // Mobile: no sticky scroll; the flight plays once when the map is in view.
  const mobileProgress = useMotionValue(reduce ? 1 : 0);
  useEffect(() => {
    if (!mobileInView || reduce) return;
    const controls = animate(mobileProgress, 1, { duration: 4, ease: [0.45, 0, 0.2, 1] });
    return () => controls.stop();
  }, [mobileInView, reduce, mobileProgress]);

  const toReached = (p: number) => {
    let n = -1;
    STATIONS.forEach((s, i) => {
      if (p >= s - 0.001) n = i;
    });
    return p >= 0.999 ? MILESTONES.length : n;
  };
  useMotionValueEvent(desktopProgress, "change", (p) => setReachedDesktop(toReached(p)));
  useMotionValueEvent(mobileProgress, "change", (p) => setReachedMobile(toReached(p)));
  useEffect(() => {
    if (!reduce) return;
    setReachedDesktop(MILESTONES.length);
    setReachedMobile(MILESTONES.length);
  }, [reduce]);

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
      <div className="px-5 py-20 sm:px-6 lg:hidden">
        {intro}
        <div ref={mobileRef} className="mt-10">
          <MapBox progress={mobileProgress} near={nearMobile} crop={ROUTE_CROP} className="aspect-[16/10]" />
        </div>
        <div className="mt-6">
          <StatusCard />
        </div>
        <div className="mt-8">
          <MilestoneList reached={reachedMobile} />
        </div>
      </div>
    </section>
  );
};

export default ShanghaiRoadmap;
