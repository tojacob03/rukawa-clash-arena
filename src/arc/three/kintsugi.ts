// The start page's kanji as a lacquered object (b6): 技, waza, cut from a
// thick slab of ivory lacquer with rounded edges, broken and mended with
// gold (outlines from tools/props/kanji.py). The gold runs into the crack
// from the top when the page opens, then a light passes slowly over the
// lacquer and back, the way light moves over a lacquer bowl you turn in
// your hands. With reduced motion the gold is in and the light stands.

import * as THREE from "three";
import raw from "./kintsugi.json?raw";
import { dispose, environment, frame, loop, shoot } from "./engine.ts";

type Ring = [number, number][];
const data = JSON.parse(raw) as { bounds: [number, number, number, number]; body: Ring[][]; gold: Ring[][] };

function shapes(polys: Ring[][]) {
  return polys.map(([outer, ...holes]) => {
    const s = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
    return s;
  });
}

const DEPTH = 0.16;
const FILL_S = 1.6;

export async function mountKintsugi(canvas: HTMLCanvasElement, _args: unknown, ready: () => void) {
  const scene = new THREE.Scene();
  scene.environment = environment();
  scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x1a120d, 0.55));
  // The light that travels: it passes over the kanji from left to right and back.
  const sweep = new THREE.DirectionalLight(0xfff0d8, 2.6);
  scene.add(sweep);
  scene.add(sweep.target);
  const fill = new THREE.DirectionalLight(0xffe2b8, 0.5);
  fill.position.set(1.5, -1, 3);
  scene.add(fill);

  const lacquer = new THREE.MeshPhysicalMaterial({ color: "#e8dcc5", roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.08 });
  const body = new THREE.Mesh(
    // The bevel rounds the edge inwards, so the cracks stay open for the gold.
    new THREE.ExtrudeGeometry(shapes(data.body), { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.008, bevelOffset: -0.008, bevelSegments: 4, curveSegments: 4 }),
    lacquer,
  );
  // The gold: a touch proud of the lacquer, as the gold of kintsugi is.
  // Only the gold above the level shows; the level falls from the top.
  const cut = new THREE.Plane(new THREE.Vector3(0, 1, 0), 10);
  const gold = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shapes(data.gold), { depth: DEPTH + 0.02, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.003, bevelSegments: 2, curveSegments: 4 }),
    new THREE.MeshStandardMaterial({ color: "#f0c060", metalness: 1, roughness: 0.34, envMapIntensity: 2.2, clippingPlanes: [cut] }),
  );
  gold.position.z = -0.006;
  const kanji = new THREE.Group();
  kanji.add(body, gold);
  const [x0, y0, x1, y1] = data.bounds;
  kanji.position.set(-(x0 + x1) / 2, -(y0 + y1) / 2, -DEPTH / 2);
  const turn = new THREE.Group();
  turn.add(kanji);
  turn.rotation.set(-0.08, 0.22, 0);
  scene.add(turn);
  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 20);
  let shown = false;
  const top = (y1 - y0) / 2 + 0.05;
  const run = loop(canvas, (t, calm) => {
    // Gold runs down the crack, then the light starts its round.
    const fill = calm ? 1 : Math.min(1, Math.max(0, (t - 0.35) / FILL_S));
    cut.constant = -(top - fill * (y1 - y0 + 0.1));
    const a = calm ? -0.5 : Math.sin(Math.max(0, t - 0.6) * 0.45 - 1.2);
    sweep.position.set(a * 3, 1.2 + 0.4 * Math.cos(t * 0.3), 2.4);
    turn.rotation.y = 0.22 + (calm ? 0 : 0.05 * Math.sin(t * 0.3));
    frame(camera, canvas.width, canvas.height, new THREE.Vector3(0, 0, 0), 1.25 * Math.max(1, (0.95 * canvas.height) / canvas.width), 0);
    shoot(scene, camera, canvas);
    if (!shown) {
      shown = true;
      ready();
    }
  });
  return {
    set: () => undefined,
    resize: run.kick,
    stop() {
      run.stop();
      dispose(scene);
    },
  };
}
