// The sea chart as SVG: four seas, the great current with its calm belts,
// the scarlet ridge, islands, your route and your ship.

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { LocateFixed, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import type { Belt, FlagDesign, SeaId } from "../core/types.ts";
import type { Island } from "../core/sea.ts";
import { ISLAND, ISLANDS, SEAS, WORLD, route, shipPos } from "../core/sea.ts";
import { placeLabels } from "../core/labels.ts";
import type { LabelReq, Rect } from "../core/labels.ts";
import type { WeatherKind } from "../core/voyage.ts";
import { ShipArt } from "./ShipArt.tsx";

export interface MapMarks {
  sea: SeaId;
  /** Route index of the island you are at (0 … 24). */
  current: number;
  /** Route index where the app started (belt and stripes at sign-up). */
  start: number;
  /** Tournaments per island id, with the best placement. */
  comps: Record<string, { n: number; best: number }>;
  shipColor: string;
  boss?: string | null;
  /** Ship class follows the belt. */
  belt: Belt;
  flag?: Partial<FlagDesign> | null;
  /** Share of the way to the next island (0 … 0.85). */
  progress: number;
  weather: WeatherKind;
  /** Landmarks found per island id (0 … 3). */
  explored: Record<string, number>;
  /** Ship condition from other sports and rust. */
  hull: number;
  sails: number;
  barnacles: number;
}

const { w: W, h: H, ridgeX: RX, currentY: CY, currentHalf: CH, calm: CALM } = WORLD;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/** Organic island outline from its id. */
function blob(id: string, x: number, y: number, r: number) {
  const n = 11;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.72 + 0.5 * hash(`${id}:${i}`));
    pts.push(`${(x + Math.cos(a) * rr * 1.25).toFixed(1)},${(y + Math.sin(a) * rr * 0.85).toFixed(1)}`);
  }
  return pts.join(" ");
}

function ridgePath(x: number, half: number) {
  const pts: string[] = [];
  for (let y = 0; y <= H; y += 20) pts.push(`${x - half - 6 * hash(`l${x}${y}`)},${y}`);
  for (let y = H; y >= 0; y -= 20) pts.push(`${x + half + 6 * hash(`r${x}${y}`)},${y}`);
  return pts.join(" ");
}

export interface OtherShip {
  id: string;
  name: string;
  sea: SeaId;
  /** Route index of their island. */
  island: number;
  progress: number;
  belt: Belt;
  sail: string;
  flag?: Partial<FlagDesign> | null;
  /** Crewmate (flies the crew flag) or friend. */
  crew: boolean;
}

type Box = { x: number; y: number; w: number };
const MIN_W = 220;
const PAD = 60;
const REDUCED = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const clampN = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

function routePath(r: Island[], from: number, to: number) {
  const seg: string[] = [];
  for (let i = from; i <= to; i++) {
    const p = r[i];
    if (i > from && r[i - 1].id === "c9" && p.id === "c10") {
      // Over the ridge at the east edge, back in at the west edge.
      seg.push(`L${W - 8} ${CY}M8 ${CY}`);
    }
    seg.push(`${i === from ? "M" : "L"}${p.x} ${p.y}`);
  }
  return seg.join(" ");
}

/**
 * The chart with its own camera: drag to move, pinch or wheel to zoom, arrow
 * keys and plus/minus from the keyboard. Labels keep one size on screen and
 * move aside instead of covering each other.
 */
export default function SeaMap({ marks, selected, onSelect, others = [] }: { marks: MapMarks; selected: string | null; onSelect: (id: string) => void; others?: OtherShip[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const miniRef = useRef<SVGRectElement>(null);
  const vb = useRef<Box>({ x: 0, y: 0, w: W });
  const ar = useRef(H / W);
  const anim = useRef(0);
  const [view, setView] = useState({ step: 0, fs: 12 });
  const r = route(marks.sea);
  const next = r[marks.current + 1];
  const pos = shipPos(r, marks.current, marks.progress);

  const maxW = () => Math.max(W, H / ar.current);
  const fit = (v: Box): Box => {
    const w = clampN(v.w, MIN_W, maxW());
    const h = w * ar.current;
    const x = w >= W ? (W - w) / 2 : clampN(v.x, -PAD, W - w + PAD);
    const y = h >= H ? (H - h) / 2 : clampN(v.y, -PAD, H - h + PAD);
    return { x, y, w };
  };

  const apply = useCallback(() => {
    const svg = svgRef.current;
    const el = boxRef.current;
    if (!svg || !el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) ar.current = rect.height / rect.width;
    const v = vb.current;
    const h = v.w * ar.current;
    svg.setAttribute("viewBox", `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${h.toFixed(1)}`);
    const ppu = (rect.width || 800) / v.w;
    svg.style.setProperty("--fs", `${clampN(12.5 / ppu, 6, 40).toFixed(2)}px`);
    svg.style.setProperty("--ss", `${clampN(24 / ppu, 16, 80).toFixed(1)}px`);
    svg.style.setProperty("--ls", `${clampN(11 / ppu, 7, 32).toFixed(2)}px`);
    const mini = miniRef.current;
    if (mini) {
      mini.setAttribute("x", String(v.x));
      mini.setAttribute("y", String(v.y));
      mini.setAttribute("width", String(v.w));
      mini.setAttribute("height", String(h));
    }
    // Relayout labels only when the zoom changed noticeably.
    const step = Math.round(Math.log2(ppu) * 3);
    setView((cur) => (cur.step === step ? cur : { step, fs: clampN(12.5 / ppu, 6, 40) }));
  }, []);

  const animateTo = useCallback(
    (target: Box) => {
      cancelAnimationFrame(anim.current);
      const to = fit(target);
      const from = { ...vb.current };
      const t0 = performance.now();
      const dur = REDUCED ? 0 : 380;
      const tick = (now: number) => {
        const k = dur ? Math.min(1, (now - t0) / dur) : 1;
        const e = 1 - Math.pow(1 - k, 3);
        vb.current = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e };
        apply();
        if (k < 1) anim.current = requestAnimationFrame(tick);
      };
      anim.current = requestAnimationFrame(tick);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apply],
  );

  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      cancelAnimationFrame(anim.current);
      const v = vb.current;
      const w = clampN(v.w * factor, MIN_W, maxW());
      const px = cx ?? v.x + v.w / 2;
      const py = cy ?? v.y + (v.w * ar.current) / 2;
      const k = w / v.w;
      vb.current = fit({ x: px - (px - v.x) * k, y: py - (py - v.y) * k, w });
      apply();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apply],
  );

  const centerOn = useCallback(
    (x: number, y: number, w = vb.current.w) => animateTo({ x: x - w / 2, y: y - (w * ar.current) / 2, w }),
    [animateTo],
  );
  const toShip = useCallback(() => {
    const rect = boxRef.current?.getBoundingClientRect();
    const w = clampN((rect?.width ?? 800) / 1.3, MIN_W, maxW());
    centerOn(pos.x, pos.y, w);
  }, [centerOn, pos.x, pos.y]);
  const toWorld = useCallback(() => animateTo({ x: 0, y: 0, w: maxW() }), [animateTo]);

  // First view: your ship, close enough to read the islands around it.
  useLayoutEffect(() => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (rect && rect.width) ar.current = rect.height / rect.width;
    const w = clampN((rect?.width ?? 800) / 1.3, MIN_W, maxW());
    vb.current = fit({ x: pos.x - w / 2, y: pos.y - (w * ar.current) / 2, w });
    apply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // An island chosen outside the map (route strip, link): bring it into view.
  const lastSel = useRef(selected);
  useEffect(() => {
    if (!selected || selected === lastSel.current) return;
    lastSel.current = selected;
    const is = ISLAND[selected];
    if (!is) return;
    const v = vb.current;
    const h = v.w * ar.current;
    const inView = is.x > v.x + v.w * 0.12 && is.x < v.x + v.w * 0.88 && is.y > v.y + h * 0.12 && is.y < v.y + h * 0.88;
    if (!inView) centerOn(is.x, is.y);
  }, [selected, centerOn]);

  // Pointer, pinch, wheel.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const pts = new Map<number, { x: number; y: number }>();
    let drag: { x: number; y: number; vx: number; vy: number; id: number } | null = null;
    let pinch: { d0: number; w0: number; wx: number; wy: number } | null = null;
    let moved = false;
    const world = (clientX: number, clientY: number) => {
      const rect = svg.getBoundingClientRect();
      const v = vb.current;
      return { x: v.x + ((clientX - rect.left) / rect.width) * v.w, y: v.y + ((clientY - rect.top) / rect.height) * v.w * ar.current };
    };
    const down = (e: PointerEvent) => {
      cancelAnimationFrame(anim.current);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
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
        const w = clampN((pinch.w0 * pinch.d0) / Math.max(d, 1), MIN_W, maxW());
        const k = w / vb.current.w;
        const v = vb.current;
        vb.current = fit({ x: pinch.wx - (pinch.wx - v.x) * k, y: pinch.wy - (pinch.wy - v.y) * k, w });
        moved = true;
        apply();
        return;
      }
      if (!drag) return;
      const ppu = svg.getBoundingClientRect().width / vb.current.w;
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
        vb.current = fit({ ...vb.current, x: drag.vx - dx / ppu, y: drag.vy - dy / ppu });
        apply();
      }
    };
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (drag?.id === e.pointerId) drag = null;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = world(e.clientX, e.clientY);
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
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      vb.current = fit(vb.current);
      apply();
    }) : null;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apply, zoomAt]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const v = vb.current;
    const step = v.w * 0.12;
    const pan: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (pan[e.key]) {
      e.preventDefault();
      cancelAnimationFrame(anim.current);
      vb.current = fit({ ...v, x: v.x + pan[e.key][0], y: v.y + pan[e.key][1] });
      apply();
    } else if (e.key === "+" || e.key === "=") zoomAt(0.75);
    else if (e.key === "-" || e.key === "_") zoomAt(1.33);
    else if (e.key === "0") toWorld();
    else if (e.key === "s" || e.key === "S") toShip();
  };

  // Which labels to show at this zoom, and where.
  const labels = useMemo(() => {
    const fs = view.fs;
    const ppu = 12.5 / fs;
    const reqs: LabelReq[] = [];
    for (const is of ISLANDS) {
      const idx = r.findIndex((x) => x.id === is.id);
      const here = idx === marks.current;
      const isNext = idx === marks.current + 1;
      const special = !!is.kind;
      const onRoute = idx >= 0;
      const show = here || isNext || selected === is.id || special || (onRoute && ppu >= 0.7) || ppu >= 1.15;
      if (!show) continue;
      const prio = here ? 100 : selected === is.id ? 90 : isNext ? 80 : special ? 60 : onRoute ? 40 - Math.abs(idx - marks.current) : 10;
      reqs.push({ id: is.id, text: is.name, x: is.x, y: is.y, prio, force: here || selected === is.id, above: !is.sea && is.y < CY });
    }
    for (const o of others) {
      const p = shipPos(route(o.sea), o.island, o.progress);
      reqs.push({ id: `ship:${o.id}`, text: o.name, x: p.x, y: p.y - 4, prio: 50 });
    }
    const obstacles: Rect[] = [{ x0: pos.x - 34, y0: pos.y - 44, x1: pos.x + 34, y1: pos.y + 8 }];
    return placeLabels(reqs, fs, obstacles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.fs, marks.current, marks.sea, selected, others, pos.x, pos.y]);

  const hitR = Math.max(24, view.fs * 1.9);
  const shipScale = clampN((view.fs / 12.5) * 0.34, 0.34, 0.9);

  return (
    <div className="sea-view" ref={boxRef} tabIndex={0} role="group" aria-label="Seekarte. Ziehen verschiebt, Mausrad oder zwei Finger zoomen. Mit Pfeiltasten verschieben, Plus und Minus zoomen, S zeigt dein Schiff, 0 die ganze Welt." onKeyDown={onKey}>
      <svg ref={svgRef} className="sea-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Seekarte deiner Reise">
        <SeaBackground sea={marks.sea} />

        {/* Home sea routes */}
        {SEAS.map((s) => {
          const pts = [0, 1, 2, 3, 4].map((i) => ISLANDS.find((x) => x.id === `${s.id}${i}`)!);
          const d = `M${pts.map((p) => `${p.x} ${p.y}`).join(" L")} L${RX} ${CY}`;
          return <path key={s.id} d={d} fill="none" stroke="#e9dcc0" strokeWidth={1.4} strokeDasharray="3 6" opacity={s.id === marks.sea ? 0.55 : 0.18} />;
        })}
        {/* Great current route */}
        <path d={routePath(r, 5, 24)} fill="none" stroke="#e9dcc0" strokeWidth={1.4} strokeDasharray="3 6" opacity={0.45} />

        {/* Your journey: before the app dashed, since then solid */}
        {marks.start > 0 ? <path d={routePath(r, 0, Math.min(marks.start, marks.current))} fill="none" stroke="#f1bf57" strokeWidth={3} strokeDasharray="7 6" opacity={0.75} strokeLinecap="round" /> : null}
        {marks.current > marks.start ? <path d={routePath(r, marks.start, marks.current)} fill="none" stroke="#f1bf57" strokeWidth={3.4} strokeLinecap="round" className="sea-trail" /> : null}
        {next ? <path d={routePath(r, marks.current, marks.current + 1)} fill="none" stroke="#ffe39a" strokeWidth={2} strokeDasharray="2 5" className="sea-next" /> : null}
        {next ? <circle cx={next.x} cy={next.y} r={20} fill="none" stroke="#ffe39a" strokeWidth={1.6} strokeDasharray="4 4" opacity={0.85} /> : null}

        {/* Islands */}
        {ISLANDS.map((is) => {
          const idx = r.findIndex((x) => x.id === is.id);
          const onRoute = idx >= 0;
          const state = !onRoute ? "other" : idx < marks.current ? "past" : idx === marks.current ? "here" : "future";
          const comp = marks.comps[is.id];
          const lbl = labels[is.id];
          return (
            <g
              key={is.id}
              className={`isle ${state}${selected === is.id ? " sel" : ""}`}
              role="button"
              tabIndex={onRoute || is.sea ? 0 : -1}
              aria-label={`${is.name}${state === "here" ? ", dein Schiff" : ""}`}
              onClick={() => onSelect(is.id)}
              onFocus={() => {
                const v = vb.current;
                const h = v.w * ar.current;
                if (is.x < v.x || is.x > v.x + v.w || is.y < v.y || is.y > v.y + h) centerOn(is.x, is.y);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(is.id);
                }
              }}
            >
              <circle cx={is.x} cy={is.y} r={hitR} fill="transparent" />
              <IslandGlyph is={is} />
              <title>{is.name}</title>
              {lbl ? (
                <text className="isle-lbl" x={lbl.x} y={lbl.y} textAnchor={lbl.anchor}>
                  {is.name}
                </text>
              ) : null}
              {(marks.explored[is.id] ?? 0) >= 3 ? (
                <g transform={`translate(${is.x - 4} ${is.y - 30})`} className="isle-explored" aria-hidden="true">
                  <path d="M0 0 V16" stroke="#1c1526" strokeWidth={1.6} />
                  <path d="M0 0 L12 4 L0 8 Z" fill="#f3b000" stroke="#1c1526" strokeWidth={1} />
                </g>
              ) : null}
              {comp ? (
                <g transform={`translate(${is.x - 20} ${is.y - 20})`} className="isle-comp">
                  <circle r={8} className={comp.best ? `m${comp.best}` : "m0"} />
                  <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#1c1526" strokeWidth={1.6} strokeLinecap="round" />
                  {comp.n > 1 ? (
                    <text x={8} y={-6} className="isle-comp-n">
                      {comp.n}
                    </text>
                  ) : null}
                </g>
              ) : null}
            </g>
          );
        })}

        {/* Crew and friends */}
        {others.map((o, i) => {
          const p = shipPos(route(o.sea), o.island, o.progress);
          const lbl = labels[`ship:${o.id}`];
          const dx = ((i % 3) - 1) * 10;
          return (
            <g key={o.id} className={`other-ship${o.crew ? " crew" : ""}`}>
              <g transform={`translate(${p.x + dx} ${p.y + 6}) scale(${p.left ? -shipScale * 0.7 : shipScale * 0.7} ${shipScale * 0.7}) translate(-100 -128)`}>
                <ShipArt belt={o.belt} sail={o.sail} flag={o.flag} />
              </g>
              {lbl ? (
                <text className="ship-lbl" x={lbl.x} y={lbl.y} textAnchor={lbl.anchor}>
                  {o.name}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* Boss as a sea monster next to the ship */}
        {marks.boss ? <SeaMonster x={pos.x + 40} y={pos.y + 44} name={marks.boss} /> : null}
        {/* Ship, on its way to the next island */}
        <ShipMark pos={pos} marks={marks} scale={shipScale} />

        <CompassRose x={W - 70} y={H - 110} />
      </svg>

      <div className="sea-tools">
        <button type="button" className="tool icon" aria-label="Hineinzoomen" onClick={() => zoomAt(0.7)}>
          <ZoomIn size={16} />
        </button>
        <button type="button" className="tool icon" aria-label="Herauszoomen" onClick={() => zoomAt(1.4)}>
          <ZoomOut size={16} />
        </button>
        <button type="button" className="tool icon" aria-label="Zu meinem Schiff" onClick={toShip}>
          <LocateFixed size={16} />
        </button>
        <button type="button" className="tool icon" aria-label="Ganze Welt" onClick={toWorld}>
          <Maximize2 size={16} />
        </button>
      </div>

      <svg
        className="sea-mini"
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          centerOn(((e.clientX - rect.left) / rect.width) * W, ((e.clientY - rect.top) / rect.height) * H);
        }}
      >
        <rect width={W} height={H} fill="#0b2442" />
        {SEAS.map((s) => {
          const left = s.id === "frost" || s.id === "abend";
          const top = s.id === "frost" || s.id === "morgen";
          return <rect key={s.id} x={left ? 0 : RX} y={top ? 0 : CY + CH + CALM} width={RX} height={top ? CY - CH - CALM : H - (CY + CH + CALM)} fill={s.color} opacity={s.id === marks.sea ? 0.45 : 0.18} />;
        })}
        <rect x={0} y={CY - CH} width={W} height={CH * 2} fill="#1d5a8f" />
        <rect x={RX - 10} y={0} width={20} height={H} fill="#c7393c" />
        <path d={routePath(r, 0, marks.current)} fill="none" stroke="#f1bf57" strokeWidth={10} strokeLinecap="round" />
        <circle cx={pos.x} cy={pos.y} r={22} fill="#f3b000" stroke="#16171c" strokeWidth={6} />
        <rect ref={miniRef} className="sea-mini-view" x={0} y={0} width={W} height={H} />
      </svg>
    </div>
  );
}

/** Seas, current, calm belts and the ridge: everything that never changes. */
const SeaBackground = memo(function SeaBackground({ sea }: { sea: SeaId }) {
  return (
    <g>
      <defs>
        <linearGradient id="sea-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d2a4a" />
          <stop offset="0.5" stopColor="#0f3358" />
          <stop offset="1" stopColor="#0b2442" />
        </linearGradient>
        <pattern id="sea-waves" width="40" height="22" patternUnits="userSpaceOnUse">
          <path d="M0 12 q5 -5 10 0 t10 0" fill="none" stroke="#2c5b8a" strokeWidth="1" opacity="0.5" />
          <path d="M20 3 q5 -5 10 0 t10 0" fill="none" stroke="#2c5b8a" strokeWidth="1" opacity="0.35" />
        </pattern>
        <pattern id="sea-calm" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.1" fill="#9cc3ff" opacity="0.35" />
          <circle cx="9" cy="9" r="1.1" fill="#9cc3ff" opacity="0.25" />
        </pattern>
        <linearGradient id="sea-ridge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6d1620" />
          <stop offset="0.5" stopColor="#c7393c" />
          <stop offset="1" stopColor="#6d1620" />
        </linearGradient>
        <radialGradient id="sea-gate">
          <stop offset="0" stopColor="#ffe39a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe39a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x={-PAD * 4} y={-PAD * 4} width={W + PAD * 8} height={H + PAD * 8} fill="#0b2442" />
      <rect width={W} height={H} fill="url(#sea-bg)" />
      <rect width={W} height={H} fill="url(#sea-waves)" />

      {SEAS.map((s) => {
        const left = s.id === "frost" || s.id === "abend";
        const top = s.id === "frost" || s.id === "morgen";
        const x = left ? 0 : RX;
        const y = top ? 0 : CY + CH + CALM;
        const h = top ? CY - CH - CALM : H - y;
        const mine = s.id === sea;
        return (
          <g key={s.id}>
            <rect x={x} y={y} width={RX} height={h} fill={s.color} opacity={mine ? 0.13 : 0.06} />
            <text className={`sea-name${mine ? " mine" : ""}`} x={left ? 40 : W - 40} y={top ? 60 : H - 30} textAnchor={left ? "start" : "end"}>
              {s.name}
            </text>
          </g>
        );
      })}

      <rect x={0} y={CY - CH - CALM} width={W} height={CALM} fill="url(#sea-calm)" />
      <rect x={0} y={CY + CH} width={W} height={CALM} fill="url(#sea-calm)" />
      <rect x={0} y={CY - CH} width={W} height={CH * 2} fill="#1d5a8f" opacity={0.55} />
      <g className="sea-flow" fill="none" stroke="#9cc3ff" strokeWidth={1.4} opacity={0.5}>
        {[-24, -8, 8, 24].map((dy) => (
          <path key={dy} d={`M0 ${CY + dy} Q300 ${CY + dy - 10} 600 ${CY + dy} T1200 ${CY + dy}`} strokeDasharray="14 18" />
        ))}
      </g>
      <text className="sea-cur" x={RX + 300} y={CY - CH + 16} textAnchor="middle">
        Äußere Strömung, Blau und Lila
      </text>
      <text className="sea-cur" x={RX - 300} y={CY - CH + 16} textAnchor="middle">
        Tiefe Strömung, Braun und Schwarz
      </text>
      <text className="sea-calm-lbl" x={W / 2 + 180} y={CY - CH - 8}>
        Kalmengürtel
      </text>
      <text className="sea-calm-lbl" x={W / 2 - 300} y={CY + CH + 18}>
        Kalmengürtel
      </text>

      <polygon points={ridgePath(RX, 16)} fill="url(#sea-ridge)" stroke="#3a0b12" strokeWidth={1.5} />
      <polygon points={ridgePath(6, 10)} fill="url(#sea-ridge)" opacity={0.85} />
      <polygon points={ridgePath(W - 6, 10)} fill="url(#sea-ridge)" opacity={0.85} />
      <text className="sea-ridge-lbl" x={RX + 5} y={150} transform={`rotate(90 ${RX + 5} 150)`}>
        Scharlachkamm
      </text>
      <circle cx={RX} cy={CY} r={48} fill="url(#sea-gate)" />
    </g>
  );
});

function IslandGlyph({ is }: { is: Island }): ReactNode {
  const r = is.kind === "kap" ? 13 : is.kind ? 11 : 9 + 3 * hash(is.id);
  if (is.kind === "tor") {
    return (
      <g>
        <path d={`M${is.x - 14} ${is.y + 10} V${is.y - 4} Q${is.x} ${is.y - 22} ${is.x + 14} ${is.y - 4} V${is.y + 10}`} fill="none" stroke="#ffe39a" strokeWidth={4} strokeLinecap="round" />
        <path d={`M${is.x - 14} ${is.y + 10} V${is.y - 4} Q${is.x} ${is.y - 22} ${is.x + 14} ${is.y - 4} V${is.y + 10}`} fill="none" stroke="#6d1620" strokeWidth={1.4} />
      </g>
    );
  }
  if (is.kind === "pass") {
    return <polygon points={`${is.x - 14},${is.y + 8} ${is.x - 4},${is.y - 12} ${is.x + 2},${is.y - 2} ${is.x + 8},${is.y - 14} ${is.x + 16},${is.y + 8}`} fill="#c7393c" stroke="#3a0b12" strokeWidth={1.5} />;
  }
  return (
    <g>
      <polygon points={blob(is.id, is.x, is.y, r + 3)} className="isle-sand" />
      <polygon points={blob(is.id + "g", is.x, is.y - 1, r)} className="isle-green" />
      {is.kind === "hafen" ? <path d={`M${is.x + r} ${is.y + 2} h10 M${is.x + r + 4} ${is.y + 2} v5 M${is.x + r + 9} ${is.y + 2} v5`} stroke="#8a5a2b" strokeWidth={2} /> : null}
      {is.kind === "kap" ? (
        <g>
          <path d={`M${is.x} ${is.y - 4} V${is.y - 26}`} stroke="#1c1526" strokeWidth={1.6} />
          <path d={`M${is.x} ${is.y - 26} h14 l-4 5 l4 5 h-14 Z`} fill="#0c0c10" stroke="#f1bf57" strokeWidth={0.8} />
        </g>
      ) : null}
    </g>
  );
}

function ShipMark({ pos, marks, scale }: { pos: { x: number; y: number; left: boolean }; marks: MapMarks; scale: number }) {
  const back = pos.left ? 1 : -1;
  const wind = { tailwind: 3, breeze: 2, light: 1, calm: 0, dock: 0 }[marks.weather];
  return (
    <g className="ship" aria-hidden="true">
      {Array.from({ length: wind }, (_, i) => (
        <path
          key={i}
          d={`M${pos.x + back * (40 + i * 5)} ${pos.y - 30 + i * 11} q${back * 10} -4 ${back * 24} 0`}
          fill="none"
          stroke="#f2f3ee"
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.75}
        />
      ))}
      {marks.weather === "calm" ? (
        <g fill="none" stroke="#9cc3ff" strokeWidth={1.2} opacity={0.8}>
          <ellipse cx={pos.x} cy={pos.y + 2} rx={40} ry={8} />
          <ellipse cx={pos.x} cy={pos.y + 2} rx={54} ry={12} strokeDasharray="3 5" />
        </g>
      ) : null}
      <g transform={`translate(${pos.x} ${pos.y}) scale(${pos.left ? -scale : scale} ${scale}) translate(-100 -128)`}>
        <ShipArt belt={marks.belt} sail={marks.shipColor} flag={marks.flag} hull={marks.hull} sails={marks.sails} barnacles={marks.barnacles} />
      </g>
      <path d={`M${pos.x - 36} ${pos.y + 5} q6 -3 12 0 t12 0 t12 0 t12 0 t12 0 t12 0`} fill="none" stroke="#9cc3ff" strokeWidth={1.2} opacity={0.8} />
    </g>
  );
}

function SeaMonster({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <g className="monster" transform={`translate(${x} ${y})`}>
      <path d="M-18 10 Q-14 -8 -4 0 Q2 6 6 -6 Q10 -18 18 -8" fill="none" stroke="#7d4fbb" strokeWidth={6} strokeLinecap="round" />
      <path d="M-18 10 Q-14 -8 -4 0 Q2 6 6 -6 Q10 -18 18 -8" fill="none" stroke="#b48be0" strokeWidth={2} strokeLinecap="round" />
      <circle cx={17} cy={-10} r={1.6} fill="#ffe39a" />
      <text x={0} y={26} textAnchor="middle" className="monster-lbl">
        {name}
      </text>
    </g>
  );
}

function CompassRose({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="rose" aria-hidden="true">
      <circle r={34} fill="none" stroke="#e9dcc0" strokeWidth={1} opacity={0.5} />
      <circle r={26} fill="none" stroke="#e9dcc0" strokeWidth={0.6} strokeDasharray="2 3" opacity={0.5} />
      <polygon points="0,-32 5,-5 0,0 -5,-5" fill="#f1bf57" />
      <polygon points="0,32 5,5 0,0 -5,5" fill="#e9dcc0" opacity={0.7} />
      <polygon points="-32,0 -5,-5 0,0 -5,5" fill="#e9dcc0" opacity={0.7} />
      <polygon points="32,0 5,-5 0,0 5,5" fill="#e9dcc0" opacity={0.7} />
      <text y={-38} textAnchor="middle" className="rose-n">
        N
      </text>
    </g>
  );
}
