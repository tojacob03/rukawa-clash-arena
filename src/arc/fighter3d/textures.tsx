// Textures of the 3D fighter in the body frame: every garment and the skin
// share one planar projection from the front (tools/fighter/geo.py,
// BODY_FRAME: x -0.6 … 0.6, z 0 … 1.2). The frame is laid over the flat SVG
// fighter's coordinates, so its patterns, patches and tattoos are drawn by the
// same components (AvatarSvg.tsx) and rasterised here.

import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import * as THREE from "three";

/** SVG pixels per body-frame unit: the SVG shoulders (y 140) sit at z 1.1. */
export const SVG_K = 0.00625;
export const VIEWBOX = "24 124 192 192";

/** A point of the body frame in SVG coordinates. */
export const toSvg = (x: number, z: number): [number, number] => [120 + x / SVG_K, 140 + (1.1 - z) / SVG_K];

const size = 1024;
const cache = new Map<string, Promise<THREE.CanvasTexture>>();

/** Serialises SVG children (React elements) into a stand-alone SVG document. */
export function svgMarkup(children: ReactElement, viewBox = VIEWBOX) {
  const host = document.createElement("div");
  const root = createRoot(host);
  flushSync(() =>
    root.render(
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} width={size} height={size}>
        {children}
      </svg>,
    ),
  );
  const out = host.innerHTML;
  root.unmount();
  return out;
}

async function raster(markup: string, px = size, py = px) {
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = py;
  const img = new Image();
  img.decoding = "async";
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  await img.decode();
  canvas.getContext("2d")!.drawImage(img, 0, 0, px, py);
  return canvas;
}

const drawings = new Map<string, Promise<HTMLCanvasElement>>();

/** Any SVG drawing (React elements in its viewBox) as a canvas of w × h pixels, kept per drawing. */
export function svgCanvas(children: ReactElement, viewBox: string, w: number, h: number) {
  const host = document.createElement("div");
  const root = createRoot(host);
  flushSync(() =>
    root.render(
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} width={w} height={h} preserveAspectRatio="none">
        {children}
      </svg>,
    ),
  );
  const markup = host.innerHTML;
  root.unmount();
  let c = drawings.get(markup);
  if (!c) {
    c = raster(markup, w, h);
    drawings.set(markup, c);
    c.catch(() => drawings.delete(markup));
    if (drawings.size > 24) drawings.delete(drawings.keys().next().value as string);
  }
  return c;
}

function texture(canvas: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false;
  t.anisotropy = 4;
  return t;
}

/** A texture for an SVG drawing in the body frame, shared by every figure. */
export function frameTexture(children: ReactElement) {
  const markup = svgMarkup(children);
  let t = cache.get(markup);
  if (!t) {
    t = raster(markup).then(texture);
    cache.set(markup, t);
    if (cache.size > 48) {
      const first = cache.keys().next().value as string;
      cache.get(first)?.then((x) => x.dispose());
      cache.delete(first);
    }
  }
  return t;
}

const tips = new Map<string, THREE.CanvasTexture>();

/** Hair from root to tip: its own colour, then the tip colour over the outer third. */
export function hairTexture(hair: string, tip: string | null) {
  const key = `${hair}${tip}`;
  let t = tips.get(key);
  if (!t) {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = hair;
    ctx.fillRect(0, 0, 4, 64);
    if (tip) {
      // Row 0 is the root (v = 0 after the glTF flip), row 63 the tip.
      for (let y = 0; y < 64; y++) {
        const k = Math.max(0, Math.min(1, (y / 63 - 0.45) / 0.4));
        ctx.globalAlpha = k * k * (3 - 2 * k);
        ctx.fillStyle = tip;
        ctx.fillRect(0, y, 4, 1);
      }
    }
    t = texture(c);
    t.magFilter = THREE.LinearFilter;
    tips.set(key, t);
  }
  return t;
}

let weave: THREE.CanvasTexture | null = null;

/** A normal map of woven cotton, tiled over the garments' body frame. */
export function weaveNormal() {
  if (weave) return weave;
  const n = 64;
  const cell = 8;
  const h = new Float32Array(n * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const across = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0;
      const t = ((across ? y : x) % 4) / 4;
      h[y * n + x] = Math.sin(t * Math.PI) * (across ? 1 : 0.8);
    }
  const c = document.createElement("canvas");
  c.width = c.height = n;
  const g = c.getContext("2d")!;
  const img = g.createImageData(n, n);
  const at = (x: number, y: number) => h[((y + n) % n) * n + ((x + n) % n)];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 0.5;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 0.5;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * n + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  weave = new THREE.CanvasTexture(c);
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  weave.repeat.set(30, 30);
  weave.flipY = false;
  return weave;
}
