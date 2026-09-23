import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ENERGY_COLORS, fmtLongDate, fmtMonth, fmtNumber, type EnergyDashboard } from "@/lib/energy";

const axisTick = { fill: "hsl(var(--muted-foreground))", fontSize: 12 };
const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 6,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

export const RenewablesScatter = ({ daily }: { daily: EnergyDashboard["daily"] }) => {
  const data = daily
    .filter((d) => d.re_share !== null)
    .map((d) => ({ date: d.date, share: (d.re_share as number) * 100, price: d.avg_price }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 8, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="share"
            domain={[0, "auto"]}
            tick={axisTick}
            tickFormatter={(v) => `${fmtNumber(v, 0)} %`}
            label={{ value: "Wind- und Solaranteil am Verbrauch", position: "insideBottom", offset: -12, ...axisTick }}
          />
          <YAxis
            type="number"
            dataKey="price"
            tick={axisTick}
            width={48}
            tickFormatter={(v) => fmtNumber(v, 0)}
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--border))" }}
            contentStyle={tooltipStyle}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof data)[number];
              return (
                <div style={tooltipStyle} className="px-2.5 py-1.5">
                  <div className="font-medium">{fmtLongDate(p.date)}</div>
                  <div className="text-muted-foreground">
                    Ø {fmtNumber(p.price, 1)} €/MWh bei {fmtNumber(p.share, 0)} % Wind und Solar
                  </div>
                </div>
              );
            }}
          />
          <Scatter data={data} fill={ENERGY_COLORS.cheap} fillOpacity={0.7} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MonthlyChart = ({ monthly }: { monthly: EnergyDashboard["monthly"] }) => {
  const data = monthly.map((m) => ({ ...m, label: fmtMonth(m.month) }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} interval={2} tickLine={false} />
          <YAxis yAxisId="neg" tick={axisTick} width={40} allowDecimals={false} />
          <YAxis
            yAxisId="price"
            orientation="right"
            tick={axisTick}
            width={40}
            tickFormatter={(v) => fmtNumber(v, 0)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
            formatter={(value: number, name: string) =>
              name === "neg_hours"
                ? [`${fmtNumber(value, 0)} Stunden`, "Negative Preise"]
                : [`${fmtNumber(value, 1)} €/MWh`, "Durchschnittspreis"]
            }
          />
          <Bar yAxisId="neg" dataKey="neg_hours" fill={ENERGY_COLORS.negative} fillOpacity={0.8} radius={[2, 2, 0, 0]} isAnimationActive={false} />
          <Line
            yAxisId="price"
            dataKey="avg_price"
            stroke="hsl(var(--foreground))"
            strokeOpacity={0.75}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
