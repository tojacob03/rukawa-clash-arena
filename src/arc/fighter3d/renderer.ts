// One WebGL renderer for every fighter on the page. Still figures are
// rendered once and copied into their own 2D canvas; a live figure (the
// character stage, the editor) breathes in a loop that stops off screen, in a
// hidden tab and with reduced motion.

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { Figure } from "./figure.ts";
import { dojo, shadowCatcher } from "./dojo.ts";
import type { Spec } from "./figure.ts";

export type Crop = "full" | "head" | "face" | "stage";

// One file per part group (tools/fighter/build.py): base, gi, nogi,
// extras, beard_N, hair_NN, hw_<style>.
const DIR = "/arc/fighter/";

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const files = new Map<string, Promise<THREE.Object3D>>();
function part(name: string) {
  let p = files.get(name);
  if (!p) {
    p = loader.loadAsync(`${DIR}${name}.glb`).then((g) => g.scene);
    files.set(name, p);
    p.catch(() => files.delete(name));
  }
  return p;
}

interface Ctx {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  floor: THREE.Mesh;
  dojo: THREE.Group;
  camera: THREE.PerspectiveCamera;
  still: Figure;
}

let ctxP: Promise<Ctx> | null = null;

async function newFigure() {
  return new Figure(await part("base"), part);
}

function context() {
  ctxP ??= (async () => {
    const canvas = document.createElement("canvas");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.localClippingEnabled = true;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xf6f2ec, 0x2e241d, 1.45));
    const fill = new THREE.DirectionalLight(0xf2f0ec, 0.85);
    fill.position.set(2.5, 1.2, 4);
    scene.add(fill);
    const key = new THREE.DirectionalLight(0xfff4e6, 2.3);
    key.position.set(-2, 3, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 2.6, bottom: -0.4, near: 0.5, far: 14 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    // The gold of the stage, catching the edge of the figure from behind.
    const rim = new THREE.DirectionalLight(0xffc56e, 2.2);
    rim.position.set(2.5, 3, -4);
    scene.add(rim);
    const floor = shadowCatcher();
    scene.add(floor);
    const mats = dojo();
    scene.add(mats);
    const camera = new THREE.PerspectiveCamera(18, 0.75, 0.5, 30);
    return { renderer, scene, floor, dojo: mats, camera, still: await newFigure() };
  })();
  return ctxP;
}

/** Framing per crop: what the camera looks at, how much height fits the frame, how far the fighter turns. */
const FRAME: Record<Crop, { y: number; h: number; yaw: number; tilt: number }> = {
  full: { y: 1.1, h: 2.36, yaw: -0.32, tilt: 0.1 },
  stage: { y: 1.0, h: 2.5, yaw: -0.36, tilt: 0.22 },
  head: { y: 1.6, h: 1.2, yaw: -0.2, tilt: 0.06 },
  face: { y: 1.34, h: 0.56, yaw: -0.12, tilt: 0.04 },
};

function shoot(c: Ctx, fig: Figure, crop: Crop, w: number, h: number, target: HTMLCanvasElement, sway = 0) {
  const { renderer, scene, camera, floor, dojo } = c;
  for (const o of [...scene.children]) if (o.userData.figure) scene.remove(o);
  fig.root.userData.figure = true;
  scene.add(fig.root);
  const f = FRAME[crop];
  fig.root.rotation.y = f.yaw + sway;
  fig.showAura(crop === "full" || crop === "stage");
  fig.syncClip();
  floor.visible = crop === "full";
  dojo.visible = crop === "stage";
  camera.aspect = w / h;
  const vfov = (camera.fov * Math.PI) / 180;
  const dist = f.h / 2 / Math.tan(vfov / 2);
  camera.position.set(0, f.y + dist * Math.sin(f.tilt), dist * Math.cos(f.tilt));
  camera.lookAt(0, f.y, 0);
  camera.updateProjectionMatrix();
  if (renderer.domElement.width !== w || renderer.domElement.height !== h) renderer.setSize(w, h, false);
  renderer.render(scene, camera);
  const g = target.getContext("2d");
  if (!g) return;
  g.clearRect(0, 0, target.width, target.height);
  g.drawImage(renderer.domElement, 0, 0, target.width, target.height);
}

let queue: Promise<unknown> = Promise.resolve();
/** Still figures waiting; while there are any, breathing figures hold their breath. */
let pending = 0;
const bitmaps = new Map<string, ImageBitmap>();

function remember(key: string, bmp: ImageBitmap) {
  bitmaps.set(key, bmp);
  if (bitmaps.size > 96) {
    const first = bitmaps.keys().next().value as string;
    bitmaps.get(first)?.close();
    bitmaps.delete(first);
  }
}

const specKey = (spec: Spec, crop: Crop, w: number, h: number) =>
  JSON.stringify([spec.look, spec.mode, Object.values(spec.gear).map((g) => g?.id ?? ""), Object.keys(spec.gear), spec.belt, spec.stripes, spec.b, spec.lf, crop, w, h]);

/** Draw a still figure into a canvas of its own. */
export function still(target: HTMLCanvasElement, spec: Spec, crop: Crop) {
  const w = target.width;
  const h = target.height;
  const key = specKey(spec, crop, w, h);
  const hit = bitmaps.get(key);
  if (hit) {
    const g = target.getContext("2d");
    g?.clearRect(0, 0, w, h);
    g?.drawImage(hit, 0, 0);
    return Promise.resolve();
  }
  pending++;
  const job = queue
    .then(async () => {
      const c = await context();
      await c.still.dress(spec);
      shoot(c, c.still, crop, w, h, target);
      if (typeof createImageBitmap === "function") remember(key, await createImageBitmap(target));
    })
    .finally(() => pending--);
  queue = job.catch(() => undefined);
  return job;
}

const reduce = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A breathing figure. Returns controls to change it and to stop it. */
export async function live(target: HTMLCanvasElement, crop: Crop) {
  const c = await context();
  const fig = await newFigure();
  let spec: Spec | null = null;
  let raf = 0;
  let visible = true;
  let stopped = false;
  const t0 = performance.now();
  let last = 0;

  const frame = (now: number) => {
    raf = 0;
    if (stopped || !spec) return;
    const t = (now - t0) / 1000;
    const still = reduce();
    // Breathing: the chest rises every 3.6 s; the head settles a little later.
    const breath = still ? 0 : Math.sin((t * Math.PI * 2) / 3.6);
    fig.root.scale.set(1, 1 + 0.006 * breath, 1 + 0.004 * breath);
    fig.head.rotation.set(still ? 0 : 0.018 * Math.sin((t * Math.PI * 2) / 3.6 + 0.8), 0, still ? 0 : 0.02 * Math.sin((t * Math.PI * 2) / 5.2));
    const sway = still ? 0 : 0.035 * Math.sin((t * Math.PI * 2) / 7.3);
    fig.tick(still ? 1.3 : t);
    const every = pending > 0 ? 500 : 30;
    if (now - last > every || still) {
      last = now;
      shoot(c, fig, crop, target.width, target.height, target, sway);
    }
    if (!still && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (!raf && !stopped) raf = requestAnimationFrame(frame);
  };
  const io = typeof IntersectionObserver === "function" ? new IntersectionObserver(([e]) => ((visible = e.isIntersecting), visible && kick())) : null;
  io?.observe(target);
  const onVis = () => !document.hidden && kick();
  document.addEventListener("visibilitychange", onVis);
  const mq = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  mq?.addEventListener("change", kick);

  return {
    async set(next: Spec) {
      spec = next;
      await fig.dress(next);
      kick();
    },
    resize() {
      kick();
    },
    stop() {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      fig.dispose();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      mq?.removeEventListener("change", kick);
    },
  };
}

/** Load the model and the renderer ahead of the first figure. */
export function warm() {
  return context().then(() => undefined);
}
