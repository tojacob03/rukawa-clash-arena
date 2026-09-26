// The fighters on the page, drawn with the shared renderer (three/engine.ts).
// Still figures are rendered once and kept as bitmaps; a live figure (the
// character stage, the editor) breathes, turns under the finger and comes
// close when you tap its face.

import * as THREE from "three";
import { Figure, partsFor } from "./figure.ts";
import { dojo, shadowCatcher } from "./dojo.ts";
import type { Spec } from "./figure.ts";
import { dispose, enqueue, frame, glb, loop, shoot, stageLights, still as stillPicture } from "../three/engine.ts";

export type Crop = "full" | "head" | "face" | "stage" | "icon" | "belt";

/** One file per part group (tools/fighter/build.py): base, gi, nogi, extras, beard_N, hair_NN, hw_<style>. */
export const part = (name: string) => glb(`/arc/fighter/${name}.glb`);

export async function newFigure() {
  return new Figure(await part("base"), part);
}

export interface Stage {
  scene: THREE.Scene;
  floor: THREE.Mesh;
  dojo: THREE.Group;
  camera: THREE.PerspectiveCamera;
}

/** A scene with the stage light, a shadow catcher and two tatami. */
export function makeStage(shadow: [number, number, number, number] = [-1.4, 1.4, 2.6, -0.4]): Stage {
  const scene = new THREE.Scene();
  stageLights(scene, { shadow });
  const floor = shadowCatcher();
  scene.add(floor);
  const mats = dojo();
  scene.add(mats);
  return { scene, floor, dojo: mats, camera: new THREE.PerspectiveCamera(18, 0.75, 0.5, 30) };
}

let ctxP: Promise<Stage & { still: Figure }> | null = null;

function context() {
  ctxP ??= newFigure().then((still) => ({ ...makeStage(), still }));
  return ctxP;
}

interface Shot {
  y: number;
  h: number;
  yaw: number;
  tilt: number;
}

/** Framing per crop: what the camera looks at, how much height fits the frame, how far the fighter turns. */
const FRAME: Record<Crop, Shot> = {
  full: { y: 1.1, h: 2.36, yaw: -0.32, tilt: 0.1 },
  stage: { y: 1.0, h: 2.5, yaw: -0.36, tilt: 0.22 },
  head: { y: 1.6, h: 1.2, yaw: -0.2, tilt: 0.06 },
  face: { y: 1.34, h: 0.56, yaw: -0.12, tilt: 0.04 },
  icon: { y: 1.5, h: 1.14, yaw: -0.26, tilt: 0.05 },
  belt: { y: 0.46, h: 0.62, yaw: -0.08, tilt: 0.16 },
};

/** Crops around the head follow it when the legs are longer or shorter. */
const RIDES = new Set<Crop>(["head", "face", "icon", "belt"]);

/** The stage close on the face (a1): what the camera sees after a tap on the head. */
const CLOSE: Shot = { y: 1.47, h: 1.3, yaw: -0.14, tilt: 0.05 };

const mix = (a: Shot, b: Shot, k: number): Shot => ({ y: a.y + (b.y - a.y) * k, h: a.h + (b.h - a.h) * k, yaw: a.yaw + (b.yaw - a.yaw) * k, tilt: a.tilt + (b.tilt - a.tilt) * k });

const at = new THREE.Vector3();

function place(s: Stage, fig: Figure, crop: Crop, target: HTMLCanvasElement, o: { sway?: number; turn?: number; close?: number } = {}) {
  const { scene, camera, floor, dojo } = s;
  for (const x of [...scene.children]) if (x.userData.figure && x !== fig.root) scene.remove(x);
  fig.root.userData.figure = true;
  if (fig.root.parent !== scene) scene.add(fig.root);
  let f = FRAME[crop];
  if (o.close) f = mix(f, { ...CLOSE, y: CLOSE.y + fig.lift }, o.close);
  const y = RIDES.has(crop) ? f.y + fig.lift : f.y;
  fig.root.rotation.y = f.yaw + (o.sway ?? 0) + (o.turn ?? 0);
  fig.showAura(crop === "full" || crop === "stage");
  fig.syncClip();
  floor.visible = crop === "full";
  dojo.visible = crop === "stage";
  frame(camera, target.width, target.height, at.set(0, y, 0), f.h, f.tilt);
}

const specKey = (spec: Spec, crop: Crop) =>
  JSON.stringify([spec.look, spec.mode, Object.values(spec.gear).map((g) => g?.id ?? ""), Object.keys(spec.gear), spec.belt, spec.stripes, spec.b, spec.lf, spec.mood ?? "", crop]);

/** Draw a still figure into a canvas of its own. */
export function still(target: HTMLCanvasElement, spec: Spec, crop: Crop) {
  return stillPicture(target, specKey(spec, crop), async () => {
    const c = await context();
    await c.still.dress(spec);
    place(c, c.still, crop, target);
    shoot(c.scene, c.camera, target);
  });
}

export interface Live {
  set: (spec: Spec) => Promise<void>;
  resize: () => void;
  stop: () => void;
  /** Turn the fighter by an angle (radians) on top of its pose. */
  turn: (rad: number) => void;
  /** Come close to the face, or go back. */
  close: (on: boolean) => void;
  /** Whether a point of the canvas (0 … 1 from the top left) lies on the head. */
  onHead: (x: number, y: number) => boolean;
}

/** A breathing figure. onFrame hears about the first frame. */
export async function live(target: HTMLCanvasElement, crop: Crop, onFrame?: () => void): Promise<Live> {
  const stage = makeStage();
  const fig = await newFigure();
  let spec: Spec | null = null;
  let turn = 0;
  let closeTo = 0;
  let close = 0;
  let prev = 0;

  const run = loop(target, (t, calm) => {
    if (!spec) return false;
    // Breathing: the chest rises every 3.6 s; the head settles a little later.
    const breath = calm ? 0 : Math.sin((t * Math.PI * 2) / 3.6);
    fig.root.scale.set(1, 1 + 0.006 * breath, 1 + 0.004 * breath);
    fig.head.rotation.set(calm ? 0 : 0.018 * Math.sin((t * Math.PI * 2) / 3.6 + 0.8), 0, calm ? 0 : 0.02 * Math.sin((t * Math.PI * 2) / 5.2));
    const sway = calm ? 0 : 0.035 * Math.sin((t * Math.PI * 2) / 7.3);
    // The camera glides to the face and back in about half a second.
    const dt = Math.min(0.1, t - prev);
    prev = t;
    close = calm ? closeTo : close + (closeTo - close) * Math.min(1, dt * 7);
    if (Math.abs(close - closeTo) < 0.002) close = closeTo;
    fig.tick(calm ? 1.3 : t);
    place(stage, fig, crop, target, { sway, turn, close: close * close * (3 - 2 * close) });
    shoot(stage.scene, stage.camera, target);
    if (onFrame) {
      onFrame();
      onFrame = undefined;
    }
  });

  const ray = new THREE.Raycaster();
  return {
    async set(next: Spec) {
      spec = next;
      await fig.dress(next);
      run.kick();
    },
    resize: run.kick,
    turn(rad: number) {
      turn = rad;
      run.kick();
    },
    close(on: boolean) {
      closeTo = on ? 1 : 0;
      run.kick();
    },
    onHead(x: number, y: number) {
      stage.scene.updateMatrixWorld(true);
      ray.setFromCamera(new THREE.Vector2(x * 2 - 1, 1 - y * 2), stage.camera);
      // The first thing the finger meets that is shown: is it part of the head?
      for (const h of ray.intersectObject(fig.root, true)) {
        let o: THREE.Object3D | null = h.object;
        let head = false;
        let shown: boolean = (h.object as THREE.Mesh).isMesh === true;
        while (o && o !== fig.root) {
          shown &&= o.visible;
          head ||= o === fig.head;
          o = o.parent;
        }
        if (shown) return head;
      }
      return false;
    },
    stop() {
      run.stop();
      fig.dispose();
      dispose(stage.scene);
    },
  };
}

/** Get a figure ready before it is shown: the parts it wears, its textures and shaders (one small render nobody sees). */
export async function preload(spec: Spec) {
  await Promise.all([context(), ...partsFor(spec).map(part)]);
  const c = document.createElement("canvas");
  c.width = c.height = 48;
  await still(c, spec, "full");
}

export { enqueue };
