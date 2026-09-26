// The belt exam (a6) on the real belt: the fighter's waist, close. A new
// stripe is taped round the rank bar, turn by turn; a new belt takes its
// colour at the knot, and the colour runs from there round the waist and
// down both tails.

import * as THREE from "three";
import type { Belt } from "../core/types.ts";
import { BELT } from "../format.ts";
import type { Figure, Spec } from "./figure.ts";
import { makeStage, newFigure } from "./renderer.ts";
import { dispose, frame, loop, shoot } from "../three/engine.ts";

export interface BeltArgs {
  you: Spec;
  belt: Belt;
  stripes: number;
}

const BELT_Y = 0.635;
/** A new stripe: the camera comes close to the bar, the tape goes round, the camera goes back. */
const IN_S = 0.45;
const WRAP_S = 1.0;
const HOLD_S = 0.35;
const OUT_S = 0.55;
const FLOW_S = 1.3;
const ease = (x: number) => {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
};

/** Colour flowing from the knot: d is how far a point is from it along the belt (0 at the knot, 1 at the back). */
function flowing(mat: THREE.MeshStandardMaterial, u: { old: THREE.Color; now: THREE.Color; front: number; y: number }) {
  const uniforms = { uOld: { value: u.old }, uNew: { value: u.now }, uFront: { value: 2 }, uBeltY: { value: u.y } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vBelt;").replace("#include <begin_vertex>", "#include <begin_vertex>\n  vBelt = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBelt;\nuniform vec3 uOld;\nuniform vec3 uNew;\nuniform float uFront;\nuniform float uBeltY;")
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        `float below = max(0.0, uBeltY - 0.03 - vBelt.y);
  float around = abs(atan(vBelt.x, vBelt.z)) / 3.14159;
  float d = below > 0.0 && abs(vBelt.x) < 0.16 && vBelt.z > 0.0 ? below * 2.6 : around;
  vec4 diffuseColor = vec4(mix(uNew, uOld, smoothstep(uFront - 0.06, uFront, d)), opacity);`,
      );
  };
  mat.customProgramCacheKey = () => "belt-flow";
  mat.needsUpdate = true;
  return uniforms;
}

/** A stripe that is wound on: only the part of the turn up to `wrap` (0 … 1) shows. */
function winding(mesh: THREE.Mesh, axis: THREE.Vector3, centre: THREE.Vector3) {
  const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
  const ref = new THREE.Vector3(0, 0, 1).projectOnPlane(axis).normalize();
  const side = new THREE.Vector3().crossVectors(axis, ref);
  const uniforms = { uWrap: { value: 1 }, uAxis: { value: axis }, uRef: { value: ref }, uSide: { value: side }, uC: { value: centre } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vTape;").replace("#include <begin_vertex>", "#include <begin_vertex>\n  vTape = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vTape;\nuniform float uWrap;\nuniform vec3 uAxis;\nuniform vec3 uRef;\nuniform vec3 uSide;\nuniform vec3 uC;")
      .replace(
        "void main() {",
        `void main() {
  vec3 p = vTape - uC;
  p -= uAxis * dot(p, uAxis);
  float a = (atan(dot(p, uSide), dot(p, uRef)) + 3.14159) / 6.28318;
  if (a > uWrap) discard;`,
      );
  };
  mat.customProgramCacheKey = () => "belt-wrap";
  mesh.material = mat;
  return uniforms;
}

function centreOf(mesh: THREE.Mesh) {
  mesh.geometry.computeBoundingBox();
  return mesh.geometry.boundingBox!.getCenter(new THREE.Vector3());
}

export async function mountBelt(canvas: HTMLCanvasElement, args: BeltArgs, ready: () => void) {
  const stage = makeStage();
  stage.floor.visible = false;
  stage.dojo.visible = false;
  const fig: Figure = await newFigure();
  stage.scene.add(fig.root);
  fig.root.rotation.y = -0.12;
  let shown = false;
  let now = args;
  let beltFlow: ReturnType<typeof flowing> | null = null;
  let barFlow: ReturnType<typeof flowing> | null = null;
  const wraps: { u: { uWrap: { value: number } }; from: number; to: number }[] = [];
  let t0 = -1;
  let flowAt = -1;
  const at = new THREE.Vector3();
  /** The stripe that changes, where the camera goes. */
  const barAt = new THREE.Vector3();

  const run = loop(canvas, (t, calm) => {
    if (t0 < 0) t0 = t;
    const k = t - t0;
    let moving = false;
    let focus = 0;
    if (wraps.length) {
      const p = calm ? 1 : Math.min(1, (k - IN_S) / WRAP_S);
      for (const w of wraps) w.u.uWrap.value = w.from + (w.to - w.from) * ease(p);
      const back = IN_S + WRAP_S + HOLD_S;
      focus = calm ? 0 : k < IN_S ? ease(k / IN_S) : k < back ? 1 : 1 - ease((k - back) / OUT_S);
      moving ||= !calm && k < back + OUT_S;
    }
    if (beltFlow && barFlow && flowAt >= 0) {
      const p = calm ? 1 : Math.min(1, (k - flowAt) / FLOW_S);
      const front = p <= 0 ? -0.1 : p * 1.25;
      beltFlow.uFront.value = barFlow.uFront.value = front;
      moving ||= p < 1;
    }
    fig.syncClip();
    const wide = Math.max(1, (1.6 * canvas.height) / canvas.width);
    at.set(0.02, 0.5 + fig.lift, 0).lerp(barAt, focus);
    frame(stage.camera, canvas.width, canvas.height, at, (0.6 + (0.2 - 0.6) * focus) * wide, 0.14);
    shoot(stage.scene, stage.camera, canvas);
    if (!shown) {
      shown = true;
      ready();
    }
    return moving;
  });

  async function set(next: BeltArgs) {
    const prev = now;
    now = next;
    await fig.dress({ ...next.you, mode: "gi", belt: next.belt, stripes: Math.max(prev.stripes, next.stripes) });
    if (now !== next) return;
    fig.showAura(false);
    const stripe = (i: number) => fig.parts.get(`belt_stripe${i}`)?.mesh;
    // The stripes: new ones are wound on, removed ones unwound.
    wraps.length = 0;
    const s1 = stripe(1);
    const s4 = stripe(4);
    fig.root.updateMatrixWorld(true);
    for (let i = 1; i <= 4; i++) {
      const m = stripe(i);
      if (!m || !s1 || !s4) continue;
      const on = i <= next.stripes;
      const was = i <= prev.stripes && prev !== next;
      m.visible = on || was;
      const axis = centreOf(s4).sub(centreOf(s1)).normalize();
      const u = (m.userData.wrap ??= winding(m, axis, centreOf(m))) as { uWrap: { value: number } };
      // The camera goes to the stripe that changes.
      if (on && !was && prev !== next) wraps.push({ u, from: 0, to: 1 });
      else if (!on && was) wraps.push({ u, from: 1, to: 0 });
      if ((on && !was && prev !== next) || (!on && was)) barAt.copy(centreOf(m)).applyMatrix4(fig.root.matrixWorld);
      else u.uWrap.value = on ? 1 : 0;
    }
    // The belt: the new colour comes in at the knot.
    const belt = fig.mats.get("belt");
    const bar = fig.mats.get("beltbar");
    if (belt && bar) {
      const y = BELT_Y + fig.lift;
      beltFlow ??= flowing(belt, { old: new THREE.Color(), now: new THREE.Color(), front: 2, y });
      barFlow ??= flowing(bar, { old: new THREE.Color(), now: new THREE.Color(), front: 2, y });
      beltFlow.uBeltY.value = barFlow.uBeltY.value = y;
      const from = BELT[prev.belt] ?? BELT.weiss;
      const to = BELT[next.belt] ?? BELT.weiss;
      beltFlow.uOld.value.set(from.color);
      beltFlow.uNew.value.set(to.color);
      barFlow.uOld.value.set(from.bar);
      barFlow.uNew.value.set(to.bar);
      const changed = prev !== next && prev.belt !== next.belt;
      flowAt = changed ? (wraps.length ? IN_S + WRAP_S + HOLD_S + OUT_S * 0.6 : 0) : -1;
      beltFlow.uFront.value = barFlow.uFront.value = changed ? -0.1 : 2;
      if (!changed) {
        beltFlow.uOld.value.set(to.color);
        barFlow.uOld.value.set(to.bar);
      }
    }
    t0 = -1;
    run.kick();
  }
  await set(args);

  return {
    set,
    resize: run.kick,
    stop() {
      run.stop();
      fig.root.traverse((o) => {
        if (o.userData.wrap) ((o as THREE.Mesh).material as THREE.Material).dispose();
      });
      fig.dispose();
      dispose(stage.scene);
    },
  };
}
