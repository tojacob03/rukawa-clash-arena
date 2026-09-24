import { useMemo, useState } from "react";
import { colorOf, fmtShortDate, type Fragrance, type FragranceStatus } from "@/lib/fragrance";

const MAX_ROWS = 6; // past that, the rest folds into one "Other" row
const ENOUGH_DAYS = 14; // before this, the chart says it is still collecting
const RAIN_MM = 1;

type Day = { date: string; id: number; temp: number; rain: boolean };
type Row = { key: string; label: string; ids: number[]; color: string; days: Day[]; median: number };

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const fmtTemp = (t: number) => `${t.toFixed(1).replace(/\.0$/, "")} °C`;

/**
 * "Does the weather decide?" - every logged day as a dot at that day's mean
 * temperature, one row per fragrance. Hollow dots were rainy days. A tick
 * marks each row's median. Needs a few weeks before it says anything.
 */
const FragranceWeather = ({
  status,
  colors,
  focus,
  onFocus,
}: {
  status: FragranceStatus;
  colors: Map<number, string>;
  focus: number | null;
  onFocus: (id: number | null) => void;
}) => {
  const [hover, setHover] = useState<{ day: Day; row: number } | null>(null);
  const names = useMemo(() => new Map(status.collection.map((f) => [f.id, f] as [number, Fragrance])), [status]);

  const { rows, domain, days } = useMemo(() => {
    const days: Day[] = (status.weather ?? []).map(([date, id, temp, rain]) => ({
      date,
      id,
      temp: Number(temp),
      rain: (rain ?? 0) >= RAIN_MM,
    }));
    const byId = new Map<number, Day[]>();
    days.forEach((d) => byId.set(d.id, [...(byId.get(d.id) ?? []), d]));
    const ranked = [...byId.entries()].sort(([, a], [, b]) => b.length - a.length);
    const shown = ranked.length > MAX_ROWS ? ranked.slice(0, MAX_ROWS - 1) : ranked;
    const rest = ranked.slice(shown.length);

    const rows: Row[] = shown.map(([id, ds]) => ({
      key: String(id),
      label: names.get(id)?.name ?? "Unknown",
      ids: [id],
      color: colorOf(colors, id),
      days: ds,
      median: median(ds.map((d) => d.temp)),
    }));
    if (rest.length) {
      const ds = rest.flatMap(([, d]) => d);
      rows.push({
        key: "other",
        label: `${rest.length} others`,
        ids: rest.map(([id]) => id),
        color: colorOf(colors, -1),
        days: ds,
        median: median(ds.map((d) => d.temp)),
      });
    }

    // Axis in whole 5 °C steps, at least 15 °C wide so a few days don't
    // look like a trend.
    const temps = days.map((d) => d.temp);
    let lo = Math.floor((Math.min(...temps) - 1) / 5) * 5;
    let hi = Math.ceil((Math.max(...temps) + 1) / 5) * 5;
    while (hi - lo < 15) {
      lo -= 5;
      if (hi - lo < 15) hi += 5;
    }
    return { rows, domain: [lo, hi] as const, days };
  }, [status, names, colors]);

  if (!days.length) return null;

  const x = (t: number) => ((t - domain[0]) / (domain[1] - domain[0])) * 100;
  const ticks = Array.from({ length: (domain[1] - domain[0]) / 5 + 1 }, (_, i) => domain[0] + i * 5);

  // One sentence, only once there is something to say.
  const qualified = rows.filter((r) => r.key !== "other" && r.days.length >= 3);
  let finding: string;
  if (days.length < ENOUGH_DAYS) {
    finding = `Still collecting: ${days.length} ${days.length === 1 ? "day" : "days"} so far. Give it a few weeks before reading anything into it.`;
  } else if (qualified.length >= 2) {
    const warm = qualified.reduce((a, b) => (b.median > a.median ? b : a));
    const cold = qualified.reduce((a, b) => (b.median < a.median ? b : a));
    finding = `${warm.label} comes out on the warmest days (median ${fmtTemp(warm.median)}), ${cold.label} on the coldest (${fmtTemp(cold.median)}).`;
  } else {
    finding = "Mostly one scent so far, so no pattern yet.";
  }

  return (
    <figure className="mt-14">
      <h3 className="text-lg font-semibold text-foreground">Does the weather decide?</h3>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Every logged day at that day&apos;s mean temperature in {status.weather_place ?? "Oldenburg"}. Hollow dots were
        rainy days, the tick is the median.
      </p>

      <div className="relative mt-6 max-w-3xl" onPointerLeave={() => setHover(null)}>
        {/* Recessive grid */}
        <div className="pointer-events-none absolute inset-y-0 left-[7.5rem] right-2 sm:left-[10rem]" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="absolute inset-y-0 w-px bg-border/40" style={{ left: `${x(t)}%` }} />
          ))}
        </div>

        <ul className="relative space-y-1" onPointerLeave={() => onFocus(null)}>
          {rows.map((row, r) => {
            const dimmed = focus !== null && !row.ids.includes(focus);
            return (
              <li
                key={row.key}
                className={`grid grid-cols-[7.5rem_1fr] items-center transition-opacity sm:grid-cols-[10rem_1fr] ${
                  dimmed ? "opacity-30" : ""
                }`}
                onPointerEnter={() => onFocus(row.ids.length === 1 ? row.ids[0] : null)}
              >
                <span className="truncate pr-3 text-sm text-foreground" title={row.label}>
                  {row.label}
                  <span className="ml-1.5 text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {row.days.length}
                  </span>
                </span>
                <span className="relative mr-2 h-8">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-border/70" />
                  <span
                    className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/70"
                    style={{ left: `${x(row.median)}%` }}
                    title={`Median ${fmtTemp(row.median)}`}
                  />
                  {row.days.map((d) => (
                    <span
                      key={d.date}
                      onPointerEnter={() => setHover({ day: d, row: r })}
                      className="absolute top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center"
                      style={{ left: `${x(d.temp)}%` }}
                    >
                      <span
                        className="block h-2.5 w-2.5 rounded-full"
                        style={{
                          // 2px ring in the surface colour keeps overlapping dots apart.
                          boxShadow: "0 0 0 2px hsl(var(--background))",
                          background: d.rain ? "hsl(var(--background))" : row.color,
                          border: `2px solid ${row.color}`,
                        }}
                      />
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Axis */}
        <div className="relative mt-2 grid grid-cols-[7.5rem_1fr] sm:grid-cols-[10rem_1fr]">
          <span />
          <span className="relative mr-2 h-5 text-xs text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
            {ticks.map((t) => (
              <span key={t} className="absolute -translate-x-1/2" style={{ left: `${x(t)}%` }}>
                {t}°
              </span>
            ))}
          </span>
        </div>

        {hover && (
          // Same box as the tracks, so x() positions it directly. Rows are
          // h-8 plus space-y-1: 36px apart.
          <div className="pointer-events-none absolute left-[7.5rem] right-2 top-0 sm:left-[10rem]">
            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border/60 bg-popover px-3 py-2 text-xs shadow-card"
              style={{ left: `${x(hover.day.temp)}%`, top: hover.row * 36 + 2 }}
            >
              <span className="block font-medium text-foreground">{names.get(hover.day.id)?.name}</span>
              <span className="block text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                {fmtShortDate(hover.day.date)} · {fmtTemp(hover.day.temp)}
                {hover.day.rain ? " · rain" : ""}
              </span>
            </div>
          </div>
        )}
      </div>

      <figcaption className="mt-4 max-w-2xl text-sm text-muted-foreground">{finding}</figcaption>

      {/* sr-only on the wrapper: a <table> itself ignores the 1px box. */}
      <div className="sr-only">
        <table>
          <caption>Fragrance by daily mean temperature</caption>
          <thead>
            <tr>
              <th>Fragrance</th>
              <th>Days</th>
              <th>Median temperature</th>
              <th>Coldest</th>
              <th>Warmest</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{row.label}</td>
                <td>{row.days.length}</td>
                <td>{fmtTemp(row.median)}</td>
                <td>{fmtTemp(Math.min(...row.days.map((d) => d.temp)))}</td>
                <td>{fmtTemp(Math.max(...row.days.map((d) => d.temp)))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
};

export default FragranceWeather;
