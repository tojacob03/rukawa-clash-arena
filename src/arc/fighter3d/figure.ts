// One dressed fighter: the parts of fighter.glb switched on and coloured for
// a look and gear, the body stretched for height, build and muscle.

import * as THREE from "three";
import type { Attire, Belt, Look, Slot } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import { BELT } from "../format.ts";
import { HAIR_COLORS, hairOf, normalizeLook, shade, skinOf } from "../avatarOptions.ts";
import { drawFace, faceKey } from "./face.ts";
import { hairTexture, weaveNormal } from "./textures.tsx";
import { bandTexture } from "./hats.ts";
import { makeAura } from "./aura.ts";
import type { Aura } from "./aura.ts";
import { bodyTexture, bottomTexture, giTexture, spatsTexture, topTexture } from "./garments.tsx";

export interface Spec {
  look: Partial<Look>;
  mode: Attire;
  gear: Partial<Record<Slot, ItemDef | undefined>>;
  belt: Belt;
  stripes: number;
  /** Build (width), 0.86 … 1.3. */
  b: number;
  /** Leg length, 0.84 … 1.16. */
  lf: number;
}

// Joints of the build script (tools/fighter/body.py) in three.js axes:
// x right, y up, z towards the viewer.
const HIP_Y = 0.56;
const SHOULDER = new THREE.Vector3(0.285, 1.0, 0);
const WRIST = new THREE.Vector3(0.418, 0.578, 0.03);
/** Head width per face shape relative to the oval, for hair and headwear (head.py SHAPES). */
const HEAD_W = [1, 1.035, 1, 1.023, 0.965, 1.105];
const HEAD_C = new THREE.Vector3(0, 1.45, 0);

const ARM_PARTS = /^(arm|fist|gi_sleeve|ng_long|ng_short(?!s)|x_tape)/;
const HEAD_PARTS = /^(head$|face$|ear|ring_|hair_|beard_|hw_)/;

/** The part files a figure wears (tools/fighter/build.py, groups), besides the base. */
export function partsFor(spec: Pick<Spec, "look" | "mode" | "gear">) {
  const look = normalizeLook(spec.look);
  const files = [spec.mode === "gi" ? "gi" : "nogi"];
  if (look.hair !== 7) files.push(`hair_${String(look.hair).padStart(2, "0")}`);
  if (look.beard >= 2) files.push(`beard_${look.beard}`);
  if (spec.gear.head?.art.style) files.push(`hw_${spec.gear.head.art.style}`);
  if (spec.gear.extra?.art.style) files.push("extras");
  return files;
}

const smooth = (a: number, b: number, x: number) => {
  const k = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

function makeMaterial(name: string) {
  // Vertex colours carry the ambient occlusion baked in Blender (tools/fighter/ao.py).
  const m = new THREE.MeshStandardMaterial({ name, roughness: 0.8, metalness: 0, vertexColors: name !== "face" });
  switch (name) {
    case "face":
      m.transparent = true;
      m.depthWrite = false;
      m.polygonOffset = true;
      m.polygonOffsetFactor = -2;
      m.roughness = 0.62;
      break;
    case "skin":
    case "body":
      m.roughness = 0.62;
      break;
    case "hair":
      m.roughness = 0.6;
      break;
    case "belt":
    case "beltbar":
    case "stripe":
      m.roughness = 0.9;
      break;
    case "gi":
    case "top":
    case "bottom":
    case "spats":
      // Woven cotton; the garments carry the planar UVs of the body frame.
      m.normalMap = weaveNormal();
      m.normalScale.set(0.35, 0.35);
      m.roughness = name === "gi" ? 0.88 : 0.7;
      break;
    case "medal":
    case "gold":
      m.metalness = 0.85;
      m.roughness = 0.32;
      break;
  }
  return m;
}

function ink() {
  const m = new THREE.MeshBasicMaterial({ color: "#1d130e", side: THREE.BackSide });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("#include <skinning_vertex>", "#include <skinning_vertex>\n  transformed += normalize(normal) * 0.0065;");
  };
  return m;
}

function floats(a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) {
  const out = new Float32Array(a.count * a.itemSize);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
  return new THREE.BufferAttribute(out, a.itemSize);
}

/** A float copy of a (quantised) geometry with the node's transform baked in. */
function bake(src: THREE.BufferGeometry, m: THREE.Matrix4) {
  const geo = new THREE.BufferGeometry();
  for (const [k, a] of Object.entries(src.attributes)) geo.setAttribute(k, floats(a));
  if (src.index) geo.setIndex(src.index.clone());
  const lin = new THREE.Matrix4().extractRotation(m);
  const sc = new THREE.Vector3().setFromMatrixScale(m);
  lin.scale(sc);
  for (const [k, list] of Object.entries(src.morphAttributes)) {
    geo.morphAttributes[k] = list.map((a) => {
      const f = floats(a);
      if (k === "position") f.applyMatrix4(lin);
      return f;
    });
  }
  geo.morphTargetsRelative = src.morphTargetsRelative;
  geo.applyMatrix4(m);
  return geo;
}

interface Part {
  mesh: THREE.Mesh;
  base: Float32Array;
  kind: "arm" | "head" | "body";
}

export class Figure {
  root = new THREE.Group();
  head = new THREE.Group();
  mats = new Map<string, THREE.MeshStandardMaterial>();
  parts = new Map<string, Part>();
  faceCanvas = document.createElement("canvas");
  faceTex: THREE.CanvasTexture;
  private faceWas = "";
  private shapeWas = "";
  private dressing = 0;
  /** Where the hat cuts the hair, in head coordinates, and the same plane in the world. */
  private clipLocal: THREE.Plane | null = null;
  private clipWorld = new THREE.Plane();

  constructor(
    base: THREE.Object3D,
    private load: (name: string) => Promise<THREE.Object3D>,
  ) {
    this.faceCanvas.width = this.faceCanvas.height = 1024;
    this.faceTex = new THREE.CanvasTexture(this.faceCanvas);
    this.faceTex.colorSpace = THREE.SRGBColorSpace;
    this.faceTex.flipY = false;
    this.faceTex.anisotropy = 4;
    this.head.position.copy(HEAD_C);
    this.root.add(this.head);
    this.inkHair = ink();
    this.ink = ink();
    this.add(base);
  }

  private ink: THREE.MeshBasicMaterial;
  private inkHair: THREE.MeshBasicMaterial;
  private files = new Set<string>();
  private loading = new Map<string, Promise<void>>();

  /** Load the files of parts this figure needs (see tools/fighter/build.py, groups). */
  need(names: string[]) {
    return Promise.all(
      names.map((n) => {
        if (this.files.has(n)) return undefined;
        let p = this.loading.get(n);
        if (!p) {
          p = this.load(n).then((scene) => {
            this.files.add(n);
            this.add(scene);
            // New body parts still need the current height and build.
            this.shapeWas = "";
          });
          this.loading.set(n, p);
        }
        return p;
      }),
    );
  }

  private material(name: string) {
    let mat = this.mats.get(name);
    if (!mat) {
      mat = makeMaterial(name);
      if (name === "face") mat.map = this.faceTex;
      if (name === "hair") {
        mat.side = THREE.DoubleSide;
        // The hat's cut also takes the cut hair out of the shadows.
        mat.clipShadows = true;
      }
      this.mats.set(name, mat);
    }
    return mat;
  }

  private add(src: THREE.Object3D) {
    src.updateMatrixWorld(true);
    src.traverse((o) => {
      const from = o as THREE.Mesh;
      if (!from.isMesh || this.parts.has(from.name)) return;
      const name = from.name;
      const matName = (from.material as THREE.Material).name || "skin";
      const mat = this.material(matName);
      // The files are quantised: bring positions back to floats in model space.
      const geo = bake(from.geometry, from.matrixWorld);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = name;
      mesh.userData = { ...from.userData };
      mesh.castShadow = matName !== "face";
      mesh.receiveShadow = true;
      mesh.updateMorphTargets();
      const kind = HEAD_PARTS.test(name) ? "head" : ARM_PARTS.test(name) ? "arm" : "body";
      if (kind === "head") {
        // Head parts hang in a group around the head centre, so hair and
        // headwear can widen with the face and the head can nod.
        geo.translate(-HEAD_C.x, -HEAD_C.y, -HEAD_C.z);
        this.head.add(mesh);
      } else {
        this.root.add(mesh);
      }
      const pos = geo.getAttribute("position") as THREE.BufferAttribute;
      this.parts.set(name, { mesh, base: Float32Array.from(pos.array as Float32Array), kind });
      if (matName !== "face") {
        // Ink outline: the back faces pushed out along the normals.
        const hull = new THREE.Mesh(geo, matName === "hair" ? this.inkHair : this.ink);
        hull.morphTargetInfluences = mesh.morphTargetInfluences;
        hull.morphTargetDictionary = mesh.morphTargetDictionary;
        mesh.add(hull);
      }
    });
  }


  private aura: Aura | null = null;
  private auraWas = "";

  /** Frees the GPU memory of this figure (shared textures stay). */
  dispose() {
    this.dressing++;
    for (const { mesh } of this.parts.values()) mesh.geometry.dispose();
    for (const m of this.mats.values()) m.dispose();
    this.ink.dispose();
    this.inkHair.dispose();
    this.faceTex.dispose();
    this.aura?.group.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material | undefined)?.dispose();
    });
    this.root.removeFromParent();
  }

  /** Moves the aura to the moment t (seconds). */
  tick(t: number) {
    this.aura?.tick(t);
  }

  showAura(on: boolean) {
    if (this.aura) this.aura.group.visible = on;
  }

  /** Call before rendering: moves the hat's cut with the head. */
  syncClip() {
    if (!this.clipLocal) return;
    this.root.updateMatrixWorld(true);
    this.clipWorld.copy(this.clipLocal).applyMatrix4(this.head.matrixWorld);
  }

  mat(name: string) {
    return this.mats.get(name);
  }

  show(test: (name: string) => boolean) {
    for (const [name, p] of this.parts) p.mesh.visible = test(name);
  }

  /** Stretch legs, widen the body, thicken the arms. Head parts only move. */
  private shape(b: number, muscle: number, lf: number) {
    const key = `${b}|${muscle}|${lf}`;
    if (key === this.shapeWas) return;
    this.shapeWas = key;
    const lift = HIP_Y * (lf - 1);
    const armK = 1 + 0.07 * (muscle - 1);
    const a = new THREE.Vector3();
    const axis = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (const part of this.parts.values()) {
      const pos = part.mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const base = part.base;
      if (part.kind === "head") continue;
      for (let i = 0; i < arr.length; i += 3) {
        p.set(base[i], base[i + 1], base[i + 2]);
        if (part.kind === "arm") {
          const side = Math.sign(p.x) || 1;
          a.set(SHOULDER.x * side, SHOULDER.y, SHOULDER.z);
          axis.set(WRIST.x * side, WRIST.y, WRIST.z).sub(a).normalize();
          const t = p.clone().sub(a).dot(axis);
          const on = a.clone().addScaledVector(axis, t);
          p.sub(on).multiplyScalar(armK).add(on);
        } else if (p.y > 0.86 && p.y < 1.12) {
          // Broader shoulders with more muscle.
          p.x *= 1 + 0.025 * (muscle - 1) * smooth(0.86, 0.98, p.y);
        }
        const w = 1 - smooth(1.02, 1.16, p.y);
        p.x *= 1 + (b - 1) * w;
        p.z *= 1 + (b - 1) * 0.6 * w;
        p.y = p.y < HIP_Y ? p.y * lf : p.y + lift;
        arr[i] = p.x;
        arr[i + 1] = p.y;
        arr[i + 2] = p.z;
      }
      pos.needsUpdate = true;
      part.mesh.geometry.computeBoundingSphere();
    }
    this.head.position.set(HEAD_C.x, HEAD_C.y + lift, HEAD_C.z);
  }

  /** Dress the figure. Resolves once every texture is in place. */
  async dress(spec: Spec) {
    const token = ++this.dressing;
    const look = normalizeLook(spec.look);
    const { gear, mode } = spec;
    const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(x) ? x : 0));
    const b = spec.b * (1 + 0.07 * clamp(look.build, -2, 2));
    const muscle = clamp(look.muscle, 0, 3);

    const skin = skinOf(look);
    const hair = hairOf(look);
    const tip = look.hairTips >= 0 ? HAIR_COLORS[look.hairTips] ?? null : null;
    const gi = gear.gi?.art ?? { c: "#f4f1ea", lapel: "#e2d9c6" };
    const top = gear.top?.art ?? { pattern: "rank" as const };
    const bottom = gear.bottom?.art ?? { c: "#1d1d26", style: "shorts" };
    const belt = BELT[spec.belt] ?? BELT.weiss;
    const topC = top.pattern === "rank" ? belt.color : top.c ?? "#1d1d26";
    const extra = gear.extra?.art.style;
    const trait = gear.trait?.art.style;
    const sleeve = top.sleeve ?? "long";
    const style = bottom.style ?? "shorts";
    const shorts = style === "shorts" || style === "combo";
    const spats = style === "spats" || style === "combo";
    const hat = gear.head?.art;
    const hatStyle = hat?.style ?? "";
    const hairId = `hair_${String(look.hair).padStart(2, "0")}`;
    const stripes = Math.min(4, spec.stripes);
    const cauli = trait === "ear";

    await this.need(partsFor(spec));
    if (token !== this.dressing) return false;
    // After loading: parts that just arrived take the same height and build.
    this.shape(Math.round(b * 100) / 100, muscle, spec.lf);

    this.show((n) => {
      if (/^(head|face|torso|neck|arm[LR]|fist[LR]|leg[LR]|foot[LR])$/.test(n)) return true;
      if (n.startsWith("hair_")) return n === hairId || n === `${hairId}_x`;
      if (n.startsWith("beard_")) return n.startsWith(`beard_${look.beard}`);
      if (n === "ear_cauli") return cauli;
      if (n.startsWith("ear")) return n === `ear${look.ears}L` || (n === `ear${look.ears}R` && !cauli);
      if (n.startsWith("ring_")) {
        const e = look.earring;
        return (e === 1 && n.startsWith("ring_stud")) || (e === 2 && n.startsWith("ring_hoop")) || (e === 3 && n === "ring_hoopR");
      }
      if (n.startsWith("hw_")) {
        const m = /^hw_([a-z]+)(?:@([a-z]+))?/.exec(n);
        if (!hat || !m || m[1] !== hatStyle) return false;
        if (m[2]) return m[2] === hat.trim;
        const unless = this.parts.get(n)?.mesh.userData.unless as string[] | undefined;
        return !(hat.trim && unless?.includes(hat.trim));
      }
      if (n.startsWith("gi_") || n.startsWith("belt")) {
        if (mode !== "gi") return false;
        const st = /^belt_stripe(\d)$/.exec(n);
        return st ? Number(st[1]) <= stripes : true;
      }
      if (n.startsWith("ng_")) {
        if (mode === "gi") return false;
        if (n === "ng_top" || n === "ng_collar") return true;
        if (n.startsWith("ng_long")) return sleeve === "long";
        if (n.startsWith("ng_short") && !n.startsWith("ng_shorts")) return sleeve === "short";
        if (n === "ng_shorts") return shorts;
        if (n === "ng_spats") return spats;
        return false;
      }
      if (n.startsWith("x_knee")) return mode !== "gi" && extra === "knee" && !spats;
      if (n.startsWith("x_tape")) return extra === "tape";
      if (n === "x_towel") return extra === "towel";
      if (n === "x_ribbon" || n === "x_medal") return extra === "medal";
      return false;
    });

    // A hat that covers the crown cuts the hair above its band.
    let clip: number[] | null = null;
    for (const p of this.parts.values()) if (p.mesh.visible && Array.isArray(p.mesh.userData.clip)) clip = p.mesh.userData.clip as number[];
    const hairMat = this.mats.get("hair");
    if (clip) {
      const n = new THREE.Vector3(0, -1, -clip[1] / 0.37);
      const len = n.length();
      this.clipLocal = new THREE.Plane(n.divideScalar(len), clip[0] / len);
      if (hairMat) hairMat.clippingPlanes = [this.clipWorld];
      this.inkHair.clippingPlanes = [this.clipWorld];
    } else {
      this.clipLocal = null;
      if (hairMat) hairMat.clippingPlanes = null;
      this.inkHair.clippingPlanes = null;
    }
    if (hairMat) hairMat.needsUpdate = true;
    this.inkHair.needsUpdate = true;

    // Head shape: morph targets on the head and the face decal; hair and
    // headwear widen with it.
    const shapeIdx = clamp(look.faceShape, 0, 5);
    for (const { mesh } of this.parts.values()) {
      const inf = mesh.morphTargetInfluences;
      if (!inf?.length) continue;
      inf.fill(0);
      if (shapeIdx > 0) inf[shapeIdx - 1] = 1;
    }
    const wide = HEAD_W[shapeIdx] ?? 1;
    for (const [n, p] of this.parts) if (/^(hair_|beard_6_tail|hw_|ear|ring_)/.test(n)) p.mesh.scale.set(wide, 1, 1);

    const set = (name: string, c: string) => this.mats.get(name)?.color.set(c);
    set("skin", skin);
    set("cauli", shade(skin, -0.12));
    set("gold", "#f1bf57");
    set("lapel", gi.lapel ?? shade(gi.c ?? "#f4f1ea", -0.1));
    set("belt", belt.color);
    set("beltbar", belt.bar);
    set("stripe", "#f6f3ea");
    set("topdark", shade(topC, -0.4));
    set("bottomdark", shade(bottom.c ?? "#1d1d26", -0.35));
    set("pad", "#2a2a36");
    set("tape", "#fbfaf5");
    set("towel", gear.extra?.art.c ?? "#6fb3c9");
    set("medal", gear.extra?.art.c ?? "#f1bf57");
    set("ribbon", "#c8302a");
    set("bead", "#f1bf57");
    set("tie", "#c8302a");
    const hc = hat?.c ?? "#f4f1ea";
    const hc2 = hat?.c2 ?? shade(hc, -0.3);
    set("hw1", hc);
    set("hw2", hc2);
    set("hw3", hat?.c3 ?? hc2);
    set("hwd", shade(hc, -0.28));
    set("hwbandend", hat?.cs?.[0] ?? hc);
    set("white", "#fbf8f2");
    for (let i = 0; i < 4; i++) set(`rib${i}`, hat?.cs?.[i] ?? hc2);
    const bandMat = this.mats.get("hwband");
    if (bandMat && hat?.style === "band") {
      bandMat.map = bandTexture(hat);
      bandMat.color.set("#ffffff");
      bandMat.needsUpdate = true;
    }

    if (hairMat) {
      hairMat.map = hairTexture(hair, tip);
      hairMat.color.set("#ffffff");
      hairMat.needsUpdate = true;
    }

    const auraKey = gear.aura ? `${gear.aura.id}|${gear.aura.art.c}` : "";
    if (auraKey !== this.auraWas) {
      this.auraWas = auraKey;
      if (this.aura) this.root.remove(this.aura.group);
      this.aura = gear.aura ? makeAura(gear.aura.id, gear.aura.art.c ?? "#5f90ea") : null;
      if (this.aura) this.root.add(this.aura.group);
    }

    const fk = faceKey({ look, scar: trait === "scar" });
    if (fk !== this.faceWas) {
      this.faceWas = fk;
      drawFace(this.faceCanvas, { look, scar: trait === "scar" });
      this.faceTex.needsUpdate = true;
    }

    const [bodyT, giT, topT, bottomT, spatsT] = await Promise.all([
      bodyTexture(look, skin),
      mode === "gi" ? giTexture(gear) : null,
      mode !== "gi" ? topTexture(gear, belt.color) : null,
      mode !== "gi" && shorts ? bottomTexture(gear, mode) : null,
      mode !== "gi" && spats ? spatsTexture(gear) : null,
    ]);
    if (token !== this.dressing) return false;
    const mapTo = (name: string, t: THREE.Texture | null) => {
      const m = this.mats.get(name);
      if (!m || !t) return;
      m.map = t;
      m.color.set("#ffffff");
      m.needsUpdate = true;
    };
    mapTo("body", bodyT);
    mapTo("gi", giT);
    mapTo("top", topT);
    mapTo("bottom", bottomT);
    mapTo("spats", spatsT);
    return true;
  }
}
