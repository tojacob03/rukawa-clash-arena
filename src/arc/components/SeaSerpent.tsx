// The weekly boss as a sea serpent. It has one hump for every time you got
// stuck in its position in the last 14 days; each quest against it pushes one
// under the surface, the ones above the water are its life points. A wave runs from head to tail, and it stops with reduced
// motion.

import type { CSSProperties } from "react";

import { SERPENT, serpentWidth } from "../core/sea.ts";

const HUMP = SERPENT.hump;

/** The serpent as SVG elements, tail at x = 0, head at the right. */
export function SerpentArt({ hp, max }: { hp: number; max: number }) {
  const n = Math.max(1, Math.min(8, max));
  const up = Math.max(0, Math.min(n, hp));
  const x0 = 10;
  const xh = x0 + n * HUMP;
  return (
    <g className="serpent">
      {/* Tail fluke: out of the water only when every hump is up */}
      {up === n ? (
        <>
          <path className="serpent-body" d={`M${x0} 0 C${x0 - 3} -4 ${x0 - 6} -6 ${x0 - 9} -10`} />
          <path className="serpent-fin" d={`M${x0 - 9} -10 l-5 1 l3 -2 l-1 -5 Z`} />
        </>
      ) : (
        <path className="serpent-under" d={`M${x0} 2 C${x0 - 3} 6 ${x0 - 6} 7 ${x0 - 9} 9`} />
      )}
      {Array.from({ length: n }, (_, i) => {
        const a = x0 + i * HUMP;
        const b = a + HUMP;
        // The humps nearest the head are the ones above water.
        const above = i >= n - up;
        if (!above) return <path key={i} className="serpent-under" d={`M${a} 2 C${a} 13 ${b} 13 ${b} 2`} />;
        return (
          <g key={i} className="serpent-hump" style={{ ["--i" as string]: n - 1 - i } as CSSProperties}>
            <path className="serpent-body" d={`M${a} 0 C${a} -15 ${b} -15 ${b} 0`} />
            <path className="serpent-fin" d={`M${a + 5} -10.5 l2.5 -5 l2 4.6 Z M${a + 9.5} -10.8 l2 -4 l1.6 3.8 Z`} />
          </g>
        );
      })}
      {/* Neck and head: jaws, an eye and a horn */}
      <g className="serpent-head">
        <path className="serpent-body" d={`M${xh} 0 C${xh} -9 ${xh + 3} -17 ${xh + 10} -19`} />
        <path className="serpent-skull" d={`M${xh + 6} -23 Q${xh + 14} -28 ${xh + 23} -21 L${xh + 25} -18 L${xh + 16} -17.5 L${xh + 22} -15 Q${xh + 12} -12 ${xh + 6} -17 Z`} />
        <circle className="serpent-eye" cx={xh + 14} cy={-21.5} r={1.5} />
        <path className="serpent-fin" d={`M${xh + 8} -23 l-3 -6 l6 3.5 Z`} />
      </g>
      {/* Where the humps break the surface */}
      <g className="serpent-foam">
        {Array.from({ length: n }, (_, i) =>
          i >= n - up ? <path key={i} d={`M${x0 + i * HUMP - 3} 1.2 q2 -1.6 4 0 M${x0 + (i + 1) * HUMP - 1} 1.2 q2 -1.6 4 0`} /> : null,
        )}
        <path d={`M${xh - 3} 1.2 q2 -1.6 4 0`} />
      </g>
    </g>
  );
}

/** The serpent on its own, on a strip of sea (the boss card on Heute). */
export default function SeaSerpent({ hp, max, height = 64, label }: { hp: number; max: number; height?: number; label?: string }) {
  const s = { w: serpentWidth(max), top: SERPENT.top, bottom: SERPENT.bottom };
  const vw = s.w + 12;
  const vh = s.bottom - s.top + 8;
  return (
    <svg className="serpent-card" viewBox={`-6 ${s.top - 4} ${vw} ${vh}`} height={height} width={(height * vw) / vh} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <rect x={-6} y={0} width={vw} height={s.bottom + 4} className="serpent-sea" />
      <path className="serpent-line" d={`M-6 0 H${vw}`} />
      <SerpentArt hp={hp} max={max} />
    </svg>
  );
}
