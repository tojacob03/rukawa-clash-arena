// Scouter: a lens that scans a fighter and reads out the Power Level and
// stats. Original design, static: the only orchestrated motion in the app is
// the chapter end after saving.

import { useEffect, useRef } from "react";
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
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    btn.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Keep focus inside the dialog: it has a single control.
      if (e.key === "Tab") {
        e.preventDefault();
        btn.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      before?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="scouter" role="dialog" aria-modal="true" aria-label={`Scouter: ${target.name}`} onClick={onClose}>
      <div className="scouter-lens" onClick={(e) => e.stopPropagation()}>
        <div className="sc-grid">
          <div className="sc-target" aria-hidden="true">
            {target.portrait}
            <span className="sc-ret tl" />
            <span className="sc-ret tr" />
            <span className="sc-ret bl" />
            <span className="sc-ret br" />
          </div>
          <div className="sc-read">
            <p className="sc-k">Ziel erfasst</p>
            <p className="sc-name">{target.name}</p>
            <p className="sc-k">Power Level</p>
            <p className="sc-pl">{nf0.format(target.power)}</p>
            <p className="sc-tier">{target.tier}</p>
            <ul className="sc-rows">
              {target.rows.map((r) => (
                <li key={r.label}>
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
      <g fill="#16171c">
        <ellipse cx={120} cy={96} rx={46} ry={48} />
        <rect x={110} y={126} width={20} height={26} />
        <path d="M78 150 Q120 141 162 150 Q172 156 170 172 L158 233 L82 233 L70 172 Q68 156 78 150 Z" />
        <path d="M80 160 L62 232 L78 238 L92 176 Z M160 160 L178 232 L162 238 L148 176 Z" />
        <path d="M84 226 L118 226 L114 296 L90 296 Z M122 226 L156 226 L150 296 L126 296 Z" />
      </g>
      <g fill="#f3b000">
        <circle cx={101} cy={104} r={4} />
        <circle cx={139} cy={104} r={4} />
      </g>
    </svg>
  );
}
