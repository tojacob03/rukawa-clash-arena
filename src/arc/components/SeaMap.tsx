// The sea chart as SVG: four seas, the great current with its calm belts,
// the scarlet ridge, islands, your route and your ship.

import type { ReactNode } from "react";
import type { Belt, FlagDesign, SeaId } from "../core/types.ts";
import type { Island } from "../core/sea.ts";
import { ISLANDS, SEAS, WORLD, route } from "../core/sea.ts";
import type { WeatherKind } from "../core/voyage.ts";
import { ShipArt } from "./ShipArt.tsx";

export interface MapMarks {
  sea: SeaId;
  /** Route index of the island you are at (0 … 24). */
  current: number;
  /** Route index where the app started (belt and stripes at sign-up). */
  start: number;
  /** Tournaments per island id, with the best placement. */
  comps: Record<string, { n: number; best: number }>;
  shipColor: string;
  boss?: string | null;
  /** Ship class follows the belt. */
  belt: Belt;
  flag?: Partial<FlagDesign> | null;
  /** Share of the way to the next island (0 … 0.85). */
  progress: number;
  weather: WeatherKind;
  /** Landmarks found per island id (0 … 3). */
  explored: Record<string, number>;
  /** Ship condition from other sports and rust. */
  hull: number;
  sails: number;
  barnacles: number;
}

const { w: W, h: H, ridgeX: RX, currentY: CY, currentHalf: CH, calm: CALM } = WORLD;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/** Organic island outline from its id. */
function blob(id: string, x: number, y: number, r: number) {
  const n = 11;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.72 + 0.5 * hash(`${id}:${i}`));
    pts.push(`${(x + Math.cos(a) * rr * 1.25).toFixed(1)},${(y + Math.sin(a) * rr * 0.85).toFixed(1)}`);
  }
  return pts.join(" ");
}

function ridgePath(x: number, half: number) {
  const pts: string[] = [];
  for (let y = 0; y <= H; y += 20) pts.push(`${x - half - 6 * hash(`l${x}${y}`)},${y}`);
  for (let y = H; y >= 0; y -= 20) pts.push(`${x + half + 6 * hash(`r${x}${y}`)},${y}`);
  return pts.join(" ");
}

export default function SeaMap({ marks, selected, onSelect }: { marks: MapMarks; selected: string | null; onSelect: (id: string) => void }) {
  const r = route(marks.sea);
  const pathOf = (from: number, to: number) => {
    const seg: string[] = [];
    for (let i = from; i <= to; i++) {
      const p = r[i];
      if (i > from && r[i - 1].id === "c9" && p.id === "c10") {
        // Over the ridge at the east edge, back in at the west edge.
        seg.push(`L${W - 8} ${CY}M8 ${CY}`);
      }
      seg.push(`${i === from ? "M" : "L"}${p.x} ${p.y}`);
    }
    return seg.join(" ");
  };
  const ship = r[marks.current];
  const next = r[marks.current + 1];
  const pos = shipPos(r, marks.current, marks.progress);

  return (
    <svg className="sea-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Seekarte deiner Reise">
      <defs>
        <linearGradient id="sea-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d2a4a" />
          <stop offset="0.5" stopColor="#0f3358" />
          <stop offset="1" stopColor="#0b2442" />
        </linearGradient>
        <pattern id="sea-waves" width="40" height="22" patternUnits="userSpaceOnUse">
          <path d="M0 12 q5 -5 10 0 t10 0" fill="none" stroke="#2c5b8a" strokeWidth="1" opacity="0.5" />
          <path d="M20 3 q5 -5 10 0 t10 0" fill="none" stroke="#2c5b8a" strokeWidth="1" opacity="0.35" />
        </pattern>
        <pattern id="sea-calm" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.1" fill="#9cc3ff" opacity="0.35" />
          <circle cx="9" cy="9" r="1.1" fill="#9cc3ff" opacity="0.25" />
        </pattern>
        <linearGradient id="sea-ridge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6d1620" />
          <stop offset="0.5" stopColor="#c7393c" />
          <stop offset="1" stopColor="#6d1620" />
        </linearGradient>
        <radialGradient id="sea-gate">
          <stop offset="0" stopColor="#ffe39a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe39a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill="url(#sea-bg)" />
      <rect width={W} height={H} fill="url(#sea-waves)" />

      {/* Four seas */}
      {SEAS.map((s) => {
        const left = s.id === "frost" || s.id === "abend";
        const top = s.id === "frost" || s.id === "morgen";
        const x = left ? 0 : RX;
        const y = top ? 0 : CY + CH + CALM;
        const h = top ? CY - CH - CALM : H - y;
        const mine = s.id === marks.sea;
        return (
          <g key={s.id}>
            <rect x={x} y={y} width={RX} height={h} fill={s.color} opacity={mine ? 0.13 : 0.06} />
            <text className={`sea-name${mine ? " mine" : ""}`} x={left ? 40 : W - 40} y={top ? 52 : H - 30} textAnchor={left ? "start" : "end"}>
              {s.name}
            </text>
          </g>
        );
      })}

      {/* Calm belts and the great current */}
      <rect x={0} y={CY - CH - CALM} width={W} height={CALM} fill="url(#sea-calm)" />
      <rect x={0} y={CY + CH} width={W} height={CALM} fill="url(#sea-calm)" />
      <rect x={0} y={CY - CH} width={W} height={CH * 2} fill="#1d5a8f" opacity={0.55} />
      <g className="sea-flow" fill="none" stroke="#9cc3ff" strokeWidth={1.4} opacity={0.5}>
        {[-24, -8, 8, 24].map((dy) => (
          <path key={dy} d={`M0 ${CY + dy} Q300 ${CY + dy - 10} 600 ${CY + dy} T1200 ${CY + dy}`} strokeDasharray="14 18" />
        ))}
      </g>
      <text className="sea-cur" x={RX + 300} y={CY - CH + 16} textAnchor="middle">
        Äußere Strömung, Blau und Lila
      </text>
      <text className="sea-cur" x={RX - 300} y={CY - CH + 16} textAnchor="middle">
        Tiefe Strömung, Braun und Schwarz
      </text>
      <text className="sea-calm-lbl" x={W / 2 + 180} y={CY - CH - 8}>
        Kalmengürtel
      </text>
      <text className="sea-calm-lbl" x={W / 2 - 300} y={CY + CH + 18}>
        Kalmengürtel
      </text>

      {/* Scarlet ridge */}
      <polygon points={ridgePath(RX, 16)} fill="url(#sea-ridge)" stroke="#3a0b12" strokeWidth={1.5} />
      <polygon points={ridgePath(6, 10)} fill="url(#sea-ridge)" opacity={0.85} />
      <polygon points={ridgePath(W - 6, 10)} fill="url(#sea-ridge)" opacity={0.85} />
      <text className="sea-ridge-lbl" x={RX + 5} y={150} transform={`rotate(90 ${RX + 5} 150)`}>
        Scharlachkamm
      </text>
      <circle cx={RX} cy={CY} r={48} fill="url(#sea-gate)" />

      {/* Home sea routes */}
      {SEAS.map((s) => {
        const pts = [0, 1, 2, 3, 4].map((i) => ISLANDS.find((x) => x.id === `${s.id}${i}`)!);
        const d = `M${pts.map((p) => `${p.x} ${p.y}`).join(" L")} L${RX} ${CY}`;
        return <path key={s.id} d={d} fill="none" stroke="#e9dcc0" strokeWidth={1.4} strokeDasharray="3 6" opacity={s.id === marks.sea ? 0.55 : 0.18} />;
      })}
      {/* Great current route */}
      <path d={pathOf(5, 24)} fill="none" stroke="#e9dcc0" strokeWidth={1.4} strokeDasharray="3 6" opacity={0.45} />

      {/* Your journey: before the app dashed, since then solid */}
      {marks.start > 0 ? <path d={pathOf(0, Math.min(marks.start, marks.current))} fill="none" stroke="#f1bf57" strokeWidth={3} strokeDasharray="7 6" opacity={0.75} strokeLinecap="round" /> : null}
      {marks.current > marks.start ? <path d={pathOf(marks.start, marks.current)} fill="none" stroke="#f1bf57" strokeWidth={3.4} strokeLinecap="round" className="sea-trail" /> : null}
      {next ? <path d={pathOf(marks.current, marks.current + 1)} fill="none" stroke="#ffe39a" strokeWidth={2} strokeDasharray="2 5" className="sea-next" /> : null}

      {/* Islands */}
      {ISLANDS.map((is) => {
        const idx = r.findIndex((x) => x.id === is.id);
        const onRoute = idx >= 0;
        const state = !onRoute ? "other" : idx < marks.current ? "past" : idx === marks.current ? "here" : "future";
        const comp = marks.comps[is.id];
        const onCurrent = !is.sea;
        const showLabel = !onCurrent || state === "here" || idx === marks.current + 1 || selected === is.id || !!is.kind;
        const above = onCurrent && is.y < CY;
        return (
          <g
            key={is.id}
            className={`isle ${state}${selected === is.id ? " sel" : ""}`}
            role="button"
            tabIndex={onRoute || is.sea ? 0 : -1}
            aria-label={`${is.name}${state === "here" ? ", dein Schiff" : ""}`}
            onClick={() => onSelect(is.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(is.id);
              }
            }}
          >
            <circle cx={is.x} cy={is.y} r={24} fill="transparent" />
            <IslandGlyph is={is} />
            <title>{is.name}</title>
            {showLabel ? (
              <text className="isle-lbl" x={is.x} y={above ? is.y - 18 : is.y + 26} textAnchor="middle">
                {is.name}
              </text>
            ) : null}
            {(marks.explored[is.id] ?? 0) >= 3 ? (
              <g transform={`translate(${is.x - 4} ${is.y - 30})`} className="isle-explored" aria-hidden="true">
                <path d="M0 0 V16" stroke="#1c1526" strokeWidth={1.6} />
                <path d="M0 0 L12 4 L0 8 Z" fill="#f3b000" stroke="#1c1526" strokeWidth={1} />
              </g>
            ) : null}
            {comp ? (
              <g transform={`translate(${is.x - 20} ${is.y - 20})`} className="isle-comp">
                <circle r={8} className={comp.best ? `m${comp.best}` : "m0"} />
                <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#1c1526" strokeWidth={1.6} strokeLinecap="round" />
                {comp.n > 1 ? (
                  <text x={8} y={-6} className="isle-comp-n">
                    {comp.n}
                  </text>
                ) : null}
              </g>
            ) : null}
          </g>
        );
      })}

      {/* Boss as a sea monster next to the ship */}
      {marks.boss && ship ? <SeaMonster x={pos.x + 40} y={pos.y + 44} name={marks.boss} /> : null}
      {/* Ship, on its way to the next island */}
      {ship ? <ShipMark pos={pos} marks={marks} /> : null}

      <CompassRose x={W - 70} y={H - 110} />
    </svg>
  );
}

function IslandGlyph({ is }: { is: Island }): ReactNode {
  const r = is.kind === "kap" ? 13 : is.kind ? 11 : 9 + 3 * hash(is.id);
  if (is.kind === "tor") {
    return (
      <g>
        <path d={`M${is.x - 14} ${is.y + 10} V${is.y - 4} Q${is.x} ${is.y - 22} ${is.x + 14} ${is.y - 4} V${is.y + 10}`} fill="none" stroke="#ffe39a" strokeWidth={4} strokeLinecap="round" />
        <path d={`M${is.x - 14} ${is.y + 10} V${is.y - 4} Q${is.x} ${is.y - 22} ${is.x + 14} ${is.y - 4} V${is.y + 10}`} fill="none" stroke="#6d1620" strokeWidth={1.4} />
      </g>
    );
  }
  if (is.kind === "pass") {
    return <polygon points={`${is.x - 14},${is.y + 8} ${is.x - 4},${is.y - 12} ${is.x + 2},${is.y - 2} ${is.x + 8},${is.y - 14} ${is.x + 16},${is.y + 8}`} fill="#c7393c" stroke="#3a0b12" strokeWidth={1.5} />;
  }
  return (
    <g>
      <polygon points={blob(is.id, is.x, is.y, r + 3)} className="isle-sand" />
      <polygon points={blob(is.id + "g", is.x, is.y - 1, r)} className="isle-green" />
      {is.kind === "hafen" ? <path d={`M${is.x + r} ${is.y + 2} h10 M${is.x + r + 4} ${is.y + 2} v5 M${is.x + r + 9} ${is.y + 2} v5`} stroke="#8a5a2b" strokeWidth={2} /> : null}
      {is.kind === "kap" ? (
        <g>
          <path d={`M${is.x} ${is.y - 4} V${is.y - 26}`} stroke="#1c1526" strokeWidth={1.6} />
          <path d={`M${is.x} ${is.y - 26} h14 l-4 5 l4 5 h-14 Z`} fill="#0c0c10" stroke="#f1bf57" strokeWidth={0.8} />
        </g>
      ) : null}
    </g>
  );
}

/** Where the ship is: at its island, or part of the way to the next one. */
function shipPos(r: Island[], idx: number, progress: number): { x: number; y: number; left: boolean } {
  const a = r[idx];
  const b = r[idx + 1];
  const ax = a.x + 16;
  const ay = a.y - 6;
  if (!b || progress <= 0) return { x: ax, y: ay, left: false };
  if (a.id === "c9" && b.id === "c10") {
    // Over the ridge at the east edge, back in at the west edge.
    const east = W - 10 - ax;
    const west = b.x - 16 - 10;
    const d = progress * (east + west);
    return d <= east ? { x: ax + d, y: ay, left: false } : { x: 10 + (d - east), y: b.y - 6, left: false };
  }
  const bx = b.x - 16;
  const by = b.y - 6;
  return { x: ax + (bx - ax) * progress, y: ay + (by - ay) * progress, left: bx < ax };
}

function ShipMark({ pos, marks }: { pos: { x: number; y: number; left: boolean }; marks: MapMarks }) {
  const back = pos.left ? 1 : -1;
  const wind = { tailwind: 3, breeze: 2, light: 1, calm: 0, dock: 0 }[marks.weather];
  return (
    <g className="ship" aria-hidden="true">
      {Array.from({ length: wind }, (_, i) => (
        <path
          key={i}
          d={`M${pos.x + back * (40 + i * 5)} ${pos.y - 30 + i * 11} q${back * 10} -4 ${back * 24} 0`}
          fill="none"
          stroke="#f2f3ee"
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.75}
        />
      ))}
      {marks.weather === "calm" ? (
        <g fill="none" stroke="#9cc3ff" strokeWidth={1.2} opacity={0.8}>
          <ellipse cx={pos.x} cy={pos.y + 2} rx={40} ry={8} />
          <ellipse cx={pos.x} cy={pos.y + 2} rx={54} ry={12} strokeDasharray="3 5" />
        </g>
      ) : null}
      <g transform={`translate(${pos.x} ${pos.y}) scale(${pos.left ? -0.34 : 0.34} 0.34) translate(-100 -128)`}>
        <ShipArt belt={marks.belt} sail={marks.shipColor} flag={marks.flag} hull={marks.hull} sails={marks.sails} barnacles={marks.barnacles} />
      </g>
      <path d={`M${pos.x - 36} ${pos.y + 5} q6 -3 12 0 t12 0 t12 0 t12 0 t12 0 t12 0`} fill="none" stroke="#9cc3ff" strokeWidth={1.2} opacity={0.8} />
    </g>
  );
}

function SeaMonster({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <g className="monster" transform={`translate(${x} ${y})`}>
      <path d="M-18 10 Q-14 -8 -4 0 Q2 6 6 -6 Q10 -18 18 -8" fill="none" stroke="#7d4fbb" strokeWidth={6} strokeLinecap="round" />
      <path d="M-18 10 Q-14 -8 -4 0 Q2 6 6 -6 Q10 -18 18 -8" fill="none" stroke="#b48be0" strokeWidth={2} strokeLinecap="round" />
      <circle cx={17} cy={-10} r={1.6} fill="#ffe39a" />
      <text x={0} y={26} textAnchor="middle" className="monster-lbl">
        {name}
      </text>
    </g>
  );
}

function CompassRose({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="rose" aria-hidden="true">
      <circle r={34} fill="none" stroke="#e9dcc0" strokeWidth={1} opacity={0.5} />
      <circle r={26} fill="none" stroke="#e9dcc0" strokeWidth={0.6} strokeDasharray="2 3" opacity={0.5} />
      <polygon points="0,-32 5,-5 0,0 -5,-5" fill="#f1bf57" />
      <polygon points="0,32 5,5 0,0 -5,5" fill="#e9dcc0" opacity={0.7} />
      <polygon points="-32,0 -5,-5 0,0 -5,5" fill="#e9dcc0" opacity={0.7} />
      <polygon points="32,0 5,-5 0,0 5,5" fill="#e9dcc0" opacity={0.7} />
      <text y={-38} textAnchor="middle" className="rose-n">
        N
      </text>
    </g>
  );
}
