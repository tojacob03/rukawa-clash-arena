// The crew photo (a10): everyone on board together on the mats of a dōjō,
// the captain in the middle. Up to six stand in one row; with more, the
// rest stand behind on a wooden step, between the heads in front.

import * as THREE from "three";
import type { Spec } from "./figure.ts";
import { dojo } from "./dojo.ts";
import { makeStage, newFigure } from "./renderer.ts";
import { dispose, frame, shoot, still } from "../three/engine.ts";
import { woodTexture } from "../three/materials.ts";

const GAP = 0.82;
const STEP_H = 0.62;
const BACK = 0.95;

/** Where each member stands: [x, y, z], front row first; the first spec is in the middle. */
export function places(n: number): [number, number, number][] {
  const front = Math.min(n, 6);
  const back = n - front;
  // Fill a row from the middle outwards: 0, +1, -1, +2, -2 …
  const row = (k: number, y: number, z: number, shift: number) =>
    Array.from({ length: k }, (_, i) => {
      const slot = i === 0 ? 0 : Math.ceil(i / 2) * (i % 2 ? 1 : -1);
      const off = k % 2 ? 0 : 0.5;
      return [(slot - off) * GAP + shift, y, z] as [number, number, number];
    });
  return [...row(front, 0, 0.1, 0), ...row(back, STEP_H, 0.1 - BACK, back % 2 === front % 2 ? GAP / 2 : 0)];
}

export function crewKey(members: Spec[]) {
  return JSON.stringify(members.map((m) => [m.look, m.mode, Object.values(m.gear).map((g) => g?.id ?? ""), m.belt, m.stripes, m.b, m.lf]));
}

/** Draws the photo into the canvas; the aspect of the canvas decides nothing, the group fills it. */
export function crewPhoto(target: HTMLCanvasElement, members: Spec[]) {
  return still(target, `crew|${crewKey(members)}`, async () => {
    const n = members.length;
    const at = places(n);
    const stage = makeStage([-3.4, 3.4, 3.4, -0.6]);
    stage.floor.visible = false;
    stage.scene.remove(stage.dojo);
    stage.scene.add(dojo(Math.max(4, Math.ceil((Math.min(n, 6) * GAP) / 0.95) + 2), -0.1));
    if (n > 6) {
      // The step at the back of the dōjō, dark keyaki wood.
      const wood = new THREE.MeshStandardMaterial({ map: woodTexture("keyaki"), roughness: 0.55 });
      const bx = at.slice(6).map((p) => p[0]);
      const step = new THREE.Mesh(new THREE.BoxGeometry(Math.max(...bx) - Math.min(...bx) + 1.2, STEP_H, 0.62), wood);
      step.position.set((Math.max(...bx) + Math.min(...bx)) / 2, STEP_H / 2, 0.1 - BACK);
      step.castShadow = step.receiveShadow = true;
      stage.scene.add(step);
    }
    const figs = await Promise.all(members.map(() => newFigure()));
    try {
      await Promise.all(figs.map((f, i) => f.dress(members[i])));
      figs.forEach((f, i) => {
        const [x, y, z] = at[i];
        f.root.position.set(x, y, z);
        // Everyone turns a little towards the middle, like for a photo.
        f.root.rotation.y = -0.1 - x * 0.06;
        f.showAura(false);
        stage.scene.add(f.root);
        f.syncClip();
      });
      const xs = at.map((p) => p[0]);
      const wide = Math.max(...xs) - Math.min(...xs) + 1.1;
      const tall = n > 6 ? 2.3 + STEP_H : 2.3;
      const mid = new THREE.Vector3((Math.max(...xs) + Math.min(...xs)) / 2, tall / 2 - 0.12, 0);
      const aspect = target.width / target.height;
      frame(stage.camera, target.width, target.height, mid, Math.max(tall, wide / aspect) * 1.05, 0.1);
      shoot(stage.scene, stage.camera, target);
    } finally {
      figs.forEach((f) => f.dispose());
      dispose(stage.scene);
    }
  });
}

/** As a scene for Scene3D: a still photo, taken again when the crew or the size changes. */
export async function mountCrew(canvas: HTMLCanvasElement, members: Spec[], ready: () => void) {
  let current = members;
  const draw = () => crewPhoto(canvas, current).then(ready);
  await draw();
  return {
    set(next: Spec[]) {
      current = next;
      return draw();
    },
    resize: () => void draw(),
    stop: () => undefined,
  };
}
