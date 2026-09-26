// Surfaces drawn once in a canvas and shared by the 3D props: planed wood
// with its grain, washi paper with fibres. Deterministic, so every picture
// of a prop looks the same.

import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function made(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  let t = cache.get(key);
  if (!t) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d")!);
    t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    cache.set(key, t);
  }
  return t;
}

/** Planed wood, the grain running along u: hinoki (light) or keyaki (dark). */
export function woodTexture(kind: "hinoki" | "keyaki" = "keyaki") {
  const [base, dark, light] = kind === "hinoki" ? ["#c9a878", "#a9855a", "#dcc196"] : ["#6b4529", "#4a2e1a", "#80583a"];
  return made(`wood-${kind}`, 512, 128, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 128);
    // Growth rings: long wavy lines, darker latewood.
    for (let i = 0; i < 26; i++) {
      const y0 = rnd(i) * 128;
      g.strokeStyle = i % 3 ? dark : light;
      g.globalAlpha = 0.18 + rnd(i + 40) * 0.25;
      g.lineWidth = 0.6 + rnd(i + 80) * 1.8;
      g.beginPath();
      for (let x = 0; x <= 512; x += 16) {
        const y = y0 + Math.sin(x / (60 + rnd(i + 5) * 90) + i) * (2 + rnd(i + 9) * 5);
        if (x) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
  });
}

/** Washi: warm paper with long fibres. */
export function paperTexture() {
  return made("washi", 256, 256, (g) => {
    g.fillStyle = "#efe6d3";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 180; i++) {
      g.strokeStyle = rnd(i) > 0.5 ? "rgba(120, 96, 60, 0.12)" : "rgba(255, 252, 240, 0.35)";
      g.lineWidth = 0.5 + rnd(i + 3) * 0.8;
      const x = rnd(i + 7) * 256;
      const y = rnd(i + 11) * 256;
      const a = rnd(i + 13) * Math.PI * 2;
      const l = 6 + rnd(i + 17) * 22;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
  });
}

const inks = new Map<number, THREE.MeshBasicMaterial>();

/** The ink line round a shape: its back faces pushed out along the normals by w (model units). */
export function inkMaterial(w: number) {
  let m = inks.get(w);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: "#1b1512", side: THREE.BackSide });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>\n  transformed += normalize(normal) * ${w.toFixed(4)};`);
    };
    m.customProgramCacheKey = () => `ink-${w}`;
    inks.set(w, m);
  }
  return m;
}

/** Draw every mesh of a group with an ink line round it, as the chart draws its shapes. */
export function inked(root: THREE.Object3D, w: number) {
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && !m.userData.noInk) meshes.push(m);
  });
  for (const m of meshes) {
    const hull = new THREE.Mesh(m.geometry, inkMaterial(w));
    hull.userData.noInk = true;
    m.add(hull);
  }
  return root;
}
