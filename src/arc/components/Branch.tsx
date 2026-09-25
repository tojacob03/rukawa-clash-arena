// The skill tree: a plum branch painted on a washi handscroll (see
// core/branch.ts for how it grows). You pull the scroll sideways with
// momentum, pinch or scroll to zoom, and jump to a sector by its kanji. The
// branch grows once when it is first opened in a visit; with reduced motion it
// is simply there.

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import type { ArcState, SectorId } from "../core/types.ts";
import { COMBOS, SECTOR, TECH, TECHS } from "../core/techniques.ts";
import { LIMB_ORDER, TREE, brushPath, fibres, linePath } from "../core/branch.ts";
import { LEVELS } from "../core/lore.ts";
import { placeLabels } from "../core/labels.ts";
import type { LabelReq, Rect } from "../core/labels.ts";
import { clamp } from "../core/model.ts";
import { reducedMotion } from "../motion.ts";
import { BlossomGlyph } from "./Blossom.tsx";

const { W, H } = TREE;
const PAD = 60;
const WORLD = { x0: -PAD, y0: -PAD, x1: W + PAD, y1: H + PAD };
const MIN_W = 420;
const INK = [0.94, 0.9, 0.8, 0.7];
const R = [7, 9, 10, 11, 12, 13.5];

type Box = { x: number; y: number; w: number; h: number };

/** Where each sector's kanji and caption sit: beside its limb, towards the edge of the scroll. */
const MARKS = TREE.limbs.map((l) => {
  const x = Math.max(40, l.x - 150);
  const y = clamp(l.up ? l.box.y0 + 30 : l.box.y1 - 250, 30, H - 280);
  return { id: l.id, x, y, caption: { x0: x - 6, y0: y + 160, x1: x + 30 + SECTOR[l.id].name.length * 19, y1: y + 240 } as Rect };
});

/** The branch grows once per visit of the app. */
let grown = false;

const STROKES = TREE.strokes.map((s) => ({ ...s, d: brushPath(s), line: linePath(s.pts) }));
const FIBRES = fibres(W, H, 420);
const byX = [...TECHS].sort((a, b) => TREE.buds[a.id].x - TREE.buds[b.id].x);

export default function Branch({ st, selected, onSelect }: { st: ArcState; selected: string | null; onSelect: (id: string) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const vb = useRef<Box>({ x: WORLD.x0, y: WORLD.y0, w: 1200, h: H + 2 * PAD });
  const anim = useRef(0);
  const [view, setView] = useState({ ppu: 0.5, x0: 0, y0: 0, x1: W, y1: H });
  const [growing, setGrowing] = useState(() => !grown && !reducedMotion());
  const miniView = useRef<SVGRectElement>(null);
  const settle = useRef(0);

  useEffect(() => {
    grown = true;
    if (!growing) return;
    const t = window.setTimeout(() => setGrowing(false), 3400);
    return () => window.clearTimeout(t);
  }, [growing]);

  /** Aspect of the stage: the box is as tall as the stage allows, the width follows. */
  const aspect = () => {
    const r = svgRef.current?.getBoundingClientRect();
    return r && r.height ? r.width / r.height : 1.6;
  };

  const limit = (v: Box): Box => {
    const a = aspect();
    const maxW = Math.max(WORLD.x1 - WORLD.x0, (WORLD.y1 - WORLD.y0) * a);
    const w = clamp(v.w, MIN_W, maxW);
    const h = w / a;
    const cx = clamp(v.x + v.w / 2, WORLD.x0 + Math.min(w, WORLD.x1 - WORLD.x0) / 2, WORLD.x1 - Math.min(w, WORLD.x1 - WORLD.x0) / 2);
    const cy = clamp(v.y + v.h / 2, WORLD.y0 + Math.min(h, WORLD.y1 - WORLD.y0) / 2, WORLD.y1 - Math.min(h, WORLD.y1 - WORLD.y0) / 2);
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  };

  const report = useCallback(() => {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const svg = svgRef.current;
      if (!svg) return;
      const v = vb.current;
      const ppu = (svg.getBoundingClientRect().width || 600) / v.w;
      setView({ ppu: Math.round(ppu * 20) / 20, x0: Math.round(v.x), y0: Math.round(v.y), x1: Math.round(v.x + v.w), y1: Math.round(v.y + v.h) });
    }, 90);
  }, []);

  const apply = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const v = vb.current;
    svg.setAttribute("viewBox", `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`);
    const ppu = (svg.getBoundingClientRect().width || 600) / v.w;
    svg.style.setProperty("--fs", `${clamp(12 / ppu, 9, 40).toFixed(2)}px`);
    svg.style.setProperty("--ns", clamp(0.75 / ppu, 1, 2.2).toFixed(3));
    const m = miniView.current;
    if (m) {
      m.setAttribute("x", v.x.toFixed(0));
      m.setAttribute("y", v.y.toFixed(0));
      m.setAttribute("width", v.w.toFixed(0));
      m.setAttribute("height", v.h.toFixed(0));
    }
    report();
  }, [report]);

  const animateTo = useCallback(
    (target: Box, dur = 620) => {
      cancelAnimationFrame(anim.current);
      const to = limit(target);
      const from = { ...vb.current };
      const t0 = performance.now();
      const d = reducedMotion() ? 0 : dur;
      const step = (now: number) => {
        const k = d ? Math.min(1, (now - t0) / d) : 1;
        const e = 1 - Math.pow(1 - k, 3);
        vb.current = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e };
        apply();
        if (k < 1) anim.current = requestAnimationFrame(step);
      };
      anim.current = requestAnimationFrame(step);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apply],
  );

  const zoomAt = useCallback(
    (factor: number, px?: number, py?: number) => {
      const v = vb.current;
      const x = px ?? v.x + v.w / 2;
      const y = py ?? v.y + v.h / 2;
      const w = v.w * factor;
      const k = w / v.w;
      vb.current = limit({ x: x - (x - v.x) * k, y: y - (y - v.y) * k, w, h: v.h * k });
      apply();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apply],
  );

  const flyToSector = useCallback(
    (id: SectorId) => {
      const l = TREE.limbs.find((x) => x.id === id)!;
      const b = l.box;
      const a = aspect();
      const w = Math.max(b.x1 - b.x0 + 220, (b.y1 - b.y0 + 200) * a);
      animateTo({ x: (b.x0 + b.x1) / 2 - w / 2, y: (b.y0 + b.y1) / 2 - w / a / 2, w, h: w / a });
    },
    [animateTo],
  );

  const overview = useCallback(() => {
    const a = aspect();
    const w = Math.max(W + 2 * PAD, (H + 2 * PAD) * a);
    animateTo({ x: WORLD.x0, y: WORLD.y0, w, h: w / a });
  }, [animateTo]);

  // First view: the full height of the scroll, from its beginning.
  useEffect(() => {
    const a = aspect();
    const h = H + 2 * PAD;
    vb.current = limit({ x: WORLD.x0, y: WORLD.y0, w: h * a, h });
    apply();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      vb.current = limit(vb.current);
      apply();
    }) : null;
    if (svgRef.current) ro?.observe(svgRef.current);
    return () => ro?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A technique chosen elsewhere (codex, quest card): bring its bud into view.
  const lastSel = useRef<string | null>(null);
  useEffect(() => {
    if (!selected || selected === lastSel.current || !TREE.buds[selected]) return;
    lastSel.current = selected;
    const b = TREE.buds[selected];
    const v = vb.current;
    const inView = b.x > v.x + v.w * 0.12 && b.x < v.x + v.w * 0.88 && b.y > v.y + v.h * 0.12 && b.y < v.y + v.h * 0.88;
    if (inView) return;
    const w = Math.min(v.w, 1100);
    const a = aspect();
    animateTo({ x: b.x - w / 2, y: b.y - w / a / 2, w, h: w / a });
  }, [selected, animateTo]);

  // Pull, pinch, wheel. A pull keeps its momentum when you let go.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const pts = new Map<number, { x: number; y: number }>();
    let drag: { x: number; y: number; vx: number; vy: number; id: number } | null = null;
    let pinch: { d0: number; w0: number; wx: number; wy: number } | null = null;
    let moved = false;
    let trail: { x: number; y: number; t: number }[] = [];
    let glide = 0;
    const world = (cx: number, cy: number) => {
      const r = svg.getBoundingClientRect();
      const v = vb.current;
      return { x: v.x + ((cx - r.left) / r.width) * v.w, y: v.y + ((cy - r.top) / r.height) * v.h };
    };
    const ppu = () => svg.getBoundingClientRect().width / vb.current.w;
    const down = (e: PointerEvent) => {
      cancelAnimationFrame(glide);
      cancelAnimationFrame(anim.current);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
      trail = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const m = world((a.x + b.x) / 2, (a.y + b.y) / 2);
        pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), w0: vb.current.w, wx: m.x, wy: m.y };
        drag = null;
      } else {
        drag = { x: e.clientX, y: e.clientY, vx: vb.current.x, vy: vb.current.y, id: e.pointerId };
      }
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const w = (pinch.w0 * pinch.d0) / Math.max(d, 1);
        const v = vb.current;
        const k = w / v.w;
        vb.current = limit({ x: pinch.wx - (pinch.wx - v.x) * k, y: pinch.wy - (pinch.wy - v.y) * k, w, h: v.h * k });
        moved = true;
        apply();
        return;
      }
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 6) {
        moved = true;
        try {
          svg.setPointerCapture(drag.id);
        } catch {
          /* pointer already released */
        }
      }
      if (!moved) return;
      const k = ppu();
      vb.current = limit({ ...vb.current, x: drag.vx - dx / k, y: drag.vy - dy / k });
      trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (trail.length > 6) trail.shift();
      apply();
    };
    const up = (e: PointerEvent) => {
      const wasDrag = drag?.id === e.pointerId && moved;
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (drag?.id === e.pointerId) drag = null;
      if (!wasDrag || reducedMotion() || trail.length < 2) return;
      const a = trail[0];
      const b = trail[trail.length - 1];
      const dt = Math.max(16, b.t - a.t);
      if (performance.now() - b.t > 80) return;
      let vx = (b.x - a.x) / dt;
      let vy = (b.y - a.y) / dt;
      let last = performance.now();
      const step = (now: number) => {
        const f = Math.min(3, (now - last) / 16.7);
        last = now;
        const k = ppu();
        vb.current = limit({ ...vb.current, x: vb.current.x - (vx * 16.7 * f) / k, y: vb.current.y - (vy * 16.7 * f) / k });
        apply();
        vx *= Math.pow(0.93, f);
        vy *= Math.pow(0.93, f);
        if (Math.hypot(vx, vy) > 0.02) glide = requestAnimationFrame(step);
      };
      glide = requestAnimationFrame(step);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(anim.current);
      cancelAnimationFrame(glide);
      if (e.ctrlKey || e.metaKey) {
        const p = world(e.clientX, e.clientY);
        zoomAt(Math.exp(e.deltaY * 0.004), p.x, p.y);
        return;
      }
      // A handscroll is read sideways: the wheel pulls it.
      const k = ppu();
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      vb.current = limit({ ...vb.current, x: vb.current.x + dx / k });
      apply();
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
    return () => {
      svg.removeEventListener("pointerdown", down);
      svg.removeEventListener("pointermove", move);
      svg.removeEventListener("pointerup", up);
      svg.removeEventListener("pointercancel", up);
      svg.removeEventListener("wheel", wheel);
      svg.removeEventListener("click", click, true);
      cancelAnimationFrame(glide);
      cancelAnimationFrame(anim.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apply, zoomAt]);

  // Names: as many as fit at this zoom, the most advanced first.
  const labels = useMemo(() => {
    if (view.ppu < 0.34) return {};
    const fs = clamp(12 / view.ppu, 9, 40);
    const reqs: LabelReq[] = [];
    const obstacles: Rect[] = MARKS.map((m) => m.caption);
    for (const x of TECHS) {
      const n = st.nodes[x.id];
      const b = TREE.buds[x.id];
      const r = R[n.level] * clamp(0.75 / view.ppu, 1, 2.2) + 3;
      obstacles.push({ x0: b.x - r, y0: b.y - r, x1: b.x + r, y1: b.y + r, owner: x.id });
      if (n.fog) continue;
      const prio = (x.id === selected ? 1000 : 0) + n.level * 20 + (n.rust ? 5 : 0) + (x.tier === 0 ? 30 : 0);
      reqs.push({ id: x.id, text: x.name, x: b.x, y: b.y, prio, force: x.id === selected });
    }
    return placeLabels(reqs, fs, obstacles, { x0: view.x0, y0: view.y0, x1: view.x1, y1: view.y1 });
  }, [view, st, selected]);

  const sel = selected ? TREE.buds[selected] : null;
  const selTech = selected ? TECH[selected] : null;

  return (
    <div className="scroll-stage" ref={stage}>
      <div className="scroll-tools">
        <div className="limb-index" role="group" aria-label="Zum Sektor">
          {LIMB_ORDER.map((id) => (
            <button key={id} type="button" className="limb-btn" onClick={() => flyToSector(id)}>
              <span className="lk" aria-hidden="true">
                {SECTOR[id].kanji}
              </span>
              <span className="ln">{SECTOR[id].name}</span>
            </button>
          ))}
        </div>
        <div className="zoom-btns">
          <button type="button" className="tool icon" aria-label="Herauszoomen" onClick={() => animateTo({ ...vb.current, x: vb.current.x - vb.current.w * 0.2, y: vb.current.y - vb.current.h * 0.2, w: vb.current.w * 1.4, h: vb.current.h * 1.4 }, 360)}>
            <Minus size={16} />
          </button>
          <button type="button" className="tool icon" aria-label="Hineinzoomen" onClick={() => animateTo({ ...vb.current, x: vb.current.x + vb.current.w * 0.15, y: vb.current.y + vb.current.h * 0.15, w: vb.current.w * 0.7, h: vb.current.h * 0.7 }, 360)}>
            <Plus size={16} />
          </button>
          <button type="button" className="tool icon" aria-label="Ganze Rolle" onClick={overview}>
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
      <svg ref={svgRef} className={`scroll${growing ? " growing" : ""}`} viewBox={`${WORLD.x0} ${WORLD.y0} 1200 ${H + 2 * PAD}`} role="group" aria-label="Skilltree: der Zweig deiner Techniken">
        <defs>
          <linearGradient id="roller" x1="0" x2="1">
            <stop offset="0" stopColor="#2a1a10" />
            <stop offset="0.45" stopColor="#6b4428" />
            <stop offset="1" stopColor="#1f130b" />
          </linearGradient>
          <linearGradient id="curl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6b4a24" stopOpacity="0.16" />
            <stop offset="0.06" stopColor="#6b4a24" stopOpacity="0" />
            <stop offset="0.94" stopColor="#6b4a24" stopOpacity="0" />
            <stop offset="1" stopColor="#6b4a24" stopOpacity="0.2" />
          </linearGradient>
          {growing ? (
            <mask id="grow-mask" maskUnits="userSpaceOnUse" x={WORLD.x0} y={WORLD.y0} width={WORLD.x1 - WORLD.x0} height={WORLD.y1 - WORLD.y0}>
              <g className="gm">
                {STROKES.map((s) => (
                  <path key={s.id} d={s.line} pathLength={1} strokeWidth={s.w0 * 1.9 + 8} style={{ "--d": `${(s.at * 2.2).toFixed(2)}s`, "--t": `${[1.3, 0.9, 0.6, 0.3][s.depth]}s` } as CSSProperties} />
                ))}
              </g>
            </mask>
          ) : null}
        </defs>
        <Paper />
        <g mask={growing ? "url(#grow-mask)" : undefined}>
          {STROKES.map((s) => (
            <path key={s.id} className={`ink d${s.depth}`} d={s.d} fillOpacity={INK[s.depth]} />
          ))}
        </g>
        <SectorMarks st={st} />
        {sel && selTech ? <Threads id={selTech.id} st={st} /> : null}
        <g>
          {byX.map((x) => {
            const n = st.nodes[x.id];
            const b = TREE.buds[x.id];
            return (
              <g
                key={x.id}
                className={`bud l${n.level}${n.rust ? " rust" : ""}${n.fog ? " fog" : ""}${x.id === selected ? " sel" : ""}`}
                transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`}
                tabIndex={n.fog ? -1 : 0}
                role="button"
                aria-label={n.fog ? "Unentdeckte Technik" : `${x.name}, Stufe ${n.level} ${LEVELS[n.level]}${n.rust ? ", rostet" : ""}`}
                onClick={() => !n.fog && onSelect(x.id)}
                onKeyDown={(e) => {
                  if (!n.fog && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelect(x.id);
                  }
                }}
                onFocus={() => {
                  const v = vb.current;
                  if (b.x < v.x || b.x > v.x + v.w || b.y < v.y || b.y > v.y + v.h) animateTo({ ...v, x: b.x - v.w / 2, y: b.y - v.h / 2 }, 300);
                }}
              >
                <title>{n.fog ? "Unentdeckt" : `${x.name}, ${LEVELS[n.level]}`}</title>
                <g className="bud-in">
                  <g className="bud-open" style={{ "--d": `${(b.at * 2.2 + 0.25).toFixed(2)}s` } as CSSProperties}>
                    <circle className="hit" r={22} />
                    {!n.fog && n.level >= 1 && n.level <= 4 && n.prog > 0.02 ? <Progress r={R[n.level] + 4} p={n.prog} /> : null}
                    <BlossomGlyph level={n.level} rust={n.rust} prov={n.prov} fog={n.fog} deg={b.deg} r={R[n.level]} />
                    {x.id === selected ? <Enso r={R[n.level] + 10} /> : null}
                  </g>
                </g>
              </g>
            );
          })}
        </g>
        <g className="bud-lbls" aria-hidden="true">
          {Object.values(labels).map((l) => (
            <text key={l.id} className={`bud-lbl${st.nodes[l.id].level >= 4 ? " hi" : ""}${l.id === selected ? " on" : ""}`} x={l.x} y={l.y} textAnchor={l.anchor}>
              {TECH[l.id].name}
            </text>
          ))}
        </g>
      </svg>
      <Minimap st={st} viewRef={miniView} onGo={(x, y) => animateTo({ ...vb.current, x: x - vb.current.w / 2, y: y - vb.current.h / 2 }, 300)} />
    </div>
  );
}

/** The washi: warm paper with its fibres, the rollers at both ends, a little curl at the edges. */
const Paper = memo(function Paper() {
  return (
    <g className="paper" aria-hidden="true">
      <rect x={0} y={0} width={W} height={H} className="washi" />
      <g className="fibre">
        {FIBRES.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <rect x={0} y={0} width={W} height={H} fill="url(#curl)" />
      {[0, W].map((x) => (
        <g key={x}>
          <rect x={x - 13} y={-26} width={26} height={H + 52} rx={4} fill="url(#roller)" />
          <rect x={x - 16} y={-44} width={32} height={20} rx={3} className="jiku" />
          <rect x={x - 16} y={H + 24} width={32} height={20} rx={3} className="jiku" />
        </g>
      ))}
    </g>
  );
});

/** Each sector's kanji, written large and pale beside its limb, with its value on the hexagon. */
function SectorMarks({ st }: { st: ArcState }) {
  return (
    <g className="sector-marks" aria-hidden="true">
      {MARKS.map((m) => (
        <g key={m.id} transform={`translate(${m.x.toFixed(0)} ${m.y.toFixed(0)})`}>
          <text className="sm-kanji" y={150}>
            {SECTOR[m.id].kanji}
          </text>
          <text className="sm-name" y={196}>
            {SECTOR[m.id].name}
          </text>
          <text className="sm-val" y={232}>
            {Math.round(st.attrs[m.id].val)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** A thin arc of progress to the next level. */
function Progress({ r, p }: { r: number; p: number }) {
  const C = 2 * Math.PI * r;
  return <circle className="bud-prog" r={r} strokeDasharray={`${(p * C).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90)" />;
}

/** The ensō: one brush circle, not quite closed, around the chosen technique. */
function Enso({ r }: { r: number }) {
  const a0 = -80;
  const a1 = 250;
  const pts: string[] = [];
  for (let a = a0; a <= a1; a += 10) {
    const rr = r * (1 + 0.04 * Math.sin((a * Math.PI) / 50));
    pts.push(`${(Math.cos((a * Math.PI) / 180) * rr).toFixed(1)} ${(Math.sin((a * Math.PI) / 180) * rr).toFixed(1)}`);
  }
  return <path className="enso" d={`M${pts.join("L")}`} />;
}

/** From the chosen technique: gold threads to what it builds on, red ones to its combos. */
function Threads({ id, st }: { id: string; st: ArcState }) {
  const b = TREE.buds[id];
  const pre = TECH[id].pre.filter((p) => TREE.buds[p] && !st.nodes[p].fog);
  const combos = COMBOS.filter(([a, c]) => a === id || c === id)
    .map(([a, c]) => (a === id ? c : a))
    .filter((o) => TREE.buds[o] && !st.nodes[o].fog);
  const curve = (o: string) => {
    const a = TREE.buds[o];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - Math.min(160, Math.abs(a.x - b.x) * 0.25);
    return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  };
  return (
    <g className="threads" aria-hidden="true">
      {pre.map((p) => (
        <path key={`p${p}`} className="thread pre" d={curve(p)} />
      ))}
      {combos.map((c) => (
        <path key={`c${c}`} className={`thread combo${st.nodes[c].level >= 3 && st.nodes[id].level >= 3 ? " lit" : ""}`} d={curve(c)} />
      ))}
    </g>
  );
}

/** The whole scroll in miniature, with the part you see; tap or drag to go there. */
function Minimap({ st, viewRef, onGo }: { st: ArcState; viewRef: React.RefObject<SVGRectElement | null>; onGo: (x: number, y: number) => void }) {
  const go = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onGo(WORLD.x0 + ((e.clientX - r.left) / r.width) * (WORLD.x1 - WORLD.x0), WORLD.y0 + ((e.clientY - r.top) / r.height) * (WORLD.y1 - WORLD.y0));
  };
  return (
    <svg
      className="scroll-mini"
      viewBox={`${WORLD.x0} ${WORLD.y0} ${WORLD.x1 - WORLD.x0} ${WORLD.y1 - WORLD.y0}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        go(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons) go(e);
      }}
    >
      <rect x={0} y={0} width={W} height={H} className="mini-paper" />
      {STROKES.filter((s) => s.depth <= 2).map((s) => (
        <path key={s.id} d={s.d} className="mini-ink" />
      ))}
      {TECHS.map((x) => {
        const n = st.nodes[x.id];
        if (n.fog || n.level < 3) return null;
        const b = TREE.buds[x.id];
        return <circle key={x.id} cx={b.x} cy={b.y} r={16} className={`mini-bud l${n.level}${n.rust ? " rust" : ""}`} />;
      })}
      <rect ref={viewRef} className="mini-view" x={0} y={0} width={1} height={1} />
    </svg>
  );
}
