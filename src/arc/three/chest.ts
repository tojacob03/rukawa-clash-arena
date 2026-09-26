// Loot comes in a lacquer chest (b3): when the chest comes into view, its lid
// swings open and the item rises out of the red lacquered inside and stays
// there. The chest tells the rarity: plain keyaki for
// common finds, black lacquer with silver lines for rare, vermilion lacquer
// for epic, black lacquer with gold maki-e waves for legendary. With
// reduced motion the chest stands open with the item above it.

import { createElement } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Belt, Rarity } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import ItemIcon from "../components/ItemIcon.tsx";
import { svgCanvas } from "../fighter3d/textures.tsx";
import { dispose, environment, frame, loop, shoot } from "./engine.ts";
import { woodTexture } from "./materials.ts";

export interface ChestArgs {
  item: ItemDef;
  belt: Belt;
  /** Seconds to wait after the chest comes into view (the second one opens after the first). */
  delay: number;
}

const OPEN_S = 0.7;
const RISE_S = 0.6;

/** Maki-e: on the lacquer a band of seigaiha waves along the bottom, a line near the edge and a sprinkle of metal dust. */
function makie(ground: string, line: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = ground;
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = line;
  g.fillStyle = line;
  g.lineWidth = 1.6;
  g.strokeRect(10, 10, 236, 236);
  const r = 26;
  g.save();
  g.beginPath();
  g.rect(12, 160, 232, 84);
  g.clip();
  for (let row = 0; row < 5; row++)
    for (let col = -1; col < 7; col++) {
      const x = col * r * 2 + (row % 2 ? r : 0);
      const y = 170 + row * r * 0.55;
      for (const k of [1, 0.66, 0.33]) {
        g.beginPath();
        g.arc(x, y, r * k, Math.PI, Math.PI * 2);
        g.stroke();
      }
    }
  g.restore();
  // Nashiji: a few flakes of metal in the lacquer above the waves.
  for (let i = 0; i < 90; i++) {
    const a = Math.sin(i * 12.9898) * 43758.5453;
    const b = Math.sin(i * 78.233) * 12345.678;
    const x = 16 + (a - Math.floor(a)) * 224;
    const y = 16 + (b - Math.floor(b)) * 140 * (b - Math.floor(b));
    g.globalAlpha = 0.35 + (a - Math.floor(a)) * 0.4;
    g.fillRect(x, y, 1.6, 1.6);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function materials(rarity: Rarity) {
  const clear = { clearcoat: 1, clearcoatRoughness: 0.12, roughness: 0.3 };
  const inside = new THREE.MeshPhysicalMaterial({ color: "#8f1d12", ...clear, roughness: 0.45 });
  const gold = new THREE.MeshStandardMaterial({ color: "#d9ab4f", metalness: 1, roughness: 0.3 });
  const silver = new THREE.MeshStandardMaterial({ color: "#cfd0d6", metalness: 1, roughness: 0.3 });
  switch (rarity) {
    case "legendary":
      return { outer: new THREE.MeshPhysicalMaterial({ map: makie("#120c0a", "#d4a94f"), ...clear }), inside, metal: gold };
    case "epic":
      return { outer: new THREE.MeshPhysicalMaterial({ color: "#b3321d", ...clear }), inside: new THREE.MeshPhysicalMaterial({ color: "#1a1210", ...clear }), metal: gold };
    case "rare":
      return { outer: new THREE.MeshPhysicalMaterial({ map: makie("#141214", "#8f929c"), ...clear }), inside, metal: silver };
    default:
      return { outer: new THREE.MeshStandardMaterial({ map: woodTexture("keyaki"), roughness: 0.5 }), inside: new THREE.MeshStandardMaterial({ map: woodTexture("hinoki"), roughness: 0.6 }), metal: new THREE.MeshStandardMaterial({ color: "#7a5a3a", metalness: 0.6, roughness: 0.4 }) };
  }
}

const W = 1.2;
const D = 0.8;
const H = 0.56;
const T = 0.06;

/** The item's picture: photographed from the model for clothes and hats, its drawing otherwise. */
async function itemTexture(item: ItemDef, belt: Belt) {
  const modelled = ["gi", "top", "bottom", "head"].includes(item.slot);
  let canvas: HTMLCanvasElement;
  if (modelled) {
    const { itemPicture } = await import("../fighter3d/itemShot.ts");
    const url = await itemPicture(item, belt, 256);
    const img = new Image();
    img.src = url;
    await img.decode();
    canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
  } else {
    canvas = await svgCanvas(createElement(ItemIcon, { item, belt, size: 48 }), "0 0 48 48", 256, 256);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export async function mountChest(canvas: HTMLCanvasElement, args: ChestArgs, ready: () => void) {
  const scene = new THREE.Scene();
  scene.environment = environment();
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x2a2018, 1.0));
  const key = new THREE.DirectionalLight(0xfff0da, 2.4);
  key.position.set(-2, 4, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 1.5, bottom: -1.5, near: 0.5, far: 12 });
  scene.add(key);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.6, 40), new THREE.ShadowMaterial({ opacity: 0.3 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const m = materials(args.item.rarity);
  const chest = new THREE.Group();
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, 0.012), mat);
    b.position.set(x, y, z);
    b.castShadow = b.receiveShadow = true;
    chest.add(b);
    return b;
  };
  // Five boards: the bottom and four walls, lacquered outside, red inside.
  box(W, T, D, 0, T / 2, 0, m.outer);
  box(W, H, T, 0, H / 2, D / 2 - T / 2, m.outer);
  box(W, H, T, 0, H / 2, -D / 2 + T / 2, m.outer);
  box(T, H, D - 2 * T, W / 2 - T / 2, H / 2, 0, m.outer);
  box(T, H, D - 2 * T, -W / 2 + T / 2, H / 2, 0, m.outer);
  const lining = new THREE.Mesh(new THREE.BoxGeometry(W - 2 * T - 0.004, 0.01, D - 2 * T - 0.004), m.inside);
  lining.position.y = T + 0.006;
  chest.add(lining);
  // The inside of the walls in the colour of the inside.
  const iw = W - 2 * T - 0.004;
  const id = D - 2 * T - 0.004;
  for (const [w, x, z, ry] of [
    [iw, 0, id / 2, Math.PI],
    [iw, 0, -id / 2, 0],
    [id, iw / 2, 0, -Math.PI / 2],
    [id, -iw / 2, 0, Math.PI / 2],
  ] as const) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, H - T - 0.01), m.inside);
    wall.position.set(x, T + (H - T) / 2, z);
    wall.rotation.y = ry;
    wall.receiveShadow = true;
    chest.add(wall);
  }
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) box(0.1, 0.1, 0.1, sx * (W / 2 - 0.04), 0.05, sz * (D / 2 - 0.04), m.metal);
  // The lid swings on its back edge.
  const hinge = new THREE.Group();
  hinge.position.set(0, H, -D / 2);
  chest.add(hinge);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(W + 0.04, 0.14, D + 0.04, 3, 0.04), m.outer);
  lid.position.set(0, 0.07, D / 2);
  lid.castShadow = true;
  hinge.add(lid);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.02, D - 0.02), m.inside);
  under.rotation.x = Math.PI / 2;
  under.position.set(0, -0.001, D / 2);
  hinge.add(under);
  const clasp = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.2, 0.03, 2, 0.01), m.metal);
  clasp.position.set(0, 0.02, D + 0.03);
  hinge.add(clasp);
  chest.rotation.y = -0.38;
  scene.add(chest);

  const itemTex = await itemTexture(args.item, args.belt);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: itemTex, transparent: true, depthWrite: false }));
  sprite.scale.set(0.9, 0.9, 1);
  sprite.renderOrder = 2;
  scene.add(sprite);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 30);
  const at = new THREE.Vector3(0, 0.62, 0);
  let start = -1;
  let shown = false;
  const run = loop(canvas, (t, calm) => {
    // The clock starts when the chest is on screen, so it opens where you see it.
    if (start < 0 && !calm) {
      const r = canvas.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) start = t + args.delay;
    }
    const k = calm ? 99 : start < 0 ? 0 : t - start;
    const open = Math.min(1, Math.max(0, k / OPEN_S));
    // Up quickly, a little past, then back to rest open.
    const swing = open < 1 ? open * open * (3 - 2 * open) * 1.08 : 1 + 0.08 * Math.max(0, 1 - (k - OPEN_S) / 0.25) * Math.cos((k - OPEN_S) * 12);
    hinge.rotation.x = (-Math.PI * 0.62 * Math.min(1.08, swing));
    const rise = Math.min(1, Math.max(0, (k - OPEN_S * 0.6) / RISE_S));
    const eased = 1 - (1 - rise) * (1 - rise);
    sprite.position.set(0, 0.25 + eased * 0.72, 0.05);
    sprite.material.opacity = Math.min(1, rise * 2.5);
    sprite.visible = rise > 0;
    frame(camera, canvas.width, canvas.height, at, 1.9, 0.42);
    shoot(scene, camera, canvas);
    if (!shown) {
      shown = true;
      ready();
    }
    // Open and the item out: nothing moves any more, the loop rests.
    return !(calm || (start >= 0 && k > OPEN_S * 0.6 + RISE_S + 0.3));
  });

  return {
    set: () => undefined,
    resize: run.kick,
    stop() {
      run.stop();
      itemTex.dispose();
      dispose(scene);
    },
  };
}
