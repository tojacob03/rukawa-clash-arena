// A carved seal stone (b7, b5): a block of warm soapstone, its face inked
// vermilion, the character cut into it so it stays the colour of the stone
// (hakubun, white script), a thin frame left standing round the edge. The
// knob on top is carved as a rounded cap with a cord hole.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { environment, picture, renderer } from "./engine.ts";

const SHU = "#c23a24";
const FONT = '"Shippori Mincho B1", "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';

const rnd = (i: number) => {
  const x = Math.sin(i * 91.7 + 17.3) * 43758.5453;
  return x - Math.floor(x);
};

/** Soapstone: honey and cream with darker veins. */
function stoneTexture(tone: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const tones = [
    ["#d8b47c", "#b98a4e", "#efd9b0"],
    ["#b9c7a4", "#8a9c78", "#dfe6cf"],
    ["#caa89c", "#9c7466", "#ead6cc"],
  ][tone % 3];
  g.fillStyle = tones[0];
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = i % 4 ? tones[2] : tones[1];
    g.globalAlpha = 0.12 + rnd(i) * 0.22;
    g.lineWidth = 1 + rnd(i + 3) * 6;
    g.beginPath();
    let x = rnd(i + 5) * 256;
    let y = rnd(i + 7) * 256;
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (rnd(i * 7 + k) - 0.3) * 70;
      y += (rnd(i * 11 + k) - 0.5) * 50;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The seal face: vermilion ink, the character and a frame line cut out. Returns colour and depth (white = raised). */
async function faceTextures(glyph: string) {
  try {
    await document.fonts.load(`800 200px ${FONT}`, glyph);
  } catch {
    // The drawing falls back to the next font.
  }
  const size = 512;
  const depth = document.createElement("canvas");
  depth.width = depth.height = size;
  const d = depth.getContext("2d")!;
  // Raised: the whole face, then cut: a groove inside the edge and the character.
  d.fillStyle = "#fff";
  d.fillRect(0, 0, size, size);
  d.strokeStyle = "#000";
  d.lineWidth = 18;
  d.strokeRect(58, 58, size - 116, size - 116);
  d.fillStyle = "#000";
  d.font = `800 ${size * 0.62}px ${FONT}`;
  d.textAlign = "center";
  d.textBaseline = "middle";
  d.fillText(glyph, size / 2, size / 2 + size * 0.03);
  const color = document.createElement("canvas");
  color.width = color.height = size;
  const g = color.getContext("2d")!;
  g.fillStyle = "#e9d7b6";
  g.fillRect(0, 0, size, size);
  // Ink only where the stone stands up; a little uneven, as on a used seal.
  const ink = document.createElement("canvas");
  ink.width = ink.height = size;
  const k = ink.getContext("2d")!;
  k.fillStyle = SHU;
  k.fillRect(0, 0, size, size);
  for (let i = 0; i < 160; i++) {
    k.fillStyle = `rgba(90, 16, 8, ${0.05 + rnd(i) * 0.08})`;
    k.beginPath();
    k.arc(rnd(i + 1) * size, rnd(i + 2) * size, 4 + rnd(i + 3) * 18, 0, Math.PI * 2);
    k.fill();
  }
  const mask = d.getImageData(0, 0, size, size);
  const px = k.getImageData(0, 0, size, size);
  for (let i = 0; i < mask.data.length; i += 4) px.data[i + 3] = mask.data[i] > 127 ? 255 : 0;
  k.putImageData(px, 0, 0);
  g.drawImage(ink, 0, 0);
  const map = new THREE.CanvasTexture(color);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const bump = new THREE.CanvasTexture(depth);
  return { map, bump };
}

let stone: THREE.CanvasTexture | null = null;

/** The seal stone as an object: body, knob, face. The face looks along +z. */
export async function sealStone(glyph: string) {
  const g = new THREE.Group();
  stone ??= stoneTexture(0);
  const body = new THREE.MeshPhysicalMaterial({ map: stone, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.35 });
  const block = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1.7, 4, 0.1), body);
  block.position.z = -0.85;
  g.add(block);
  // The knob: a rounded cap at the back end, with a hole for the cord.
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.46, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), body);
  cap.rotation.x = -Math.PI / 2;
  cap.scale.set(1, 0.8, 1);
  cap.position.z = -1.68;
  g.add(cap);
  const hole = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 12, 24), new THREE.MeshStandardMaterial({ color: "#7a5230", roughness: 0.6 }));
  hole.position.z = -1.95;
  g.add(hole);
  const { map, bump } = await faceTextures(glyph);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.9),
    new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 6, roughness: 0.55 }),
  );
  face.position.z = 0.002;
  g.add(face);
  return g;
}

/** A still of the stone as the face shows to you, turned a little so its depth shows. */
export function sealPicture(glyph: string, px: number) {
  return picture(`hanko|${glyph}|${px}`, px, px, async (target) => {
    const scene = new THREE.Scene();
    scene.environment = environment();
    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a2a20, 1.1));
    const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
    key.position.set(-2.5, 3, 4);
    scene.add(key);
    const s = await sealStone(glyph);
    s.rotation.set(0.22, -0.3, 0.05);
    scene.add(s);
    // Fill the frame with the stone: aim at the middle of its box, back off until it fits.
    s.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(s);
    const mid = box.getCenter(new THREE.Vector3());
    const dim = box.getSize(new THREE.Vector3());
    const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 30);
    const dist = (Math.max(dim.x, dim.y) * 0.5) / Math.tan((22 * Math.PI) / 360) + dim.z * 0.5;
    camera.position.set(mid.x, mid.y, mid.z + dist * 0.98);
    camera.lookAt(mid);
    const r = renderer();
    r.setSize(px, px, false);
    r.render(scene, camera);
    const g = target.getContext("2d")!;
    g.clearRect(0, 0, px, px);
    g.drawImage(r.domElement, 0, 0, px, px);
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
    });
  });
}
