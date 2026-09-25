import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import type { ArcState, SectorId } from "../core/types.ts";
import { COMBOS, SECTORS, TECHS } from "../core/techniques.ts";
import { POS, RING_R, VIEW, polar, sectorAngle } from "../core/layout.ts";
import { LEVELS, RINGS } from "../core/lore.ts";
import { clamp } from "../core/model.ts";

const VB0 = { x: -VIEW, y: -VIEW, w: 2 * VIEW, h: 2 * VIEW };
const MIN_W = 260;
const CORE_R = [8, 9, 10, 11, 12.5, 14.5];
const REDUCED = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type Box = typeof VB0;

export default function StarMap({
  st,
  selected,
  onSelect,
  pulse = [],
}: {
  st: ArcState;
  selected: string | null;
  onSelect: (id: string) => void;
  pulse?: string[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const vb = useRef<Box>({ ...VB0 });
  const anim = useRef(0);
  const [focus, setFocus] = useState<SectorId | null>(null);

  const apply = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const v = vb.current;
    svg.setAttribute("viewBox", `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`);
    const ppu = (svg.getBoundingClientRect().width || 600) / v.w;
    const ns = clamp(0.6 / ppu, 1, 2.6);
    svg.style.setProperty("--fs", `${clamp(11.5 / ppu, 8, 24).toFixed(2)}px`);
    svg.style.setProperty("--ns", ns.toFixed(3));
    svg.style.setProperty("--lo", `${(14.5 * ns + 5 / ppu).toFixed(1)}px`);
    svg.style.setProperty("--ss", `${clamp(13 / ppu, 20, 46).toFixed(1)}px`);
    svg.classList.toggle("show-lbl", ppu >= 0.55);
    svg.classList.toggle("zoomed", v.w < VB0.w - 1);
  }, []);

  const animateTo = useCallback(
    (target: Box) => {
      cancelAnimationFrame(anim.current);
      const from = { ...vb.current };
      const t0 = performance.now();
      const dur = REDUCED ? 0 : 420;
      const step = (now: number) => {
        const k = dur ? Math.min(1, (now - t0) / dur) : 1;
        const e = 1 - Math.pow(1 - k, 3);
        vb.current = {
          x: from.x + (target.x - from.x) * e,
          y: from.y + (target.y - from.y) * e,
          w: from.w + (target.w - from.w) * e,
          h: from.h + (target.h - from.h) * e,
        };
        apply();
        if (k < 1) anim.current = requestAnimationFrame(step);
      };
      anim.current = requestAnimationFrame(step);
    },
    [apply],
  );

  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      const v = vb.current;
      const w = clamp(v.w * factor, MIN_W, VB0.w);
      if (w >= VB0.w - 1) {
        vb.current = { ...VB0 };
        setFocus(null);
        apply();
        return;
      }
      const px = cx ?? v.x + v.w / 2;
      const py = cy ?? v.y + v.h / 2;
      const k = w / v.w;
      vb.current = { x: px - (px - v.x) * k, y: py - (py - v.y) * k, w, h: w };
      apply();
    },
    [apply],
  );

  const focusSector = useCallback(
    (id: SectorId) => {
      const ids = TECHS.filter((x) => x.sector === id || (x.sector === "fund" && x.dir === id)).map((x) => POS[x.id]);
      const xs = ids.map((p) => p.x);
      const ys = ids.map((p) => p.y);
      const x0 = Math.min(...xs) - 80;
      const x1 = Math.max(...xs) + 80;
      const y0 = Math.min(...ys) - 70;
      const y1 = Math.max(...ys) + 95;
      const size = Math.max(x1 - x0, y1 - y0);
      setFocus(id);
      animateTo({ x: (x0 + x1) / 2 - size / 2, y: (y0 + y1) / 2 - size / 2, w: size, h: size });
    },
    [animateTo],
  );

  // Centre on the selected star when it is chosen from outside the map (codex, quest card).
  const lastSel = useRef<string | null>(null);
  useEffect(() => {
    if (!selected || selected === lastSel.current) return;
    lastSel.current = selected;
    const p = POS[selected];
    const v = vb.current;
    const inView = p.x > v.x + v.w * 0.1 && p.x < v.x + v.w * 0.9 && p.y > v.y + v.h * 0.1 && p.y < v.y + v.h * 0.9;
    if (v.w < VB0.w - 1 && inView) return;
    const w = Math.min(v.w, 620);
    animateTo({ x: p.x - w / 2, y: p.y - w / 2, w, h: w });
  }, [selected, animateTo]);

  // Pointer: drag to pan when zoomed, pinch to zoom, wheel to zoom.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    apply();
    const pts = new Map<number, { x: number; y: number }>();
    let drag: { x: number; y: number; vx: number; vy: number; id: number } | null = null;
    let pinch: { d0: number; w0: number; wx: number; wy: number } | null = null;
    let moved = false;
    const world = (clientX: number, clientY: number) => {
      const r = svg.getBoundingClientRect();
      const v = vb.current;
      return { x: v.x + ((clientX - r.left) / r.width) * v.w, y: v.y + ((clientY - r.top) / r.height) * v.h };
    };
    const down = (e: PointerEvent) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const m = world((a.x + b.x) / 2, (a.y + b.y) / 2);
        pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), w0: vb.current.w, wx: m.x, wy: m.y };
        drag = null;
      } else if (vb.current.w < VB0.w - 1) {
        drag = { x: e.clientX, y: e.clientY, vx: vb.current.x, vy: vb.current.y, id: e.pointerId };
      }
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const w = clamp((pinch.w0 * pinch.d0) / Math.max(d, 1), MIN_W, VB0.w);
        const k = w / vb.current.w;
        const v = vb.current;
        vb.current = { x: pinch.wx - (pinch.wx - v.x) * k, y: pinch.wy - (pinch.wy - v.y) * k, w, h: w };
        moved = true;
        apply();
        return;
      }
      if (!drag) return;
      const r = svg.getBoundingClientRect();
      const ppu = r.width / vb.current.w;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 5) {
        moved = true;
        try {
          svg.setPointerCapture(drag.id);
        } catch {
          /* pointer already released */
        }
      }
      if (moved) {
        vb.current = { ...vb.current, x: drag.vx - dx / ppu, y: drag.vy - dy / ppu };
        apply();
      }
    };
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (drag?.id === e.pointerId) drag = null;
      if (vb.current.w >= VB0.w - 1) setFocus(null);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = world(e.clientX, e.clientY);
      cancelAnimationFrame(anim.current);
      zoomAt(Math.exp(e.deltaY * 0.0015), p.x, p.y);
    };
    const click = (e: MouseEvent) => {
      if (moved) {
        moved = false;
        e.stopPropagation();
      }
    };
    svg.addEventListener("pointerdown", down);
    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", up);
    svg.addEventListener("wheel", wheel, { passive: false });
    svg.addEventListener("click", click, true);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => apply()) : null;
    ro?.observe(svg);
    return () => {
      svg.removeEventListener("pointerdown", down);
      svg.removeEventListener("pointermove", move);
      svg.removeEventListener("pointerup", up);
      svg.removeEventListener("pointercancel", up);
      svg.removeEventListener("wheel", wheel);
      svg.removeEventListener("click", click, true);
      ro?.disconnect();
      cancelAnimationFrame(anim.current);
    };
  }, [apply, zoomAt]);

  const statics = useMemo(
    () => (
      <>
        <g>
          {SECTORS.map((s, i) => {
            const c = sectorAngle(s.id);
            const r0 = 44;
            const r1 = 660;
            const [x1, y1] = polar(r0, c - 30);
            const [x2, y2] = polar(r1, c - 30);
            const [x3, y3] = polar(r1, c + 30);
            const [x4, y4] = polar(r0, c + 30);
            return (
              <g key={s.id}>
                <path className={`wedge${i % 2 ? " alt" : ""}`} d={`M${x1} ${y1}L${x2} ${y2}A${r1} ${r1} 0 0 1 ${x3} ${y3}L${x4} ${y4}A${r0} ${r0} 0 0 0 ${x1} ${y1}Z`} />
                <line className="spoke" x1={x1} y1={y1} x2={x2} y2={y2} />
              </g>
            );
          })}
          {RING_R.map((r, i) => {
            const [x, y] = polar(r, -120);
            return (
              <g key={r}>
                <circle className="ring" r={r} />
                <text className="ringlbl" x={x} y={y - 6} textAnchor="middle">
                  {RINGS[i].jp}
                </text>
              </g>
            );
          })}
        </g>
        <defs>
          {SECTORS.map((s) => {
            const c = sectorAngle(s.id);
            const top = Math.sin((c * Math.PI) / 180) < 0;
            const r = top ? 648 : 676;
            const [ax, ay] = polar(r, top ? c - 27 : c + 27);
            const [bx, by] = polar(r, top ? c + 27 : c - 27);
            return <path key={s.id} id={`arc-${s.id}`} d={`M${ax.toFixed(1)} ${ay.toFixed(1)}A${r} ${r} 0 0 ${top ? 1 : 0} ${bx.toFixed(1)} ${by.toFixed(1)}`} />;
          })}
        </defs>
      </>
    ),
    [],
  );

  const hex = SECTORS.map((s) => polar(RING_R[0] + (st.attrs[s.id].val / 100) * (RING_R[4] - RING_R[0]), sectorAngle(s.id)).map((v) => v.toFixed(1)).join(",")).join(" ");
  const pulseSet = new Set(pulse);

  return (
    <div className="map-box">
      <div className="map-tools">
        {SECTORS.map((s) => (
          <button key={s.id} type="button" className={`tool${focus === s.id ? " on" : ""}`} onClick={() => focusSector(s.id)}>
            {s.name}
          </button>
        ))}
        <span className="grow" />
        <button type="button" className="tool icon" aria-label="Hineinzoomen" onClick={() => zoomAt(0.7)}>
          <ZoomIn size={16} />
        </button>
        <button type="button" className="tool icon" aria-label="Herauszoomen" onClick={() => zoomAt(1.45)}>
          <ZoomOut size={16} />
        </button>
        <button
          type="button"
          className="tool icon"
          aria-label="Ganze Karte"
          onClick={() => {
            setFocus(null);
            animateTo({ ...VB0 });
          }}
        >
          <Maximize2 size={16} />
        </button>
      </div>
      <svg ref={svgRef} className="map" viewBox={`${VB0.x} ${VB0.y} ${VB0.w} ${VB0.h}`} role="group" aria-label="Sternkarte der Techniken">
        <defs>
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {statics}
        <polygon className="hexshadow" points={hex} />
        <g>
          {TECHS.flatMap((x) =>
            x.pre.map((p) => {
              const a = st.nodes[p].level;
              const b = st.nodes[x.id].level;
              return (
                <line
                  key={`${p}-${x.id}`}
                  className={`edge${a >= 4 && b >= 4 ? " hot" : a >= 2 && b >= 2 ? " lit" : ""}`}
                  x1={POS[p].x}
                  y1={POS[p].y}
                  x2={POS[x.id].x}
                  y2={POS[x.id].y}
                />
              );
            }),
          )}
        </g>
        <g>
          {COMBOS.map(([a, b]) => {
            const A = POS[a];
            const B = POS[b];
            const on = st.nodes[a].level >= 3 && st.nodes[b].level >= 3;
            const hidden = st.nodes[a].fog || st.nodes[b].fog;
            if (hidden) return null;
            return <path key={`${a}-${b}`} className={`combo${on ? " lit" : ""}`} d={`M${A.x} ${A.y}Q${(A.x + B.x) / 4} ${(A.y + B.y) / 4} ${B.x} ${B.y}`} />;
          })}
        </g>
        <g>
          {TECHS.map((x) => {
            const n = st.nodes[x.id];
            const R = n.fog ? 3.5 : CORE_R[n.level];
            const C = 2 * Math.PI * (R + 4.5);
            const cls = `n l${n.level}${n.rust ? " rust" : ""}${n.prov ? " prov" : ""}${n.fog ? " fog" : ""}${x.id === selected ? " sel" : ""}${pulseSet.has(x.id) ? " pulse" : ""}`;
            return (
              <g
                key={x.id}
                className={cls}
                transform={`translate(${POS[x.id].x.toFixed(1)} ${POS[x.id].y.toFixed(1)})`}
                tabIndex={n.fog ? -1 : 0}
                role="button"
                aria-label={n.fog ? "Unentdeckter Stern" : `${x.name}, Stufe ${n.level} ${LEVELS[n.level]}`}
                onClick={() => onSelect(x.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(x.id);
                  }
                }}
              >
                <title>{n.fog ? "Unentdeckt" : `${x.name}, ${LEVELS[n.level]}`}</title>
                <g className="n-in">
                  <circle className="hit" r="20" />
                  {n.level === 5 && !n.fog ? <TokuiSpikes r={R} /> : null}
                  {!n.fog && n.level >= 1 && n.level <= 4 && n.prog > 0.01 ? (
                    <circle className="n-prog" r={R + 4.5} strokeDasharray={`${(n.prog * C).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90)" />
                  ) : null}
                  <circle className="n-core" r={R} filter={n.level >= 4 && !n.rust && !n.fog ? "url(#glow)" : undefined} />
                  <circle className="n-sel" r={R + 9} />
                </g>
              </g>
            );
          })}
        </g>
        <g aria-hidden="true">
          {TECHS.map((x) => {
            const n = st.nodes[x.id];
            if (n.fog) return null;
            const words = x.name.length > 12 && x.name.includes(" ") ? splitName(x.name) : [x.name];
            return (
              <text key={x.id} className={`lbl${n.level >= 4 ? " hi" : ""}${n.level === 5 ? " tokui" : ""}${x.id === selected ? " on" : ""}`} x={POS[x.id].x} y={POS[x.id].y} textAnchor="middle">
                {words.map((w, i) => (
                  <tspan key={i} x={POS[x.id].x} dy={i === 0 ? "0.85em" : "1.1em"}>
                    {w}
                  </tspan>
                ))}
              </text>
            );
          })}
        </g>
        <g>
          {SECTORS.map((s) => (
            <text key={s.id} className="seclbl" onClick={() => focusSector(s.id)}>
              <textPath href={`#arc-${s.id}`} startOffset="50%" textAnchor="middle">
                {s.name}
              </textPath>
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

/**
 * Tokui-Waza is the last level of the star map (Hiden, the secret teaching):
 * the star shines like the brightest star in the night sky, with diffraction
 * spikes that scintillate, instead of a ring.
 */
function TokuiSpikes({ r }: { r: number }) {
  const ray = (len: number, w: number, deg: number) => <path d={`M0 ${-len} L${w} 0 L0 ${len} L${-w} 0 Z`} transform={`rotate(${deg})`} />;
  return (
    <g className="spikes" aria-hidden="true">
      <g className="spikes-long">
        {ray(r * 3.6, 2.1, 0)}
        {ray(r * 3.6, 2.1, 90)}
      </g>
      <g className="spikes-short">
        {ray(r * 2.2, 1.4, 45)}
        {ray(r * 2.2, 1.4, 135)}
      </g>
    </g>
  );
}

function splitName(name: string) {
  const words = name.split(" ");
  let best = [name];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const d = Math.abs(a.length - b.length);
    if (d < bestDiff) {
      bestDiff = d;
      best = [a, b];
    }
  }
  return best;
}

