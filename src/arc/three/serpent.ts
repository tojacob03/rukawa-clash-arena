// The weekly boss as a sea serpent in 3D (b1, b2), in the units of the drawn
// serpent (SeaSerpent.tsx: the tail at x = 10, a hump every 16, the head at
// the right, the waterline at y = 0, up is up here). Every hump above the
// water is one time you got stuck in the boss's position in the last 14
// days; the ones it has lost lie under the surface, marked by rings. When
// every hump is up, the tail fluke shows too. Scaled red skin, vermilion
// fins, a horned head with an open jaw and a gold eye, inked like the chart.

import * as THREE from "three";
import { SERPENT } from "../core/sea.ts";
import { inked } from "./materials.ts";
import { picture, renderer, shoot } from "./engine.ts";

const HUMP = SERPENT.hump;
const R = 3.3;

let scales: THREE.CanvasTexture | null = null;

/** Scales in rows, dark edges on the deep red of the body. */
function scaleTexture() {
  if (scales) return scales;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#7e2216";
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(30, 6, 4, 0.55)";
  g.lineWidth = 2;
  for (let row = 0; row < 9; row++)
    for (let col = 0; col < 9; col++) {
      const x = col * 16 + (row % 2) * 8;
      const y = row * 16;
      g.beginPath();
      g.arc(x, y, 9, 0.15 * Math.PI, 0.85 * Math.PI);
      g.stroke();
    }
  scales = new THREE.CanvasTexture(c);
  scales.colorSpace = THREE.SRGBColorSpace;
  scales.wrapS = scales.wrapT = THREE.RepeatWrapping;
  scales.repeat.set(4, 1);
  return scales;
}

function fin(w: number, h: number, mat: THREE.Material) {
  const s = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w * 0.1, h), new THREE.Vector2(w / 2, 0)]);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: false });
  g.translate(0, 0, -0.4);
  return new THREE.Mesh(g, mat);
}

export interface SerpentModel {
  group: THREE.Group;
  /** Humps above the water, nearest the head first, to bob in a wave. */
  humps: THREE.Object3D[];
  head: THREE.Object3D;
  dispose: () => void;
}

export function buildSerpent(hp: number, max: number): SerpentModel {
  const n = Math.max(1, Math.min(8, max));
  const up = Math.max(0, Math.min(n, hp));
  const x0 = 10;
  const xh = x0 + n * HUMP;
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ map: scaleTexture(), roughness: 0.55 });
  const finMat = new THREE.MeshStandardMaterial({ color: "#c93a25", roughness: 0.6, side: THREE.DoubleSide });
  const foam = new THREE.MeshStandardMaterial({ color: "#ede3d1", roughness: 0.9 });
  const humps: THREE.Object3D[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const cx = x0 + (i + 0.5) * HUMP;
    const above = i >= n - up;
    if (!above) {
      // A lost hump: only a ring on the water where it went down.
      const ring = new THREE.Mesh(new THREE.TorusGeometry(HUMP * 0.32, 0.35, 6, 24), foam);
      ring.rotation.x = Math.PI / 2;
      ring.scale.set(1, 0.6, 1);
      ring.position.set(cx, 0.2, 0);
      ring.userData.noInk = true;
      group.add(ring);
      continue;
    }
    const hump = new THREE.Group();
    hump.position.set(cx, 0, 0);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(HUMP / 2, R, 12, 28, Math.PI), skin);
    arch.scale.set(1, 1.55, 1);
    hump.add(arch);
    for (const [dx, h] of [[-2.5, 5.5], [2.5, 4.5]] as const) {
      const f = fin(4.5, h, finMat);
      f.position.set(dx, HUMP * 0.78 + R * 0.9 - 1, 0);
      f.rotation.z = -0.2;
      hump.add(f);
    }
    // Foam where the hump breaks the surface.
    for (const s of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(R * 1.35, 0.45, 6, 18), foam);
      r.rotation.x = Math.PI / 2;
      r.position.set((s * HUMP) / 2, 0.3, 0);
      r.userData.noInk = true;
      hump.add(r);
    }
    group.add(hump);
    humps.push(hump);
  }
  if (up === n) {
    // The tail fluke, when every hump is up.
    const tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(x0 + 1, -1, 0), new THREE.Vector3(x0 - 3, 4, 0), new THREE.Vector3(x0 - 7, 8, 0)]), 12, R * 0.8, 10), skin);
    group.add(tail);
    const fluke = fin(8, 6, finMat);
    fluke.position.set(x0 - 8, 8, 0);
    fluke.rotation.z = 0.9;
    group.add(fluke);
  }
  // Neck and head, rising from the water at the right.
  const head = new THREE.Group();
  const neck = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(xh - 2, -2, 0), new THREE.Vector3(xh + 1, 9, 0), new THREE.Vector3(xh + 5, 16, 0), new THREE.Vector3(xh + 10, 19.5, 0)]), 20, R, 12),
    skin,
  );
  group.add(neck);
  head.position.set(xh + 13, 21, 0);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(5.2, 20, 14), skin);
  skull.scale.set(1.45, 0.78, 0.85);
  head.add(skull);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(3.4, 9, 12), skin);
  snout.rotation.z = -Math.PI / 2;
  snout.scale.set(1, 1, 0.8);
  snout.position.set(8.5, -0.2, 0);
  head.add(snout);
  const jaw = new THREE.Mesh(new THREE.ConeGeometry(2.4, 11, 10), skin);
  jaw.rotation.z = -Math.PI / 2 - 0.35;
  jaw.position.set(6.5, -4, 0);
  head.add(jaw);
  const mouth = new THREE.Mesh(new THREE.ConeGeometry(2, 8, 10), new THREE.MeshStandardMaterial({ color: "#3a0a06", roughness: 0.8 }));
  mouth.rotation.z = -Math.PI / 2 - 0.18;
  mouth.position.set(6.5, -2.3, 0);
  mouth.userData.noInk = true;
  head.add(mouth);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1.35, 12, 10), new THREE.MeshStandardMaterial({ color: "#f0cf7d", roughness: 0.3, metalness: 0.2 }));
    eye.position.set(2.2, 1.6, s * 3.6);
    head.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), new THREE.MeshBasicMaterial({ color: "#1b1512" }));
    pupil.scale.set(0.5, 1.2, 0.5);
    pupil.position.set(2.8, 1.6, s * 4.6);
    pupil.userData.noInk = true;
    head.add(pupil);
  }
  const horn = new THREE.Mesh(new THREE.ConeGeometry(1.4, 8, 10), new THREE.MeshStandardMaterial({ color: "#e8d9b8", roughness: 0.5 }));
  horn.rotation.z = 0.9;
  horn.position.set(-4, 5.5, 0);
  head.add(horn);
  const crest = fin(6, 5, finMat);
  crest.position.set(-5.5, 2, 0);
  crest.rotation.z = 0.7;
  head.add(crest);
  group.add(head);
  inked(group, 0.45);
  group.traverse((o) => (o.castShadow = true));
  return {
    group,
    humps,
    head,
    dispose() {
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
      });
    },
  };
}

/** The serpent's box on the chart, in the drawing's units (y down, the waterline at 0). */
export function serpentBox(max: number) {
  const n = Math.max(1, Math.min(8, max));
  return { x: -16, y: -36, w: 36 + n * HUMP + 22, h: 52 };
}

const surface = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.6);

/** The serpent for the chart as a data URL: what is above the water. */
export function serpentPicture(hp: number, max: number, pxPerUnit = 3) {
  const box = serpentBox(max);
  const w = Math.round(box.w * pxPerUnit);
  const h = Math.round(box.h * pxPerUnit);
  return picture(`serpent|${hp}|${max}|${pxPerUnit}`, w, h, (target) => {
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x223038, 1.7));
    const key = new THREE.DirectionalLight(0xfff0da, 2.2);
    key.position.set(-40, 80, 90);
    scene.add(key);
    const s = buildSerpent(hp, max);
    scene.add(s.group);
    // Straight on, a little from above and from the head's side.
    const cx = box.x + box.w / 2;
    const cy = -(box.y + box.h / 2);
    const camera = new THREE.OrthographicCamera(-box.w / 2, box.w / 2, box.h / 2, -box.h / 2, 1, 1000);
    camera.position.set(cx + 40, cy + 60, 300);
    camera.lookAt(cx, cy, 0);
    const gl = renderer();
    const was = gl.clippingPlanes;
    gl.clippingPlanes = [surface];
    try {
      shoot(scene, camera, target);
    } finally {
      gl.clippingPlanes = was;
      s.dispose();
    }
  });
}
