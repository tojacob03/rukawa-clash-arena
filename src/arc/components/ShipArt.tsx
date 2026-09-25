// Your ship: it grows with your belt, flies your crew flag and shows its
// condition (patched sails when endurance is low, barnacles for rusting
// techniques). Drawn in a 200 × 150 box; ShipArt can sit inside the sea chart.

import type { Belt, FlagDesign } from "../core/types.ts";
import type { WeatherKind } from "../core/voyage.ts";
import { CrewFlagArt } from "./CrewFlag.tsx";

const INK = "#1b1512";
const WOOD = "#8a5a2b";
const WOOD2 = "#6b4220";
const SAIL = "#efe6d3";
const GOLD = "#d4a94f";

export interface ShipLook {
  belt: Belt;
  /** Main sail colour (your class). */
  sail: string;
  flag?: Partial<FlagDesign> | null;
  /** 0 … 100 from other sports; low values show wear. */
  hull?: number;
  sails?: number;
  /** Rusting techniques: barnacles on the hull. */
  barnacles?: number;
}

function Flag({ x, y, flag }: { x: number; y: number; flag?: Partial<FlagDesign> | null }) {
  return (
    <g transform={`translate(${x} ${y}) scale(0.24)`}>
      <CrewFlagArt design={flag} />
    </g>
  );
}

function Mast({ x, top, bottom }: { x: number; top: number; bottom: number }) {
  return <line x1={x} y1={top} x2={x} y2={bottom} stroke={INK} strokeWidth={3.4} strokeLinecap="round" />;
}

/** A square sail between two yards, slightly bellied. */
function Square({ x, y, w, h, fill, patch }: { x: number; y: number; w: number; h: number; fill: string; patch?: boolean }) {
  return (
    <g>
      <path d={`M${x - w / 2} ${y} H${x + w / 2} Q${x + w / 2 + 4} ${y + h / 2} ${x + w / 2 - 2} ${y + h} H${x - w / 2 + 2} Q${x - w / 2 - 4} ${y + h / 2} ${x - w / 2} ${y} Z`} fill={fill} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <line x1={x - w / 2 - 3} y1={y} x2={x + w / 2 + 3} y2={y} stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      {patch ? <rect x={x + w / 8} y={y + h / 3} width={w / 5} height={h / 4} fill="#d9d2bf" stroke={INK} strokeWidth={1.2} strokeDasharray="2 2" /> : null}
    </g>
  );
}

function Hull({ d, ports, trim, barnacles, cracked }: { d: string; ports?: number[]; trim?: boolean; barnacles: number; cracked?: boolean }) {
  return (
    <g>
      <path d={d} fill={WOOD} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      {trim ? <path d={d} fill="none" stroke={GOLD} strokeWidth={1.6} transform="translate(0 3)" opacity={0.9} /> : null}
      {ports?.map((x) => <rect key={x} x={x - 3} y={114} width={6} height={5} fill={INK} />)}
      {Array.from({ length: Math.min(9, barnacles) }, (_, i) => (
        <circle key={i} cx={70 + i * 8 + (i % 2) * 2} cy={129 - (i % 3)} r={2.1} fill="#d9d2bf" stroke={INK} strokeWidth={0.9} />
      ))}
      {cracked ? <path d="M92 112 l4 6 l-3 4 l5 6" fill="none" stroke={INK} strokeWidth={1.4} /> : null}
    </g>
  );
}

/** The ship as SVG elements in a 200 × 150 box (waterline at 128). */
export function ShipArt({ belt, sail, flag, hull = 50, sails = 50, barnacles = 0 }: ShipLook) {
  const worn = sails < 25;
  const cracked = hull < 15;
  switch (belt) {
    case "weiss":
      return (
        <g>
          <Hull d="M58 112 H142 L132 130 H68 Z" barnacles={barnacles} cracked={cracked} />
          <Mast x={100} top={50} bottom={112} />
          <path d="M101 56 L101 106 L136 106 Q124 80 101 56 Z" fill={sail} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          {worn ? <rect x={108} y={86} width={9} height={8} fill="#d9d2bf" stroke={INK} strokeWidth={1.1} strokeDasharray="2 2" /> : null}
          <line x1={62} y1={120} x2={40} y2={138} stroke={WOOD2} strokeWidth={3} strokeLinecap="round" />
          <Flag x={100} y={36} flag={flag} />
        </g>
      );
    case "blau":
      return (
        <g>
          <Hull d="M36 108 H164 Q160 124 146 132 H54 Q40 124 36 108 Z" barnacles={barnacles} cracked={cracked} />
          <Mast x={106} top={26} bottom={108} />
          <path d="M107 32 L107 102 L156 102 Q146 62 107 32 Z" fill={sail} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          <path d="M104 36 L58 104 L103 104 Z" fill={SAIL} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          {worn ? <rect x={118} y={70} width={11} height={10} fill="#d9d2bf" stroke={INK} strokeWidth={1.1} strokeDasharray="2 2" /> : null}
          <Flag x={106} y={12} flag={flag} />
        </g>
      );
    case "lila":
      return (
        <g>
          <Hull d="M26 104 H174 Q170 122 154 132 H46 Q30 122 26 104 Z" barnacles={barnacles} cracked={cracked} />
          <Mast x={78} top={24} bottom={104} />
          <Mast x={128} top={18} bottom={104} />
          <Square x={78} y={32} w={46} h={28} fill={SAIL} patch={worn} />
          <Square x={78} y={64} w={52} h={32} fill={sail} />
          <path d="M129 26 L129 98 L170 98 Q164 58 129 26 Z" fill={sail} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          <path d="M76 30 L30 100 L74 100 Z" fill={SAIL} stroke={INK} strokeWidth={2} strokeLinejoin="round" opacity={0.95} />
          <Flag x={128} y={4} flag={flag} />
        </g>
      );
    default: {
      const flagship = belt === "schwarz";
      return (
        <g>
          <Hull d="M18 102 H182 Q178 122 160 132 H40 Q22 122 18 102 Z" ports={[50, 70, 90, 110, 130, 150]} trim={flagship} barnacles={barnacles} cracked={cracked} />
          {flagship ? <rect x={170} y={92} width={7} height={10} fill={GOLD} stroke={INK} strokeWidth={1.4} /> : null}
          {[58, 100, 142].map((x, i) => (
            <g key={x}>
              <Mast x={x} top={i === 1 ? 10 : 20} bottom={102} />
              {flagship ? <Square x={x} y={i === 1 ? 16 : 26} w={26} h={16} fill={SAIL} /> : null}
              <Square x={x} y={i === 1 ? (flagship ? 36 : 22) : flagship ? 46 : 30} w={34} h={24} fill={SAIL} patch={worn && i === 0} />
              <Square x={x} y={i === 1 ? (flagship ? 64 : 50) : flagship ? 74 : 58} w={40} h={24} fill={sail} />
            </g>
          ))}
          <Flag x={100} y={-4} flag={flag} />
        </g>
      );
    }
  }
}

/** Hull ends at the waterline for each ship class, where the dock shores rest. */
const HULL_X: Record<Belt, [number, number]> = { weiss: [60, 140], blau: [40, 160], lila: [30, 170], braun: [22, 178], schwarz: [22, 178] };

/**
 * Dry dock: the ship on keel blocks, held by shores. This is the week in
 * Heilungsmodus: the ship is being mended instead of sailing.
 */
export function DockArt({ belt = "braun" }: { belt?: Belt }) {
  const [a, b] = HULL_X[belt];
  return (
    <g className="dock">
      <rect x={4} y={134} width={192} height={12} fill="#8d8a80" stroke={INK} strokeWidth={2} />
      <path d="M12 140 h14 M40 142 h18 M80 140 h12 M118 142 h20 M156 140 h16" stroke="#6d6a62" strokeWidth={1.4} strokeLinecap="round" />
      {[a + 12, (a + b) / 2 - 6, b - 24].map((x) => (
        <rect key={x} x={x} y={128} width={12} height={7} fill={WOOD2} stroke={INK} strokeWidth={1.4} />
      ))}
      <path d={`M${a - 26} 134 L${a - 2} 112 M${a - 10} 134 L${a + 6} 118 M${b + 26} 134 L${b + 2} 112 M${b + 10} 134 L${b - 6} 118`} stroke={WOOD} strokeWidth={3.4} strokeLinecap="round" />
    </g>
  );
}

/**
 * Standalone picture of the ship on the water. With `weather` it moves the
 * way the map ship does: it rolls and the swell runs past as strongly as the
 * wind from your training rhythm, and in the dry dock nothing moves.
 */
export default function Ship({ look, width = 320, label, weather }: { look: ShipLook; width?: number; label?: string; weather?: WeatherKind }) {
  const dock = weather === "dock";
  return (
    <svg viewBox="-10 -12 220 170" width={width} height={(width * 170) / 220} className={`ship-art${weather ? ` w-${weather}` : ""}`} role="img" aria-label={label}>
      {dock ? <DockArt belt={look.belt} /> : null}
      <g className="ship-roll">
        <ShipArt {...look} />
      </g>
      {dock ? null : (
        <g className="swell">
          {/* The hull sits a little in the water, so rolling never lifts it clear. */}
          <path d="M-40 131 Q-25 125 -10 131 T20 131 T50 131 T80 131 T110 131 T140 131 T170 131 T200 131 T230 131 T260 131 V160 H-40 Z" fill="#22363a" stroke={INK} strokeWidth={2.4} />
          <path d="M-30 143 Q-18 139 -6 143 T18 143 M90 148 Q102 144 114 148 T138 148 M190 143 Q202 139 214 143 T238 143" fill="none" stroke="#ede3d1" strokeWidth={1.4} opacity={0.55} />
        </g>
      )}
    </svg>
  );
}
