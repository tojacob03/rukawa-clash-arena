// Wanted poster ("Steckbrief") with your bounty. The wanted poster is an old
// western and pirate trope; layout and wording here are original. It is a
// printed sheet nailed to a post: torn edges (each poster its own), folded
// once across and once down, the photo printed in warm ink, the bounty set
// large, and the council's red seal stamped over the corner of the photo.

import { useId, useMemo } from "react";
import type { ReactNode } from "react";
import { nf0 } from "../format.ts";

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A torn outline as a clip-path: small bites out of every edge, the same for the same name. */
function tornEdge(seed: number) {
  let s = seed | 0;
  // mulberry32
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pts: string[] = [];
  const edge = (from: [number, number], to: [number, number], inward: [number, number], steps: number, depth: number) => {
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const d = rnd() * depth;
      pts.push(`calc(${(from[0] + (to[0] - from[0]) * t).toFixed(2)}% + ${(inward[0] * d).toFixed(1)}px) calc(${(from[1] + (to[1] - from[1]) * t).toFixed(2)}% + ${(inward[1] * d).toFixed(1)}px)`);
    }
  };
  edge([0, 0], [100, 0], [0, 1], 22, 3.2);
  edge([100, 0], [100, 100], [-1, 0], 30, 2.6);
  edge([100, 100], [0, 100], [0, -1], 22, 3.4);
  edge([0, 100], [0, 0], [1, 0], 30, 2.6);
  return `polygon(${pts.join(", ")})`;
}

/** The council's seal: 懸賞, "reward offered", in a red square, the ink edge a little rough. */
function Seal() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg className="w-seal" viewBox="0 0 60 88" aria-hidden="true">
      <defs>
        <filter id={`${uid}ink`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="2" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.25" numOctaves="1" seed="5" result="blot" />
          <feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.8" result="mask" />
          <feComposite in="rough" in2="mask" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${uid}ink)`} className="w-seal-ink">
        <rect x={3} y={3} width={54} height={82} rx={3} fill="none" strokeWidth={4} />
        <text x={30} y={40} textAnchor="middle">
          懸
        </text>
        <text x={30} y={75} textAnchor="middle">
          賞
        </text>
      </g>
    </svg>
  );
}

/** The nail it hangs from. */
function Nail() {
  return (
    <svg className="w-nail" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx={10} cy={10} r={6.5} fill="#2a211b" />
      <circle cx={10} cy={10} r={6.5} fill="none" stroke="#0e0b09" strokeWidth={1.2} />
      <path d="M6.6 8.2 A4.2 4.2 0 0 1 10.6 5.8" fill="none" stroke="#8c7a66" strokeWidth={1.3} strokeLinecap="round" />
    </svg>
  );
}

export default function Wanted({ name, bounty, portrait, line }: { name: string; bounty: number; portrait: ReactNode; line: string }) {
  const seed = hash(name);
  const clip = useMemo(() => tornEdge(seed), [seed]);
  // A poster number, the same for the same name.
  const no = String(seed % 9000 + 1000);
  return (
    <div className="wanted-post">
      <figure className="wanted" style={{ clipPath: clip }} aria-label={`Steckbrief ${name}, Kopfgeld ${nf0.format(bounty)} Gold`}>
        <p className="w-title">Gesucht</p>
        <p className="w-sub">auf jeder Matte der vier Meere</p>
        <div className="w-photo">
          {portrait}
          <Seal />
        </div>
        <p className="w-name">{name}</p>
        <p className="w-label">Kopfgeld</p>
        <p className="w-bounty">
          <svg className="w-coin" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx={10} cy={10} r={8} fill="none" stroke="currentColor" strokeWidth={2.2} />
            <circle cx={10} cy={10} r={3.2} fill="none" stroke="currentColor" strokeWidth={2} />
          </svg>
          {nf0.format(bounty)}
          <small>Gold</small>
        </p>
        <figcaption className="w-line">{line}</figcaption>
        <p className="w-fine">Ausgestellt vom Rat der vier Meere, Nr. {no}</p>
      </figure>
      <Nail />
    </div>
  );
}
