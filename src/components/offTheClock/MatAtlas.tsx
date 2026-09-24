import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { BJJ, MAT_STOPS, type MatStop } from "@/data/offTheClock";

// World topology + d3-geo: its own chunk, fetched with this page.
const GymGlobe = lazy(() => import("./GymGlobe"));

const EASE = [0.16, 1, 0.3, 1] as const;
const TOUR_MS = 4500;
const TOUR_MS_PHOTOS = 7000;

const home = MAT_STOPS.find((s) => s.home) ?? MAT_STOPS[0];
const countries = new Set(BJJ.gyms.map((g) => g.country).filter(Boolean)).size;

// Great-circle distance, rounded - "how far from the home mat".
const kmFromHome = ({ coords: [lon2, lat2] }: MatStop) => {
  const [lon1, lat1] = home.coords;
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return Math.round((2 * 6371 * Math.asin(Math.sqrt(a))) / 10) * 10;
};

/**
 * The mat passport as a place: a globe with every city I have trained in,
 * touring through them on its own until the visitor takes over (click a
 * city or drag the globe).
 */
const MatAtlas = () => {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const [active, setActive] = useState(0);
  const [touring, setTouring] = useState(true);
  const stop = MAT_STOPS[active];
  const autoplay = touring && inView && !reduceMotion;

  useEffect(() => {
    if (!autoplay) return;
    const timer = setTimeout(
      () => setActive((i) => (i + 1) % MAT_STOPS.length),
      stop.photos ? TOUR_MS_PHOTOS : TOUR_MS,
    );
    return () => clearTimeout(timer);
  }, [autoplay, active, stop.photos]);

  const select = (i: number) => {
    setTouring(false);
    setActive(i);
  };

  return (
    <div ref={ref} className="mt-14">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-lg font-semibold text-foreground">Mat passport</h3>
        <p className="text-sm text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
          {BJJ.gyms.length} gyms in {countries} countries · drag the globe or pick a city
        </p>
      </div>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        <div className="relative mx-auto w-full max-w-[520px] lg:sticky lg:top-20">
          <Suspense
            fallback={<div className="mx-auto aspect-square w-[90%] rounded-full bg-card/60" aria-hidden="true" />}
          >
            <GymGlobe stops={MAT_STOPS} active={active} running={inView} onDrag={() => setTouring(false)} />
          </Suspense>
        </div>

        <div>
          <ol className="divide-y divide-border/60 border-y border-border/60">
            {MAT_STOPS.map((s, i) => {
              const on = i === active;
              return (
                <li key={s.city} className="relative">
                  <button
                    type="button"
                    onClick={() => select(i)}
                    aria-pressed={on}
                    className="group flex w-full items-baseline gap-4 py-3.5 text-left"
                  >
                    <span className="w-6 text-sm text-muted-foreground/60" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`flex-1 text-lg font-semibold tracking-tight transition-colors ${
                        on ? "text-clash-gold" : "text-foreground/80 group-hover:text-foreground"
                      }`}
                    >
                      {s.city}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">{s.country}</span>
                    </span>
                    <span className="text-sm text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {s.home ? "home" : `${kmFromHome(s).toLocaleString("en-US")} km`}
                    </span>
                  </button>
                  {on && autoplay && (
                    <motion.span
                      key={`tour-${active}`}
                      aria-hidden="true"
                      className="absolute bottom-[-1px] left-0 h-px w-full origin-left bg-clash-gold"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: (s.photos ? TOUR_MS_PHOTOS : TOUR_MS) / 1000, ease: "linear" }}
                    />
                  )}
                </li>
              );
            })}
          </ol>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={stop.city}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mt-6"
              aria-live="polite"
            >
              <p className="text-sm text-muted-foreground">
                {stop.home ? "Home gym" : stop.gyms.length > 1 ? `${stop.gyms.length} gyms` : "Gym"} in {stop.city}
              </p>
              <ul className="mt-3 flex flex-wrap gap-3">
                {stop.gyms.map((gym, i) => (
                  <motion.li
                    key={gym}
                    initial={reduceMotion ? false : { opacity: 0, scale: 1.3, rotate: 0 }}
                    animate={{ opacity: 1, scale: 1, rotate: reduceMotion ? 0 : i % 2 ? 2 : -2 }}
                    transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.15 + i * 0.1, ease: [0.3, 1.4, 0.5, 1] }}
                    className={`rounded-lg border-2 border-dashed px-4 py-2 text-sm font-medium ${
                      stop.home ? "border-clash-gold/80 text-clash-gold" : "border-muted-foreground/35 text-foreground"
                    }`}
                  >
                    {gym}
                  </motion.li>
                ))}
              </ul>

              {stop.photos && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {stop.photos.map((photo) => (
                    <figure key={photo.src}>
                      <div className="aspect-[3/4] overflow-hidden rounded-xl border border-border/60 bg-card">
                        <img
                          src={photo.src}
                          alt={photo.alt}
                          loading="lazy"
                          decoding="async"
                          width={1200}
                          height={1600}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <figcaption className="mt-2 text-xs text-muted-foreground">
                        {photo.gym}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MatAtlas;
