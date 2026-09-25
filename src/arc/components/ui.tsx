import type { ReactNode } from "react";
import { Crosshair, Hammer, Repeat, Shield } from "lucide-react";
import type { Belt as BeltId, QuestKind } from "../core/types.ts";
import { LEVELS, QUEST } from "../core/lore.ts";
import { BELT } from "../format.ts";

export function Belt({ belt, stripes, width = 96 }: { belt: BeltId; stripes: number; width?: number }) {
  const b = BELT[belt];
  return (
    <svg className="belt" width={width} height={(width / 96) * 16} viewBox="0 0 96 16" role="img" aria-label={`${b.name}gurt, ${stripes} Streifen`}>
      <rect x="0.5" y="2.5" width="95" height="11" rx="2" fill={b.color} stroke="rgba(255,255,255,.28)" />
      <rect x="64" y="2.5" width="24" height="11" fill={b.bar} />
      {Array.from({ length: Math.min(4, stripes) }, (_, i) => (
        <rect key={i} x={83 - i * 5.2} y="2.5" width="2.6" height="11" fill="#f6f3ea" />
      ))}
    </svg>
  );
}

export function Seg<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { v: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          role="radio"
          aria-checked={o.v === value}
          title={o.title}
          className={o.v === value ? "on" : ""}
          onClick={() => onChange(o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 30,
  label,
  big,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  big?: boolean;
}) {
  return (
    <div className={`stepper${big ? " big" : ""}`} role="group" aria-label={label}>
      <button type="button" aria-label={`${label} weniger`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label={`${label} mehr`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  );
}

export function SecTitle({ kanji, eyebrow, title, children }: { kanji: string; eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="sec-title">
      <span className="wm" aria-hidden="true">
        {kanji}
      </span>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children ? <p className="lede">{children}</p> : null}
    </header>
  );
}

export function LevelPill({ level, rust, prov }: { level: number; rust?: boolean; prov?: boolean }) {
  return (
    <span className="pills">
      <span className={`pill l${level}`} aria-label={`Stufe ${level}, ${LEVELS[level]}`}>
        <b aria-hidden="true">{level}</b> {LEVELS[level]}
      </span>
      {rust ? <span className="pill rust">Rost</span> : null}
      {prov ? <span className="pill prov">vorläufig</span> : null}
    </span>
  );
}

const KIND_ICON = { kata: Repeat, jagd: Crosshair, stand: Shield, schmiede: Hammer };

export function KindBadge({ kind }: { kind: QuestKind }) {
  const q = QUEST[kind];
  const Icon = KIND_ICON[kind];
  return (
    <span className={`kind k-${kind}`}>
      <b aria-hidden="true">
        <Icon size={12} strokeWidth={2.5} />
      </b>
      {q.name}
    </span>
  );
}

/** Hero panel: thick ink frame, cut corner, halftone, hard ink offset. One per screen. */
export function HeroKoma({ children, className, ai, label }: { children: ReactNode; className?: string; ai?: boolean; label?: string }) {
  return (
    <section className={`hero-koma${className ? ` ${className}` : ""}`} aria-label={label}>
      <div className="hk-frame">
        <div className={`hk-in${ai ? " ai" : ""}`}>{children}</div>
      </div>
    </section>
  );
}

/** Two badges for a change of level, instead of an arrow. */
export function LvlStep({ from, to, label }: { from: number; to: number; label: string }) {
  return (
    <span className="lvl-step" aria-label={`${label} ${to}, vorher ${from}`}>
      <span aria-hidden="true">{from}</span>
      <span aria-hidden="true">{to}</span>
    </span>
  );
}

/** Tiny level glyph used in lists. */
export function Star({ level, rust, prov, fog, size = 18 }: { level: number; rust?: boolean; prov?: boolean; fog?: boolean; size?: number }) {
  const r = fog ? 3 : [6, 6.5, 7, 7.5, 8, 9][level];
  return (
    <svg className="star-ico" width={size} height={size} viewBox="-11 -11 22 22" aria-hidden="true">
      <g className={`n l${level}${rust ? " rust" : ""}${prov ? " prov" : ""}${fog ? " fog" : ""}`}>
        <circle className="n-core" r={r} />
      </g>
    </svg>
  );
}
