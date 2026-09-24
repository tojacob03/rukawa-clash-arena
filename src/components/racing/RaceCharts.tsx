import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  COMPOUND_ORDER,
  compoundColor,
  compoundLabel,
  fmtSec,
  fmtSigned,
  teamColor,
  type RaceDriver,
  type RacePayload,
  type SeasonPayload,
} from "@/lib/racing";

const axisTick = { fill: "hsl(var(--muted-foreground))", fontSize: 12 };
const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 6,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

/** Lap time relative to each driver's own median, by tyre age, one line per compound. */
export const TyreCurveChart = ({ curve }: { curve: RacePayload["tyre_curve"] }) => {
  const compounds = COMPOUND_ORDER.filter((c) => curve[c]?.length);
  const ages = new Set<number>();
  compounds.forEach((c) => curve[c].forEach(([age]) => ages.add(age)));
  const data = [...ages]
    .sort((a, b) => a - b)
    .map((age) => {
      const row: Record<string, number> = { age };
      compounds.forEach((c) => {
        const p = curve[c].find(([a]) => a === age);
        if (p) row[c] = p[1];
      });
      return row;
    });

  if (!compounds.length) return <p className="text-sm text-muted-foreground">Not enough clean laps in this race.</p>;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" />
          <XAxis
            dataKey="age"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={axisTick}
            label={{ value: "Tyre age (laps)", position: "insideBottom", offset: -12, ...axisTick }}
          />
          <YAxis tick={axisTick} width={48} tickFormatter={(v) => fmtSigned(v, 2)} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(age) => `Tyre age ${age} laps`}
            formatter={(value: number, name: string) => [`${fmtSigned(value, 2)} s`, compoundLabel(name)]}
          />
          {compounds.map((c) => (
            <Line
              key={c}
              dataKey={c}
              stroke={compoundColor(c)}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Horizontal bars: median race pace gap to the quickest driver. */
export const PaceBars = ({ drivers }: { drivers: RaceDriver[] }) => {
  const rows = drivers
    .filter((d) => d.pace_delta !== null)
    .sort((a, b) => (a.pace_delta as number) - (b.pace_delta as number));
  const max = Math.max(0.5, ...rows.map((d) => d.pace_delta as number));

  return (
    <ol className="space-y-1.5" style={{ fontVariantNumeric: "tabular-nums" }}>
      {rows.map((d) => (
        <li key={d.number} className="grid grid-cols-[3rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm">
          <span className="font-medium text-foreground">{d.code}</span>
          <span className="h-3 rounded-sm bg-secondary/60">
            <span
              className="block h-full rounded-sm"
              style={{
                width: `${Math.max(1.5, ((d.pace_delta as number) / max) * 100)}%`,
                background: teamColor(d.colour),
              }}
            />
          </span>
          <span className="text-right text-muted-foreground">
            {d.pace_delta === 0 ? "fastest" : `${fmtSigned(d.pace_delta as number, 3)} s`}
          </span>
        </li>
      ))}
    </ol>
  );
};

/** Median stationary pit stop time per team (season). */
export const PitCrewBars = ({ crews }: { crews: SeasonPayload["pit_crews"] }) => {
  if (!crews.length) return <p className="text-sm text-muted-foreground">Stationary pit stop times are not available for this season.</p>;
  const max = Math.max(...crews.map((c) => c.median_stop));
  const min = Math.min(...crews.map((c) => c.median_stop));
  const floor = Math.max(0, min - 0.6);

  return (
    <ol className="space-y-1.5" style={{ fontVariantNumeric: "tabular-nums" }}>
      {crews.map((c) => (
        <li key={c.team} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_7.5rem] items-center gap-3 text-sm">
          <span className="truncate text-foreground">{c.team}</span>
          <span className="h-3 rounded-sm bg-secondary/60">
            <span
              className="block h-full rounded-sm"
              style={{
                width: `${Math.max(3, ((c.median_stop - floor) / (max - floor)) * 100)}%`,
                background: teamColor(c.colour),
              }}
            />
          </span>
          <span className="text-right text-muted-foreground">
            {fmtSec(c.median_stop)} s <span className="text-muted-foreground/60">(best {c.best_stop.toFixed(1)})</span>
          </span>
        </li>
      ))}
    </ol>
  );
};

/** Average number of pit stops per finisher, race by race. */
export const StopsChart = ({ rows }: { rows: SeasonPayload["stops_per_race"] }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="circuit" tick={{ ...axisTick, fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={70} />
        <YAxis tick={axisTick} width={32} allowDecimals />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "hsl(var(--secondary))", opacity: 0.4 }}
          formatter={(v: number) => [`${fmtSec(v)} stops`, "Average per finisher"]}
        />
        <Bar dataKey="avg_stops" fill="hsl(45 100% 60%)" fillOpacity={0.85} radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
