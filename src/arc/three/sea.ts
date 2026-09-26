// Live scenes on the water: your ship on the ship page (b1) and the weekly
// boss on Heute (b2). The sea is a dark swell that runs past as strongly as
// the wind from your training rhythm; the ship rolls and lifts on it, the
// flag waves; in the dry dock nothing moves. The serpent's humps rise and
// sink in a wave from the head to the tail and the head sways. With reduced
// motion everything holds one calm moment.

import * as THREE from "three";
import type { WeatherKind } from "../core/voyage.ts";
import type { ShipLook } from "../components/ShipArt.tsx";
import { buildShip } from "./ship.ts";
import { buildSerpent } from "./serpent.ts";
import { dispose, environment, loop, shoot } from "./engine.ts";

/** How the sea moves for each weather: swell height, speed, how far the ship rolls, the wind for the flag. */
const SEA: Record<WeatherKind, { swell: number; speed: number; roll: number; wind: number }> = {
  tailwind: { swell: 2.4, speed: 1.2, roll: 0.07, wind: 1 },
  breeze: { swell: 1.8, speed: 1, roll: 0.05, wind: 0.66 },
  light: { swell: 1.2, speed: 0.8, roll: 0.035, wind: 0.4 },
  calm: { swell: 0.4, speed: 0.4, roll: 0.01, wind: 0.1 },
  dock: { swell: 0, speed: 0, roll: 0, wind: 0 },
};

/** The height of the swell at a point, the same sum the water's shader draws. */
function swellAt(x: number, z: number, t: number, a: number, s: number) {
  return a * (0.6 * Math.sin(x * 0.045 + z * 0.02 - t * 1.3 * s) + 0.3 * Math.sin(x * 0.09 - z * 0.05 - t * 2.1 * s + 1.3) + 0.15 * Math.sin(-x * 0.03 + z * 0.12 - t * 1.7 * s));
}

/** The swell, faded out on an ellipse round `centre` (from inner to outer), so it never ends in a line on the page. */
function water(w: number, d: number, inner: number, outer: number, centre = new THREE.Vector2()) {
  const u = { uT: { value: 0 }, uA: { value: 1 }, uS: { value: 1 } };
  const mat = new THREE.MeshStandardMaterial({ color: "#1d3236", roughness: 0.5, metalness: 0.05, transparent: true, envMapIntensity: 0.5 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    const fn = `uniform float uT; uniform float uA; uniform float uS;
float sw(vec2 p) { return uA * (0.6 * sin(p.x * 0.045 + p.y * 0.02 - uT * 1.3 * uS) + 0.3 * sin(p.x * 0.09 - p.y * 0.05 - uT * 2.1 * uS + 1.3) + 0.15 * sin(-p.x * 0.03 + p.y * 0.12 - uT * 1.7 * uS)); }`;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>\n${fn}`)
      .replace(
        "#include <beginnormal_vertex>",
        `vec2 wp = vec2(position.x, -position.y);
  float e = 0.8;
  float hx = sw(wp + vec2(e, 0.0)) - sw(wp - vec2(e, 0.0));
  float hz = sw(wp + vec2(0.0, e)) - sw(wp - vec2(0.0, e));
  vec3 objectNormal = normalize(vec3(-hx / (2.0 * e), hz / (2.0 * e), 1.0));`,
      )
      .replace("#include <begin_vertex>", "vec3 transformed = vec3(position);\n  transformed.z += sw(wp);\n  vSea = wp;");
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vSea;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vSea;\nuniform vec2 uFade;")
      .replace("#include <common>", "#include <common>\nuniform vec2 uCentre;")
      .replace("#include <dithering_fragment>", "#include <dithering_fragment>\n  gl_FragColor.a *= 1.0 - smoothstep(uFade.x, uFade.y, length((vSea - uCentre) * vec2(1.0, 2.2)));");
    sh.uniforms.uFade = { value: new THREE.Vector2(inner, outer) };
    sh.uniforms.uCentre = { value: centre };
  };
  mat.customProgramCacheKey = () => "sea-swell";
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 96, 48), mat);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  return { plane, u };
}

function lights(scene: THREE.Scene) {
  scene.environment = environment();
  scene.environmentIntensity = 0.6;
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x1a2a2e, 1.6));
  const key = new THREE.DirectionalLight(0xfff0da, 2.4);
  key.position.set(-160, 240, 200);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -160, right: 160, top: 200, bottom: -80, near: 10, far: 900 });
  key.shadow.bias = -0.0008;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc56e, 0.8);
  rim.position.set(200, 120, -220);
  scene.add(rim);
}

export interface ShipSceneArgs {
  look: ShipLook;
  weather: WeatherKind;
}

export async function mountShipScene(canvas: HTMLCanvasElement, args: ShipSceneArgs, ready: () => void) {
  const scene = new THREE.Scene();
  lights(scene);
  const sea = water(900, 500, 60, 175);
  scene.add(sea.plane);
  // The dry dock: a stone floor with keel blocks and shores.
  const dock = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: "#8d8a80", roughness: 0.9 });
  const wood = new THREE.MeshStandardMaterial({ color: "#6b4220", roughness: 0.8 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(260, 6, 120), stone);
  floor.position.y = -16;
  floor.receiveShadow = true;
  dock.add(floor);
  for (const x of [-50, 0, 50]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 20), wood);
    b.position.set(x, -9, 0);
    dock.add(b);
  }
  for (const s of [-1, 1])
    for (const x of [-40, 30]) {
      const shore = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 40, 8), wood);
      shore.position.set(x, 2, s * 28);
      shore.rotation.x = s * 0.7;
      dock.add(shore);
    }
  scene.add(dock);
  const camera = new THREE.PerspectiveCamera(26, 1, 5, 3000);
  let ship = await buildShip(args.look, SEA[args.weather].wind);
  scene.add(ship.group);
  let cur = args;
  let shown = false;
  const run = loop(canvas, (t, calm) => {
    const w = SEA[cur.weather];
    const inDock = cur.weather === "dock";
    const tt = calm ? 1.2 : t;
    sea.u.uT.value = tt;
    sea.u.uA.value = w.swell;
    sea.u.uS.value = w.speed;
    sea.plane.visible = !inDock;
    dock.visible = inDock;
    const g = ship.group;
    if (inDock) {
      g.position.set(0, 4, 0);
      g.rotation.set(0, 0, 0);
    } else {
      // Lift with the swell at the ship, roll and pitch with its slope.
      const y0 = swellAt(0, 0, tt, w.swell, w.speed);
      g.position.set(0, y0 - 1.5, 0);
      g.rotation.x = calm ? 0 : w.roll * Math.sin(tt * 1.1 * w.speed + 0.4);
      g.rotation.z = calm ? 0 : (swellAt(20, 0, tt, w.swell, w.speed) - swellAt(-20, 0, tt, w.swell, w.speed)) / 40;
    }
    ship.tick(tt);
    // From the starboard quarter, as on the chart.
    camera.aspect = canvas.width / canvas.height;
    const yaw = 0.62;
    const dist = 420;
    camera.position.set(-Math.sin(yaw) * dist, 120, Math.cos(yaw) * dist);
    camera.lookAt(0, 44, 0);
    camera.updateProjectionMatrix();
    shoot(scene, camera, canvas);
    if (!shown) {
      shown = true;
      ready();
    }
  });
  return {
    async set(next: ShipSceneArgs) {
      const look = JSON.stringify(next.look) !== JSON.stringify(cur.look) || SEA[next.weather].wind !== SEA[cur.weather].wind;
      cur = next;
      if (look) {
        const fresh = await buildShip(next.look, SEA[next.weather].wind);
        scene.remove(ship.group);
        ship.dispose();
        ship = fresh;
        scene.add(ship.group);
      }
      run.kick();
    },
    resize: run.kick,
    stop() {
      run.stop();
      ship.dispose();
      dispose(scene);
    },
  };
}

export interface SerpentSceneArgs {
  hp: number;
  max: number;
}

export async function mountSerpentScene(canvas: HTMLCanvasElement, args: SerpentSceneArgs, ready: () => void) {
  const scene = new THREE.Scene();
  lights(scene);
  const n0 = Math.max(1, Math.min(8, args.max));
  const sea = water(900, 400, 20 + n0 * 7, 50 + n0 * 11, new THREE.Vector2((36 + n0 * 16) / 2, 0));
  sea.u.uA.value = 0.9;
  sea.u.uS.value = 0.8;
  scene.add(sea.plane);
  const camera = new THREE.PerspectiveCamera(22, 1, 5, 3000);
  let s = buildSerpent(args.hp, args.max);
  scene.add(s.group);
  let cur = args;
  let shown = false;
  const run = loop(canvas, (t, calm) => {
    const tt = calm ? 0.8 : t;
    sea.u.uT.value = tt;
    // A wave runs from the head to the tail: each hump rises and sinks a little later.
    s.humps.forEach((h, i) => {
      h.position.y = calm ? 0 : 1.6 * Math.sin(tt * 2 - i * 0.9) - 0.6;
    });
    s.head.rotation.z = calm ? 0 : 0.07 * Math.sin(tt * 1.3);
    s.head.position.y = 21 + (calm ? 0 : 0.8 * Math.sin(tt * 1.3 + 0.6));
    const n = Math.max(1, Math.min(8, cur.max));
    const w = 36 + n * 16;
    camera.aspect = canvas.width / canvas.height;
    const cx = w / 2 - 4;
    const fit = Math.max(40, (w + 20) / camera.aspect);
    const dist = fit / 2 / Math.tan((22 * Math.PI) / 360);
    camera.position.set(cx - 30, 60 + dist * 0.18, dist);
    camera.lookAt(cx, 8, 0);
    camera.updateProjectionMatrix();
    shoot(scene, camera, canvas);
    if (!shown) {
      shown = true;
      ready();
    }
  });
  return {
    set(next: SerpentSceneArgs) {
      if (next.hp !== cur.hp || next.max !== cur.max) {
        scene.remove(s.group);
        s.dispose();
        s = buildSerpent(next.hp, next.max);
        scene.add(s.group);
      }
      cur = next;
      run.kick();
    },
    resize: run.kick,
    stop() {
      run.stop();
      s.dispose();
      dispose(scene);
    },
  };
}
