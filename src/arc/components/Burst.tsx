import { useEffect, useRef } from "react";

export interface BurstEvent {
  kicker: string;
  title: string;
  lines: string[];
  tone: "gold" | "ai" | "beni";
}

/** Full-screen moment for level-ups, a new Tokui-Waza or a seal. */
export default function Burst({ ev, onClose }: { ev: BurstEvent; onClose: () => void }) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    btn.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div className={`burst tone-${ev.tone}`} role="dialog" aria-modal="true" aria-label={ev.title} onClick={onClose}>
      <div className="burst-lines" aria-hidden="true" />
      <div className="burst-sparks" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} style={{ ["--a" as string]: `${i * 26}deg`, ["--d" as string]: `${(i % 5) * 60}ms` }} />
        ))}
      </div>
      <div className="burst-card" onClick={(e) => e.stopPropagation()}>
        <p className="burst-kicker">{ev.kicker}</p>
        <h2 className="burst-title" data-text={ev.title}>
          {ev.title}
        </h2>
        <ul>
          {ev.lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <button ref={btn} type="button" className="btn primary" onClick={onClose}>
          <span>Weiter</span>
        </button>
      </div>
    </div>
  );
}
