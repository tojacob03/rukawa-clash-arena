// A stamp pressed into the mat passport (b5): a carved block comes down onto
// the page, presses the paper a little, and lifts off, leaving its print.
// Drawn over the print in a canvas of its own; the print itself is the
// page's drawing, which shows from the moment the stone touches.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { dispose, environment, loop, reduced, shoot } from "./engine.ts";
import { woodTexture } from "./materials.ts";

const DOWN = 0.42;
const HOLD = 0.22;
const UP = 0.5;

/**
 * Plays once over a print that is `tilt` degrees turned on the page; the
 * canvas is FIT times the print's width, centred on it. touch() is called
 * when the stone meets the paper, done() when it is gone.
 */
export const FIT = 2.2;

export function pressStamp(canvas: HTMLCanvasElement, ink: string, tilt: number, touch: () => void, done: () => void) {
  if (reduced()) {
    touch();
    done();
    return () => undefined;
  }
  const scene = new THREE.Scene();
  scene.environment = environment();
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x3a2a20, 1.2));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.2);
  key.position.set(-1.5, 5, 2.5);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 1.5, bottom: -1.5, near: 0.5, far: 12 });
  scene.add(key);
  // The paper only catches the stone's shadow; the page shows through.
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.35 }));
  paper.rotation.x = -Math.PI / 2;
  paper.receiveShadow = true;
  scene.add(paper);
  // The stamp: a keyaki block the size of the print, inked at the bottom, a turned hinoki handle on top.
  const stone = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.5, 0.84, 3, 0.07), new THREE.MeshPhysicalMaterial({ map: woodTexture("keyaki"), roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3 }));
  body.position.y = 0.27;
  const face = new THREE.Mesh(new RoundedBoxGeometry(1.16, 0.05, 0.8, 2, 0.02), new THREE.MeshStandardMaterial({ color: ink, roughness: 0.7 }));
  face.position.y = 0.025;
  const handle = new THREE.Mesh(
    // Profile from the foot up, so the faces look outwards.
    new THREE.LatheGeometry([new THREE.Vector2(0.16, 0.52), new THREE.Vector2(0.1, 0.6), new THREE.Vector2(0.13, 0.74), new THREE.Vector2(0.2, 0.9), new THREE.Vector2(0.14, 1.0), new THREE.Vector2(0.001, 1.02)], 32),
    new THREE.MeshStandardMaterial({ map: woodTexture("hinoki"), roughness: 0.45 }),
  );
  for (const m of [body, face, handle]) {
    m.castShadow = true;
    stone.add(m);
  }
  scene.add(stone);
  stone.rotation.y = (-tilt * Math.PI) / 180;
  // From above and a little in front, as you look down at the page; the
  // print (1.2 wide) spans 1 / FIT of the canvas.
  const dist = 5;
  const fov = ((2 * Math.atan((1.2 * FIT) / 2 / dist)) * 180) / Math.PI;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 30);
  const lean = (22 * Math.PI) / 180;
  camera.position.set(0, dist * Math.cos(lean), dist * Math.sin(lean));
  camera.lookAt(0, 0, 0);
  let touched = false;
  let finished = false;
  const run = loop(canvas, (t) => {
    // Down fast and settling, a little squash in the paper, then up and away.
    let y: number;
    if (t < DOWN) {
      const k = t / DOWN;
      y = 2.6 * (1 - k * k);
    } else if (t < DOWN + HOLD) {
      if (!touched) {
        touched = true;
        touch();
      }
      y = -0.03 * Math.sin(((t - DOWN) / HOLD) * Math.PI);
    } else {
      const k = Math.min(1, (t - DOWN - HOLD) / UP);
      y = 2.8 * k * k;
    }
    stone.position.y = y;
    stone.rotation.x = t < DOWN ? 0.1 * (1 - t / DOWN) : 0;
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    shoot(scene, camera, canvas);
    if (t > DOWN + HOLD + UP && !finished) {
      finished = true;
      done();
      return false;
    }
  });
  return () => {
    run.stop();
    dispose(scene);
  };
}
