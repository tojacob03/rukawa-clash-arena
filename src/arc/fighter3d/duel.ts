// The Scouter as a duel (a8): you and the one you are about to roll with,
// face to face on two tatami. The other is a shadow, known only by belt,
// weight and gi: dark cloth and skin, gold eyes, the belt (or the rank
// rashguard) in its colour.

import * as THREE from "three";
import type { Attire, Belt, Size } from "../core/types.ts";
import { DEFAULT_LOOK } from "../avatarOptions.ts";
import type { Figure, Spec } from "./figure.ts";
import { FACE_K } from "./face.ts";
import { makeStage, newFigure } from "./renderer.ts";
import { dispose, frame, loop, shoot } from "../three/engine.ts";

export interface DuelArgs {
  you: Spec;
  belt: Belt;
  attire: Attire;
  size: Size;
}

/** What keeps its colour on the shadow: the rank it wears. */
const RANK = new Set(["belt", "beltbar", "stripe", "top", "topdark"]);

function goldEyes() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  const k = FACE_K * 512;
  g.setTransform(k, 0, 0, k, (0.5 - 120 * FACE_K) * 512, (0.5 - 96 * FACE_K) * 512);
  g.fillStyle = "#e0b45a";
  for (const x of [102, 138]) {
    g.beginPath();
    g.ellipse(x, 111, 4.6, 5.4, 0, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false;
  return t;
}

function shade(fig: Figure, body: THREE.Material, eyes: THREE.Material) {
  for (const { mesh } of fig.parts.values()) {
    const name = (mesh.material as THREE.Material).name;
    if (RANK.has(name) || name.startsWith("shadow")) continue;
    mesh.material = name === "face" ? eyes : body;
  }
}

export async function mountDuel(canvas: HTMLCanvasElement, args: DuelArgs, ready: () => void) {
  const stage = makeStage([-2, 2, 2.6, -0.4]);
  stage.floor.visible = false;
  const [you, foe] = await Promise.all([newFigure(), newFigure()]);
  const body = new THREE.MeshStandardMaterial({ name: "shadow", color: "#2b231e", roughness: 0.86, vertexColors: true });
  const eyesTex = goldEyes();
  const eyes = new THREE.MeshBasicMaterial({ name: "shadow-eyes", map: eyesTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  for (const [f, x, yaw] of [
    [you, -0.56, 0.92],
    [foe, 0.56, -0.92],
  ] as const) {
    f.root.position.x = x;
    f.root.rotation.y = yaw;
    stage.scene.add(f.root);
  }
  let shown = false;
  let current = args;
  const at = new THREE.Vector3(0, 0.96, 0);

  const run = loop(canvas, (t, calm) => {
    [you, foe].forEach((f, i) => {
      const breath = calm ? 0 : Math.sin((t * Math.PI * 2) / (3.6 + i * 0.5) + i * 1.3);
      f.root.scale.set(1, 1 + 0.006 * breath, 1 + 0.004 * breath);
      f.head.rotation.set(calm ? 0 : 0.018 * breath, 0, 0);
      f.showAura(false);
      f.syncClip();
    });
    frame(stage.camera, canvas.width, canvas.height, at, 2.2 * Math.max(1, (1.25 * canvas.height) / canvas.width), 0.2);
    shoot(stage.scene, stage.camera, canvas);
    if (!shown) {
      shown = true;
      ready();
    }
  });

  async function set(next: DuelArgs) {
    current = next;
    const b = next.size === "schwerer" ? 1.14 : next.size === "leichter" ? 0.88 : 1;
    const look = { ...DEFAULT_LOOK, hair: 1, beard: 0, marks: [] };
    const foeSpec: Spec = { look, mode: next.attire, gear: {}, belt: next.belt, stripes: 0, b, lf: 1 };
    await Promise.all([you.dress({ ...next.you, mode: next.attire }), foe.dress(foeSpec)]);
    if (current !== next) return;
    shade(foe, body, eyes);
    run.kick();
  }
  await set(args);

  return {
    set,
    resize: run.kick,
    stop() {
      run.stop();
      you.dispose();
      foe.dispose();
      body.dispose();
      eyes.dispose();
      eyesTex.dispose();
      dispose(stage.scene);
    },
  };
}
