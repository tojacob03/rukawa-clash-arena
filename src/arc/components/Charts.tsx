import { SECTORS } from "../core/techniques.ts";
import { polar, sectorAngle } from "../core/layout.ts";
import { clamp } from "../core/model.ts";
import { nf0, shortDate } from "../format.ts";
import { isoOf } from "../core/model.ts";

/** Belt benchmarks drawn as rings. Placeholders until pilot data calibrates them. */
const BENCH: [string, number][] = [
  ["Blau", 25],
  ["Lila", 45],
  ["Braun", 65],
  ["Schwarz", 85],
];

export interface HexSeries {
  vals: number[];
  cls: string;
  label: string;
}

export function Hexagon({ series, labelIndex = 0 }: { series: HexSeries[]; labelIndex?: number }) {
  const R = 130;
  const V = R + 110;
  const angs = SECTORS.map((s) => sectorAngle(s.id));
  const pts = (vals: number[]) =>
    angs.map((a, i) => polar((R * clamp(vals[i], 0, 100)) / 100, a).map((v) => v.toFixed(1)).join(",")).join(" ");
  const main = series[labelIndex]?.vals ?? SECTORS.map(() => 0);
  return (
    <svg className="hex" viewBox={`${-V} ${-V + 20} ${2 * V} ${2 * V - 40}`} role="img" aria-label={`Hexagon: ${SECTORS.map((s, i) => `${s.name} ${Math.round(main[i])}`).join(", ")}`}>
      {BENCH.map(([name, v]) => (
        <g key={name}>
          <polygon className="hx-ring" points={pts(angs.map(() => v))} />
          <text className="hx-ringlbl" x={7} y={-(R * v) / 100 + 4}>
            {name}
          </text>
        </g>
      ))}
      <polygon className="hx-ring outer" points={pts(angs.map(() => 100))} />
      {angs.map((a, i) => {
        const [x, y] = polar(R, a);
        return <line key={i} className="hx-axis" x1="0" y1="0" x2={x.toFixed(1)} y2={y.toFixed(1)} />;
      })}
      {series.map((s) => (
        <polygon key={s.label} className={`hx-poly ${s.cls}`} points={pts(s.vals)} />
      ))}
      {main.map((v, i) => {
        const [x, y] = polar((R * clamp(v, 0, 100)) / 100, angs[i]);
        return <circle key={i} className="hx-dot" cx={x.toFixed(1)} cy={y.toFixed(1)} r="3.6" />;
      })}
      {SECTORS.map((s, i) => {
        const a = angs[i];
        const [x, y] = polar(R + 16, a);
        const c = Math.cos((a * Math.PI) / 180);
        const sn = Math.sin((a * Math.PI) / 180);
        const anchor = c > 0.3 ? "start" : c < -0.3 ? "end" : "middle";
        const yy = sn < -0.9 ? y - 24 : sn > 0.9 ? y + 14 : y - 6;
        return (
          <text key={s.id} textAnchor={anchor} x={x.toFixed(1)} y={yy.toFixed(1)}>
            <tspan className="hx-name">{s.name}</tspan>
            <tspan className="hx-val" x={x.toFixed(1)} dy="19">
              {Math.round(main[i])}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}

export function KiChart({ series, today, extra }: { series: { d: number; r: number }[]; today: number; extra?: { series: { d: number; r: number }[]; cls: string }[] }) {
  const W = 560;
  const H = 180;
  const l = 54;
  const r = 70;
  const t = 16;
  const b = 26;
  const all = [series, ...(extra ?? []).map((e) => e.series)].flat();
  if (series.length < 2) return <p className="muted small">Die Ki-Kurve erscheint nach den ersten Roll-Karten.</p>;
  const ys = all.map((p) => p.r * 10);
  const ymin = Math.min(...ys);
  const ymax = Math.max(...ys);
  const pad = (ymax - ymin) * 0.12 || 10;
  const y0 = ymin - pad;
  const y1 = ymax + pad;
  const x0 = series[0].d;
  const x1 = Math.max(today, x0 + 1);
  const X = (d: number) => l + ((d - x0) / (x1 - x0)) * (W - l - r);
  const Y = (v: number) => t + (1 - (v - y0) / (y1 - y0)) * (H - t - b);
  const line = (s: { d: number; r: number }[]) => s.map((p) => `${X(p.d).toFixed(1)},${Y(p.r * 10).toFixed(1)}`).join(" ");
  const last = series[series.length - 1];
  const lx = X(last.d);
  const ly = Y(last.r * 10);
  return (
    <svg className="ki-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Ki von ${nf0.format(Math.round(series[0].r * 10))} auf ${nf0.format(Math.round(last.r * 10))}`}>
      <defs>
        <linearGradient id="kiFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0bf5a" stopOpacity=".35" />
          <stop offset="1" stopColor="#f0bf5a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[ymax, ymin].map((v) => (
        <g key={v}>
          <line className="kc-grid" x1={l} x2={W - r} y1={Y(v)} y2={Y(v)} />
          <text className="kc-txt" x={l - 8} y={Y(v) + 4} textAnchor="end">
            {nf0.format(Math.round(v))}
          </text>
        </g>
      ))}
      <path d={`M${X(x0)},${H - b} L${line(series).split(" ").join(" L")} L${lx},${H - b} Z`} fill="url(#kiFill)" />
      {(extra ?? []).map((e) => (e.series.length > 1 ? <polyline key={e.cls} className={`kc-line ${e.cls}`} points={line(e.series)} /> : null))}
      <polyline className="kc-line main" points={line(series)} />
      <circle className="kc-end" cx={lx} cy={ly} r="5" />
      <text className="kc-val" x={lx + 9} y={ly + 4}>
        {nf0.format(Math.round(last.r * 10))}
      </text>
      <text className="kc-txt" x={l} y={H - 6}>
        {shortDate(isoOf(x0))}
      </text>
      <text className="kc-txt" x={W - r} y={H - 6} textAnchor="end">
        heute
      </text>
    </svg>
  );
}
