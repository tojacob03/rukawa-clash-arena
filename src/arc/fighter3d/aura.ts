// Auras around the 3D fighter, one per aura item (core/items.ts): blue
// flames at the feet, gold rays behind, cherry petals falling, star dust,
// lightning, sea spray. Each is a group with a tick(t) that moves it; a
// still figure shows it at one moment.

import * as THREE from "three";

type Draw = (g: CanvasRenderingContext2D, s: number) => void;

const sprites = new Map<string, THREE.CanvasTexture>();

function sprite(key: string, draw: Draw, size = 128) {
  let t = sprites.get(key);
  if (!t) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    draw(c.getContext("2d")!, size);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    sprites.set(key, t);
  }
  return t;
}

// White shapes, tinted by the material colour.
const FLAME: Draw = (g, s) => {
  g.fillStyle = "#fff";
  g.beginPath();
  g.moveTo(s * 0.5, s * 0.02);
  g.bezierCurveTo(s * 0.62, s * 0.3, s * 0.9, s * 0.52, s * 0.82, s * 0.76);
  g.bezierCurveTo(s * 0.75, s * 0.96, s * 0.25, s * 0.96, s * 0.18, s * 0.76);
  g.bezierCurveTo(s * 0.1, s * 0.52, s * 0.4, s * 0.36, s * 0.5, s * 0.02);
  g.fill();
};
const STAR: Draw = (g, s) => {
  g.fillStyle = "#fff";
  g.beginPath();
  const c = s / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const r = i % 2 ? s * 0.09 : s * 0.48;
    g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
};
const PETAL: Draw = (g, s) => {
  g.fillStyle = "#fff";
  g.beginPath();
  g.moveTo(s * 0.5, s * 0.06);
  g.bezierCurveTo(s * 0.92, s * 0.3, s * 0.8, s * 0.86, s * 0.5, s * 0.94);
  g.bezierCurveTo(s * 0.2, s * 0.86, s * 0.08, s * 0.3, s * 0.5, s * 0.06);
  g.fill();
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  g.moveTo(s * 0.44, s * 0.02);
  g.lineTo(s * 0.5, s * 0.16);
  g.lineTo(s * 0.56, s * 0.02);
  g.fill();
};
const DROP: Draw = (g, s) => {
  g.fillStyle = "#fff";
  g.beginPath();
  g.ellipse(s / 2, s / 2, s * 0.3, s * 0.42, 0, 0, Math.PI * 2);
  g.fill();
};

const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function spriteMat(map: THREE.Texture, color: string, opacity = 0.9, additive = false) {
  return new THREE.SpriteMaterial({ map, color, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
}

export interface Aura {
  group: THREE.Group;
  tick: (t: number) => void;
}

export function makeAura(id: string, color: string): Aura | null {
  const group = new THREE.Group();
  group.name = "aura";
  const parts: THREE.Object3D[] = [];
  let tick: (t: number) => void = () => undefined;

  if (id === "au_blau") {
    const map = sprite("flame", FLAME);
    // Flames rise behind the fighter and at the sides, never across the body.
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Sprite(spriteMat(map, color, 0.7, true));
      const a = Math.PI * 0.42 + (i / 8) * Math.PI * 1.16;
      s.position.set(Math.sin(a) * 0.58, -0.02, Math.cos(a) * 0.42 - 0.08);
      s.center.set(0.5, 0);
      parts.push(s);
    }
    tick = (t) =>
      parts.forEach((s, i) => {
        const f = 0.5 + 0.5 * Math.sin(t * 7 + i * 1.7) * Math.sin(t * 3.1 + i);
        s.scale.set(0.22 + 0.04 * f, 0.42 + 0.3 * f + 0.12 * (i % 3), 1);
      });
  } else if (id === "au_gold") {
    // Gold motes rising around the fighter from a ring of light on the mat.
    const map = sprite("star", STAR);
    for (let i = 0; i < 26; i++) parts.push(new THREE.Sprite(spriteMat(map, color, 0.9, true)));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.012, 6, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    ring.scale.set(1, 0.75, 1);
    parts.push(ring);
    const motes = parts.slice(0, -1);
    tick = (t) =>
      motes.forEach((s, i) => {
        const k = (t * (0.16 + rnd(i, 1) * 0.1) + rnd(i, 2)) % 1;
        const a = rnd(i, 3) * Math.PI * 2 + k * 1.2;
        const r = 0.6 - k * 0.12;
        s.position.set(Math.sin(a) * r, k * 2.3, Math.cos(a) * r * 0.75);
        const size = 0.09 * (1 - k * 0.6) * (0.6 + 0.4 * Math.sin(t * 5 + i));
        s.scale.set(size, size, 1);
      });
  } else if (id === "au_sakura") {
    const map = sprite("petal", PETAL, 64);
    for (let i = 0; i < 32; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.13), new THREE.MeshBasicMaterial({ map, color, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      parts.push(m);
    }
    tick = (t) =>
      parts.forEach((m, i) => {
        const speed = 0.18 + rnd(i, 1) * 0.12;
        const k = (t * speed + rnd(i, 2)) % 1;
        const r = 0.45 + rnd(i, 3) * 0.55;
        const a = rnd(i, 4) * Math.PI * 2 + t * 0.2;
        m.position.set(Math.sin(a) * r + Math.sin(t * 1.3 + i) * 0.08, 2.5 - k * 2.6, Math.cos(a) * r * 0.7);
        m.rotation.set(t * (1 + rnd(i, 5)) + i, t * 0.7 + i, t * 0.9);
        ((m as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = Math.min(1, k * 6, (1 - k) * 6) * 0.9;
      });
  } else if (id === "au_sterne") {
    const map = sprite("star", STAR);
    for (let i = 0; i < 22; i++) parts.push(new THREE.Sprite(spriteMat(map, color, 0.95, true)));
    tick = (t) =>
      parts.forEach((s, i) => {
        const a = rnd(i, 1) * Math.PI * 2;
        const r = 0.55 + rnd(i, 2) * 0.5;
        s.position.set(Math.sin(a) * r, 0.2 + rnd(i, 3) * 2.1, Math.cos(a) * r * 0.6);
        const tw = Math.max(0, Math.sin(t * (1.5 + rnd(i, 4) * 2) + i * 2.3));
        const size = (0.07 + 0.1 * rnd(i, 5)) * (0.35 + 0.65 * tw);
        s.scale.set(size, size, 1);
      });
  } else if (id === "au_donner") {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
    for (let b = 0; b < 3; b++) {
      const s = b === 1 ? -1 : 1;
      const pts: THREE.Vector3[] = [];
      let x = s * (0.75 + 0.1 * b);
      for (let k = 0; k < 7; k++) {
        pts.push(new THREE.Vector3(x, 2.3 - k * 0.3 - b * 0.2, -0.2));
        x += (k % 2 ? 0.1 : -0.1) * s;
      }
      parts.push(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0), 40, 0.018, 5, false), mat));
    }
    tick = (t) =>
      parts.forEach((m, i) => {
        // A strike, a flicker, then quiet; a still figure shows two bolts.
        const phase = (t * 0.6 + i * 0.37 + 0.9) % 1;
        m.visible = phase < 0.07 || (phase > 0.1 && phase < 0.13) || (t === 1.3 && i !== 1);
      });
  } else if (id === "au_gischt") {
    const map = sprite("drop", DROP, 64);
    for (let i = 0; i < 40; i++) parts.push(new THREE.Sprite(spriteMat(map, color, 0.85)));
    tick = (t) =>
      parts.forEach((s, i) => {
        const k = (t * 0.5 + rnd(i, 1)) % 1;
        const a = rnd(i, 2) * Math.PI * 2 + t * 0.4;
        const r = 0.5 + k * 0.45;
        s.position.set(Math.sin(a) * r, 0.1 + Math.sin(k * Math.PI) * (0.5 + rnd(i, 3) * 0.6), Math.cos(a) * r * 0.7);
        const size = 0.055 * (1 - k * 0.5);
        s.scale.set(size, size * 1.3, 1);
        ((s as THREE.Sprite).material as THREE.SpriteMaterial).opacity = 0.85 * Math.min(1, (1 - k) * 4);
      });
  } else {
    return null;
  }
  for (const p of parts) group.add(p);
  tick(1.3);
  return { group, tick };
}
