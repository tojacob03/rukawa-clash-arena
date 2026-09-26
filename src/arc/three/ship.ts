// Your ship in 3D (b1), in the units of the drawn ship (ShipArt: a 200 × 150
// box, the waterline at 128): x along the ship with the bow at +x, y up from
// the waterline, z across. It grows with your belt as the drawing does: a
// boat with one sail, a sloop, a brig, a three-master, and the flagship
// with royals, a gold rail and a stern lantern. The main sails take your
// class colour, the crew flag flies from the main mast as cloth, worn sails
// carry a patch, and barnacles sit on the hull for rusting techniques.

import * as THREE from "three";
import type { Belt } from "../core/types.ts";
import type { ShipLook } from "../components/ShipArt.tsx";
import { cloth, flagTexture, setWind } from "./flag.tsx";
import { inked } from "./materials.ts";
import { picture, renderer, shoot } from "./engine.ts";

const WOOD = "#8a5a2b";
const WOOD2 = "#5e3a1c";
const SAIL = "#efe6d3";
const GOLD = "#d4a94f";

interface Rig {
  len: number;
  beam: number;
  free: number;
  masts: { x: number; h: number; square: number; fore?: "tri" | "gaff"; royal?: boolean }[];
  jib?: boolean;
  ports?: number;
  flagship?: boolean;
  oar?: boolean;
}

/** The ship classes, sized like the drawings. */
const RIGS: Record<Belt, Rig> = {
  weiss: { len: 84, beam: 28, free: 14, masts: [{ x: -2, h: 76, square: 0, fore: "tri" }], oar: true },
  blau: { len: 128, beam: 36, free: 19, masts: [{ x: 8, h: 100, square: 0, fore: "tri" }], jib: true },
  lila: { len: 148, beam: 40, free: 22, masts: [{ x: 32, h: 100, square: 2 }, { x: -24, h: 106, square: 1, fore: "gaff" }], jib: true },
  braun: { len: 164, beam: 44, free: 25, masts: [{ x: 44, h: 100, square: 2 }, { x: 0, h: 114, square: 2 }, { x: -44, h: 100, square: 2 }], jib: true, ports: 6 },
  schwarz: { len: 164, beam: 44, free: 25, masts: [{ x: 44, h: 104, square: 3 }, { x: 0, h: 120, square: 3 }, { x: -44, h: 104, square: 3 }], jib: true, ports: 6, flagship: true },
};

/** Planks: long lines along the hull, the grain of each board. */
function plankTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = WOOD;
  g.fillRect(0, 0, 512, 128);
  for (let y = 0; y < 128; y += 16) {
    g.fillStyle = "rgba(40, 22, 8, 0.55)";
    g.fillRect(0, y, 512, 1.5);
    for (let x = ((y / 16) % 2) * 90; x < 512; x += 180) g.fillRect(x, y, 1.5, 16);
    g.fillStyle = "rgba(255, 230, 190, 0.06)";
    g.fillRect(0, y + 3, 512, 5);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

let planks: THREE.CanvasTexture | null = null;

/** The hull: U-shaped sections from the transom (t = 0) to the stem (t = 1), rising to the bow and stern. */
function hullGeometry(r: Rig) {
  const NX = 28;
  const NU = 14;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const width = (t: number) => (t < 0.4 ? 0.72 + 0.28 * Math.sin((t / 0.4) * (Math.PI / 2)) : Math.pow(Math.cos(((t - 0.4) / 0.6) * (Math.PI / 2)), 0.75));
  const top = (t: number) => r.free + 7 * Math.pow(t, 3) + 5 * Math.pow(1 - t, 4);
  const bottom = (t: number) => -10 + 8 * Math.pow(Math.max(0, t - 0.55) / 0.45, 1.6);
  for (let i = 0; i <= NX; i++) {
    const t = i / NX;
    const x = -r.len / 2 + t * r.len;
    const w = (r.beam / 2) * Math.max(0.02, width(t));
    for (let j = 0; j <= NU; j++) {
      const a = (j / NU) * Math.PI;
      const z = -w * Math.cos(a);
      const y = top(t) + (bottom(t) - top(t)) * Math.pow(Math.sin(a), 0.7);
      pos.push(x, y, z);
      uv.push(t * 3, (j / NU) * 2);
    }
  }
  const row = NU + 1;
  for (let i = 0; i < NX; i++)
    for (let j = 0; j < NU; j++) {
      const a = i * row + j;
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  // The transom: close the stern.
  const c0 = pos.length / 3;
  pos.push(-r.len / 2, top(0) * 0.6, 0);
  uv.push(0, 1);
  for (let j = 0; j < NU; j++) idx.push(c0, j + 1, j);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { g, top, width };
}

/** A sail bellied forward (+x) in its middle. */
function squareSail(w: number, h: number, belly: number, mat: THREE.Material) {
  const g = new THREE.PlaneGeometry(w, h, 10, 8);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / w + 0.5;
    const v = p.getY(i) / h + 0.5;
    p.setZ(i, belly * Math.sin(u * Math.PI) * Math.sin(v * Math.PI * 0.9 + 0.1));
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  // The plane faces +z; turn it across the ship, facing the bow.
  m.rotation.y = Math.PI / 2;
  return m;
}

/** A fore-and-aft sail: a triangle (or a four-sided gaff sail) in the x-y plane, bellied to +z. */
function triSail(pts: [number, number][], belly: number, mat: THREE.Material) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ShapeGeometry(shape, 12);
  // Refine so the belly bends smoothly.
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  const box = new THREE.Box2().setFromPoints(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  for (let i = 0; i < p.count; i++) {
    const u = (p.getX(i) - box.min.x) / (box.max.x - box.min.x || 1);
    const v = (p.getY(i) - box.min.y) / (box.max.y - box.min.y || 1);
    p.setZ(i, belly * Math.sin(u * Math.PI) * Math.sin(v * Math.PI));
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function spar(len: number, r: number, mat: THREE.Material) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, len, 10), mat);
}

export interface ShipModel {
  group: THREE.Group;
  /** Moves the flag to the moment t (seconds). */
  tick: (t: number) => void;
  dispose: () => void;
}

/** Builds the ship for a look; the flag waves with `wind` (0 … 1). */
export async function buildShip(look: ShipLook, wind: number): Promise<ShipModel> {
  const r = RIGS[look.belt] ?? RIGS.weiss;
  const group = new THREE.Group();
  planks ??= plankTexture();
  const wood = new THREE.MeshStandardMaterial({ map: planks, roughness: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: WOOD2, roughness: 0.6 });
  const deckMat = new THREE.MeshStandardMaterial({ color: "#a47a4c", roughness: 0.8 });
  const sailMain = new THREE.MeshStandardMaterial({ color: look.sail, roughness: 0.9, side: THREE.DoubleSide });
  const sailCream = new THREE.MeshStandardMaterial({ color: SAIL, roughness: 0.9, side: THREE.DoubleSide });
  const patch = new THREE.MeshStandardMaterial({ color: "#d9d2bf", roughness: 0.95, side: THREE.DoubleSide });
  const gold = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.9, roughness: 0.35 });
  const worn = (look.sails ?? 50) < 25;

  const { g: hullGeo, top, width } = hullGeometry(r);
  const hull = new THREE.Mesh(hullGeo, wood);
  hull.material.side = THREE.DoubleSide;
  group.add(hull);
  // The deck, just under the rail.
  const deckPts: THREE.Vector2[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    deckPts.push(new THREE.Vector2(-r.len / 2 + t * r.len, (r.beam / 2) * Math.max(0.02, width(t)) * 0.94));
  }
  for (let i = 20; i >= 0; i--) {
    const t = i / 20;
    deckPts.push(new THREE.Vector2(-r.len / 2 + t * r.len, -(r.beam / 2) * Math.max(0.02, width(t)) * 0.94));
  }
  const deck = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(deckPts)), deckMat);
  deck.rotation.x = Math.PI / 2;
  deck.position.y = r.free - 2;
  deck.userData.noInk = true;
  group.add(deck);
  if (r.flagship) {
    // A gold rail along the sheer on both sides.
    for (const s of [-1, 1]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 24; i++) {
        const t = 0.02 + (i / 24) * 0.93;
        pts.push(new THREE.Vector3(-r.len / 2 + t * r.len, top(t) - 3, s * (r.beam / 2) * Math.max(0.02, width(t)) * 1.01));
      }
      const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.9, 6), gold);
      rail.userData.noInk = true;
      group.add(rail);
    }
    const lantern = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), gold);
    lantern.position.set(-r.len / 2 - 1, top(0) + 6, 0);
    group.add(lantern);
  }
  if (r.ports) {
    const port = new THREE.MeshStandardMaterial({ color: "#1b1512", roughness: 0.8 });
    for (let i = 0; i < r.ports; i++) {
      const t = 0.2 + (i / (r.ports - 1)) * 0.55;
      for (const s of [-1, 1]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 1.2), port);
        p.position.set(-r.len / 2 + t * r.len, r.free * 0.55, s * (r.beam / 2) * width(t) * 0.99);
        p.userData.noInk = true;
        group.add(p);
      }
    }
  }
  // Barnacles at the waterline.
  const shell = new THREE.MeshStandardMaterial({ color: "#d9d2bf", roughness: 0.9 });
  for (let i = 0; i < Math.min(9, look.barnacles ?? 0); i++) {
    const t = 0.25 + i * 0.06;
    const b = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 6), shell);
    b.position.set(-r.len / 2 + t * r.len, 1 + (i % 3), (r.beam / 2) * width(t) * 0.96);
    group.add(b);
  }
  if (r.oar) {
    const oar = spar(34, 1.2, dark);
    oar.position.set(-r.len / 2 - 6, 4, 6);
    oar.rotation.z = 1.1;
    group.add(oar);
  }

  // Masts and sails.
  let flagTop = new THREE.Vector3(0, 100, 0);
  let tallest = 0;
  for (const m of r.masts) {
    const mast = spar(m.h - r.free + 4, 1.9, dark);
    mast.position.set(m.x, r.free - 4 + (m.h - r.free + 4) / 2, 0);
    group.add(mast);
    if (m.h > tallest) {
      tallest = m.h;
      flagTop = new THREE.Vector3(m.x, m.h, 0);
    }
    // Square sails, from the top down; the lowest (the course) in your colour.
    // Each hangs from its yard, the pair braced round a little to the wind.
    const n = m.square;
    const span = (m.h - r.free - 14) / Math.max(1, n);
    for (let k = 0; k < n; k++) {
      const course = k === n - 1;
      const w = (course ? 44 : 34 - (n - 1 - k) * 4) * (r.beam / 44);
      const h = span * 0.86;
      const y = m.h - 6 - span * k - h / 2;
      const braced = new THREE.Group();
      braced.position.set(m.x + 2.5, y, 0);
      braced.rotation.y = 0.62;
      braced.add(squareSail(w, h, 6, course ? sailMain : sailCream));
      const yard = spar(w + 6, 1.1, dark);
      yard.rotation.x = Math.PI / 2;
      yard.position.set(-1.5, h / 2, 0);
      braced.add(yard);
      if (worn && k === 0) {
        const pa = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.2, h * 0.25), patch);
        pa.rotation.y = Math.PI / 2;
        pa.position.set(4.5, -h * 0.1, w * 0.12);
        braced.add(pa);
      }
      group.add(braced);
    }
    // A fore-and-aft sail behind the mast, swung out a little on its boom.
    if (m.fore) {
      const lo = r.free + 6;
      const hi = n ? m.h - span * n - 4 : m.h - 6;
      const back = m.fore === "gaff" ? 46 : Math.min(52, r.len * 0.42);
      const pts: [number, number][] = m.fore === "gaff" ? [[0, lo], [0, hi], [-back * 0.8, hi + 6], [-back, lo]] : [[0, lo], [0, hi], [-back, lo]];
      const swung = new THREE.Group();
      swung.position.set(m.x - 1.5, 0, 0);
      swung.rotation.y = 0.28;
      swung.add(triSail(pts, 7, m === r.masts[0] || m.fore === "gaff" ? sailMain : sailCream));
      const boom = spar(back + 4, 1.1, dark);
      boom.rotation.z = Math.PI / 2;
      boom.position.set(-back / 2, lo - 1, 0);
      swung.add(boom);
      group.add(swung);
    }
  }
  if (r.jib) {
    const fore = r.masts.reduce((a, m) => (m.x > a.x ? m : a), r.masts[0]);
    const tip = r.len / 2 + 22;
    const bowsprit = spar(34, 1.3, dark);
    bowsprit.rotation.z = Math.PI / 2 + 0.25;
    bowsprit.position.set(r.len / 2 + 6, r.free + 10, 0);
    group.add(bowsprit);
    const jib = triSail([[fore.x + 3, fore.h - 10], [tip, r.free + 12], [fore.x + 10, r.free + 8]], 5, sailCream);
    group.add(jib);
  }
  if (worn && r.masts.every((m) => !m.square)) {
    const m = r.masts[0];
    const pa = new THREE.Mesh(new THREE.PlaneGeometry(8, 7), patch);
    pa.position.set(m.x - 14, r.free + 24, 5);
    pa.rotation.y = 0.28;
    group.add(pa);
  }
  inked(group, 0.9);

  // The crew flag on the main mast.
  const fw = 28;
  const fh = 19;
  const flag = cloth(fw, fh);
  flag.mat.map = await flagTexture(look.flag);
  setWind(flag.uniforms, wind, fw);
  const sheet = new THREE.Mesh(flag.geo, flag.mat);
  sheet.position.set(flagTop.x + 1.5, flagTop.y + 20, 0);
  group.add(sheet);
  const pole = spar(22, 0.9, dark);
  pole.position.set(flagTop.x, flagTop.y + 10, 0);
  group.add(pole);
  group.traverse((o) => {
    o.castShadow = true;
  });

  return {
    group,
    tick: (t) => {
      flag.uniforms.uTime.value = t;
    },
    dispose() {
      flag.mat.map?.dispose();
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
      });
    },
  };
}

/** The box of the sprite in the drawing's units: as ShipArt, with room above for the flag. */
export const SPRITE = { x: 0, y: -46, w: 200, h: 196 };

let spriteRig: { scene: THREE.Scene; camera: THREE.OrthographicCamera } | null = null;

function spriteScene() {
  if (!spriteRig) {
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x3a2c20, 2.0));
    const key = new THREE.DirectionalLight(0xfff0da, 2.6);
    key.position.set(-160, 220, 200);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffc56e, 1.4);
    rim.position.set(160, 120, -200);
    scene.add(rim);
    // From the starboard quarter, a little astern and above, bow to the
    // right; a fifth larger than the drawing, so the rigging reads.
    const zoom = 1.2;
    const camera = new THREE.OrthographicCamera(-100 / zoom, 100 / zoom, (128 + 46) / zoom, -22 / zoom, 1, 2000);
    const yaw = 0.68;
    const el = 0.22;
    camera.position.set(-Math.sin(yaw) * Math.cos(el) * 600, Math.sin(el) * 600, Math.cos(yaw) * Math.cos(el) * 600);
    camera.lookAt(0, 0, 0);
    spriteRig = { scene, camera };
  }
  return spriteRig;
}

const keel = new THREE.Plane(new THREE.Vector3(0, 1, 0), 2.5);

/** Draw the ship for the chart: the part above the water, the flag at a moment of its wave. */
export async function drawShipSprite(target: HTMLCanvasElement, look: ShipLook, wind: number, t: number, render: (scene: THREE.Scene, camera: THREE.Camera, target: HTMLCanvasElement) => void, gl: THREE.WebGLRenderer) {
  const { scene, camera } = spriteScene();
  const ship = await buildShip(look, wind);
  ship.tick(t);
  scene.add(ship.group);
  const was = gl.clippingPlanes;
  gl.clippingPlanes = [keel];
  try {
    render(scene, camera, target);
  } finally {
    gl.clippingPlanes = was;
    scene.remove(ship.group);
    ship.dispose();
  }
}

/** The ship for the chart as a data URL; `frame` picks one of the flag's moments (0 … frames-1). */
export function shipPicture(look: ShipLook, wind: number, px: number, frame = 0, frames = 1) {
  const key = `ship|${JSON.stringify(look)}|${Math.round(wind * 10)}|${px}|${frame}/${frames}`;
  const h = Math.round((px * SPRITE.h) / SPRITE.w);
  // One period of the wave, cut into `frames` moments.
  const period = 2 - Math.max(0, Math.min(1, wind)) * 1.05;
  return picture(key, px, h, (target) => drawShipSprite(target, look, wind, 0.6 + (frame / frames) * period, shoot, renderer()));
}
