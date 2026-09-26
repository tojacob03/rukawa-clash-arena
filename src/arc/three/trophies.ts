// The shelf of the fight record (b4): a keyaki board on the wall with a
// metal medal hanging from a peg for every podium, and a cup standing on it
// for every tournament won. Medals and cups are engraved with the name of
// the tournament and its year; the metal mirrors a soft room.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { environment, frame, shoot, still } from "./engine.ts";
import { woodTexture } from "./materials.ts";

export interface Award {
  kind: "medal" | "cup";
  /** 1 gold, 2 silver, 3 bronze. */
  place: number;
  name: string;
  year: string;
}

const METAL = ["#e0b85a", "#c8c9cf", "#b8784a"];
const MEDAL_GAP = 0.7;
const CUP_GAP = 0.82;
const RIBBON = ["#b3261e", "#1f3a73", "#1f5c4f"];
const KANJI = ["優勝", "準優勝", "三位"];
const FONT = '"Shippori Mincho B1", "Hiragino Mincho ProN", "Yu Mincho", serif';

/** Relief for a medal face: white stands up, black is cut. */
function medalFace(a: Award) {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "#ffffff";
  g.lineWidth = 16;
  g.beginPath();
  g.arc(s / 2, s / 2, s * 0.45, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 4;
  g.beginPath();
  g.arc(s / 2, s / 2, s * 0.33, 0, Math.PI * 2);
  g.stroke();
  // The name round the top, the year round the bottom, cut into the ring.
  g.fillStyle = "#303030";
  g.font = `700 ${s * 0.07}px ${FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const around = (text: string, from: number, to: number, r: number) => {
    const chars = [...text];
    const step = (to - from) / Math.max(1, chars.length - 1);
    chars.forEach((ch, i) => {
      const a = from + step * i;
      g.save();
      g.translate(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r);
      g.rotate(a + (from < to ? Math.PI / 2 : -Math.PI / 2));
      g.fillText(ch, 0, 0);
      g.restore();
    });
  };
  const name = a.name.toUpperCase().slice(0, 22);
  const span = Math.min(Math.PI * 0.9, name.length * 0.13);
  around(name, -Math.PI / 2 - span / 2, -Math.PI / 2 + span / 2, s * 0.39);
  around(a.year, Math.PI / 2 + 0.28, Math.PI / 2 - 0.28, s * 0.39);
  // In the middle, raised: the place in kanji.
  g.fillStyle = "#ffffff";
  const k = KANJI[a.place - 1] ?? "";
  g.font = `800 ${s * (k.length > 2 ? 0.15 : 0.2)}px ${FONT}`;
  g.fillText(k, s / 2, s / 2 + s * 0.01);
  return c;
}

/** The plaque of a cup: the name and year cut into a small plate. */
function plaque(a: Award) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 160;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1b1410";
  g.fillRect(0, 0, 512, 160);
  g.strokeStyle = "#e0b85a";
  g.lineWidth = 6;
  g.strokeRect(12, 12, 488, 136);
  g.fillStyle = "#e0b85a";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `700 44px ${FONT}`;
  g.fillText(a.name.slice(0, 20), 256, 64, 460);
  g.font = `700 34px ${FONT}`;
  g.fillText(`${KANJI[0]} ${a.year}`, 256, 116);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function metal(place: number) {
  return new THREE.MeshStandardMaterial({ color: METAL[place - 1] ?? METAL[0], metalness: 1, roughness: 0.28 });
}

function medal(a: Award) {
  const g = new THREE.Group();
  const face = new THREE.CanvasTexture(medalFace(a));
  // The cap of the disc is mapped a quarter turn round; turn the relief upright.
  face.center.set(0.5, 0.5);
  face.rotation = Math.PI / 2;
  const mat = metal(a.place);
  mat.bumpMap = face;
  mat.bumpScale = 3;
  // A disc with a rounded rim: the face on the front, plain on the back.
  const plain = metal(a.place);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 64), [plain, mat, plain]);
  disc.rotation.x = Math.PI / 2;
  g.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 12, 64), plain);
  g.add(rim);
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 24), plain);
  eye.position.y = 0.33;
  g.add(eye);
  // The ribbon: two bands from the peg down to the eye, in the colour of the place.
  const ribbon = new THREE.MeshStandardMaterial({ color: RIBBON[a.place - 1] ?? RIBBON[0], roughness: 0.7, side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    const band = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.36), ribbon);
    band.position.set(s * 0.035, 0.5, -0.02);
    band.rotation.z = s * 0.2;
    g.add(band);
  }
  g.traverse((o) => (o.castShadow = true));
  return g;
}

function cup(a: Award) {
  const g = new THREE.Group();
  const gold = metal(1);
  const profile = [
    [0.2, 0], [0.2, 0.05], [0.16, 0.07], [0.06, 0.1], [0.045, 0.2], [0.05, 0.32], [0.09, 0.36],
    [0.2, 0.44], [0.26, 0.58], [0.27, 0.7], [0.25, 0.7], [0.24, 0.6], [0.001, 0.46],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), gold);
  body.position.y = 0.16;
  g.add(body);
  for (const s of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 10, 24, Math.PI * 1.2), gold);
    handle.position.set(s * 0.28, 0.72, 0);
    handle.rotation.z = s > 0 ? -Math.PI * 0.6 : Math.PI * 0.4;
    g.add(handle);
  }
  // A black lacquered plinth with the engraved plate.
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.16, 0.36, 2, 0.02), new THREE.MeshPhysicalMaterial({ color: "#16110d", roughness: 0.25, clearcoat: 1 }));
  plinth.position.y = 0.08;
  g.add(plinth);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.1), new THREE.MeshStandardMaterial({ map: plaque(a), metalness: 0.6, roughness: 0.35 }));
  plate.position.set(0, 0.08, 0.181);
  g.add(plate);
  g.traverse((o) => (o.castShadow = true));
  return g;
}

export function shelfKey(awards: Award[]) {
  return JSON.stringify(awards);
}

/** Draws the shelf with its medals and cups into the canvas. */
export function drawShelf(target: HTMLCanvasElement, awards: Award[]) {
  return still(target, `shelf|${shelfKey(awards)}`, async () => {
    await document.fonts.load(`800 40px ${FONT}`, "優勝準三位").catch(() => undefined);
    const scene = new THREE.Scene();
    scene.environment = environment();
    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x2a2018, 0.9));
    const key = new THREE.DirectionalLight(0xfff0da, 2.6);
    key.position.set(-2, 3, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 2, bottom: -2, near: 0.5, far: 14 });
    key.shadow.bias = -0.0005;
    scene.add(key);
    const medals = awards.filter((a) => a.kind === "medal");
    const cups = awards.filter((a) => a.kind === "cup");
    const width = Math.max(2.2, medals.length * MEDAL_GAP + cups.length * CUP_GAP + 0.9);
    // The wall only takes the shadows; the page shows through.
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(width + 2, 4), new THREE.ShadowMaterial({ opacity: 0.28 }));
    wall.position.z = -0.25;
    wall.receiveShadow = true;
    scene.add(wall);
    const wood = new THREE.MeshStandardMaterial({ map: woodTexture("keyaki"), roughness: 0.5 });
    const board = new THREE.Mesh(new RoundedBoxGeometry(width, 0.07, 0.5, 2, 0.015), wood);
    board.castShadow = board.receiveShadow = true;
    scene.add(board);
    for (const s of [-1, 1]) {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.3), wood);
      bracket.position.set(s * (width / 2 - 0.3), -0.16, -0.08);
      bracket.castShadow = true;
      scene.add(bracket);
    }
    let x = -width / 2 + 0.45;
    // Cups on the board, medals hanging below its front edge from brass pegs.
    for (const a of cups) {
      const c = cup(a);
      c.position.set(x + 0.32, 0.035, 0.02);
      c.rotation.y = 0.18;
      scene.add(c);
      x += CUP_GAP;
    }
    for (const a of medals) {
      const m = medal(a);
      m.position.set(x + 0.3, -0.66, 0.2);
      m.rotation.set(0.05, -0.1 + ((x * 7) % 0.2), 0.03);
      scene.add(m);
      const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.08, 12), metal(1));
      peg.rotation.x = Math.PI / 2;
      peg.position.set(x + 0.3, -0.02, 0.24);
      scene.add(peg);
      x += MEDAL_GAP;
    }
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 40);
    // Cups stand above the board, medals hang below it: frame what is there.
    const top = cups.length ? 1.1 : 0.12;
    const bottom = medals.length ? -1.02 : -0.3;
    const h = Math.max(top - bottom + 0.12, (width + 0.3) / (target.width / target.height));
    frame(camera, target.width, target.height, new THREE.Vector3(0, (top + bottom) / 2, 0), h, 0.06);
    shoot(scene, camera, target);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
    });
  });
}

/** As a scene for Scene3D: a still, drawn again when the awards or the size change. */
export async function mountShelf(canvas: HTMLCanvasElement, awards: Award[], ready: () => void) {
  let current = awards;
  const draw = () => drawShelf(canvas, current).then(ready);
  await draw();
  return {
    set(next: Award[]) {
      current = next;
      return draw();
    },
    resize: () => void draw(),
    stop: () => undefined,
  };
}
