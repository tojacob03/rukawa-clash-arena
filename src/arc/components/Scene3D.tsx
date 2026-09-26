// A canvas for one 3D scene (three/engine.ts): the scene module is loaded
// when the canvas mounts, draws at the size the canvas is shown at, fades in
// with its first frame and gives way to a drawing without WebGL.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export interface Mounted {
  /** New arguments (the key changed). */
  set: (args: never) => Promise<unknown> | void;
  resize: () => void;
  stop: () => void;
}

/** Starts a scene in a canvas; ready is called after its first frame. */
export type Mount = (canvas: HTMLCanvasElement, args: never, ready: () => void) => Promise<Mounted>;

export default function Scene3D({
  load,
  args,
  argsKey,
  box,
  size,
  label,
  fallback,
  className,
}: {
  /** The scene, loaded on demand: () => import("…").then((m) => m.mountX). */
  load: () => Promise<Mount>;
  args: unknown;
  /** Changes whenever the arguments do. */
  argsKey: string;
  /** Width and height the picture is composed for. */
  box: readonly [number, number];
  size: number;
  label: string;
  fallback: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef<Mounted | null>(null);
  const argsRef = useRef(args);
  argsRef.current = args;
  const loadRef = useRef(load);
  loadRef.current = load;
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [bw, bh] = box;
  const dpr = typeof window === "undefined" ? 1 : Math.min(2, window.devicePixelRatio || 1);
  const [px, setPx] = useState<[number, number]>([Math.round(size * dpr), Math.round(((size * bh) / bw) * dpr)]);

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
    if (failed) return;
    let gone = false;
    loadRef
      .current()
      .then((mount) => (ref.current ? mount(ref.current, argsRef.current as never, () => !gone && setReady(true)) : null))
      .then((m) => {
        if (!m) return;
        if (gone) return m.stop();
        live.current = m;
      })
      .catch(() => !gone && setFailed(true));
    return () => {
      gone = true;
      live.current?.stop();
      live.current = null;
    };
  }, [failed]);

  useEffect(() => {
    const r = live.current?.set(argsRef.current as never);
    if (r) r.catch(() => setFailed(true));
  }, [argsKey]);
  useEffect(() => {
    live.current?.resize();
  }, [px]);

  if (failed) return <>{fallback}</>;
  return (
    <canvas
      ref={ref}
      className={`scene3d${className ? ` ${className}` : ""}${ready ? " ready" : ""}`}
      width={px[0]}
      height={px[1]}
      style={{ ["--aw" as string]: `${size}px` }}
      role="img"
      aria-label={label}
    />
  );
}
