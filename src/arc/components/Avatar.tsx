// The player's fighter: a 3D figure (built in Blender by tools/fighter,
// rendered with three.js in fighter3d/), dressed per look and gear. Without
// WebGL the flat SVG fighter stands in. On the stage it turns under the
// finger (or the arrow keys) and comes close when you tap its face.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { Attire, Belt, Look, Slot } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import { figureFactors } from "../core/body.ts";
import type { Body } from "../core/body.ts";
import type { Spec } from "../fighter3d/figure.ts";
import type { Mood } from "../fighter3d/face.ts";
import type { Crop, Live } from "../fighter3d/renderer.ts";
import AvatarSvg from "./AvatarSvg.tsx";

export interface AvatarProps {
  look: Partial<Look>;
  mode: Attire;
  gear: Partial<Record<Slot, ItemDef | undefined>>;
  belt: Belt;
  stripes: number;
  weightKg?: number;
  heightCm?: number;
  /** Height and build from someone else's card; wins over height and weight. */
  body?: Body | null;
  size?: number;
  label?: string;
  /** A still figure; without it the figure breathes (never with reduced motion). */
  still?: boolean;
  /** "head" shows only the head, for option thumbnails; "icon" the head as a portrait; "stage" the fighter on two tatami. */
  crop?: Crop;
  /** A passing expression (smile, battle cry, tired eyes). */
  mood?: Mood;
  /** On the stage: turn by dragging, come close with a tap on the face. */
  interactive?: boolean;
}

const BOX: Record<Crop, readonly [number, number]> = { full: [240, 320], head: [124, 136], face: [80, 64], stage: [320, 300], icon: [1, 1], belt: [320, 200] };

const STEP = Math.PI / 12;

export default function Avatar(props: AvatarProps) {
  const { look, mode, gear, belt, stripes, weightKg, heightCm, body, size = 240, label, still, crop = "full", mood, interactive } = props;
  const ref = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<Live | null>(null);
  const [failed, setFailed] = useState(false);
  // Shown once the first frame is drawn: no empty box, no half-dressed figure.
  const [ready, setReady] = useState(false);
  const [turn, setTurn] = useState(0);
  const [close, setClose] = useState(false);
  const drag = useRef<{ x: number; turn: number; moved: boolean; id: number } | null>(null);
  const [bw, bh] = BOX[crop];
  const w = size;
  const h = (size * bh) / bw;
  const dpr = typeof window === "undefined" ? 1 : Math.min(2, window.devicePixelRatio || 1);
  const [px, setPx] = useState<[number, number]>([Math.round(w * dpr), Math.round(h * dpr)]);
  const animated = !still && (crop === "full" || crop === "stage");
  const turning = !!interactive && animated;

  const { b, lf } = figureFactors(look.height, heightCm, weightKg, body);
  const spec: Spec = { look, mode, gear, belt, stripes, b, lf, mood };
  const key = JSON.stringify([look, mode, Object.entries(gear).map(([k, v]) => [k, v?.id]), belt, stripes, b, lf, mood]);
  const specRef = useRef(spec);
  specRef.current = spec;

  // Render at the size the canvas is shown at, not the size it was asked for.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(([e]) => {
      const cw = e.contentRect.width;
      if (cw < 4) return;
      const next: [number, number] = [Math.round(cw * dpr), Math.round(((cw * bh) / bw) * dpr)];
      setPx((p) => (Math.abs(p[0] - next[0]) > 1 ? next : p));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [bw, bh, dpr, failed]);

  useEffect(() => {
    if (failed || animated) return;
    let gone = false;
    import("../fighter3d/renderer.ts")
      .then((r) => (gone || !ref.current ? undefined : r.still(ref.current, specRef.current, crop)))
      .then(() => !gone && setReady(true))
      .catch(() => !gone && setFailed(true));
    return () => {
      gone = true;
    };
  }, [key, px, crop, failed, animated]);

  useEffect(() => {
    if (failed || !animated) return;
    let gone = false;
    import("../fighter3d/renderer.ts")
      .then((r) => (ref.current ? r.live(ref.current, crop, () => !gone && setReady(true)) : null))
      .then((l) => {
        if (!l) return;
        if (gone) return l.stop();
        liveRef.current = l;
        return l.set(specRef.current);
      })
      .catch(() => !gone && setFailed(true));
    return () => {
      gone = true;
      liveRef.current?.stop();
      liveRef.current = null;
    };
  }, [animated, crop, failed]);

  useEffect(() => {
    liveRef.current?.set(specRef.current);
  }, [key]);
  useEffect(() => {
    liveRef.current?.resize();
  }, [px]);
  useEffect(() => {
    liveRef.current?.turn(turn);
    liveRef.current?.close(close);
  }, [turn, close, ready]);

  if (failed) return <AvatarSvg {...props} crop={crop === "stage" || crop === "belt" ? "full" : crop === "icon" ? "head" : crop} />;

  const cls = `avatar${crop === "head" || crop === "face" || crop === "icon" ? " crop" : ""}${ready ? " ready" : ""}${turning ? " turns" : ""}`;
  const style = { ["--aw" as string]: `${w}px` };
  if (!turning)
    return <canvas ref={ref} className={cls} width={px[0]} height={px[1]} style={style} role="img" aria-label={label ?? "Dein Charakter"} />;

  // A drag turns the fighter all the way round; a tap on the face comes close, another tap goes back.
  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: e.clientX, turn, moved: false, id: e.pointerId };
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (d.moved) setTurn(d.turn + (dx / Math.max(160, e.currentTarget.clientWidth)) * Math.PI * 2);
  };
  const up = (e: PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved || d.id !== e.pointerId) return;
    if (close) return setClose(false);
    const r = e.currentTarget.getBoundingClientRect();
    if (liveRef.current?.onHead((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)) setClose(true);
  };
  const keys = (e: KeyboardEvent<HTMLCanvasElement>) => {
    const k = e.key;
    if (k === "ArrowLeft" || k === "ArrowDown") setTurn((t) => t - STEP);
    else if (k === "ArrowRight" || k === "ArrowUp") setTurn((t) => t + STEP);
    else if (k === "Home") setTurn(0);
    else if (k === "Enter" || k === " ") setClose((c) => !c);
    else return;
    e.preventDefault();
  };
  const deg = Math.round(((((turn * 180) / Math.PI) % 360) + 540) % 360) - 180;
  return (
    <canvas
      ref={ref}
      className={cls}
      width={px[0]}
      height={px[1]}
      style={style}
      tabIndex={0}
      role="slider"
      aria-label={`${label ?? "Dein Charakter"}. Ziehen oder Pfeiltasten drehen, Tippen aufs Gesicht oder Eingabe holt es heran.`}
      aria-valuemin={-180}
      aria-valuemax={180}
      aria-valuenow={deg}
      aria-valuetext={`${deg === 0 ? "Vorderseite" : `um ${Math.abs(deg)} Grad ${deg > 0 ? "nach rechts" : "nach links"} gedreht`}${close ? ", Gesicht nah" : ""}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={keys}
    />
  );
}
