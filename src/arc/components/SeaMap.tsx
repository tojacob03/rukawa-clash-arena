// The sea chart as SVG: four seas, the great current with its calm belts,
// the scarlet ridge, islands, your route and your ship. Every piece of text
// sits in one layer on top and goes through the label placement, so no label
// covers another label, an island or a ship. The controls live in a bar
// below the chart instead of on top of it.

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { LocateFixed, Maximize2, Minus, Plus } from "lucide-react";
import type { Belt, FlagDesign, SeaId } from "../core/types.ts";
import type { Island } from "../core/sea.ts";
import { ISLAND, ISLANDS, LOOP_START, ROUTE_LEN, SEAS, nextIndex, SERPENT, WORLD, courseLength, route, serpentWidth, shipPos, smoothPath, voyageLegs } from "../core/sea.ts";
import { placeLabels } from "../core/labels.ts";
import type { LabelReq, PlacedLabel, Rect, Spot } from "../core/labels.ts";
import type { WeatherKind } from "../core/voyage.ts";
import { DockArt, ShipArt } from "./ShipArt.tsx";
import { SerpentArt } from "./SeaSerpent.tsx";
import { loadMotion, reducedMotion } from "../motion.ts";
import type { Timeline } from "../motion.ts";

export interface MapMarks {
  sea: SeaId;
  /** Route index of the island the ship came from (0 … 24). */
  current: number;
  /** Laps round the world completed: after the first the whole route is sailed. */
  lap: number;
  /** Tournaments per island id, with the best placement. */
  comps: Record<string, { n: number; best: number }>;
  shipColor: string;
  boss?: string | null;
  /** Its life points (times stuck in 14 days) and the highest count: humps of the serpent. */
  bossHp?: number;
  bossMax?: number;
  /** Ship class follows the belt. */
  belt: Belt;
  flag?: Partial<FlagDesign> | null;
  /** Share of the way to the next island (0 … 1). */
  progress: number;
  weather: WeatherKind;
  /** Landmarks found per island id (0 … 3). */
  explored: Record<string, number>;
  /** Ship condition from other sports and rust. */
  hull: number;
  sails: number;
  barnacles: number;
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

/** A voyage to show: the ship sails from `from` to `to`, steps of the voyage (islands reached plus the share of the way, laps included). */
export interface Voyage {
  id: number;
  from: number;
  to: number;
}
export type VoyageEvent = { kind: "start"; seconds: number } | { kind: "done" };

const { w: W, h: H, ridgeX: RX, currentY: CY, currentHalf: CH, calm: CALM } = WORLD;

/** Text sizes relative to island names; the CSS uses the same factors. */
const SEA_NAME = 1.92;
const SMALL = 0.88;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/** Organic, smooth outline from an id: a ring of points joined by curves. */
function blob(id: string, x: number, y: number, r: number, dx = 0, dy = 0) {
  const n = 11;
  const p: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.74 + 0.46 * hash(`${id}:${i}`));
    p.push([x + dx + Math.cos(a) * rr * 1.25, y + dy + Math.sin(a) * rr * 0.85]);
  }
  const mid = (a: [number, number], b: [number, number]) => `${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`;
  let d = `M${mid(p[n - 1], p[0])}`;
  for (let i = 0; i < n; i++) d += ` Q${p[i][0].toFixed(1)} ${p[i][1].toFixed(1)} ${mid(p[i], p[(i + 1) % n])}`;
  return `${d} Z`;
}

function ridgePath(x: number, half: number) {
  const pts: string[] = [];
  for (let y = 0; y <= H; y += 20) pts.push(`${x - half - 6 * hash(`l${x}${y}`)},${y}`);
  for (let y = H; y >= 0; y -= 20) pts.push(`${x + half + 6 * hash(`r${x}${y}`)},${y}`);
  return pts.join(" ");
}

/**
 * Mist on the chart (a sumi-e sea is mostly what you cannot see): thick over
 * the islands your route has not reached yet, thin over the home seas of
 * others, and a few banks drifting over everything. Two layers, far and
 * near, that move apart when you pull the chart.
 */
const MistBanks = memo(function MistBanks({ r, current, lap, layer }: { r: Island[]; current: number; lap: number; layer: "far" | "near" }) {
  const puffs: { x: number; y: number; rx: number; ry: number; o: number; i: number }[] = [];
  if (layer === "far") {
    const onRoute = new Set(r.map((x) => x.id));
    ISLANDS.forEach((is, k) => {
      const idx = r.findIndex((x) => x.id === is.id);
      const ahead = idx > current + 1 && !lap;
      const other = !onRoute.has(is.id);
      if (!ahead && !other) return;
      const n = ahead ? 2 : 1;
      for (let j = 0; j < n; j++) {
        const a = hash(`${is.id}m${j}`) * Math.PI * 2;
        puffs.push({ x: is.x + Math.cos(a) * 26, y: is.y + Math.sin(a) * 14, rx: 70 + 40 * hash(`${is.id}r${j}`), ry: 30 + 16 * hash(`${is.id}y${j}`), o: ahead ? 0.18 : 0.07, i: k + j });
      }
    });
    for (let k = 0; k < 10; k++) puffs.push({ x: hash(`fx${k}`) * W, y: hash(`fy${k}`) * H, rx: 160 + 120 * hash(`fr${k}`), ry: 40 + 30 * hash(`fs${k}`), o: 0.05, i: k });
  } else {
    for (let k = 0; k < 6; k++) {
      const edge = k % 2 ? H - 40 - 60 * hash(`ny${k}`) : 40 + 60 * hash(`ny${k}`);
      puffs.push({ x: (k / 5) * W + 80 * hash(`nx${k}`), y: edge, rx: 220 + 120 * hash(`nr${k}`), ry: 60 + 30 * hash(`ns${k}`), o: 0.1, i: k });
    }
  }
  return (
    <>
      {puffs.map((p, k) => (
        <ellipse key={k} className="puff" cx={p.x.toFixed(0)} cy={p.y.toFixed(0)} rx={p.rx.toFixed(0)} ry={p.ry.toFixed(0)} fill="url(#sea-mist)" opacity={p.o} style={{ "--i": p.i } as CSSProperties} />
      ))}
    </>
  );
});

const isleR = (is: Island) => (is.kind === "kap" ? 13 : is.kind ? 11 : 9 + 3 * hash(is.id));

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

/** Your route so far; after a lap round the world, all of it, closed at the gate. */
const trailPath = (r: Island[], current: number, lap: number) =>
  lap ? `${routePath(r, 0, ROUTE_LEN - 1)} L${r[LOOP_START].x} ${r[LOOP_START].y}` : current > 0 ? routePath(r, 0, current) : null;

/** Where a sea's name may stand: along the outer edge of its quarter first, then the inner one. */
function seaSpots(id: SeaId, fs: number): Spot[] {
  const left = id === "frost" || id === "abend";
  const top = id === "frost" || id === "morgen";
  const x0 = left ? 0 : RX;
  const y0 = top ? 0 : CY + CH + CALM;
  const x1 = left ? RX : W;
  const y1 = top ? CY - CH - CALM : H;
  const inset = 26;
  const t = y0 + inset + fs * SEA_NAME * 0.85;
  const b = y1 - inset;
  const l: Spot = { x: x0 + inset + 10, y: 0, anchor: "start" };
  const r: Spot = { x: x1 - inset - 10, y: 0, anchor: "end" };
  const outerX = left ? l : r;
  const innerX = left ? r : l;
  const outerY = top ? t : b;
  const innerY = top ? b : t;
  const cx: Spot = { x: (x0 + x1) / 2, y: 0, anchor: "middle" };
  return [
    { ...outerX, y: outerY },
    { ...cx, y: outerY },
    { ...innerX, y: outerY },
    { ...outerX, y: innerY },
    { ...cx, y: innerY },
    { ...innerX, y: innerY },
  ];
}

/** Spots along a calm belt (above or below the current) within [x0, x1]. */
function beltSpots(x0: number, x1: number, fs: number, sides: ("n" | "s")[]): Spot[] {
  const out: Spot[] = [];
  for (const side of sides) {
    const y = side === "n" ? CY - CH - CALM / 2 + fs * SMALL * 0.35 : CY + CH + CALM / 2 + fs * SMALL * 0.35;
    for (let x = x0; x <= x1; x += 45) out.push({ x, y, anchor: "middle" });
  }
  return out;
}

/**
 * The chart with its own camera: drag to move, pinch or wheel to zoom, arrow
 * keys and plus/minus from the keyboard. Labels keep one size on screen and
 * move aside instead of covering each other.
 */
export default function SeaMap({
  marks,
  selected,
  onSelect,
  others = [],
  voyage = null,
  onVoyage,
  note,
  overlay = false,
}: {
  marks: MapMarks;
  selected: string | null;
  onSelect: (id: string) => void;
  others?: OtherShip[];
  voyage?: Voyage | null;
  onVoyage?: (e: VoyageEvent) => void;
  /** A line under the chart, such as the miles since your last look. */
  note?: ReactNode;
  /** A card floats over the right side of the chart on wide screens: keep what you look at clear of it. */
  overlay?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const miniRef = useRef<SVGRectElement>(null);
  const shipRef = useRef<SVGGElement>(null);
  const flipRef = useRef<SVGGElement>(null);
  const serpentRef = useRef<SVGGElement>(null);
  const wakeRef = useRef<SVGGElement>(null);
  const mistFar = useRef<SVGGElement>(null);
  const mistNear = useRef<SVGGElement>(null);
  /** Ends a running voyage at once, when you take the helm (drag, zoom, keys). */
  const skipRef = useRef<(() => void) | null>(null);
  const onVoyageRef = useRef(onVoyage);
  onVoyageRef.current = onVoyage;
  const vb = useRef<Box>({ x: 0, y: 0, w: W });
  const ar = useRef(H / W);
  const anim = useRef(0);
  const settleT = useRef(0);
  const [view, setView] = useState({ step: 0, fs: 12, ppu: 1 });
  /** The visible part of the map once it stops moving, so labels stay inside. */
  const [seen, setSeen] = useState<Rect | null>(null);
  const r = route(marks.sea);
  const nextI = nextIndex(marks.current);
  const next = r[nextI];
  const pos = shipPos(r, marks.current, marks.progress);
  const legs = useMemo(() => (voyage ? voyageLegs(route(marks.sea), voyage.from, voyage.to) : null), [voyage, marks.sea]);
  const sailing = !!legs?.length;
  // While a voyage waits to start, the ship lies where you saw it last.
  const start = sailing ? { x: legs[0][0].x, y: legs[0][0].y, left: legs[0][1].x < legs[0][0].x } : pos;

  const maxW = () => Math.max(W, H / ar.current);
  /** Map units hidden under the floating card, at view width w. */
  const covered = useCallback(
    (w: number) => {
      if (!overlay || typeof window === "undefined" || !window.matchMedia?.("(min-width: 1000px)").matches) return 0;
      const px = boxRef.current?.getBoundingClientRect().width ?? 1000;
      return (346 / px) * w;
    },
    [overlay],
  );
  const fit = (v: Box): Box => {
    const w = clampN(v.w, MIN_W, maxW());
    const h = w * ar.current;
    const x = w >= W ? (W - w) / 2 : clampN(v.x, -PAD, W - w + PAD + covered(w));
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
    const fs = clampN(12.5 / ppu, 6, 40);
    // Parallax: the far mist lags behind the chart, the near mist runs ahead of it.
    const dx = v.x + v.w / 2 - W / 2;
    const dy = v.y + h / 2 - H / 2;
    mistFar.current?.setAttribute("transform", `translate(${(dx * 0.07).toFixed(1)} ${(dy * 0.07).toFixed(1)})`);
    mistNear.current?.setAttribute("transform", `translate(${(-dx * 0.14).toFixed(1)} ${(-dy * 0.14).toFixed(1)})`);
    svg.style.setProperty("--fs", `${fs.toFixed(2)}px`);
    const mini = miniRef.current;
    if (mini) {
      mini.setAttribute("x", String(v.x));
      mini.setAttribute("y", String(v.y));
      mini.setAttribute("width", String(v.w));
      mini.setAttribute("height", String(h));
    }
    // Relayout labels only when the zoom changed noticeably. Within one step
    // the text grows by up to 12 %; place it for the largest size of the step.
    const step = Math.round(Math.log2(ppu) * 3);
    const stepFs = clampN(12.5 / Math.pow(2, (step - 0.5) / 3), 6, 40);
    setView((cur) => (cur.step === step ? cur : { step, fs: stepFs, ppu: Math.pow(2, step / 3) }));
    // ... and keep them inside the view once it comes to rest.
    window.clearTimeout(settleT.current);
    settleT.current = window.setTimeout(() => {
      const m = 6 / ppu;
      setSeen({ x0: v.x + m, y0: v.y + m, x1: v.x + v.w - m, y1: v.y + h - m });
    }, 140);
  }, []);

  const animateTo = useCallback(
    (goal: Box) => {
      skipRef.current?.();
      cancelAnimationFrame(anim.current);
      const to = fit(goal);
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
      skipRef.current?.();
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
    (x: number, y: number, w = vb.current.w) => animateTo({ x: x - w / 2 + covered(w) / 2, y: y - (w * ar.current) / 2, w }),
    [animateTo, covered],
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
    vb.current = fit({ x: pos.x - w / 2 + covered(w) / 2, y: pos.y - (w * ar.current) / 2, w });
    apply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The voyage since your last look: the camera waits where you left the
  // ship, then follows it along its course (a little behind, like a boat
  // following in its wake) while the chart zooms in slightly. The wake draws
  // itself behind the hull and closes again once the ship lies still. Any
  // touch, wheel or key ends it at once.
  useLayoutEffect(() => {
    if (!voyage || !legs) return;
    const done = () => onVoyageRef.current?.({ kind: "done" });
    const svg = svgRef.current;
    const ship = shipRef.current;
    const flip = flipRef.current;
    if (!legs.length || !svg || !ship || !flip || reducedMotion()) {
      done();
      return;
    }
    const rect = boxRef.current?.getBoundingClientRect();
    const w1 = clampN((rect?.width ?? 800) / 1.3, MIN_W, maxW());
    const w0 = clampN(w1 * 1.25, MIN_W, maxW());
    const s = legs[0][0];
    const end = legs[legs.length - 1][legs[legs.length - 1].length - 1];
    const frame = (x: number, y: number, w: number) => {
      vb.current = fit({ x: x - w / 2, y: y - (w * ar.current) / 2, w });
      apply();
    };
    cancelAnimationFrame(anim.current);
    frame(s.x, s.y, w0);

    let tl: Timeline | null = null;
    let stop: (() => void) | null = null;
    let dead = false;
    const skip = () => tl?.progress(1);
    skipRef.current = skip;
    loadMotion()
      .then(({ gsap }) => {
        if (dead) return;
        const lens = legs.map(courseLength);
        const total = lens.reduce((a, b) => a + b, 0);
        const dur = clampN(1.3 + total / 150, 1.8, 5.5);
        const wakes = [...(wakeRef.current?.querySelectorAll<SVGPathElement>("path") ?? [])];
        const cam = { x: s.x, y: s.y, w: w0 };
        let lastX = s.x;
        let left = legs[0][1].x < s.x;
        const turn = { s: left ? -1 : 1 };
        const face = (l: boolean) => {
          if (l === left) return;
          left = l;
          gsap.to(turn, { s: l ? -1 : 1, duration: 0.45, ease: "power2.inOut", overwrite: true, onUpdate: () => flip.setAttribute("transform", `scale(${turn.s.toFixed(3)} 1)`) });
        };
        const follow = () => {
          const x = Number(gsap.getProperty(ship, "x"));
          const y = Number(gsap.getProperty(ship, "y"));
          if (Math.abs(x - lastX) > 0.2) {
            face(x < lastX);
            lastX = x;
          }
          // Over the ridge the ship leaves at the east edge: the camera cuts.
          const k = Math.abs(x - cam.x) > W / 3 ? 1 : 1 - Math.pow(0.9, gsap.ticker.deltaRatio());
          cam.x += (x - cam.x) * k;
          cam.y += (y - cam.y) * k;
          frame(cam.x, cam.y, cam.w);
        };
        stop = () => gsap.ticker.remove(follow);
        gsap.set(ship, { x: s.x, y: s.y });
        tl = gsap.timeline({
          delay: 0.35,
          onStart: () => {
            gsap.ticker.add(follow);
            onVoyageRef.current?.({ kind: "start", seconds: dur });
          },
          onComplete: () => {
            stop?.();
            gsap.killTweensOf(turn);
            flip.setAttribute("transform", pos.left ? "scale(-1 1)" : "scale(1 1)");
            frame(end.x, end.y, w1);
            skipRef.current = null;
            done();
          },
        });
        let t = 0;
        legs.forEach((leg, i) => {
          const d = (dur * lens[i]) / total;
          const ease = legs.length === 1 ? "power1.inOut" : i === 0 ? "power1.in" : i === legs.length - 1 ? "power1.out" : "none";
          const path = smoothPath(leg);
          tl!.to(ship, { motionPath: { path }, duration: d, ease }, t);
          const wake = wakes.filter((p) => p.dataset.leg === String(i));
          tl!.fromTo(wake, { drawSVG: "0% 0%", opacity: 1 }, { drawSVG: "0% 100%", duration: d, ease, immediateRender: false }, t);
          t += d;
        });
        tl.to(cam, { w: w1, duration: dur + 0.5, ease: "power2.inOut" }, 0);
        // The weekly boss waits where you are stuck: it surfaces as you arrive.
        const surface = Math.max(0, dur - 0.5);
        if (serpentRef.current) tl.fromTo(serpentRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.1, ease: "power2.out" }, surface);
        const name = svg.querySelector(".monster-lbl");
        if (name) tl.fromTo(name, { opacity: 0 }, { opacity: 1, duration: 0.6 }, surface + 0.5);
        // The wake closes behind the ship once it lies still.
        tl.to(wakes, { drawSVG: "100% 100%", opacity: 0, duration: 1.3, ease: "power2.inOut" }, dur + 0.15);
      })
      .catch(() => {
        if (!dead) done();
      });
    const opts = { capture: true, passive: true } as const;
    const box = boxRef.current;
    svg.addEventListener("pointerdown", skip, opts);
    svg.addEventListener("wheel", skip, opts);
    box?.addEventListener("keydown", skip, true);
    return () => {
      dead = true;
      svg.removeEventListener("pointerdown", skip, opts);
      svg.removeEventListener("wheel", skip, opts);
      box?.removeEventListener("keydown", skip, true);
      stop?.();
      tl?.kill();
      if (skipRef.current === skip) skipRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyage]);

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
      window.clearTimeout(settleT.current);
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

  const shipScale = clampN((view.fs / 12.5) * 0.34, 0.34, 0.9);
  const shipBox = (x: number, y: number, s: number): Rect => ({ x0: x - 88 * s, y0: y - 124 * s, x1: x + 88 * s, y1: y + 22 * s });

  // Crew and friends: ships that would sit on top of yours or of each other
  // move around the spot, so every ship stays visible. The gap grows with the
  // ships when zoomed out.
  const fleet = useMemo(() => {
    const gap = 44 * (shipScale / 0.34);
    const placed = [{ x: pos.x, y: pos.y }];
    return others.map((o, i) => {
      const p = shipPos(route(o.sea), o.island, o.progress);
      let q = { x: p.x, y: p.y };
      for (let k = 0; k < 16 && placed.some((z) => Math.hypot(z.x - q.x, (z.y - q.y) * 1.6) < gap); k++) {
        const a = Math.PI * (0.75 + 0.5 * (k % 4)) + i * 0.3;
        const rr = gap * (1 + Math.floor(k / 4) * 0.8);
        q = { x: p.x + Math.cos(a) * rr, y: p.y + Math.sin(a) * rr * 0.6 };
      }
      placed.push(q);
      return { ...q, left: p.left };
    });
  }, [others, pos.x, pos.y, shipScale]);

  // What islands, their markers, ships and the compass cover: no label goes
  // there. An island's own shape may touch its name, its markers may not.
  const isleBoxes = useMemo(() => {
    const out: Rect[] = [];
    for (const is of ISLANDS) {
      const rr = isleR(is);
      // The next island wears a wider ring.
      const g = is.id === next.id ? 13 : 6;
      out.push({ x0: is.x - rr * 1.25 - g, y0: is.y - rr * 0.85 - g, x1: is.x + rr * 1.25 + g + (is.kind === "hafen" ? 12 : 0), y1: is.y + rr * 0.85 + g, owner: is.id });
      if (is.kind === "kap") out.push({ x0: is.x - 2, y0: is.y - 28, x1: is.x + 16, y1: is.y - 14 });
      if ((marks.explored[is.id] ?? 0) >= 3) out.push({ x0: is.x - 6, y0: is.y - 32, x1: is.x + 10, y1: is.y - 12 });
      if (marks.comps[is.id]) out.push({ x0: is.x - 30, y0: is.y - 30, x1: is.x - 10, y1: is.y - 10 });
    }
    return out;
  }, [marks.explored, marks.comps, next.id]);

  // The boss swims next to the ship as a sea serpent, in open water. It is
  // as long as its highest life points; its humps show the current ones.
  const boss = useMemo(() => {
    if (!marks.boss) return null;
    const sc = 0.6;
    const w = serpentWidth(marks.bossMax ?? 4) * sc;
    const box = (x: number, y: number): Rect => ({ x0: x - w / 2, y0: y + SERPENT.top * sc, x1: x + w / 2, y1: y + SERPENT.bottom * sc });
    const side = w / 2 + 22;
    const tries = [
      [side, 44],
      [-side, 44],
      [0, 56],
      [side + 20, 6],
      [-side - 20, 6],
      [side, -44],
      [-side, -44],
      [0, -60],
      [side * 2, 44],
      [-side * 2, 44],
    ];
    // Islands and ships, and the ridge in the middle and at both edges: it swims in open water.
    const busy = [
      ...isleBoxes,
      shipBox(pos.x, pos.y, shipScale),
      ...fleet.map((f) => shipBox(f.x, f.y + 6, shipScale * 0.7)),
      { x0: RX - 26, y0: 0, x1: RX + 26, y1: H },
      { x0: -W, y0: -H, x1: 22, y1: H * 2 },
      { x0: W - 22, y0: -H, x1: W * 2, y1: H * 2 },
      { x0: -W, y0: -H, x1: W * 2, y1: 16 },
      { x0: -W, y0: H - 16, x1: W * 2, y1: H * 2 },
    ];
    const hit = (b: Rect) => busy.some((i) => b.x0 < i.x1 && b.x1 > i.x0 && b.y0 < i.y1 && b.y1 > i.y0);
    for (const [dx, dy] of tries) {
      const b = box(pos.x + dx, pos.y + dy);
      if (!hit(b)) return { x: pos.x + dx, y: pos.y + dy, box: b, w, sc };
    }
    // Everything taken: at least inside the world.
    const x = clampN(pos.x + side, w / 2 + 24, W - w / 2 - 24);
    return { x, y: pos.y + 44, box: box(x, pos.y + 44), w, sc };
  }, [marks.boss, marks.bossMax, pos.x, pos.y, isleBoxes, fleet, shipScale]);

  // Which labels to show at this zoom, and where.
  const labels = useMemo(() => {
    const fs = view.fs;
    const ppu = view.ppu;
    const reqs: LabelReq[] = [];
    for (const is of ISLANDS) {
      const idx = r.findIndex((x) => x.id === is.id);
      const here = idx === marks.current;
      const isNext = idx === nextI;
      const special = !!is.kind;
      const onRoute = idx >= 0;
      const show = here || isNext || selected === is.id || special || (onRoute && ppu >= 0.7) || ppu >= 1.15;
      if (!show) continue;
      const prio = here ? 100 : selected === is.id ? 90 : isNext ? 80 : special ? 60 : onRoute ? 40 - Math.abs(idx - marks.current) : 10;
      // Same sizes as the CSS: the current island a bit bigger, islands off your route a bit smaller.
      const size = here ? 1.12 : onRoute ? 1 : 0.92;
      reqs.push({ id: is.id, text: is.name, x: is.x, y: is.y, prio, size, force: here || isNext || selected === is.id, above: !is.sea && is.y < CY });
    }
    // Who sails there matters more than the name of a distant island.
    others.forEach((o, i) => reqs.push({ id: `ship:${o.id}`, text: o.name, x: fleet[i].x, y: fleet[i].y - 4, prio: o.crew ? 72 : 55, size: 0.92 }));
    // The serpent explains itself (and the legend names it): its name gives way to the islands.
    if (boss && marks.boss) reqs.push({ id: "boss", text: marks.boss, x: boss.x, y: boss.y - 2, prio: 75, size: SMALL });
    // The world's own names: seas, the currents, the calm belts, the ridge.
    for (const s of SEAS) reqs.push({ id: `sea:${s.id}`, text: s.name, x: 0, y: 0, prio: s.id === marks.sea ? 66 : 46, size: SEA_NAME * 1.3, spots: seaSpots(s.id, fs) });
    if (ppu >= 0.55) {
      reqs.push({ id: "cur:east", text: "Äußere Strömung", x: 0, y: 0, prio: 30, size: SMALL * 1.05, spots: beltSpots(RX + 90, W - 90, fs, ["n", "s"]) });
      reqs.push({ id: "cur:west", text: "Tiefe Strömung", x: 0, y: 0, prio: 30, size: SMALL * 1.05, spots: beltSpots(90, RX - 90, fs, ["s", "n"]) });
    }
    if (ppu >= 0.8) reqs.push({ id: "calm", text: "Kalmengürtel", x: 0, y: 0, prio: 20, size: SMALL, spots: beltSpots(RX - 250, RX + 250, fs, ["n", "s"]) });
    reqs.push({
      id: "ridge",
      text: "Scharlachkamm",
      x: 0,
      y: 0,
      prio: 35,
      // Display font, letter-spaced: wider than the island names.
      size: SMALL * 1.52,
      spots: [60, 150, 470, 560, 240].map((y) => ({ x: RX - fs * 0.3, y, anchor: "start" as const, vertical: true })),
    });
    const obstacles: Rect[] = [
      ...isleBoxes,
      shipBox(pos.x, pos.y, shipScale),
      ...fleet.map((f, i) => ({ ...shipBox(f.x, f.y + 6, shipScale * 0.7), owner: `ship:${others[i].id}` })),
      ...(boss ? [boss.box] : []),
      { x0: W - 112, y0: H - 160, x1: W - 28, y1: H - 68 },
    ];
    // Inside the part you can see, and inside the world (not in the margin around it).
    const world = { x0: 4, y0: 4, x1: W - 4, y1: H - 4 };
    const area = seen ? { x0: Math.max(seen.x0, world.x0), y0: Math.max(seen.y0, world.y0), x1: Math.min(seen.x1, world.x1), y1: Math.min(seen.y1, world.y1) } : world;
    return placeLabels(reqs, fs, obstacles, area);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.fs, view.ppu, marks.current, marks.sea, marks.boss, selected, others, fleet, pos.x, pos.y, isleBoxes, boss, seen, shipScale]);

  const hitR = Math.max(24, view.fs * 1.9);
  const text = (l: PlacedLabel | undefined, cls: string, body: string, onClick?: () => void) =>
    l ? (
      <text key={l.id} className={cls} x={l.x} y={l.y} textAnchor={l.vertical ? "start" : l.anchor} transform={l.vertical ? `rotate(90 ${l.x} ${l.y})` : undefined} onClick={onClick}>
        {body}
      </text>
    ) : null;

  return (
    <div className="sea-chart">
      <div className="sea-view" ref={boxRef} tabIndex={0} role="group" aria-label="Seekarte. Ziehen verschiebt, Mausrad oder zwei Finger zoomen. Mit Pfeiltasten verschieben, Plus und Minus zoomen, S zeigt dein Schiff, 0 die ganze Welt." onKeyDown={onKey}>
        <svg ref={svgRef} className="sea-map" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Seekarte deiner Reise">
          <SeaBackground sea={marks.sea} />

          {/* Home sea routes */}
          {SEAS.map((s) => {
            const pts = [0, 1, 2, 3, 4].map((i) => ISLANDS.find((x) => x.id === `${s.id}${i}`)!);
            const d = `M${pts.map((p) => `${p.x} ${p.y}`).join(" L")} L${RX} ${CY}`;
            return <path key={s.id} d={d} className="sea-lane" opacity={s.id === marks.sea ? 0.5 : 0.16} />;
          })}
          {/* Great current route */}
          <path d={routePath(r, 5, 24)} className="sea-lane" opacity={0.4} />

          {/* Your journey so far, and the leg ahead */}
          {trailPath(r, marks.current, marks.lap) ? <path d={trailPath(r, marks.current, marks.lap)!} className="sea-trail" /> : null}
          <path d={`M${r[marks.current].x} ${r[marks.current].y} L${next.x} ${next.y}`} className="sea-next" />

          {/* Islands */}
          {ISLANDS.map((is) => {
            const idx = r.findIndex((x) => x.id === is.id);
            const onRoute = idx >= 0;
            const state = !onRoute ? "other" : idx === marks.current ? "here" : idx < marks.current || marks.lap ? "past" : "future";
            const comp = marks.comps[is.id];
            const rr = isleR(is);
            return (
              <g
                key={is.id}
                className={`isle ${state}${selected === is.id ? " sel" : ""}${idx === nextI ? " next" : ""}`}
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
                {idx === nextI ? <circle cx={is.x} cy={is.y} r={rr * 1.25 + 11} className="isle-next-ring" /> : null}
                {selected === is.id && state !== "here" ? <circle cx={is.x} cy={is.y} r={rr * 1.25 + 7} className="isle-sel-ring" /> : null}
                <IslandGlyph is={is} />
                <title>{is.name}</title>
                {(marks.explored[is.id] ?? 0) >= 3 ? (
                  <g transform={`translate(${is.x - 4} ${is.y - 30})`} className="isle-explored" aria-hidden="true">
                    <path d="M0 0 V16" stroke="#1b1512" strokeWidth={1.6} />
                    <path d="M0 0 L12 4 L0 8 Z" fill="#d4a94f" stroke="#1b1512" strokeWidth={1} />
                  </g>
                ) : null}
                {comp ? (
                  <g transform={`translate(${is.x - 20} ${is.y - 20})`} className="isle-comp">
                    <circle r={8} className={comp.best ? `m${comp.best}` : "m0"} />
                    <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#0b0d0e" strokeWidth={1.6} strokeLinecap="round" />
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

          {/* Mist over the waters ahead, and banks drifting over the whole sea */}
          <g ref={mistFar} className="mist far" aria-hidden="true">
            <MistBanks r={r} current={marks.current} lap={marks.lap} layer="far" />
          </g>

          {/* Crew and friends */}
          {others.map((o, i) => {
            const p = fleet[i];
            return (
              <g key={o.id} className={`other-ship${o.crew ? " crew" : ""}`} aria-hidden="true">
                <g transform={`translate(${p.x} ${p.y + 6}) scale(${p.left ? -shipScale * 0.7 : shipScale * 0.7} ${shipScale * 0.7}) translate(-100 -128)`}>
                  <ShipArt belt={o.belt} sail={o.sail} flag={o.flag} />
                </g>
              </g>
            );
          })}

          {/* Boss as a sea monster next to the ship */}
          {boss ? (
            <g ref={serpentRef} style={sailing ? { opacity: 0 } : undefined}>
              <g transform={`translate(${boss.x - boss.w / 2} ${boss.y}) scale(${boss.sc})`} aria-hidden="true">
                <SerpentArt hp={marks.bossHp ?? 1} max={marks.bossMax ?? 4} />
              </g>
            </g>
          ) : null}
          {/* The wake of a voyage, drawn while the ship sails */}
          {sailing ? (
            <g ref={wakeRef} className="voyage-wake" aria-hidden="true">
              {legs.map((leg, i) => {
                const d = smoothPath(leg);
                return (
                  <g key={i}>
                    <path data-leg={i} className="churn" d={d} strokeWidth={9 * (shipScale / 0.34)} />
                    <path data-leg={i} className="foam" d={d} strokeWidth={2.2 * (shipScale / 0.34)} />
                  </g>
                );
              })}
            </g>
          ) : null}
          {/* Ship, on its way to the next island */}
          <g ref={shipRef} transform={`translate(${start.x} ${start.y})`}>
            <g ref={flipRef} transform={start.left ? "scale(-1 1)" : "scale(1 1)"}>
              <ShipMark marks={marks} scale={shipScale} />
            </g>
          </g>

          <CompassRose x={W - 70} y={H - 110} />
          <g ref={mistNear} className="mist near" aria-hidden="true">
            <MistBanks r={r} current={marks.current} lap={marks.lap} layer="near" />
          </g>

          {/* All names, on top of everything else */}
          <g className="sea-labels">
            {SEAS.map((s) => text(labels[`sea:${s.id}`], `sea-name${s.id === marks.sea ? " mine" : ""}`, s.name))}
            {text(labels["cur:east"], "sea-cur", "Äußere Strömung")}
            {text(labels["cur:west"], "sea-cur", "Tiefe Strömung")}
            {text(labels.calm, "sea-calm-lbl", "Kalmengürtel")}
            {text(labels.ridge, "sea-ridge-lbl", "Scharlachkamm")}
            {ISLANDS.map((is) => {
              const idx = r.findIndex((x) => x.id === is.id);
              const state = idx < 0 ? "other" : idx === marks.current ? "here" : idx === nextI ? "next" : idx < marks.current || marks.lap ? "past" : "future";
              return text(labels[is.id], `isle-lbl ${state}${selected === is.id ? " sel" : ""}`, is.name, () => onSelect(is.id));
            })}
            {others.map((o) => text(labels[`ship:${o.id}`], `ship-lbl${o.crew ? " crew" : ""}`, o.name))}
            {marks.boss ? text(labels.boss, `monster-lbl${sailing ? " surfacing" : ""}`, marks.boss) : null}
          </g>
        </svg>
      </div>

      <div className="sea-bar">
        {note ? (
          <p className="sea-note" aria-live="polite">
            {note}
          </p>
        ) : null}
        <svg
          className="sea-mini"
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden="true"
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            centerOn(((e.clientX - rect.left) / rect.width) * W, ((e.clientY - rect.top) / rect.height) * H);
          }}
        >
          <rect width={W} height={H} fill="#0e1416" />
          {SEAS.map((s) => {
            const left = s.id === "frost" || s.id === "abend";
            const top = s.id === "frost" || s.id === "morgen";
            return <rect key={s.id} x={left ? 0 : RX} y={top ? 0 : CY + CH + CALM} width={RX} height={top ? CY - CH - CALM : H - (CY + CH + CALM)} fill={s.color} opacity={s.id === marks.sea ? 0.45 : 0.18} />;
          })}
          <rect x={0} y={CY - CH} width={W} height={CH * 2} fill="#2b3336" />
          <rect x={RX - 10} y={0} width={20} height={H} fill="#8e2a1c" />
          {trailPath(r, marks.current, marks.lap) ? <path d={trailPath(r, marks.current, marks.lap)!} fill="none" stroke="#d4a94f" strokeWidth={10} strokeLinecap="round" /> : null}
          <circle cx={pos.x} cy={pos.y} r={22} fill="#f0d898" stroke="#0b0d0e" strokeWidth={6} />
          <rect ref={miniRef} className="sea-mini-view" x={0} y={0} width={W} height={H} />
        </svg>
        <div className="sea-zoom" role="group" aria-label="Ansicht">
          <button type="button" className="sea-btn icon" aria-label="Herauszoomen" onClick={() => zoomAt(1.4)}>
            <Minus size={16} aria-hidden="true" />
          </button>
          <button type="button" className="sea-btn icon" aria-label="Hineinzoomen" onClick={() => zoomAt(0.7)}>
            <Plus size={16} aria-hidden="true" />
          </button>
          <button type="button" className="sea-btn push" aria-label="Zu meinem Schiff" onClick={toShip}>
            <LocateFixed size={16} aria-hidden="true" />
            <span className="sea-btn-t">Mein Schiff</span>
          </button>
          <button type="button" className="sea-btn" aria-label="Ganze Welt" onClick={toWorld}>
            <Maximize2 size={16} aria-hidden="true" />
            <span className="sea-btn-t">Ganze Welt</span>
          </button>
        </div>
        <ul className="sea-key" aria-label="Legende">
          <li>
            <svg viewBox="0 0 28 10" aria-hidden="true">
              <path d="M3 5 H25" stroke="#d4a94f" strokeWidth={3} strokeLinecap="round" />
            </svg>
            Deine Route
          </li>
          <li>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx={8} cy={8} r={6} fill="none" stroke="#f0d898" strokeWidth={1.6} strokeDasharray="3 2.5" />
            </svg>
            Nächstes Ziel
          </li>
          <li>
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <circle cx={9} cy={9} r={7} fill="#c93a25" stroke="#0b0d0e" strokeWidth={1.2} />
              <path d="M5.5 5.5 L12.5 12.5 M12.5 5.5 L5.5 12.5" stroke="#0b0d0e" strokeWidth={1.6} strokeLinecap="round" />
            </svg>
            Turnier
          </li>
          <li>
            <svg viewBox="0 0 14 18" aria-hidden="true">
              <path d="M3 2 V16" stroke="#cfc3b1" strokeWidth={1.6} />
              <path d="M3 2 L13 5.5 L3 9 Z" fill="#d4a94f" stroke="#0b0d0e" strokeWidth={0.8} />
            </svg>
            Erkundet
          </li>
          {marks.boss ? (
            <li>
              <svg viewBox="-4 -24 70 34" aria-hidden="true">
                <SerpentArt hp={2} max={2} />
              </svg>
              Wochenboss
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

/** Seigaiha scale radius, and the scale centres of one tile in painting order. */
const SG = 22;
const SEIGAIHA: [number, number][] = [
  [SG, -SG / 2],
  [0, 0],
  [SG * 2, 0],
  [SG, SG / 2],
  [0, SG],
  [SG * 2, SG],
  [SG, (SG * 3) / 2],
];

/** Seas, current, calm belts and the ridge: everything that never changes. */
const SeaBackground = memo(function SeaBackground({ sea }: { sea: SeaId }) {
  const ticks: { x: number; y: number; w: number; h: number }[] = [];
  const T = 7;
  for (let i = 0; i * 50 < W; i++) if (i % 2) ticks.push({ x: i * 50, y: 0, w: 50, h: T }, { x: i * 50, y: H - T, w: 50, h: T });
  for (let i = 0; i * 50 < H; i++) if (i % 2) ticks.push({ x: 0, y: i * 50, w: T, h: 50 }, { x: W - T, y: i * 50, w: T, h: 50 });
  return (
    <g>
      <defs>
        <linearGradient id="sea-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c1113" />
          <stop offset="0.5" stopColor="#111a1d" />
          <stop offset="1" stopColor="#0b1012" />
        </linearGradient>
        <radialGradient id="sea-mist">
          <stop offset="0" stopColor="#ede3d1" stopOpacity="1" />
          <stop offset="0.55" stopColor="#ede3d1" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ede3d1" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sea-deep" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.32" />
        </radialGradient>
        {/* Seigaiha, the wave pattern of the blue sea: rows of scales, each row
            laid over the lower half of the one above it. */}
        <pattern id="sea-waves" width={SG * 2} height={SG} patternUnits="userSpaceOnUse">
          {SEIGAIHA.map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={SG} fill="#0f1618" />
              {[1, 0.74, 0.5, 0.26].map((k) => (
                <circle key={k} cx={cx} cy={cy} r={SG * k} fill="none" stroke="#ede3d1" strokeWidth={0.8} strokeOpacity={0.1} />
              ))}
            </g>
          ))}
        </pattern>
        <pattern id="sea-calm" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#ede3d1" opacity="0.16" />
          <circle cx="9" cy="9" r="0.9" fill="#ede3d1" opacity="0.1" />
        </pattern>
        <linearGradient id="sea-ridge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2e0a06" />
          <stop offset="0.45" stopColor="#8e2a1c" />
          <stop offset="0.55" stopColor="#7a2216" />
          <stop offset="1" stopColor="#260805" />
        </linearGradient>
        <pattern id="sea-peaks" width="18" height="16" patternUnits="userSpaceOnUse">
          <path d="M1 15 L6 5 L9 10 L12 3 L17 15 Z" fill="#1a0504" opacity="0.35" />
          <path d="M6 5 L7.6 8.2 M12 3 L13.8 6.8" stroke="#f3c7b8" strokeWidth="0.9" opacity="0.3" />
        </pattern>
      </defs>

      {/* Outside the world: the table the chart lies on. */}
      <rect x={-W} y={-H} width={W * 3} height={H * 3} className="sea-margin" />
      <rect width={W} height={H} fill="url(#sea-waves)" />
      <rect width={W} height={H} fill="url(#sea-bg)" opacity={0.55} />

      {SEAS.map((s) => {
        const left = s.id === "frost" || s.id === "abend";
        const top = s.id === "frost" || s.id === "morgen";
        const x = left ? 0 : RX;
        const y = top ? 0 : CY + CH + CALM;
        const h = top ? CY - CH - CALM : H - y;
        return <rect key={s.id} x={x} y={y} width={RX} height={h} fill={s.color} opacity={s.id === sea ? 0.13 : 0.05} />;
      })}

      {/* Graticule */}
      <g className="sea-grid">
        {Array.from({ length: Math.floor(W / 100) - 1 }, (_, i) => (
          <path key={`v${i}`} d={`M${(i + 1) * 100} 0 V${H}`} />
        ))}
        {Array.from({ length: Math.floor(H / 100) }, (_, i) => (
          <path key={`h${i}`} d={`M0 ${(i + 1) * 100} H${W}`} />
        ))}
      </g>

      <rect x={0} y={CY - CH - CALM} width={W} height={CALM} fill="url(#sea-calm)" />
      <rect x={0} y={CY + CH} width={W} height={CALM} fill="url(#sea-calm)" />
      <rect x={0} y={CY - CH} width={W} height={CH * 2} fill="#ede3d1" opacity={0.035} />
      <path d={`M0 ${CY - CH} H${W} M0 ${CY + CH} H${W}`} stroke="#ede3d1" strokeWidth={0.8} opacity={0.22} />
      <g className="sea-flow" fill="none" stroke="#ede3d1" strokeWidth={1.1} opacity={0.22}>
        {[-24, -8, 8, 24].map((dy) => (
          <path key={dy} d={`M0 ${CY + dy} Q300 ${CY + dy - 10} 600 ${CY + dy} T1200 ${CY + dy}`} strokeDasharray="14 18" />
        ))}
      </g>

      {/* The ridge, a mountain range, and its wrap-around at both edges */}
      <polygon points={ridgePath(RX, 16)} fill="url(#sea-ridge)" stroke="#1a0504" strokeWidth={1.5} />
      <polygon points={ridgePath(RX, 16)} fill="url(#sea-peaks)" />
      <polygon points={ridgePath(6, 10)} fill="url(#sea-ridge)" opacity={0.85} />
      <polygon points={ridgePath(W - 6, 10)} fill="url(#sea-ridge)" opacity={0.85} />
      {/* The gate of the four currents */}
      <circle cx={RX} cy={CY} r={34} className="sea-gate" />
      <circle cx={RX} cy={CY} r={44} className="sea-gate outer" />

      <rect width={W} height={H} fill="url(#sea-deep)" pointerEvents="none" />

      {/* Chart frame with a graduated border */}
      <g className="sea-frame-art" pointerEvents="none">
        <rect x={0} y={0} width={W} height={H} className="line" />
        <rect x={T} y={T} width={W - T * 2} height={H - T * 2} className="line thin" />
        {ticks.map((t, i) => (
          <rect key={i} x={t.x} y={t.y} width={t.w} height={t.h} className="tick" />
        ))}
      </g>
    </g>
  );
});

function IslandGlyph({ is }: { is: Island }) {
  const r = isleR(is);
  if (is.kind === "tor") {
    const d = `M${is.x - 14} ${is.y + 10} V${is.y - 4} Q${is.x} ${is.y - 22} ${is.x + 14} ${is.y - 4} V${is.y + 10}`;
    return (
      <g>
        <path d={d} fill="none" stroke="#d4a94f" strokeWidth={4} strokeLinecap="round" />
        <path d={d} fill="none" stroke="#4a120d" strokeWidth={1.4} />
      </g>
    );
  }
  if (is.kind === "pass") {
    return <polygon points={`${is.x - 14},${is.y + 8} ${is.x - 4},${is.y - 12} ${is.x + 2},${is.y - 2} ${is.x + 8},${is.y - 14} ${is.x + 16},${is.y + 8}`} fill="#8e2a1c" stroke="#1a0504" strokeWidth={1.5} />;
  }
  return (
    <g>
      {/* Shallow water and a depth line around the coast */}
      <path d={blob(is.id + "s", is.x, is.y, r + 9)} className="isle-shallow" />
      <path d={blob(is.id + "c", is.x, is.y, r + 15)} className="isle-contour" />
      <path d={blob(is.id, is.x, is.y, r + 3, 1.6, 2.4)} className="isle-shade" />
      <path d={blob(is.id, is.x, is.y, r + 3)} className="isle-sand" />
      <path d={blob(is.id + "g", is.x, is.y - 1, r)} className="isle-green" />
      <path d={blob(is.id + "h", is.x - r * 0.25, is.y - r * 0.3, r * 0.42)} className="isle-hill" />
      {is.kind === "hafen" ? <path d={`M${is.x + r} ${is.y + 2} h10 M${is.x + r + 4} ${is.y + 2} v5 M${is.x + r + 9} ${is.y + 2} v5`} stroke="#7a5230" strokeWidth={2} /> : null}
      {is.kind === "kap" ? (
        <g>
          <path d={`M${is.x} ${is.y - 4} V${is.y - 26}`} stroke="#1b1512" strokeWidth={1.6} />
          <path d={`M${is.x} ${is.y - 26} h14 l-4 5 l4 5 h-14 Z`} fill="#0b0d0e" stroke="#d4a94f" strokeWidth={0.8} />
        </g>
      ) : null}
    </g>
  );
}

/** Your ship at the origin, bow to the right; the chart moves and turns it. */
function ShipMark({ marks, scale }: { marks: MapMarks; scale: number }) {
  const gusts = { tailwind: 3, breeze: 2, light: 1, calm: 0, dock: 0 }[marks.weather];
  const k = scale / 0.34;
  return (
    <g className={`ship w-${marks.weather}`} aria-hidden="true">
      {/* Gusts from astern, as many and as fast as your training rhythm */}
      {Array.from({ length: gusts }, (_, i) => (
        <path
          key={i}
          className="gust"
          pathLength={100}
          style={{ ["--i" as string]: i } as CSSProperties}
          d={`M${-(36 + i * 5) * k} ${(-30 + i * 11) * k} q${-14 * k} ${-5 * k} ${-34 * k} 0`}
          strokeWidth={1.6 * k}
        />
      ))}
      {/* Doldrums: the ship lies still, rings spread on flat water */}
      {marks.weather === "calm" ? (
        <g className="calm-rings" strokeWidth={1.2 * k}>
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx={0} cy={2 * k} rx={46 * k} ry={10 * k} style={{ ["--i" as string]: i } as CSSProperties} />
          ))}
        </g>
      ) : null}
      <g transform={`scale(${scale}) translate(-100 -128)`}>
        {marks.weather === "dock" ? <DockArt belt={marks.belt} /> : null}
        <g className="ship-roll">
          <ShipArt belt={marks.belt} sail={marks.shipColor} flag={marks.flag} hull={marks.hull} sails={marks.sails} barnacles={marks.barnacles} />
        </g>
      </g>
    </g>
  );
}

function CompassRose({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="rose" aria-hidden="true">
      <circle r={34} fill="none" stroke="#cfc3b1" strokeWidth={1} opacity={0.4} />
      <circle r={26} fill="none" stroke="#cfc3b1" strokeWidth={0.6} strokeDasharray="2 3" opacity={0.4} />
      <polygon points="0,-32 5,-5 0,0 -5,-5" fill="#d4a94f" />
      <polygon points="0,32 5,5 0,0 -5,5" fill="#cfc3b1" opacity={0.55} />
      <polygon points="-32,0 -5,-5 0,0 -5,5" fill="#cfc3b1" opacity={0.55} />
      <polygon points="32,0 5,-5 0,0 5,5" fill="#cfc3b1" opacity={0.55} />
      <text y={-38} textAnchor="middle" className="rose-n">
        N
      </text>
    </g>
  );
}
