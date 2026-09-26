// The islands of the sea chart as small dioramas (b1): a shore of sand, a
// green top and a hill, trees of their sea (snowy pines in the Frost Sea,
// cherry trees in the Morning Sea, maples in the Evening Sea, a smoking
// cone in the Ember Sea, palms in the great current), and what the kind of
// island asks for: a harbour with its pier and shed, the gate as a torii
// standing in the water, the scarlet ridge's pass, the cape's lighthouse
// with the black flag. Seen from above at an angle, inked like the chart.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { picture, renderer } from "./engine.ts";
import { inked } from "./materials.ts";

export type Biome = "frost" | "morgen" | "abend" | "glut" | "strom";
export type Kind = "hafen" | "tor" | "pass" | "kap" | undefined;

const PAL: Record<Biome, { sand: string; top: string; hill: string }> = {
  frost: { sand: "#cfcac1", top: "#e9eef1", hill: "#d3dce2" },
  morgen: { sand: "#d9ccb2", top: "#6f8c52", hill: "#86a364" },
  abend: { sand: "#cbbba0", top: "#6f7a4c", hill: "#8a8a52" },
  glut: { sand: "#5b4b44", top: "#7b6a45", hill: "#4a3a35" },
  strom: { sand: "#dccfb4", top: "#5f8a58", hill: "#78a06a" },
};

const rnd = (seed: number, i: number) => {
  const x = Math.sin(seed * 91.3 + i * 47.7) * 43758.5453;
  return x - Math.floor(x);
};

const mat = (color: string, rough = 0.85) => new THREE.MeshStandardMaterial({ color, roughness: rough });

/** A flat blob of radius about r, rounded at its edge, from y0 up by h. */
function slab(seed: number, r: number, h: number, y0: number, color: string) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const k = 1 + 0.13 * Math.sin(3 * a + seed * 6) + 0.07 * Math.sin(5 * a + seed * 11) + 0.04 * Math.sin(8 * a + seed);
    pts.push(new THREE.Vector2(Math.cos(a) * r * k, Math.sin(a) * r * k));
  }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: h, bevelEnabled: true, bevelThickness: h * 0.5, bevelSize: h * 0.6, bevelSegments: 3, curveSegments: 4 });
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat(color));
  m.position.y = y0;
  return m;
}

function pine(snow: boolean) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.12, 6), mat("#5e3a1c"));
  trunk.position.y = 0.06;
  g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.13 - i * 0.03, 0.18, 8), mat(snow && i === 2 ? "#eef2f4" : "#2e4a3c"));
    c.position.y = 0.16 + i * 0.1;
    g.add(c);
  }
  return g;
}

function blossomTree(colors: string[], seed: number) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.2, 6), mat("#4a2f22"));
  trunk.position.y = 0.1;
  g.add(trunk);
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 + rnd(seed, i) * 0.04, 1), mat(colors[i % colors.length], 0.9));
    s.position.set((rnd(seed, i + 5) - 0.5) * 0.14, 0.26 + rnd(seed, i + 9) * 0.08, (rnd(seed, i + 13) - 0.5) * 0.14);
    g.add(s);
  }
  return g;
}

function palm(seed: number) {
  const g = new THREE.Group();
  const lean = (rnd(seed, 1) - 0.5) * 0.6;
  const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * 0.3, 0.18, 0), new THREE.Vector3(lean, 0.34, 0)];
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.022, 6), mat("#8a6a44"));
  g.add(trunk);
  const leaf = mat("#3f7a3c", 0.8);
  for (let i = 0; i < 6; i++) {
    const l = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 4), leaf);
    l.position.set(lean, 0.34, 0);
    l.rotation.set(Math.PI / 2 - 0.5, (i / 6) * Math.PI * 2, 0, "YXZ");
    l.translateY(0.1);
    g.add(l);
  }
  return g;
}

function volcano(seed: number) {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.45, 0.55, 14, 1), mat("#3d302c"));
  cone.position.y = 0.3;
  g.add(cone);
  const lava = new THREE.Mesh(new THREE.CircleGeometry(0.12, 14), new THREE.MeshStandardMaterial({ color: "#d4542a", roughness: 0.6 }));
  lava.rotation.x = -Math.PI / 2;
  lava.position.y = 0.578;
  lava.userData.noInk = true;
  g.add(lava);
  // A plume of smoke drifting off, three grey puffs.
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07 + i * 0.03, 1), mat("#8a8680", 1));
    p.position.set(0.04 + i * 0.08 + rnd(seed, i) * 0.03, 0.66 + i * 0.1, 0);
    p.userData.noInk = true;
    g.add(p);
  }
  return g;
}

function torii() {
  const g = new THREE.Group();
  const red = mat("#c23a24", 0.6);
  const black = mat("#1b1512", 0.6);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.7, 10), red);
    post.position.set(s * 0.26, 0.35, 0);
    g.add(post);
  }
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.05), red);
  nuki.position.y = 0.55;
  g.add(nuki);
  const kasagi = new THREE.Mesh(new RoundedBoxGeometry(0.84, 0.07, 0.09, 2, 0.02), black);
  kasagi.position.y = 0.72;
  g.add(kasagi);
  const shimaki = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.05, 0.08), red);
  shimaki.position.y = 0.665;
  g.add(shimaki);
  return g;
}

function lighthouse() {
  const g = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.42, 12), mat("#efe6d3", 0.7));
  tower.position.y = 0.21;
  g.add(tower);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.08, 12), mat("#c23a24", 0.7));
  band.position.y = 0.22;
  g.add(band);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.07, 12), mat("#d4a94f", 0.4));
  lamp.position.y = 0.46;
  g.add(lamp);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.08, 12), mat("#1b1512", 0.6));
  roof.position.y = 0.53;
  g.add(roof);
  // Kap Kuro: the black flag on a pole beside it.
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 6), mat("#1b1512"));
  pole.position.set(0.2, 0.2, 0.05);
  g.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshStandardMaterial({ color: "#0b0d0e", side: THREE.DoubleSide }));
  flag.position.set(0.28, 0.35, 0.05);
  g.add(flag);
  return g;
}

function harbour() {
  const g = new THREE.Group();
  const wood = mat("#8a5a2b", 0.8);
  const pier = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.12), wood);
  pier.position.set(1.0, 0.1, 0.25);
  g.add(pier);
  for (const x of [0.8, 1.0, 1.2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 6), mat("#5e3a1c"));
    post.position.set(x, 0.04, 0.31);
    g.add(post);
  }
  const shed = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.18), mat("#b08a5e", 0.8));
  shed.position.set(0.5, 0.32, 0.18);
  g.add(shed);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.12, 4), mat("#44484e", 0.6));
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0.5, 0.46, 0.18);
  g.add(roof);
  return g;
}

function rocks(seed: number, n: number, color: string, spread = 0.3) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + rnd(seed, i) * 0.08, 0), mat(color, 0.9));
    r.position.set((rnd(seed, i + 3) - 0.5) * spread * 2, 0.04, (rnd(seed, i + 7) - 0.5) * spread * 2);
    r.rotation.set(rnd(seed, i + 11) * 3, rnd(seed, i + 13) * 3, 0);
    g.add(r);
  }
  return g;
}

/** One island, radius about 1, standing on the water (y = 0). */
export function buildIsland(biome: Biome, kind: Kind, seed: number) {
  const g = new THREE.Group();
  const p = PAL[biome];
  if (kind === "tor") {
    g.add(rocks(seed, 4, "#6d6a62"));
    const t = torii();
    t.rotation.y = 0.2;
    g.add(t);
    return inked(g, 0.012);
  }
  if (kind === "pass") {
    // The scarlet ridge: jagged red peaks with a notch, the pass, between them.
    const red = mat("#8e2a1c", 0.8);
    for (const [x, h, r] of [[-0.35, 0.8, 0.42], [0.35, 0.95, 0.45], [0, 0.45, 0.3]] as const) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7, 1), red);
      c.position.set(x, h / 2, 0);
      c.rotation.y = rnd(seed, x * 10 + 3);
      g.add(c);
    }
    g.add(slab(seed, 0.85, 0.06, 0, "#5b3a30"));
    return inked(g, 0.012);
  }
  g.add(slab(seed, 0.95, 0.08, 0, p.sand));
  g.add(slab(seed + 0.37, 0.72, 0.07, 0.1, p.top));
  // The hill, off the middle.
  const hx = (rnd(seed, 1) - 0.5) * 0.5;
  const hz = (rnd(seed, 2) - 0.5) * 0.4 - 0.1;
  if (biome === "glut") {
    const v = volcano(seed);
    v.position.set(hx * 0.6, 0.12, hz);
    g.add(v);
  } else {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(p.hill));
    hill.scale.set(1, 0.55 + rnd(seed, 3) * 0.3, 0.8);
    hill.position.set(hx, 0.16, hz);
    g.add(hill);
  }
  // Trees round the hill, a few tries each for a free place.
  const n = kind ? 2 : 3 + Math.floor(rnd(seed, 4) * 2);
  const placed: [number, number][] = [];
  for (let i = 0, tries = 0; placed.length < n && tries < 40; tries++, i++) {
    const a = rnd(seed, 10 + i) * Math.PI * 2;
    const d = 0.3 + rnd(seed, 20 + i) * 0.32;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d * 0.8;
    if (Math.hypot(x - hx, z - hz) < 0.34 || placed.some(([px, pz]) => Math.hypot(x - px, z - pz) < 0.22)) continue;
    if (kind === "hafen" && x > 0.25 && z > 0) continue;
    if (kind === "kap" && Math.hypot(x - 0.4, z - 0.1) < 0.3) continue;
    placed.push([x, z]);
    const tree =
      biome === "frost" ? pine(true) : biome === "morgen" ? blossomTree(["#f2b6c6", "#f7cfd9", "#e89ab0"], seed + i) : biome === "abend" ? blossomTree(["#c9582a", "#e08a3a", "#b43a22"], seed + i) : palm(seed + i);
    tree.position.set(x, 0.17, z);
    tree.scale.setScalar(1.3 + rnd(seed, 30 + i) * 0.35);
    g.add(tree);
  }
  if (kind === "hafen") g.add(harbour());
  if (kind === "kap") {
    const l = lighthouse();
    l.position.set(0.4, 0.17, 0.1);
    g.add(l);
  }
  return inked(g, 0.012);
}

let rig: { scene: THREE.Scene; camera: THREE.OrthographicCamera } | null = null;

function studio() {
  if (!rig) {
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x223038, 1.6));
    const key = new THREE.DirectionalLight(0xfff0da, 2.2);
    key.position.set(-3, 5, 4);
    scene.add(key);
    // From above, leaning towards the viewer: the chart is read from the south.
    const camera = new THREE.OrthographicCamera(-1.4, 1.4, 1.4, -1.4, 0.1, 20);
    camera.position.set(0, 3.4, 4.8);
    camera.lookAt(0, 0.25, 0);
    rig = { scene, camera };
  }
  return rig;
}

/** An island as a picture for the chart, px square; the island's middle in the middle of it. */
export function islandPicture(biome: Biome, kind: Kind, seed: number, px: number) {
  return picture(`isle|${biome}|${kind ?? ""}|${seed.toFixed(3)}|${px}`, px, px, (target) => {
    const { scene, camera } = studio();
    const isle = buildIsland(biome, kind, seed);
    scene.add(isle);
    const r = renderer();
    r.setSize(px, px, false);
    r.render(scene, camera);
    const g = target.getContext("2d")!;
    g.clearRect(0, 0, px, px);
    g.drawImage(r.domElement, 0, 0, px, px);
    scene.remove(isle);
    isle.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.userData.noInk && !m.material) return;
      m.geometry?.dispose();
    });
  });
}
