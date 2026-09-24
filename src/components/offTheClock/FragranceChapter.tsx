import { useMemo } from "react";
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

      <figure className="mt-10">
        <div className="inline-grid grid-cols-[2.5rem_repeat(5,1.75rem)] gap-1.5 sm:grid-cols-[2.5rem_repeat(5,2rem)]">
          {WEEKDAYS.map((label, d) => (
            <div key={label} className="contents">
              <span className="flex items-center text-xs text-muted-foreground">{label}</span>
              {weeks.map((week) => {
                const cell = week[d];
                const f = cell.id !== null ? names.get(cell.id) : undefined;
                return (
                  <span
                    key={cell.date}
                    title={f ? `${fmtShortDate(cell.date)}: ${f.name}` : fmtShortDate(cell.date)}
                    className={`aspect-square rounded-[4px] ${
                      cell.future ? "border border-dashed border-border/60" : f ? "" : "bg-secondary/50"
                    } ${cell.date === data.today ? "ring-1 ring-foreground/60 ring-offset-2 ring-offset-background" : ""}`}
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
              <li key={f.id} className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: fragranceColor(f.id) }} />
                <span className="text-foreground">{f.name}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{f.worn_recent}×</span>
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
