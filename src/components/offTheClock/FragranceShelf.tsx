import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { colorOf, fmtShortDate, OTHER_COLOR, type Fragrance } from "@/lib/fragrance";

type Sort = "worn" | "house";

// Flakon shapes by what's inside: attar bottles for oils, small squat ones
// for extraits, everything else a classic spray bottle in three builds.
type Shape = "oil" | "extrait" | "spray";
const shapeOf = (f: Fragrance): Shape => {
  const c = (f.concentration ?? "").toLowerCase();
  if (c.includes("oil") || c.includes("concentrated")) return "oil";
  if (c.includes("extrait")) return "extrait";
  return "spray";
};

const GLASS = "hsl(220 20% 70% / 0.07)";
const GLASS_EDGE = "hsl(220 14% 58% / 0.55)";
const CAP = "hsl(220 12% 26%)";
const CAP_EDGE = "hsl(220 12% 42%)";
const IDLE_LIQUID = "hsl(38 18% 52%)";

/** One bottle, drawn in a 28x56 box standing on its baseline. */
const Bottle = ({ f, liquid }: { f: Fragrance; liquid: string }) => {
  const shape = shapeOf(f);
  // Body: [x, width, height]; liquid fills the lower 72 %.
  let body: [number, number, number];
  let top: JSX.Element;
  if (shape === "oil") {
    body = [8, 12, 20];
    top = (
      <>
        <rect x={12} y={30} width={4} height={6} fill={GLASS} stroke={GLASS_EDGE} strokeWidth={0.8} />
        <rect x={12.5} y={12} width={3} height={18} rx={1.5} fill={CAP} stroke={CAP_EDGE} strokeWidth={0.8} />
        <circle cx={14} cy={10} r={2.6} fill={CAP} stroke={CAP_EDGE} strokeWidth={0.8} />
      </>
    );
  } else if (shape === "extrait") {
    body = [5, 18, 19];
    top = (
      <>
        <rect x={11} y={34} width={6} height={3} fill={GLASS} stroke={GLASS_EDGE} strokeWidth={0.8} />
        <rect x={8} y={25} width={12} height={9} rx={1.5} fill={CAP} stroke={CAP_EDGE} strokeWidth={0.8} />
      </>
    );
  } else {
    const build = f.id % 3;
    body = build === 0 ? [5, 18, 30] : build === 1 ? [6, 16, 34] : [4, 20, 27];
    const neckY = 56 - body[2] - 3;
    top = (
      <>
        <rect x={11.5} y={neckY} width={5} height={3} fill={GLASS} stroke={GLASS_EDGE} strokeWidth={0.8} />
        {build === 2 ? (
          <circle cx={14} cy={neckY - 5} r={5} fill={CAP} stroke={CAP_EDGE} strokeWidth={0.8} />
        ) : (
          <rect
            x={build === 0 ? 9 : 10}
            y={neckY - 9}
            width={build === 0 ? 10 : 8}
            height={9}
            rx={1.5}
            fill={CAP}
            stroke={CAP_EDGE}
            strokeWidth={0.8}
          />
        )}
      </>
    );
  }
  const [bx, bw, bh] = body;
  const by = 56 - bh;
  const lh = bh * 0.72;
  const rx = shape === "oil" ? 5 : 2.5;

  return (
    <svg viewBox="0 0 28 56" width={30} height={60} className="overflow-visible" aria-hidden="true">
      {top}
      <rect x={bx} y={by} width={bw} height={bh} rx={rx} fill={GLASS} stroke={GLASS_EDGE} strokeWidth={0.9} />
      <rect x={bx + 1.5} y={56 - 1.5 - lh} width={bw - 3} height={lh} rx={Math.max(rx - 1.5, 1)} fill={liquid} />
      {/* Glass highlight */}
      <rect x={bx + 2.5} y={by + 3} width={1.2} height={bh - 8} rx={0.6} fill="#fff" opacity={0.28} />
    </svg>
  );
};

/**
 * The whole collection as a shelf: one flakon per fragrance, shaped by its
 * concentration. The four most-worn of the last five weeks carry their
 * calendar colour; bottles never worn since logging started stand back.
 * Hovering or tapping a bottle lights up its days in the calendar.
 */
const FragranceShelf = ({
  collection,
  colors,
  focus,
  onFocus,
}: {
  collection: Fragrance[];
  colors: Map<number, string>;
  focus: number | null;
  onFocus: (id: number | null) => void;
}) => {
  const reduceMotion = useReducedMotion();
  const [sort, setSort] = useState<Sort>("worn");

  const bottles = useMemo(() => {
    const byHouse = (a: Fragrance, b: Fragrance) =>
      (a.house ?? "").localeCompare(b.house ?? "") || a.name.localeCompare(b.name);
    return [...collection].sort((a, b) =>
      sort === "house"
        ? byHouse(a, b)
        : b.worn_total - a.worn_total || (b.last_worn ?? "").localeCompare(a.last_worn ?? "") || byHouse(a, b),
    );
  }, [collection, sort]);

  const wornEver = collection.filter((f) => f.worn_total > 0).length;
  const focused = focus !== null ? collection.find((f) => f.id === focus) : undefined;

  return (
    <div className="mt-14">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">The shelf</h3>
          <p className="text-sm text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
            {collection.length} bottles, {wornEver} worn since I started logging
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border/60 p-0.5 text-sm" role="group" aria-label="Sort the shelf">
          {(
            [
              ["worn", "Most worn"],
              ["house", "By house"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              className={`rounded-md px-3 py-1 transition-colors ${
                sort === key ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul
        className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(34px,1fr))]"
        style={{
          gridAutoRows: 76,
          // A board under every row of bottles.
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0 72px, hsl(220 15% 24%) 72px 74px, transparent 74px 76px)",
        }}
        onPointerLeave={() => onFocus(null)}
      >
        {bottles.map((f, i) => {
          const colored = colors.has(f.id);
          const liquid = colored ? colorOf(colors, f.id) : f.worn_total > 0 ? OTHER_COLOR : IDLE_LIQUID;
          const dimmed = focus !== null && focus !== f.id;
          return (
            <motion.li
              key={f.id}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: reduceMotion ? 0 : Math.min(i * 0.012, 0.6) }}
              className="flex items-end justify-center pb-[4px]"
            >
              <button
                type="button"
                aria-label={`${f.name}${f.house ? `, ${f.house}` : ""}${
                  f.worn_total ? `, worn ${f.worn_total} times` : ", not worn yet"
                }`}
                aria-pressed={focus === f.id}
                onPointerEnter={() => onFocus(f.id)}
                onFocus={() => onFocus(f.id)}
                onClick={() => onFocus(focus === f.id ? null : f.id)}
                className={`origin-bottom rounded-sm transition-[transform,opacity] duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 ${
                  dimmed ? "opacity-30" : f.worn_total > 0 || focus === f.id ? "opacity-100" : "opacity-[0.55]"
                } ${focus === f.id ? "-translate-y-1" : ""}`}
              >
                <Bottle f={f} liquid={liquid} />
              </button>
            </motion.li>
          );
        })}
      </ul>

      <p className="mt-4 min-h-[2.5rem] text-sm text-muted-foreground" aria-live="polite">
        {focused ? (
          <>
            <span className="font-medium text-foreground">{focused.name}</span>
            {focused.house && <> · {focused.house}</>}
            {focused.concentration && <> · {focused.concentration}</>}
            <br />
            {focused.worn_total > 0
              ? `Worn ${focused.worn_total}×, last on ${fmtShortDate(focused.last_worn ?? "")}`
              : "Not worn since I started logging."}
          </>
        ) : (
          "Oils stand in attar bottles, extraits in small ones. Hover or tap a bottle."
        )}
      </p>
    </div>
  );
};

export default FragranceShelf;
