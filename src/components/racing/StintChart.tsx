import { useEffect, useRef, useState } from "react";
import { compoundColor, compoundLabel, displayName, teamColor, type RaceDriver } from "@/lib/racing";

type StintChartProps = {
  drivers: RaceDriver[];
  totalLaps: number;
};

const ROW = 20;
const BAR = 13;
const LABEL_W = 78;
const AXIS_H = 24;

type Hover = { x: number; y: number; text: string } | null;

const StintChart = ({ drivers, totalLaps }: StintChartProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(900);
  const [hover, setHover] = useState<Hover>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setW(Math.max(300, Math.round(el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = drivers.filter((d) => d.stints && d.stints.length > 0);
  const plotW = W - LABEL_W - 8;
  const lapW = plotW / Math.max(1, totalLaps);
  const H = rows.length * ROW + AXIS_H;
  const x = (lap: number) => LABEL_W + lap * lapW;
  const tickStep = totalLaps > 50 ? 10 : 5;

  return (
    <div ref={boxRef} className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full select-none"
        role="img"
        aria-label="Tyre strategy of every driver: one row per driver, coloured by tyre compound, in finishing order."
        onMouseLeave={() => setHover(null)}
      >
        {/* lap grid */}
        {Array.from({ length: Math.floor(totalLaps / tickStep) + 1 }, (_, i) => i * tickStep).map((lap) => (
          <g key={lap}>
            <line x1={x(lap)} x2={x(lap)} y1={0} y2={rows.length * ROW} stroke="hsl(var(--border))" strokeWidth={1} />
            <text
              x={x(lap)}
              y={H - 6}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}
            >
              {lap}
            </text>
          </g>
        ))}

        {rows.map((d, i) => {
          const y = i * ROW;
          const muted = d.status !== null;
          return (
            <g key={d.number} opacity={muted ? 0.55 : 1}>
              <rect x={0} y={y + (ROW - BAR) / 2} width={3} height={BAR} fill={teamColor(d.colour)} rx={1} />
              <text
                x={8}
                y={y + ROW / 2}
                dy="0.35em"
                className="fill-muted-foreground"
                style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}
              >
                {d.position ?? "–"}
              </text>
              <text
                x={30}
                y={y + ROW / 2}
                dy="0.35em"
                className="fill-foreground"
                style={{ fontSize: 12, fontWeight: 500 }}
              >
                {d.code ?? d.number}
              </text>
              {d.status && (
                <text x={62} y={y + ROW / 2} dy="0.35em" className="fill-muted-foreground" style={{ fontSize: 9 }}>
                  {d.status}
                </text>
              )}

              {d.stints!.map(([compound, start, end, age], s) => {
                const from = Math.max(0, start - 1);
                const to = Math.max(from + 0.5, end);
                const used = age > 0;
                const text = `${displayName(d.name)}: ${compoundLabel(compound)}, laps ${start}–${end}${
                  used ? ` (used, ${age} laps old)` : " (new)"
                }`;
                return (
                  <rect
                    key={s}
                    x={x(from) + 0.5}
                    y={y + (ROW - BAR) / 2}
                    width={Math.max(1, (to - from) * lapW - 1)}
                    height={BAR}
                    rx={2}
                    fill={compoundColor(compound)}
                    fillOpacity={used ? 0.55 : 0.95}
                    stroke={used ? compoundColor(compound) : "none"}
                    strokeDasharray={used ? "2 2" : undefined}
                    onMouseEnter={() => setHover({ x: x((from + to) / 2), y, text })}
                    onClick={() => setHover({ x: x((from + to) / 2), y, text })}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-foreground shadow-card"
          style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%` }}
        >
          {hover.text}
        </div>
      )}
    </div>
  );
};

export default StintChart;
