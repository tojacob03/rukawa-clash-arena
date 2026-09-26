// The crew on deck: when you come close to your ship on the chart, everyone
// on board stands on it as their own fighter. The one at the helm near the
// stern is the captain (or you, on your own ship); the others spread along
// the deck to the bow.

import * as THREE from "three";
import type { Belt } from "../core/types.ts";
import type { ShipLook } from "../components/ShipArt.tsx";
import type { Figure, Spec } from "../fighter3d/figure.ts";
import { newFigure } from "../fighter3d/renderer.ts";
import { crewKey } from "../fighter3d/group.ts";
import { SPRITE, buildShip, deckSpots, spriteScene } from "./ship.ts";
import { picture, renderer, shoot } from "./engine.ts";

/** On deck a fighter stands about a third as tall as the main mast: big enough to tell who is who. */
const SCALE = 19;

export interface Crew {
  figs: Figure[];
  /** Call before rendering: the hats' cuts follow the rolling ship. */
  sync: () => void;
  dispose: () => void;
}

/** Puts the crew on the deck of a ship group built by buildShip. */
export async function boardCrew(ship: THREE.Group, belt: Belt, crew: Spec[]): Promise<Crew> {
  const spots = deckSpots(belt, crew.length);
  const shown = crew.slice(0, spots.length);
  const figs = await Promise.all(shown.map(() => newFigure()));
  try {
    await Promise.all(figs.map((f, i) => f.dress(shown[i])));
  } catch (e) {
    figs.forEach((f) => f.dispose());
    throw e;
  }
  figs.forEach((f, i) => {
    const s = spots[i];
    f.root.scale.setScalar(SCALE);
    f.root.position.set(s.x, s.y, s.z);
    f.root.rotation.y = s.turn;
    f.showAura(false);
    ship.add(f.root);
  });
  const sync = () => figs.forEach((f) => f.syncClip());
  sync();
  return {
    figs,
    sync,
    dispose() {
      figs.forEach((f) => {
        ship.remove(f.root);
        f.dispose();
      });
    },
  };
}

const keel = new THREE.Plane(new THREE.Vector3(0, 1, 0), 2.5);
const hider = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });

/**
 * The crew for the chart as a data URL, in the ship sprite's box: drawn over
 * the ship's picture, where the hull hides their feet behind the rail (it
 * writes depth, no colour).
 */
export function crewPicture(look: ShipLook, crew: Spec[], px: number) {
  const key = `deck|${JSON.stringify(look)}|${crewKey(crew)}|${px}`;
  const h = Math.round((px * SPRITE.h) / SPRITE.w);
  return picture(key, px, h, async (target) => {
    const { scene, camera } = spriteScene();
    const ship = await buildShip(look, 0);
    // Only the hull and its rail hide the crew (the rigging stands behind
    // them on the far side). Materials are shared (the ink), so the hull gets
    // a depth-only one of its own.
    ship.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      if (m.userData.hull) m.material = hider;
      else m.visible = false;
    });
    const aboard = await boardCrew(ship.group, look.belt, crew);
    scene.add(ship.group);
    const gl = renderer();
    const was = gl.clippingPlanes;
    gl.clippingPlanes = [keel];
    try {
      aboard.sync();
      shoot(scene, camera, target);
    } finally {
      gl.clippingPlanes = was;
      scene.remove(ship.group);
      aboard.dispose();
      ship.dispose();
    }
  });
}
