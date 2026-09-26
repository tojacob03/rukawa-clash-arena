// The pattern of a headband (hachimaki) in the 3D fighter: its colour,
// stripes in a flag's colours, the red sun of the white one, check or kente.
// u runs round the head with the front at 0.5, v across the band
// (tools/fighter/hats.py, band_uv).

import * as THREE from "three";
import type { ItemArt } from "../core/items.ts";

const cache = new Map<string, THREE.CanvasTexture>();
const WHITE = "#f4f1ea";

export function bandTexture(art: ItemArt) {
  const key = JSON.stringify([art.c, art.c2, art.cs, art.trim]);
  let t = cache.get(key);
  if (t) return t;
  const W = 512;
  const H = 64;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const base = art.c ?? WHITE;
  const cs = art.cs ?? [base];
  // Stripes from the top edge down; v = 0 is the top after the glTF flip.
  cs.forEach((col, i) => {
    g.fillStyle = col;
    g.fillRect(0, Math.floor((i * H) / cs.length), W, Math.ceil(H / cs.length) + 1);
  });
  if (art.trim === "check") {
    g.globalAlpha = 0.7;
    g.fillStyle = art.c2 ?? "#fff";
    for (let x = 0; x < W; x += 16) g.fillRect(x, 0, 3, H);
    g.globalAlpha = 1;
  } else if (art.trim === "kente") {
    g.fillStyle = art.c2 ?? "#000";
    for (let x = 0, i = 0; x < W; x += 16, i++) if (i % 2) g.fillRect(x, H * 0.35, 8, H * 0.3);
  } else if (!art.cs) {
    // The sun on the forehead: red on white, white on anything else.
    g.fillStyle = base.toLowerCase() === WHITE ? "#c8302a" : "#fff";
    g.beginPath();
    g.ellipse(W / 2, H / 2, H * 0.3, H * 0.34, 0, 0, Math.PI * 2);
    g.fill();
  }
  t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false;
  t.wrapS = THREE.RepeatWrapping;
  cache.set(key, t);
  return t;
}
