import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { COFFEE } from "@/data/offTheClock";

const GOLD = "#F5C542";
const EASE = [0.16, 1, 0.3, 1] as const;

type Leg = { place: string; detail: string; coords: [number, number] };

// Grown -> roasted -> in the cup. The route of the bag in the grinder.
const LEGS: Leg[] = [
  { place: "Blue Mountains", detail: `Grown, ${COFFEE.origin}`, coords: [-76.58, 18.05] },
  { place: "Prishtina", detail: `Roasted by ${COFFEE.roaster}`, coords: [21.1655, 42.6629] },
  { place: "Oldenburg", detail: `Pulled as ${COFFEE.method.toLowerCase()}`, coords: [8.2146, 53.1435] },
];

const km = ([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]) => {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
};

const round = (n: number) => (Math.round(n / 100) * 100).toLocaleString("en-US");

const legs = LEGS.slice(1).map((leg, i) => km(LEGS[i].coords, leg.coords));
const total = legs.reduce((a, b) => a + b, 0);

// Stations sit where the distance puts them, so the long crossing looks
// long - but never closer than MIN_GAP, or the last two labels collide.
const MIN_GAP = 0.3;
const split = Math.min(legs[0] / total, 1 - MIN_GAP);
const X = [0, split, 1];

const W = 1000;
const PAD = 24;
const Y = 70;
const xAt = (f: number) => PAD + f * (W - 2 * PAD);
const arc = (a: number, b: number) => {
  const x1 = xAt(a);
  const x2 = xAt(b);
  const lift = Math.min(60, (x2 - x1) * 0.18);
  return `M ${x1} ${Y} Q ${(x1 + x2) / 2} ${Y - lift * 2} ${x2} ${Y}`;
};

/**
 * The bag in the grinder, as a route: from the Blue Mountains to a roaster
 * in Prishtina to my espresso machine. Distances are great-circle, rounded.
 */
const CoffeeJourney = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const show = inView || reduceMotion;

  return (
    <div ref={ref} className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-lg font-semibold text-foreground">Bean miles</h3>
        <p className="text-sm text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
          about {round(total)} km from the tree to the cup
        </p>
      </div>

      <div className="relative mt-6">
        <svg viewBox={`0 -40 ${W} 140`} className="h-auto w-full overflow-visible" aria-hidden="true">
          {LEGS.slice(1).map((_, i) => {
            const d = arc(X[i], X[i + 1]);
            return (
              <g key={i}>
                <path d={d} fill="none" stroke="hsl(220 15% 26%)" strokeWidth={1.5} strokeDasharray="3 6" />
                <motion.path
                  d={d}
                  fill="none"
                  stroke={GOLD}
                  strokeWidth={2}
                  strokeLinecap="round"
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={show ? { pathLength: 1 } : undefined}
                  transition={{ duration: i === 0 ? 1.6 : 0.8, delay: i === 0 ? 0.2 : 1.8, ease: EASE }}
                />
                {!reduceMotion && show && (
                  // A bean rides each leg once the line has been drawn.
                  <motion.ellipse
                    rx={5}
                    ry={3.5}
                    fill={GOLD}
                    style={{ offsetPath: `path("${d}")`, offsetRotate: "auto" }}
                    initial={{ offsetDistance: "0%", opacity: 0 }}
                    animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
                    transition={{
                      duration: i === 0 ? 3.2 : 1.6,
                      delay: 2.8 + i * 3.6,
                      repeat: Infinity,
                      repeatDelay: i === 0 ? 4 : 5.6,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </g>
            );
          })}
          {X.map((f, i) => (
            <motion.circle
              key={i}
              cx={xAt(f)}
              cy={Y}
              r={i === X.length - 1 ? 7 : 5}
              fill={i === X.length - 1 ? GOLD : "hsl(220 25% 8%)"}
              stroke={GOLD}
              strokeWidth={2}
              initial={reduceMotion ? false : { scale: 0 }}
              animate={show ? { scale: 1 } : undefined}
              transition={{ duration: 0.4, delay: [0, 1.7, 2.5][i], ease: [0.3, 1.4, 0.5, 1] }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          ))}
        </svg>

        {/* Distances over each leg */}
        {legs.map((d, i) => (
          <p
            key={i}
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground"
            style={{ left: `${((xAt((X[i] + X[i + 1]) / 2) / W) * 100).toFixed(2)}%`, fontVariantNumeric: "tabular-nums" }}
          >
            {round(d)} km
          </p>
        ))}

        {/* Wide screens: each label under its station. Narrow: a list. */}
        <ol className="mt-4 space-y-2 text-sm sm:relative sm:mt-2 sm:h-12 sm:space-y-0">
          {LEGS.map((leg, i) => (
            <li
              key={leg.place}
              className={`flex gap-2 sm:absolute sm:top-0 sm:block sm:whitespace-nowrap ${
                i === 0 ? "" : i === LEGS.length - 1 ? "sm:-translate-x-full sm:text-right" : "sm:-translate-x-1/2 sm:text-center"
              }`}
              style={{ left: `${((xAt(X[i]) / W) * 100).toFixed(2)}%` }}
            >
              <span className="font-medium text-foreground sm:block">{leg.place}</span>
              <span className="text-muted-foreground sm:block">{leg.detail}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default CoffeeJourney;
