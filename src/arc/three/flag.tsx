// A crew flag as cloth on its pole (b8): the drawn flag printed on a sheet
// that waves in the wind, the wave running from the pole to the free end,
// strong with a strong wind (your training rhythm, or the crew week), limp
// and hanging without. With reduced motion it holds one moment of the wave.

import * as THREE from "three";
import type { FlagDesign } from "../core/types.ts";
import { CrewFlagArt } from "../components/CrewFlag.tsx";
import { svgCanvas, weaveNormal } from "../fighter3d/textures.tsx";
import { dispose, environment, frame, loop, shoot, stageLights } from "./engine.ts";

export interface FlagArgs {
  design?: Partial<FlagDesign> | null;
  /** 0 … 1 */
  wind: number;
}

const clothW = 1.5;
const clothH = 1.0;

function cloth() {
  const uniforms = { uTime: { value: 0 }, uAmp: { value: 0.1 }, uWaves: { value: 1.15 }, uSpeed: { value: 3 }, uSag: { value: 0 } };
  const mat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.82, alphaTest: 0.5, transparent: false });
  mat.normalMap = weaveNormal();
  mat.normalScale.set(0.25, 0.25);
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    const head = `#include <common>
uniform float uTime;
uniform float uAmp;
uniform float uWaves;
uniform float uSpeed;
uniform float uSag;
float wPhase(vec2 st) { return st.x * uWaves * 6.28318 - uTime * uSpeed + (1.0 - st.y) * 0.7; }`;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", head)
      .replace(
        "#include <beginnormal_vertex>",
        `float k = uv.x;
  float ph = wPhase(uv);
  float dzdx = uAmp * (sin(ph) + k * cos(ph) * uWaves * 6.28318) / ${clothW.toFixed(2)};
  float dzdy = uAmp * k * cos(ph) * 0.7 / ${clothH.toFixed(2)};
  vec3 objectNormal = normalize(vec3(-dzdx, dzdy, 1.0));
  #ifdef USE_TANGENT
    vec3 objectTangent = vec3( tangent.xyz );
  #endif`,
      )
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3( position );
  transformed.z += uAmp * k * sin(ph);
  transformed.x -= uAmp * 0.45 * k * (1.0 - cos(ph));
  transformed.y -= uSag * k * k;`,
      );
  };
  mat.customProgramCacheKey = () => "flag-cloth";
  return { mat, uniforms };
}

export async function mountFlag(canvas: HTMLCanvasElement, args: FlagArgs, ready: () => void) {
  const scene = new THREE.Scene();
  stageLights(scene, { rim: 1.4 });
  scene.environment = environment();
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 30);
  const { mat, uniforms } = cloth();
  const geo = new THREE.PlaneGeometry(clothW, clothH, 48, 24);
  geo.translate(clothW / 2, -clothH / 2, 0);
  const sheet = new THREE.Mesh(geo, mat);
  sheet.position.set(0.03, 1.0, 0);
  sheet.castShadow = true;
  scene.add(sheet);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 2.6, 16), new THREE.MeshStandardMaterial({ color: "#3a2415", roughness: 0.35 }));
  pole.position.set(0, -0.15, 0);
  scene.add(pole);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16), new THREE.MeshStandardMaterial({ color: "#d9ab4f", metalness: 1, roughness: 0.28 }));
  knob.position.set(0, 1.17, 0);
  scene.add(knob);
  let map: THREE.CanvasTexture | null = null;
  let shown = false;
  const at = new THREE.Vector3(0.72, 0.42, 0);

  const run = loop(canvas, (t, calm) => {
    uniforms.uTime.value = calm ? 0.9 : t;
    frame(camera, canvas.width, canvas.height, at, 1.6 * Math.max(1, (1.24 * canvas.height) / canvas.width), 0.04);
    shoot(scene, camera, canvas);
    if (!shown) {
      shown = true;
      ready();
    }
  });

  async function set(next: FlagArgs) {
    const w = Math.max(0, Math.min(1, next.wind));
    // The same wind as the drawn flag: faster and higher waves with more of it; without, it hangs.
    uniforms.uAmp.value = w < 0.15 ? 0.04 : 0.08 + 0.17 * w;
    uniforms.uSpeed.value = (Math.PI * 2) / (2 - w * 1.05);
    uniforms.uSag.value = w < 0.15 ? 0.32 : 0.06 * (1 - w);
    const c = await svgCanvas(<CrewFlagArt design={next.design} />, "0 0 120 80", 768, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    map?.dispose();
    map = tex;
    mat.map = tex;
    mat.needsUpdate = true;
    run.kick();
  }
  await set(args);

  return {
    set,
    resize: run.kick,
    stop() {
      run.stop();
      map?.dispose();
      dispose(scene);
    },
  };
}
