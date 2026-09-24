import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  addDays,
  fmtShortDate,
  fmtWeekday,
  fragranceColor,
  isoWeekday,
  useFragranceStatus,
  type FragranceStatus,
} from "@/lib/fragrance";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Five calendar weeks (Mon-Sun) ending with the current week. */
const buildWeeks = (status: FragranceStatus) => {
  const byDate = new Map(status.recent.map(([date, id]) => [date, id]));
  const lastSunday = addDays(status.today, 7 - isoWeekday(status.today));
  const start = addDays(lastSunday, -34);
  return Array.from({ length: 5 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(start, w * 7 + d);
      return { date, id: byDate.get(date) ?? null, future: date > status.today };
    }),
  );
};

/** Variety in the window: distinct scents, and the longest run of one. */
const rotationStats = (status: FragranceStatus) => {
  const days = [...status.recent].sort(([a], [b]) => a.localeCompare(b));
  let longest = { id: 0, days: 0 };
  let run = 0;
  days.forEach(([date, id], i) => {
    const prev = days[i - 1];
    run = prev && prev[1] === id && addDays(prev[0], 1) === date ? run + 1 : 1;
    if (run > longest.days) longest = { id, days: run };
  });
  return { distinct: new Set(days.map(([, id]) => id)).size, logged: days.length, longest };
};

const Stat = ({ value, label }: { value: string | number; label: string }) => (
  <div>
    <dd className="text-2xl font-semibold tracking-tight text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
      {value}
    </dd>
    <dt className="mt-1 text-sm text-muted-foreground">{label}</dt>
  </div>
);

const Intro = () => (
  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
    No fixed rotation. What goes on in the morning changes with the mood, the weather and the day ahead, and I log it
    with one tap.
  </p>
);

const FragranceChapter = () => {
  const { data, isLoading } = useFragranceStatus();
  const weeks = useMemo(() => (data ? buildWeeks(data) : []), [data]);
  const names = useMemo(() => new Map(data?.collection.map((f) => [f.id, f]) ?? []), [data]);
  const stats = useMemo(() => (data ? rotationStats(data) : null), [data]);
  // Hovering a day or a name lights up every day that scent was worn.
  const [focus, setFocus] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  if (isLoading) {
    return <div className="h-40 max-w-2xl animate-pulse rounded-xl bg-muted motion-reduce:animate-none" aria-busy="true" />;
  }

  // Nothing logged yet (or the request failed): still a complete chapter.
  if (!data || !data.latest) {
    return (
      <>
        <h2 className="text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl">
          A different one every morning.
        </h2>
        <Intro />
      </>
    );
  }

  const wornToday = data.latest.worn_on === data.today;
  const worn = data.collection.filter((f) => f.worn_recent > 0);
  const top = worn[0];

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {wornToday ? "Today" : `Last worn on ${fmtWeekday(data.latest.worn_on)}`}
      </p>
      <h2 className="mt-2 text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl">
        {data.latest.name}
      </h2>
      {data.latest.house && <p className="mt-2 text-lg text-clash-gold">{data.latest.house}</p>}
      <Intro />

      {stats && stats.logged > 1 && (
        <dl className="mt-10 grid max-w-xl grid-cols-3 gap-6 border-t border-border/60 pt-6">
          <Stat value={stats.distinct} label="different scents" />
          <Stat value={stats.logged} label="days logged" />
          <Stat
            value={stats.longest.days > 1 ? `${stats.longest.days} days` : "never"}
            label={stats.longest.days > 1 ? `longest streak, ${names.get(stats.longest.id)?.name}` : "the same one twice in a row"}
          />
        </dl>
      )}

      <figure className="mt-10" onPointerLeave={() => setFocus(null)}>
        <div className="inline-grid grid-cols-[2.5rem_repeat(5,1.75rem)] gap-1.5 sm:grid-cols-[2.5rem_repeat(5,2rem)]">
          {WEEKDAYS.map((label, d) => (
            <div key={label} className="contents">
              <span className="flex items-center text-xs text-muted-foreground">{label}</span>
              {weeks.map((week, w) => {
                const cell = week[d];
                const f = cell.id !== null ? names.get(cell.id) : undefined;
                const dimmed = focus !== null && cell.id !== focus;
                return (
                  <motion.span
                    key={cell.date}
                    title={f ? `${fmtShortDate(cell.date)}: ${f.name}` : fmtShortDate(cell.date)}
                    onPointerEnter={() => setFocus(f ? f.id : null)}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.4 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    // Fills in day by day, oldest first.
                    transition={{ duration: 0.3, delay: reduceMotion ? 0 : (w * 7 + d) * 0.018 }}
                    className={`aspect-square rounded-[4px] transition-[filter,opacity] duration-200 ${
                      cell.future ? "border border-dashed border-border/60" : f ? "" : "bg-secondary/50"
                    } ${cell.date === data.today ? "ring-1 ring-foreground/60 ring-offset-2 ring-offset-background" : ""} ${
                      dimmed ? "!opacity-20" : ""
                    } ${focus !== null && !dimmed ? "brightness-110" : ""}`}
                    style={f ? { background: fragranceColor(f.id) } : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <figcaption className="mt-5 max-w-2xl space-y-3 text-sm text-muted-foreground">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {worn.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onPointerEnter={() => setFocus(f.id)}
                  onFocus={() => setFocus(f.id)}
                  onBlur={() => setFocus(null)}
                  onClick={() => setFocus((cur) => (cur === f.id ? null : f.id))}
                  aria-pressed={focus === f.id}
                  className={`inline-flex items-center gap-2 rounded-sm transition-opacity ${
                    focus !== null && focus !== f.id ? "opacity-40" : ""
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: fragranceColor(f.id) }} />
                  <span className="text-foreground">{f.name}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{f.worn_recent}×</span>
                </button>
              </li>
            ))}
          </ul>
          <p>
            The last five weeks, one square per day.
            {top && top.worn_recent > 1 ? ` Most worn: ${top.name}, ${top.worn_recent} days.` : ""}
          </p>
        </figcaption>
      </figure>
    </>
  );
};

export default FragranceChapter;
