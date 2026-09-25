// Your crew flag: background, emblem, what crosses behind it and what the
// emblem wears. Drawn in a 120 × 80 box; CrewFlagArt can sit inside other SVG
// (the mast of your ship on the sea chart).

import { useId } from "react";
import type { CSSProperties } from "react";
import type { FlagDesign } from "../core/types.ts";
import { FLAG_BG, FLAG_FG, WEARS, normalizeFlag } from "../core/crewflag.ts";

const INK = "#16171c";
const RED = "#c8203f";
const GOLD = "#f3b000";
const PAPER = "#f2f3ee";
/** The cloth outline, with a frayed free end. */
const CLOTH = "M2 2 H114 Q109 22 117 40 Q110 58 115 78 H2 Z";

const dark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
};

/** Emblem colour that stays visible on the chosen background. */
function colours(f: FlagDesign) {
  const bg = FLAG_BG[f.bg].hex;
  let fg = FLAG_FG[f.fg].hex;
  if (dark(bg) === dark(fg) && Math.abs(parseInt(bg.slice(1), 16) - parseInt(fg.slice(1), 16)) < 0x303030) fg = dark(bg) ? PAPER : INK;
  if (fg === bg) fg = dark(bg) ? PAPER : INK;
  return { bg, fg };
}

export function CrewFlagArt({ design }: { design?: Partial<FlagDesign> | null }) {
  const f = normalizeFlag(design);
  const { bg, fg } = colours(f);
  const hole = bg;
  return (
    <g>
      <path d={CLOTH} fill={bg} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Cross kind={f.cross} fg={fg} bg={hole} />
      <Emblem kind={f.emblem} fg={fg} bg={hole} />
      {WEARS.has(f.emblem) ? <Head kind={f.head} bg={bg} /> : null}
    </g>
  );
}

export default function CrewFlag({ design, width = 120, label }: { design?: Partial<FlagDesign> | null; width?: number; label?: string }) {
  return (
    <svg viewBox="0 0 120 80" width={width} height={(width * 80) / 120} className="crew-flag" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <CrewFlagArt design={design} />
    </svg>
  );
}

/**
 * The flag on its pole, in the wind. The cloth is cut into narrow strips that
 * rise, fall and tilt one after another, so a wave runs from the pole to the
 * free end. `wind` (0 … 1) is the same wind that moves your ship: your
 * training rhythm, or the crew week for a crew flag. Without wind the flag
 * hangs down the pole. With reduced motion it simply stands still.
 */
export function WavingFlag({ design, wind, width = 120, label }: { design?: Partial<FlagDesign> | null; wind: number; width?: number; label?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const w = Math.max(0, Math.min(1, wind));
  const N = 20;
  const sw = 120 / N;
  const period = 2 - w * 1.05;
  const lambda = 120 / 0.9;
  return (
    <svg
      viewBox="-8 -12 134 108"
      width={width}
      height={(width * 108) / 134}
      className={`crew-flag waving${w < 0.15 ? " limp" : ""}`}
      style={{ ["--p" as string]: `${period.toFixed(2)}s` } as CSSProperties}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <g id={`${uid}art`}>
          <CrewFlagArt design={design} />
        </g>
        <clipPath id={`${uid}cloth`}>
          <path d={CLOTH} />
        </clipPath>
        {Array.from({ length: N }, (_, i) => (
          <clipPath key={i} id={`${uid}c${i}`}>
            <rect x={i * sw - (i ? 0.5 : 4)} y={-12} width={sw + (i ? 1 : 4.5) + (i === N - 1 ? 6 : 0)} height={112} />
          </clipPath>
        ))}
      </defs>
      <line className="flag-pole" x1={-2} y1={-8} x2={-2} y2={94} />
      <circle className="flag-knob" cx={-2} cy={-9} r={3} />
      <g className="flag-cloth">
        {Array.from({ length: N }, (_, i) => {
          const k = (i + 0.5) / N;
          const amp = (0.6 + 4.6 * w) * k;
          const tilt = (Math.atan((2 * Math.PI * amp) / lambda) * 180) / Math.PI;
          const cx = i * sw + sw / 2;
          const vars = { ["--a" as string]: `${amp.toFixed(2)}px`, ["--sk" as string]: `${tilt.toFixed(2)}deg`, ["--k" as string]: k.toFixed(3), transformOrigin: `${cx}px 40px` } as CSSProperties;
          return (
            <g key={i} clipPath={`url(#${uid}c${i})`}>
              <g className="flag-rise" style={vars}>
                <g className="flag-tilt" style={vars}>
                  <use href={`#${uid}art`} />
                  <rect className="flag-fold" x={i * sw} y={0} width={sw} height={82} clipPath={`url(#${uid}cloth)`} />
                </g>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function Cross({ kind, fg, bg }: { kind: number; fg: string; bg: string }) {
  switch (kind) {
    case 1: // bones
      return (
        <g stroke={fg} strokeWidth={6} strokeLinecap="round" fill={fg}>
          <line x1={34} y1={64} x2={86} y2={14} />
          <line x1={34} y1={14} x2={86} y2={64} />
          {[
            [32, 66],
            [88, 12],
            [32, 12],
            [88, 66],
          ].map(([x, y]) => (
            <g key={`${x}${y}`} stroke="none">
              <circle cx={x - 2.5} cy={y} r={3.6} />
              <circle cx={x + 2.5} cy={y} r={3.6} />
            </g>
          ))}
        </g>
      );
    case 2: // sabres
      return (
        <g fill="none" stroke={fg} strokeLinecap="round">
          <path d="M36 64 Q52 34 86 12" strokeWidth={4.5} />
          <path d="M84 64 Q68 34 34 12" strokeWidth={4.5} />
          <path d="M30 58 L44 68 M90 58 L76 68" strokeWidth={3.5} />
          <circle cx={34} cy={66} r={2.8} fill={fg} stroke="none" />
          <circle cx={86} cy={66} r={2.8} fill={fg} stroke="none" />
          <path d="M40 60 Q52 36 84 14" strokeWidth={1.2} stroke={bg} opacity={0.6} />
        </g>
      );
    case 3: // anchor
      return (
        <g fill="none" stroke={fg} strokeWidth={5} strokeLinecap="round">
          <circle cx={60} cy={11} r={4} strokeWidth={3} />
          <line x1={60} y1={15} x2={60} y2={66} />
          <line x1={46} y1={21} x2={74} y2={21} />
          <path d="M38 52 Q60 74 82 52" />
          <path d="M34 50 l6 -4 l2 7 Z M86 50 l-6 -4 l-2 7 Z" fill={fg} strokeWidth={2} />
        </g>
      );
    case 4: // oars
      return (
        <g fill={fg} stroke={fg} strokeLinecap="round">
          <line x1={38} y1={66} x2={80} y2={18} strokeWidth={4} />
          <line x1={82} y1={66} x2={40} y2={18} strokeWidth={4} />
          <ellipse cx={84} cy={13} rx={5} ry={10} transform="rotate(41 84 13)" stroke="none" />
          <ellipse cx={36} cy={13} rx={5} ry={10} transform="rotate(-41 36 13)" stroke="none" />
        </g>
      );
    case 5: // belts
      return (
        <g strokeLinecap="butt">
          <line x1={32} y1={66} x2={88} y2={12} stroke={fg} strokeWidth={8} />
          <line x1={32} y1={12} x2={88} y2={66} stroke={fg} strokeWidth={8} />
          <line x1={76} y1={23.5} x2={82} y2={17.7} stroke={bg} strokeWidth={8.4} />
          <line x1={76} y1={54.5} x2={82} y2={60.3} stroke={bg} strokeWidth={8.4} />
          <line x1={77.5} y1={22} x2={80.5} y2={19.2} stroke={RED} strokeWidth={8.4} />
          <line x1={77.5} y1={56} x2={80.5} y2={58.8} stroke={RED} strokeWidth={8.4} />
        </g>
      );
    default:
      return null;
  }
}

function Emblem({ kind, fg, bg }: { kind: number; fg: string; bg: string }) {
  switch (kind) {
    case 1: // fist
      return (
        <g>
          <rect x={46} y={24} width={28} height={24} rx={6} fill={fg} stroke={INK} strokeWidth={1.5} />
          <path d="M53 24 V34 M60 24 V34 M67 24 V34" stroke={bg} strokeWidth={1.8} />
          <path d="M46 38 Q54 35 58 41" stroke={bg} strokeWidth={1.8} fill="none" />
          <rect x={50} y={47} width={20} height={9} fill={fg} stroke={INK} strokeWidth={1.5} />
        </g>
      );
    case 2: // belt knot
      return (
        <g stroke={INK} strokeWidth={1.4}>
          <rect x={30} y={32} width={60} height={7} fill={fg} />
          <path d="M55 39 L48 58 L55 60 L61 41 Z" fill={fg} />
          <path d="M65 39 L72 58 L65 60 L59 41 Z" fill={fg} />
          <path d="M49.5 54 L55.8 56 M70.5 54 L64.2 56" stroke={RED} strokeWidth={4} />
          <rect x={53} y={28} width={14} height={14} rx={3} fill={fg} />
        </g>
      );
    case 3: // Waza star
      return (
        <g>
          <polygon points="60,18 76,27 76,47 60,56 44,47 44,27" fill="none" stroke={fg} strokeWidth={4} strokeLinejoin="round" />
          <path d="M60 25 L63.5 34 L72 37 L63.5 40 L60 49 L56.5 40 L48 37 L56.5 34 Z" fill={fg} />
        </g>
      );
    case 4: // wave
      return (
        <g>
          <path d="M36 54 Q40 28 62 26 Q78 26 78 40 Q78 50 68 50 Q60 50 60 43 Q60 37 66 37 Q63 41 67 43 Q72 43 72 38 Q71 31 62 32 Q46 34 44 54 Z" fill={fg} stroke={INK} strokeWidth={1.4} />
          <path d="M32 58 Q40 54 48 58 T64 58 T80 58 T96 58" fill="none" stroke={fg} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    case 5: // oni mask
      return (
        <g stroke={INK} strokeWidth={1.4}>
          <path d="M47 22 L44 10 L53 20 Z M73 22 L76 10 L67 20 Z" fill={GOLD} />
          <path d="M45 26 Q45 18 60 18 Q75 18 75 26 L74 44 Q70 55 60 55 Q50 55 46 44 Z" fill={fg} />
          <path d="M50 31 L57 34 L50 36 Z M70 31 L63 34 L70 36 Z" fill={bg} stroke="none" />
          <path d="M51 29 L58 32 M69 29 L62 32" strokeWidth={2} />
          <rect x={52} y={43} width={16} height={6} rx={2} fill={bg} stroke="none" />
          <path d="M54 43 l2 4 l2 -4 Z M62 43 l2 4 l2 -4 Z" fill={PAPER} stroke="none" />
        </g>
      );
    default: // skull
      return (
        <g>
          <circle cx={60} cy={33} r={14} fill={fg} stroke={INK} strokeWidth={1.4} />
          <rect x={51} y={41} width={18} height={11} rx={3} fill={fg} stroke={INK} strokeWidth={1.4} />
          <circle cx={54.5} cy={33} r={3.8} fill={bg} />
          <circle cx={65.5} cy={33} r={3.8} fill={bg} />
          <path d="M60 37 l-2.2 4 h4.4 Z" fill={bg} />
          <path d="M55 46 V52 M58.5 46 V52 M62 46 V52 M65.5 46 V52" stroke={bg} strokeWidth={1.3} />
        </g>
      );
  }
}

function Head({ kind, bg }: { kind: number; bg: string }) {
  switch (kind) {
    case 1: // headband with knot tails
      return (
        <g stroke={INK} strokeWidth={1.2}>
          <rect x={45.5} y={24} width={29} height={5} fill={RED} />
          <path d="M74 25 L84 20 L85 24 Z M74 27 L84 30 L82 33 Z" fill={RED} />
          <circle cx={60} cy={26.5} r={1.8} fill={PAPER} stroke="none" />
        </g>
      );
    case 2: // bandana
      return (
        <g stroke={INK} strokeWidth={1.2}>
          <path d="M45.5 31 Q46 17 60 17 Q74 17 74.5 31 Z" fill={RED} />
          <path d="M46 28 L38 24 L39 30 Z M46 29 L37 33 L41 36 Z" fill={RED} />
          <circle cx={56} cy={23} r={1.3} fill={PAPER} stroke="none" />
          <circle cx={64} cy={21} r={1.3} fill={PAPER} stroke="none" />
          <circle cx={67} cy={26} r={1.3} fill={PAPER} stroke="none" />
        </g>
      );
    case 3: // tricorn
      return <path d="M38 25 Q60 2 82 25 Q71 18 60 20 Q49 18 38 25 Z" fill={INK} stroke={dark(bg) ? GOLD : INK} strokeWidth={1.6} />;
    case 4: // samurai topknot
      return (
        <g stroke={INK} strokeWidth={1.2}>
          <path d="M57 20 L63 20 L64 11 Q60 8 56 11 Z" fill={INK} stroke={dark(bg) ? PAPER : INK} />
          <path d="M55.5 17 H64.5" stroke={RED} strokeWidth={2.2} />
        </g>
      );
    case 5: // crown
      return <path d="M47 22 L49 11 L55 18 L60 8 L65 18 L71 11 L73 22 Z" fill={GOLD} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />;
    default:
      return null;
  }
}
