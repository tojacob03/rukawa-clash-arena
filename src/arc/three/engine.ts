// One WebGL renderer for every 3D picture on the page: the fighters, the
// ship, the serpent, the seals, medals and chests. A scene is rendered into
// the shared canvas and copied into a 2D canvas of its own. Still pictures
// wait in one queue and are kept as bitmaps; a live scene runs in a loop that
// stops off screen, in a hidden tab and with reduced motion.

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

let gl: THREE.WebGLRenderer | null = null;

/** The shared renderer; throws without WebGL, so callers fall back to their drawings. */
export function renderer() {
  if (!gl) {
    const canvas = document.createElement("canvas");
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power", preserveDrawingBuffer: false });
    r.setClearColor(0x000000, 0);
    r.toneMapping = THREE.NeutralToneMapping;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.localClippingEnabled = true;
    gl = r;
  }
  return gl;
}

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const files = new Map<string, Promise<THREE.Object3D>>();

/** A glTF file from public/arc, loaded once. */
export function glb(path: string) {
  let p = files.get(path);
  if (!p) {
    p = loader.loadAsync(path).then((g) => g.scene);
    files.set(path, p);
    p.catch(() => files.delete(path));
  }
  return p;
}

let env: THREE.Texture | null = null;

/** A soft room for metal and lacquer to mirror. */
export function environment() {
  if (!env) {
    const pm = new THREE.PMREMGenerator(renderer());
    env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
  }
  return env;
}

/** Render a scene and copy the picture into the target canvas. */
export function shoot(scene: THREE.Scene, camera: THREE.Camera, target: HTMLCanvasElement) {
  const r = renderer();
  const w = target.width;
  const h = target.height;
  if (!w || !h) return;
  if (r.domElement.width !== w || r.domElement.height !== h) r.setSize(w, h, false);
  r.render(scene, camera);
  const g = target.getContext("2d");
  if (!g) return;
  g.clearRect(0, 0, w, h);
  g.drawImage(r.domElement, 0, 0, w, h);
}

/** Aim a camera at a point so that a height h fits the frame, seen from above by tilt (radians). */
export function frame(camera: THREE.PerspectiveCamera, w: number, h: number, at: THREE.Vector3, height: number, tilt: number) {
  camera.aspect = w / h;
  const vfov = (camera.fov * Math.PI) / 180;
  const dist = height / 2 / Math.tan(vfov / 2);
  camera.position.set(at.x, at.y + dist * Math.sin(tilt), at.z + dist * Math.cos(tilt));
  camera.lookAt(at);
  camera.updateProjectionMatrix();
}

export const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

let queue: Promise<unknown> = Promise.resolve();
/** Still pictures waiting; while there are any, live scenes draw only twice a second. */
let pending = 0;
export const busy = () => pending > 0;

/** Run jobs on the shared renderer one after the other. */
export function enqueue<T>(job: () => Promise<T> | T): Promise<T> {
  pending++;
  const p = queue.then(job).finally(() => pending--);
  queue = p.catch(() => undefined);
  return p;
}

const bitmaps = new Map<string, ImageBitmap>();

function remember(key: string, bmp: ImageBitmap) {
  bitmaps.set(key, bmp);
  if (bitmaps.size > 160) {
    const first = bitmaps.keys().next().value as string;
    bitmaps.get(first)?.close();
    bitmaps.delete(first);
  }
}

/** Draw a still picture into a canvas, from the cache when the same one was drawn before. */
export function still(target: HTMLCanvasElement, key: string, draw: (target: HTMLCanvasElement) => Promise<void> | void) {
  const w = target.width;
  const h = target.height;
  const k = `${key}|${w}x${h}`;
  const hit = bitmaps.get(k);
  if (hit) {
    const g = target.getContext("2d");
    g?.clearRect(0, 0, w, h);
    g?.drawImage(hit, 0, 0);
    return Promise.resolve();
  }
  return enqueue(async () => {
    await draw(target);
    if (typeof createImageBitmap === "function") remember(k, await createImageBitmap(target));
  });
}

const urls = new Map<string, Promise<string>>();

/** A still picture as a data URL, for an <image> in an SVG or an <img>; kept per key. */
export function picture(key: string, w: number, h: number, draw: (target: HTMLCanvasElement) => Promise<void> | void) {
  let p = urls.get(key);
  if (!p) {
    p = enqueue(async () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      await draw(c);
      return c.toDataURL("image/png");
    });
    urls.set(key, p);
    p.catch(() => urls.delete(key));
  }
  return p;
}

export interface Loop {
  /** Draw again soon (after a change, or to go on after reduced motion). */
  kick: () => void;
  stop: () => void;
}

/**
 * Calls draw about 30 times a second while the target is on screen and the
 * tab is shown. draw gets the seconds since the start and whether motion is
 * reduced; with reduced motion it draws once per kick. It returns false when
 * nothing moves any more, and the loop rests until the next kick.
 */
export function loop(target: Element, draw: (t: number, calm: boolean) => boolean | void): Loop {
  let raf = 0;
  let visible = true;
  let stopped = false;
  let last = -1e9;
  const t0 = performance.now();
  const frame = (now: number) => {
    raf = 0;
    if (stopped) return;
    const calm = reduced();
    const every = busy() ? 500 : 30;
    let more = true;
    if (now - last > every || calm) {
      last = now;
      more = draw((now - t0) / 1000, calm) !== false;
    }
    if (more && !calm && visible && !document.hidden) raf = requestAnimationFrame(frame);
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
  kick();
  return {
    kick,
    stop() {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      mq?.removeEventListener("change", kick);
    },
  };
}

/** The light of the stage: sky and floor, a warm key from the front left that casts shadows, a gold rim from behind. */
export function stageLights(scene: THREE.Scene, o: { shadow?: [number, number, number, number]; rim?: number } = {}) {
  scene.add(new THREE.HemisphereLight(0xf6f2ec, 0x2e241d, 1.45));
  const fill = new THREE.DirectionalLight(0xf2f0ec, 0.85);
  fill.position.set(2.5, 1.2, 4);
  scene.add(fill);
  const key = new THREE.DirectionalLight(0xfff4e6, 2.3);
  key.position.set(-2, 3, 5);
  if (o.shadow) {
    const [l, r, t, b] = o.shadow;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: l, right: r, top: t, bottom: b, near: 0.5, far: 14 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
  }
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc56e, o.rim ?? 2.2);
  rim.position.set(2.5, 3, -4);
  scene.add(rim);
  return { key, fill, rim };
}

/** Free the geometry and materials of an object tree (shared textures stay). */
export function dispose(o: THREE.Object3D) {
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    m.geometry?.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((y) => y.dispose());
    else mat?.dispose();
  });
  o.removeFromParent();
}
