// Inventory pictures from the model itself (a7): a gi, a rashguard or shorts
// worn by an invisible fighter, so the piece keeps its shape, a hat on a
// wooden hat block, each photographed on its own like a catalogue specimen.

import * as THREE from "three";
import type { Belt } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import { DEFAULT_LOOK } from "../avatarOptions.ts";
import { picture, renderer, stageLights } from "../three/engine.ts";
import type { Figure } from "./figure.ts";
import { newFigure } from "./renderer.ts";

const PART: Record<string, (name: string) => boolean> = {
  gi: (n) => n.startsWith("gi_") || n.startsWith("belt"),
  top: (n) => n.startsWith("ng_") && n !== "ng_shorts" && n !== "ng_spats",
  bottom: (n) => n === "ng_shorts" || n === "ng_spats",
  // Hats sit on the bare head, turned into a wooden hat block.
  head: (n) => n.startsWith("hw_") || n === "head",
};

let rig: Promise<{ fig: Figure; scene: THREE.Scene; camera: THREE.PerspectiveCamera }> | null = null;

function studio() {
  rig ??= newFigure().then((fig) => {
    const scene = new THREE.Scene();
    stageLights(scene);
    scene.add(fig.root);
    return { fig, scene, camera: new THREE.PerspectiveCamera(22, 1, 0.1, 30) };
  });
  return rig;
}

const box = new THREE.Box3();
const part = new THREE.Box3();
const mid = new THREE.Vector3();
const dim = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/** A data URL of the item on its own, px square; the same picture for every icon of the item. */
export function itemPicture(item: ItemDef, belt: Belt, px: number) {
  const beltKey = item.slot === "gi" || item.art.pattern === "rank" ? belt : "";
  return picture(`item|${item.id}|${JSON.stringify(item.art)}|${beltKey}|${px}`, px, px, async (target) => {
    const { fig, scene, camera } = await studio();
    const mode = item.slot === "gi" ? "gi" : "nogi";
    const gear = { [item.slot]: item };
    // Tops and bottoms sit on the default other half, which is then hidden.
    await fig.dress({ look: DEFAULT_LOOK, mode, gear, belt, stripes: 0, b: 1, lf: 1 });
    fig.only(PART[item.slot] ?? (() => false));
    fig.showAura(false);
    if (item.slot === "head") fig.mat("skin")?.color.set("#c9ad84");
    // Measure the piece as it stands (without the face-shape morphs), then
    // turn it for a three-quarter view from a little above, like a piece on a stand.
    fig.root.rotation.y = 0;
    fig.head.rotation.set(0, 0, 0);
    fig.root.updateMatrixWorld(true);
    box.makeEmpty();
    fig.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.visible || !m.parent?.visible) return;
      box.union(part.setFromBufferAttribute(m.geometry.getAttribute("position") as THREE.BufferAttribute).applyMatrix4(m.matrixWorld));
    });
    if (box.isEmpty()) throw new Error(`nothing to picture for ${item.id}`);
    box.getCenter(mid);
    box.getSize(dim);
    const yaw = item.slot === "head" ? -0.55 : -0.42;
    const tilt = item.slot === "head" ? 0.3 : 0.18;
    fig.root.rotation.y = yaw;
    fig.root.updateMatrixWorld(true);
    mid.applyAxisAngle(UP, yaw);
    const wide = dim.x * Math.cos(yaw) + dim.z * Math.abs(Math.sin(yaw));
    const tall = dim.y * Math.cos(tilt) + dim.z * Math.sin(tilt);
    const size = Math.max(wide, tall) * 1.06;
    const dist = size / 2 / Math.tan((camera.fov * Math.PI) / 360);
    camera.aspect = 1;
    camera.position.set(mid.x, mid.y + dist * Math.sin(tilt), mid.z + dist * Math.cos(tilt));
    camera.lookAt(mid);
    camera.updateProjectionMatrix();
    fig.syncClip();
    const r = renderer();
    r.setSize(px, px, false);
    r.render(scene, camera);
    const g = target.getContext("2d");
    g?.clearRect(0, 0, px, px);
    g?.drawImage(r.domElement, 0, 0, px, px);
  });
}
