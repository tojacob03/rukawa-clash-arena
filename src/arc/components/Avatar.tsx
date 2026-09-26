// The player's fighter: a 3D figure (built in Blender by tools/fighter,
// rendered with three.js in fighter3d/), dressed per look and gear. Without
// WebGL the flat SVG fighter stands in.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Attire, Belt, Look, Slot } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import { bodyOf } from "../core/body.ts";
import type { Body } from "../core/body.ts";
import type { Spec } from "../fighter3d/figure.ts";
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
  /** "head" shows only the head, for option thumbnails; "stage" the fighter on two tatami. */
  crop?: "full" | "head" | "face" | "stage";
}

const BOX = { full: [240, 320], head: [124, 136], face: [80, 64], stage: [320, 300] } as const;

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, Number.isFinite(x) ? x : 0));

type Live = Awaited<ReturnType<typeof import("../fighter3d/renderer.ts").live>>;

export default function Avatar(props: AvatarProps) {
  const { look, mode, gear, belt, stripes, weightKg, heightCm, body, size = 240, label, still, crop = "full" } = props;
  const ref = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<Live | null>(null);
  const [failed, setFailed] = useState(false);
  const [bw, bh] = BOX[crop];
  const w = size;
  const h = (size * bh) / bw;
  const dpr = typeof window === "undefined" ? 1 : Math.min(2, window.devicePixelRatio || 1);
  const [px, setPx] = useState<[number, number]>([Math.round(w * dpr), Math.round(h * dpr)]);
  const animated = !still && (crop === "full" || crop === "stage");

  const fig = body ?? bodyOf(heightCm, weightKg);
  const lf = body || heightCm ? fig.h : 1 + 0.08 * clamp(look.height ?? 0, -2, 2);
  const spec: Spec = { look, mode, gear, belt, stripes, b: fig.b, lf };
  const key = JSON.stringify([look, mode, Object.entries(gear).map(([k, v]) => [k, v?.id]), belt, stripes, fig.b, lf]);
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
      .catch(() => !gone && setFailed(true));
    return () => {
      gone = true;
    };
  }, [key, px, crop, failed, animated]);

  useEffect(() => {
    if (failed || !animated) return;
    let gone = false;
    import("../fighter3d/renderer.ts")
      .then((r) => (ref.current ? r.live(ref.current, crop) : null))
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

  if (failed) return <AvatarSvg {...props} crop={crop === "stage" ? "full" : crop} />;
  return (
    <canvas
      ref={ref}
      className={`avatar${crop === "head" || crop === "face" ? " crop" : ""}`}
      width={px[0]}
      height={px[1]}
      style={{ ["--aw" as string]: `${w}px` }}
      role="img"
      aria-label={label ?? "Dein Charakter"}
    />
  );
}
