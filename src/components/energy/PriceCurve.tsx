import { useEffect, useMemo, useRef, useState } from "react";
import {
  ENERGY_COLORS,
  berlinHour,
  berlinMinute,
  fmtNumber,
  fmtTime,
  priceColor,
  toCentPerKwh,
  type PricePoint,
  type PriceWindow,
} from "@/lib/energy";

type PriceCurveProps = {
  points: PricePoint[];
  window: PriceWindow | null;
  /** Quarter hours before this moment are drawn dimmed (only for "today"). */
  nowMs?: number;
};

const PAD = { top: 16, right: 4, bottom: 30, left: 44 };

const niceStep = (range: number) => {
  const raw = range / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};

const PriceCurve = ({ points, window, nowMs }: PriceCurveProps) => {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // The SVG uses real pixel units (viewBox = rendered size), so labels keep
  // a readable size on phones instead of being scaled down with the chart.
  const [W, setW] = useState(960);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setW(Math.max(280, Math.round(el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = W < 640 ? 240 : 320;
  const PLOT_W = W - PAD.left - PAD.right;
  const PLOT_H = H - PAD.top - PAD.bottom;

  const { yMin, yMax, ticks, min, max } = useMemo(() => {
    const values = points.map((p) => p[1]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = niceStep(Math.max(1, max - Math.min(0, min)));
    const yMin = Math.min(0, Math.floor(min / step) * step);
    const yMax = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let v = yMin; v <= yMax + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
    return { yMin, yMax, ticks, min, max };
  }, [points]);

  const n = points.length;
  const barW = PLOT_W / n;
  const y = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin || 1)) * PLOT_H;
  const zeroY = y(0);

  const handleMove = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W - PAD.left;
    const i = Math.floor(x / barW);
    setHover(i >= 0 && i < n ? i : null);
  };

  const hovered = hover !== null ? points[hover] : null;
  const summary = `Viertelstundenpreise von ${fmtNumber(min, 0)} bis ${fmtNumber(max, 0)} Euro pro Megawattstunde.`;

  return (
    <div ref={boxRef} className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full touch-pan-y select-none"
        role="img"
        aria-label={summary}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => handleMove(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={() => setHover(null)}
      >
        {/* grid + y labels (€/MWh) */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="hsl(var(--border))"
              strokeWidth={t === 0 ? 1.5 : 1}
            />
            <text
              x={PAD.left - 8}
              y={y(t)}
              dy="0.32em"
              textAnchor="end"
              className="fill-muted-foreground"
              style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}
            >
              {fmtNumber(t, 0)}
            </text>
          </g>
        ))}

        {/* highlighted window */}
        {window && (
          <g>
            <rect
              x={PAD.left + window.startIndex * barW}
              y={PAD.top}
              width={(window.endIndex - window.startIndex + 1) * barW}
              height={PLOT_H}
              fill={ENERGY_COLORS.window}
              opacity={0.1}
            />
            <line
              x1={PAD.left + window.startIndex * barW}
              x2={PAD.left + (window.endIndex + 1) * barW}
              y1={y(window.avg)}
              y2={y(window.avg)}
              stroke={ENERGY_COLORS.window}
              strokeWidth={2}
            />
          </g>
        )}

        {/* bars */}
        {points.map(([ts, v], i) => {
          const top = Math.min(y(v), zeroY);
          const h = Math.max(1, Math.abs(y(v) - zeroY));
          const past = nowMs !== undefined && ts + 15 * 60 * 1000 <= nowMs;
          return (
            <rect
              key={ts}
              x={PAD.left + i * barW + 0.5}
              y={top}
              width={Math.max(1, barW - 1)}
              height={h}
              rx={Math.min(2, barW / 4)}
              fill={priceColor(v, min, max)}
              opacity={past ? 0.3 : hover === null || hover === i ? 1 : 0.55}
            />
          );
        })}

        {/* now marker */}
        {nowMs !== undefined && points.length > 0 && nowMs > points[0][0] && nowMs < points[n - 1][0] + 15 * 60 * 1000 && (
          <line
            x1={PAD.left + ((nowMs - points[0][0]) / (15 * 60 * 1000)) * barW}
            x2={PAD.left + ((nowMs - points[0][0]) / (15 * 60 * 1000)) * barW}
            y1={PAD.top}
            y2={PAD.top + PLOT_H}
            stroke="hsl(var(--foreground))"
            strokeDasharray="3 4"
            strokeWidth={1}
            opacity={0.6}
          />
        )}

        {/* x labels every 3 hours */}
        {points.map(([ts], i) => {
          const h = berlinHour(ts);
          if (berlinMinute(ts) !== 0 || h % 3 !== 0) return null;
          return (
            <text
              key={`x-${ts}`}
              x={PAD.left + i * barW}
              y={H - 8}
              textAnchor="start"
              className="fill-muted-foreground"
              style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}
            >
              {String(h).padStart(2, "0")}:00
            </text>
          );
        })}
      </svg>

      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-card"
          style={{ left: `${((PAD.left + (hover + 0.5) * barW) / W) * 100}%` }}
        >
          <div className="font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
            {fmtTime(hovered[0])}–{fmtTime(hovered[0] + 15 * 60 * 1000)} Uhr
          </div>
          <div className="text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
            {fmtNumber(hovered[1], 2)} €/MWh = {fmtNumber(toCentPerKwh(hovered[1]), 2)} ct/kWh
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceCurve;
