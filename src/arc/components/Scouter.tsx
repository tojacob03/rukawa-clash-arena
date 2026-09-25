// Scouter: a lens that scans a fighter and reads out the Power Level and
// stats. Original design; the count-up and scan lines stop for reduced motion.

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { nf0 } from "../format.ts";

export interface ScanRow {
  label: string;
  value: string;
  /** 0 … 100, drawn as a bar. */
  bar?: number;
}

export interface ScanTarget {
  name: string;
  power: number;
  tier: string;
  portrait: ReactNode;
  rows: ScanRow[];
  foot?: string;
}

export default function Scouter({ target, onClose }: { target: ScanTarget; onClose: () => void }) {
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [n, setN] = useState(reduce ? target.power : 0);
  const [done, setDone] = useState(!!reduce);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    btn.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const e = t - t0 - 450;
      if (e < 0) {
        setN(Math.floor(Math.random() * 99999));
      } else {
        const p = Math.min(1, e / 1100);
        const eased = 1 - Math.pow(1 - p, 3);
        const jitter = p < 1 ? Math.round((Math.random() - 0.5) * target.power * 0.04 * (1 - p)) : 0;
        setN(Math.max(0, Math.round(target.power * eased) + jitter));
        if (p >= 1) {
          setDone(true);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target.power, reduce]);

  return (
    <div className="scouter" role="dialog" aria-modal="true" aria-label={`Scouter: ${target.name}`} onClick={onClose}>
      <div className={`scouter-lens${done ? " locked" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="sc-lines" aria-hidden="true" />
        <div className="sc-grid">
          <div className="sc-target" aria-hidden="true">
            {target.portrait}
            <span className="sc-ret tl" />
            <span className="sc-ret tr" />
            <span className="sc-ret bl" />
            <span className="sc-ret br" />
            <span className="sc-beam" />
          </div>
          <div className="sc-read">
            <p className="sc-k">{done ? "Ziel erfasst" : "Scanne …"}</p>
            <p className="sc-name">{target.name}</p>
            <p className="sc-k">Power Level</p>
            <p className="sc-pl" aria-live="polite">
              {nf0.format(n)}
            </p>
            <p className="sc-tier">{done ? target.tier : " "}</p>
            <ul className="sc-rows">
              {target.rows.map((r, i) => (
                <li key={r.label} className={done ? "on" : ""} style={{ transitionDelay: `${i * 70}ms` }}>
                  <span>{r.label}</span>
                  <b>{r.value}</b>
                  {r.bar !== undefined ? (
                    <i aria-hidden="true">
                      <em style={{ width: `${Math.max(0, Math.min(100, r.bar))}%` }} />
                    </i>
                  ) : null}
                </li>
              ))}
            </ul>
            {target.foot ? <p className="sc-foot">{target.foot}</p> : null}
          </div>
        </div>
        <button ref={btn} type="button" className="sc-close" onClick={onClose}>
          Scouter abnehmen
        </button>
      </div>
    </div>
  );
}

/** Dark silhouette for opponents. */
export function Silhouette({ size = 180 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 4) / 3} viewBox="0 0 240 320" className="avatar silhouette">
      <g fill="#0b1f14">
        <ellipse cx={120} cy={96} rx={46} ry={48} />
        <rect x={110} y={126} width={20} height={26} />
        <path d="M78 150 Q120 141 162 150 Q172 156 170 172 L158 233 L82 233 L70 172 Q68 156 78 150 Z" />
        <path d="M80 160 L62 232 L78 238 L92 176 Z M160 160 L178 232 L162 238 L148 176 Z" />
        <path d="M84 226 L118 226 L114 296 L90 296 Z M122 226 L156 226 L150 296 L126 296 Z" />
      </g>
      <g fill="#57f287" opacity={0.9}>
        <circle cx={101} cy={104} r={4} />
        <circle cx={139} cy={104} r={4} />
      </g>
    </svg>
  );
}
