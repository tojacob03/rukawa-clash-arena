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

/**
 * Cloth that waves from its left edge (u = 0, the pole) to its free end: a
 * plane of w × h with the drawing mapped on it. Returns the material and the
 * wind to set (amplitude, waves along the cloth, speed, sag of the free end).
 */
export function cloth(w: number, h: number) {
  const uniforms = { uTime: { value: 0 }, uAmp: { value: 0.1 * w }, uWaves: { value: 1.15 }, uSpeed: { value: 3 }, uSag: { value: 0 } };
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
  float dzdx = uAmp * (sin(ph) + k * cos(ph) * uWaves * 6.28318) / ${w.toFixed(3)};
  float dzdy = uAmp * k * cos(ph) * 0.7 / ${h.toFixed(3)};
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
  mat.customProgramCacheKey = () => `flag-cloth-${w.toFixed(3)}-${h.toFixed(3)}`;
  const geo = new THREE.PlaneGeometry(w, h, 32, 16);
  geo.translate(w / 2, -h / 2, 0);
  return { mat, uniforms, geo };
}

/** Set the wind on a cloth: the same wind as the drawn flag; without it the cloth hangs. */
export function setWind(u: ReturnType<typeof cloth>["uniforms"], wind: number, w: number) {
  const k = Math.max(0, Math.min(1, wind));
  u.uAmp.value = (k < 0.15 ? 0.027 : 0.053 + 0.113 * k) * w;
  u.uSpeed.value = (Math.PI * 2) / (2 - k * 1.05);
  u.uSag.value = (k < 0.15 ? 0.21 : 0.04 * (1 - k)) * w;
}

/** The crew flag drawn into a texture for the cloth. */
export async function flagTexture(design?: Partial<FlagDesign> | null) {
  const c = await svgCanvas(<CrewFlagArt design={design} />, "0 0 120 80", 768, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export async function mountFlag(canvas: HTMLCanvasElement, args: FlagArgs, ready: () => void) {
  const scene = new THREE.Scene();
  stageLights(scene, { rim: 1.4 });
  scene.environment = environment();
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 30);
  const { mat, uniforms, geo } = cloth(clothW, clothH);
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
    setWind(uniforms, next.wind, clothW);
    const tex = await flagTexture(next.design);
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
