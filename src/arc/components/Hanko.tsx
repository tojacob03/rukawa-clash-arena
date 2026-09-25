// Dōjō date stamp (日付印): a round red seal with the kind of session on top,
// the date across the middle band and 道場 below. In a Japanese dōjō the
// training book gets such a stamp for every session: 稽古 for training,
// 試合 for a competition, 鍛錬 for conditioning. The ink edge is roughened a
// little, as a rubber stamp leaves it on paper.

import { useId } from "react";

export default function Hanko({ kind, date, size = 108, className }: { kind: string; date: string; size?: number; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [y, m, d] = date.split("-");
  const label = `${Number(d)}.${Number(m)}.${y.slice(2)}`;
  // Chord of the inner circle (r = 41) at the band lines, 12 units from the centre.
  const half = Math.sqrt(41 * 41 - 12 * 12);
  return (
    <svg className={`hanko${className ? ` ${className}` : ""}`} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`Gestempelt: ${kind}, ${label}`}>
      <defs>
        <filter id={`${uid}ink`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="rough" />
          {/* Where the rubber took little ink: a few pale specks */}
          <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="1" seed="3" result="blot" />
          <feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.9" result="mask" />
          <feComposite in="rough" in2="mask" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${uid}ink)`} className="hanko-ink">
        <circle cx={50} cy={50} r={44} fill="none" strokeWidth={4.4} />
        <path d={`M${50 - half} 38 H${50 + half} M${50 - half} 62 H${50 + half}`} fill="none" strokeWidth={2.4} />
        <text x={50} y={31} textAnchor="middle" className="hanko-top">
          {kind}
        </text>
        <text x={50} y={55.5} textAnchor="middle" className="hanko-date">
          {label}
        </text>
        <text x={50} y={84} textAnchor="middle" className="hanko-bottom">
          道場
        </text>
      </g>
    </svg>
  );
}
