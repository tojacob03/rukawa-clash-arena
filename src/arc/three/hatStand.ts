// The hat collection of the mat passport (b5): one hat at a time on a wooden
// hat block on a small turned stand, turning slowly; a drag turns it by hand.
// With reduced motion it stands still, a drag still turns it.

import * as THREE from "three";
import type { ItemDef } from "../core/items.ts";
import { DEFAULT_LOOK } from "../avatarOptions.ts";
import { newFigure } from "../fighter3d/renderer.ts";
import { dispose, environment, frame, loop, shoot, stageLights } from "./engine.ts";
import { woodTexture } from "./materials.ts";

export interface HatArgs {
  item: ItemDef | null;
}

export async function mountHatStand(canvas: HTMLCanvasElement, args: HatArgs, ready: () => void) {
  const scene = new THREE.Scene();
  stageLights(scene, { shadow: [-1.2, 1.2, 2.6, 0.4] });
  scene.environment = environment();
  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 30);
  const fig = await newFigure();
  scene.add(fig.root);
  // The stand: a turned keyaki column and foot under the block.
  const wood = new THREE.MeshStandardMaterial({ map: woodTexture("keyaki"), roughness: 0.45 });
  const col = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.24, 0), new THREE.Vector2(0.24, 0.05), new THREE.Vector2(0.09, 0.09), new THREE.Vector2(0.07, 0.5), new THREE.Vector2(0.11, 0.56), new THREE.Vector2(0.1, 0.62)], 40), wood);
  col.position.y = 0.4;
  col.castShadow = col.receiveShadow = true;
  scene.add(col);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), new THREE.ShadowMaterial({ opacity: 0.3 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.4;
  floor.receiveShadow = true;
  scene.add(floor);
  let turn = 0;
  let shown = false;
  let current = args;
  const at = new THREE.Vector3(0, 1.47, 0);

  const run = loop(canvas, (t, calm) => {
    fig.root.rotation.y = turn + (calm ? -0.5 : -0.5 + t * 0.35);
    fig.syncClip();
    frame(camera, canvas.width, canvas.height, at, 1.62 * Math.max(1, (1.2 * canvas.height) / canvas.width), 0.2);
    shoot(scene, camera, canvas);
    if (!shown) {
      shown = true;
      ready();
    }
  });

  async function set(next: HatArgs) {
    current = next;
    if (!next.item) return;
    await fig.dress({ look: DEFAULT_LOOK, mode: "gi", gear: { head: next.item }, belt: "weiss", stripes: 0, b: 1, lf: 1 });
    if (current !== next) return;
    // Only the head, as a bare wooden hat block, and the hat on it.
    fig.only((n) => n.startsWith("hw_") || n === "head");
    fig.showAura(false);
    fig.mat("skin")?.color.set("#c9ad84");
    run.kick();
  }
  await set(args);

  return {
    set,
    resize: run.kick,
    /** A drag: turn the stand by hand. */
    turn(rad: number) {
      turn = rad;
      run.kick();
    },
    stop() {
      run.stop();
      fig.dispose();
      dispose(scene);
    },
  };
}
