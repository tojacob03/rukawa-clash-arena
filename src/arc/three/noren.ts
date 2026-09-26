// The gym page's entrance (b9): the door of a dōjō, hinoki posts under a
// beam and a small tiled roof, a stone step, and a noren hanging in the
// doorway in the gym's colours (one of five traditional dyes, fixed by the
// gym's name), its crest the gym's initial in a ring. The cloth moves a
// little in the draught; with reduced motion it hangs still.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { weaveNormal } from "../fighter3d/textures.tsx";
import { dispose, environment, frame, loop, shoot, stageLights } from "./engine.ts";
import { woodTexture } from "./materials.ts";

export interface NorenArgs {
  name: string;
}

/** Traditional noren dyes, with the colour the crest is left in. */
const DYES: [string, string][] = [
  ["#1f3a73", "#f3ede0"],
  ["#a8321e", "#f7efe3"],
  ["#1b1512", "#e2bd68"],
  ["#2f5d46", "#f3ede0"],
  ["#7a3e1d", "#f3ede0"],
];

const FONT = '"Shippori Mincho B1", "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif';

export function dyeOf(name: string) {
  let h = 0x811c9dc5;
  for (const ch of name.toLowerCase()) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193);
  return DYES[(h >>> 0) % DYES.length];
}

const PANELS = 3;
const CW = 1.5;
const CH = 1.15;
const GAP = 0.018;

/** The whole cloth as one drawing; each panel shows its third. */
async function clothTexture(name: string) {
  const [dye, pale] = dyeOf(name);
  await document.fonts.load(`800 100px ${FONT}`, name.slice(0, 1)).catch(() => undefined);
  const w = 1024;
  const h = Math.round((w * CH) / CW);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = dye;
  g.fillRect(0, 0, w, h);
  // The crest: a ring with the initial, across the middle slit's top.
  const cx = w / 2;
  const cy = h * 0.36;
  const r = h * 0.23;
  g.strokeStyle = pale;
  g.lineWidth = r * 0.14;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = pale;
  g.font = `800 ${r * 1.25}px ${FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText([...name.trim()][0]?.toUpperCase() ?? "道", cx, cy + r * 0.06);
  // Two dyed lines above the hem; the slits would cut a written name apart.
  g.fillRect(0, h * 0.86, w, h * 0.012);
  g.fillRect(0, h * 0.885, w, h * 0.005);
  // A pale band at the top where the cloth is sewn over the pole.
  g.fillRect(0, 0, w, h * 0.05);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function panelMaterial(map: THREE.Texture, i: number, uTime: { value: number }) {
  const m = new THREE.MeshStandardMaterial({ map, side: THREE.DoubleSide, roughness: 0.85 });
  m.normalMap = weaveNormal();
  m.normalScale.set(0.3, 0.3);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;`)
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3( position );
  float hang = 1.0 - uv.y;
  float sway = sin(uTime * 1.3 + ${(i * 1.7).toFixed(2)}) * 0.5 + sin(uTime * 2.1 + ${(i * 0.9).toFixed(2)}) * 0.25;
  transformed.z += hang * hang * 0.06 * sway + hang * 0.012 * sin(uv.x * 6.28 + uTime * 1.7);
  transformed.x += hang * hang * 0.012 * sway;`,
      );
  };
  m.customProgramCacheKey = () => `noren-${i}`;
  return m;
}

export async function mountNoren(canvas: HTMLCanvasElement, args: NorenArgs, ready: () => void) {
  const scene = new THREE.Scene();
  const lights = stageLights(scene, { shadow: [-2, 2, 3, -0.5], rim: 0.9 });
  // Softer than the stage: the dyes should read deep, not bleached.
  lights.key.intensity = 1.5;
  lights.fill.intensity = 0.5;
  scene.environment = environment();
  scene.environmentIntensity = 0.5;
  const door = new THREE.Group();
  door.rotation.y = -0.32;
  scene.add(door);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 40);
  const wood = new THREE.MeshStandardMaterial({ map: woodTexture("hinoki"), roughness: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ map: woodTexture("keyaki"), roughness: 0.5 });
  const add = (m: THREE.Mesh) => {
    m.castShadow = m.receiveShadow = true;
    door.add(m);
    return m;
  };
  // The doorway: two posts, the beam, the threshold; dark inside.
  for (const s of [-1, 1]) add(new THREE.Mesh(new RoundedBoxGeometry(0.16, 2.2, 0.16, 2, 0.015), wood)).position.set(s * 0.88, 1.1, 0);
  add(new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.18, 0.2, 2, 0.015), wood)).position.set(0, 2.2, 0);
  add(new THREE.Mesh(new RoundedBoxGeometry(1.9, 0.06, 0.24, 2, 0.01), dark)).position.set(0, 0.03, 0);
  const inside = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.1), new THREE.MeshStandardMaterial({ color: "#16110e", roughness: 1 }));
  inside.position.set(0, 1.1, -0.35);
  door.add(inside);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.7), new THREE.MeshStandardMaterial({ color: "#6f6645", roughness: 0.95 }));
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(0, 0.07, -0.05);
  door.add(mat);
  // A pent roof over the door: a board sloping down to the front, round
  // tiles running down it, their ends in a row along the eave.
  const tile = new THREE.MeshStandardMaterial({ color: "#44484e", roughness: 0.5, metalness: 0.15 });
  const slope = new THREE.Group();
  slope.position.set(0, 2.32, -0.12);
  slope.rotation.x = 0.42;
  door.add(slope);
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 0.78), dark);
  board.position.set(0, 0, 0.35);
  board.castShadow = true;
  slope.add(board);
  const n = 21;
  for (let i = 0; i < n; i++) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.8, 10, 1, false, 0, Math.PI), tile);
    t.rotation.set(Math.PI / 2, 0, 0);
    t.rotation.z = Math.PI / 2;
    t.rotation.order = "ZXY";
    t.position.set(-1.25 + (i * 2.5) / (n - 1), 0.03, 0.36);
    t.castShadow = true;
    slope.add(t);
    const end = new THREE.Mesh(new THREE.CircleGeometry(0.056, 12), tile);
    end.position.set(t.position.x, 0.03, 0.761);
    slope.add(end);
  }
  const ridge = new THREE.Mesh(new RoundedBoxGeometry(2.66, 0.1, 0.12, 2, 0.03), tile);
  ridge.position.set(0, 0.05, -0.04);
  slope.add(ridge);
  const step = add(new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.12, 0.5, 2, 0.03), new THREE.MeshStandardMaterial({ color: "#8b8680", roughness: 0.9 })));
  step.position.set(0, -0.06, 0.4);
  // The noren on its rod, in three panels.
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.76, 12), dark);
  rod.rotation.z = Math.PI / 2;
  rod.position.set(0, 2.06, 0.13);
  door.add(rod);
  const uTime = { value: 0 };
  let map = await clothTexture(args.name);
  const panels: THREE.Mesh[] = [];
  const pw = (CW - GAP * (PANELS - 1)) / PANELS;
  for (let i = 0; i < PANELS; i++) {
    const geo = new THREE.PlaneGeometry(pw, CH, 8, 16);
    // Each panel shows its part of the drawing.
    const uv = geo.getAttribute("uv") as THREE.BufferAttribute;
    for (let k = 0; k < uv.count; k++) uv.setX(k, (i * (pw + GAP) + uv.getX(k) * pw) / CW);
    const p = new THREE.Mesh(geo, panelMaterial(map, i, uTime));
    p.position.set(-CW / 2 + pw / 2 + i * (pw + GAP), 2.06 - CH / 2, 0.14);
    p.castShadow = true;
    panels.push(p);
    door.add(p);
  }
  let shown = false;
  const at = new THREE.Vector3(0.05, 1.3, 0);
  const run = loop(canvas, (t, calm) => {
    uTime.value = calm ? 0.6 : t;
    frame(camera, canvas.width, canvas.height, at, 3.0 * Math.max(1, (0.95 * canvas.height) / canvas.width), 0.12);
    shoot(scene, camera, canvas);
    if (!shown) {
      shown = true;
      ready();
    }
  });
  return {
    async set(next: NorenArgs) {
      const old = map;
      map = await clothTexture(next.name);
      for (const p of panels) {
        (p.material as THREE.MeshStandardMaterial).map = map;
        (p.material as THREE.MeshStandardMaterial).needsUpdate = true;
      }
      old.dispose();
      run.kick();
    },
    resize: run.kick,
    stop() {
      run.stop();
      map.dispose();
      dispose(scene);
    },
  };
}
