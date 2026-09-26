// The face of the 3D fighter, drawn into a canvas that lies on the front of
// the head like a decal. The drawing uses the coordinates of the old SVG
// avatar (head centre 120/96, 46 wide to each side), so every eye, brow,
// nose, mouth and mark keeps its place; the build script maps the same frame
// onto the head (tools/fighter/head.py, FACE_FRAME).

import type { Look } from "../core/types.ts";
import { EYE_COLORS, eyeOf, hairOf, shade, skinOf } from "../avatarOptions.ts";

/** World units per SVG pixel: the head is 0.43 * 0.93 wide to each side (head.py), the SVG head 46. */
export const FACE_K = (0.43 * 0.93) / 46;

const LINE = "#24160f";

type Ctx = CanvasRenderingContext2D;

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, Number.isFinite(x) ? x : 0));

function strokeD(ctx: Ctx, d: string, color: string, w: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(d));
}

function fillD(ctx: Ctx, d: string, color: string) {
  ctx.fillStyle = color;
  ctx.fill(new Path2D(d));
}

function ell(cx: number, cy: number, rx: number, ry: number) {
  const p = new Path2D();
  p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  return p;
}

/** Iris with a darker upper rim, the pupil and two catchlights. */
function iris(ctx: Ctx, color: string, cx: number, cy: number, rx: number, ry: number) {
  const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
  g.addColorStop(0, shade(color, -0.45));
  g.addColorStop(0.45, color);
  g.addColorStop(1, shade(color, 0.35));
  ctx.fillStyle = g;
  ctx.fill(ell(cx, cy, rx, ry));
  ctx.lineWidth = Math.max(0.8, rx * 0.14);
  ctx.strokeStyle = shade(color, -0.5);
  ctx.stroke(ell(cx, cy, rx, ry));
  ctx.fillStyle = "#120b08";
  ctx.fill(ell(cx, cy + 0.4, rx * 0.42, ry * 0.46));
  ctx.fillStyle = "#fff";
  ctx.fill(ell(cx - rx * 0.36, cy - ry * 0.34, Math.max(1.3, rx * 0.3), Math.max(1.3, ry * 0.26)));
  ctx.globalAlpha = 0.8;
  ctx.fill(ell(cx + rx * 0.34, cy + ry * 0.42, Math.max(0.7, rx * 0.13), Math.max(0.7, ry * 0.11)));
  ctx.globalAlpha = 1;
}

function lashes(ctx: Ctx, n: number) {
  if (n <= 0) return;
  strokeD(ctx, n === 2 ? "M-12 -4 L-18 -8 M-10 -8 L-15 -13 M-6 -10 L-9 -15" : "M-12 -4 L-16 -7 M-9 -8 L-12 -11", LINE, 1.7);
}

/** One eye around (0, 0), drawn as the viewer's left eye. */
function eye(ctx: Ctx, shape: number, color: string, skin: string, lash: number) {
  const white = "#fbf8f2";
  switch (shape) {
    case 0: {
      ctx.fillStyle = white;
      ctx.fill(ell(0, 0, 11, 13));
      ctx.save();
      ctx.clip(ell(0, 0, 11, 13));
      iris(ctx, color, 0, 2, 8.2, 10.5);
      ctx.restore();
      strokeD(ctx, "M-12 -5 Q0 -18 12 -6", LINE, 3.4);
      strokeD(ctx, "M-9 10 Q0 14 8 10", shade(skin, -0.3), 1.1);
      lashes(ctx, lash);
      return;
    }
    case 1:
    case 2: {
      const d = shape === 1 ? "M-12 1 Q-2 -10 12 -2 Q2 10 -12 1 Z" : "M-12 1 Q0 -5 12 0 Q0 5 -12 1 Z";
      fillD(ctx, d, white);
      ctx.save();
      ctx.clip(new Path2D(d));
      iris(ctx, color, 1, 0, shape === 1 ? 6.6 : 5.2, shape === 1 ? 7.2 : 5.6);
      ctx.restore();
      strokeD(ctx, shape === 1 ? "M-13 1 Q-2 -11 13 -3" : "M-13 1 Q0 -6 13 -1", LINE, 3.2);
      lashes(ctx, lash);
      return;
    }
    case 4: {
      ctx.fillStyle = white;
      ctx.fill(ell(0, 0, 11, 13));
      ctx.save();
      ctx.clip(ell(0, 0, 11, 13));
      iris(ctx, color, 0, 2, 8.2, 10.5);
      fillD(ctx, "M-14 -16 L14 -16 L14 0.5 Q0 3.5 -14 0.5 Z", skin);
      ctx.restore();
      strokeD(ctx, "M-12 0 Q0 3 12 0", LINE, 3.2);
      lashes(ctx, lash);
      return;
    }
    case 5:
      strokeD(ctx, "M-10 3 Q0 -8 10 3", LINE, 3.4);
      lashes(ctx, lash);
      return;
    case 6:
      ctx.fillStyle = LINE;
      ctx.fill(ell(0, 2, 3.4, 4.6));
      ctx.fillStyle = "#fff";
      ctx.fill(ell(-1, 0.4, 1.1, 1.1));
      return;
    default: {
      const d = "M-12 0 Q-2 -11 12 -4 Q2 12 -12 0 Z";
      fillD(ctx, d, white);
      ctx.save();
      ctx.clip(new Path2D(d));
      iris(ctx, color, 1, 1, 6.6, 7.6);
      ctx.restore();
      strokeD(ctx, "M-13 0 Q-2 -13 13 -5", LINE, 3.5);
      lashes(ctx, lash);
    }
  }
}

const BROWS: Record<number, (ctx: Ctx, c: string) => void> = {
  0: (ctx, c) => strokeD(ctx, "M-12 1 L11 1", c, 4),
  1: (ctx, c) => strokeD(ctx, "M-12 3 Q0 -5 11 1", c, 3.6),
  2: (ctx, c) => fillD(ctx, "M-13 3 Q-1 -6 12 0 L11 5 Q0 1 -12 7 Z", c),
  3: (ctx, c) => strokeD(ctx, "M-11 2 Q0 -3 10 1", c, 2),
  4: (ctx, c) => strokeD(ctx, "M-13 -2 L11 5", c, 4.2),
  5: (ctx, c) => strokeD(ctx, "M-13 5 L11 -2", c, 3.6),
  6: (ctx, c) => strokeD(ctx, "M-13 1 L-3 1 M1 1 L11 1", c, 4),
};

function nose(ctx: Ctx, kind: number, skin: string) {
  const c = shade(skin, -0.3);
  switch (kind) {
    case 1:
      return strokeD(ctx, "M121 106 L116 116 L121 117", c, 2);
    case 2:
      return strokeD(ctx, "M115 116 Q120 119 125 116 M114 112 Q112 117 116 117 M126 112 Q128 117 124 117", c, 1.8);
    case 3:
      return strokeD(ctx, "M119 100 Q127 110 121 117 L117 116", c, 2);
    case 4:
      strokeD(ctx, "M117 115 Q120 118 123 115", c, 1.8);
      ctx.fillStyle = c;
      ctx.fill(ell(118, 114, 0.9, 0.9));
      ctx.fill(ell(122, 114, 0.9, 0.9));
      return;
    case 5:
      return strokeD(ctx, "M120 103 L123 108 L118 112 L122 117 L117 117", c, 2.2);
    case 6:
      ctx.globalAlpha = 0.6;
      fillD(ctx, "M119 112 L122 116 L117.5 116 Z", c);
      ctx.globalAlpha = 1;
      return;
    default:
      return strokeD(ctx, "M120 110 L118 116", c, 2);
  }
}

function mouth(ctx: Ctx, kind: number) {
  switch (kind) {
    case 0:
      return strokeD(ctx, "M113 124 L127 124", LINE, 2.4);
    case 1:
      fillD(ctx, "M111 121 Q120 131 129 121 Q120 124 111 121 Z", "#8e2f3c");
      return strokeD(ctx, "M111 121 Q120 131 129 121 Q120 124 111 121 Z", LINE, 2);
    case 3:
      return strokeD(ctx, "M110 127 Q112 124 120 124 Q128 124 130 127", LINE, 2.4);
    case 4:
      fillD(ctx, "M111 120 Q120 116 129 120 Q128 134 120 135 Q112 134 111 120 Z", "#6e1f2e");
      fillD(ctx, "M113 121 Q120 119 127 121 L126 123 Q120 122 114 123 Z", "#fff");
      ctx.fillStyle = "#d86a7a";
      ctx.fill(ell(120, 131, 4, 2));
      return strokeD(ctx, "M111 120 Q120 116 129 120 Q128 134 120 135 Q112 134 111 120 Z", LINE, 1.9);
    case 5:
    case 6: {
      const d = "M110 120 Q120 124 130 120 Q128 132 120 132 Q112 132 110 120 Z";
      fillD(ctx, d, kind === 6 ? "#2f7de1" : "#fff");
      strokeD(ctx, "M111 124.5 Q120 127.5 129 124.5", kind === 6 ? "#9cc3ff" : "#c9c4cf", 1.2);
      if (kind === 5) strokeD(ctx, "M116 122 V129 M120 122.5 V130 M124 122 V129", "#d8d3dc", 0.8);
      return strokeD(ctx, d, LINE, 1.9);
    }
    case 7:
      fillD(ctx, "M117 124 Q117 131 121 131 Q124 130 123 124 Z", "#e07a8a");
      strokeD(ctx, "M117 124 Q117 131 121 131 Q124 130 123 124 Z", LINE, 1.3);
      return strokeD(ctx, "M112 123 Q120 127 128 123", LINE, 2.4);
    default:
      return strokeD(ctx, "M113 124 Q121 127 128 121", LINE, 2.4);
  }
}

function marksUnder(ctx: Ctx, marks: Set<string>, skin: string) {
  const dark = shade(skin, -0.35);
  if (marks.has("blush")) {
    ctx.fillStyle = "rgba(255, 110, 120, 0.3)";
    ctx.fill(ell(93, 116, 7.5, 3.8));
    ctx.fill(ell(147, 116, 7.5, 3.8));
  }
  if (marks.has("freckles")) {
    ctx.fillStyle = dark;
    ctx.globalAlpha = 0.55;
    for (const [x, y] of [
      [106, 112],
      [110, 115],
      [104, 116],
      [134, 112],
      [130, 115],
      [136, 116],
      [115, 110],
      [125, 110],
    ])
      ctx.fill(ell(x, y, 0.9, 0.9));
    ctx.globalAlpha = 1;
  }
  if (marks.has("bags")) {
    ctx.globalAlpha = 0.6;
    strokeD(ctx, "M92 117 Q101 121 110 117 M130 117 Q139 121 148 117", dark, 1.4);
    ctx.globalAlpha = 1;
  }
  if (marks.has("paint")) {
    ctx.globalAlpha = 0.75;
    strokeD(ctx, "M89 119 L108 121 M91 124 L106 125 M151 119 L132 121 M149 124 L134 125", "#1c1526", 2.4);
    ctx.globalAlpha = 1;
  }
  if (marks.has("matburn")) {
    ctx.save();
    ctx.translate(150, 106);
    ctx.rotate((-20 * Math.PI) / 180);
    ctx.fillStyle = "rgba(216, 100, 106, 0.55)";
    ctx.fill(ell(0, 0, 6, 3.2));
    ctx.restore();
  }
  if (marks.has("mole")) {
    ctx.fillStyle = "#4a2f22";
    ctx.fill(ell(136, 127, 1.3, 1.3));
  }
  if (marks.has("scarCheek")) strokeD(ctx, "M139 112 L152 121 M142 112 L140 116 M146 115 L144 119 M150 118 L148 122", "rgba(176, 82, 90, 0.85)", 1.6);
}

function marksOver(ctx: Ctx, marks: Set<string>, scar: boolean) {
  if (marks.has("scarEye")) strokeD(ctx, "M97 88 L104 124", "rgba(176, 82, 90, 0.85)", 2);
  if (marks.has("bandage")) {
    ctx.save();
    ctx.translate(120, 109);
    ctx.rotate((-8 * Math.PI) / 180);
    ctx.translate(-120, -109);
    fillD(ctx, "M111.5 106 h17 a1.5 1.5 0 0 1 1.5 1.5 v3 a1.5 1.5 0 0 1 -1.5 1.5 h-17 a1.5 1.5 0 0 1 -1.5 -1.5 v-3 a1.5 1.5 0 0 1 1.5 -1.5 Z", "#f1d7b5");
    fillD(ctx, "M117 106.5 h6 v5 h-6 Z", "#e7c49a");
    ctx.restore();
  }
  if (scar) strokeD(ctx, "M150 80 L158 92 M154 80 L162 92", "rgba(176, 82, 90, 0.8)", 2);
}

/** Beard styles that are only a shadow on the skin (stubble). */
function stubble(ctx: Ctx, kind: number, hair: string) {
  if (kind !== 1) return;
  ctx.globalAlpha = 0.26;
  fillD(ctx, "M78 110 Q84 138 120 144 Q156 138 162 110 Q150 132 120 134 Q90 132 78 110 Z", hair);
  ctx.globalAlpha = 1;
}

export interface FaceOpts {
  look: Look;
  /** The trait "scar" of the gear. */
  scar?: boolean;
}

export const faceKey = ({ look: l, scar }: FaceOpts) =>
  [l.skin, l.skinHex, l.eyeShape, l.eyeColor, l.eyeHex, l.eyeColor2, l.eyeSize, l.eyeGap, l.lashes, l.brows, l.nose, l.mouth, l.hairColor, l.hairHex, l.hair === 7, l.beard, l.marks.join("."), scar ? 1 : 0].join("|");

/** Draws the face onto a transparent square canvas of the given size. */
export function drawFace(canvas: HTMLCanvasElement | OffscreenCanvas, { look, scar }: FaceOpts) {
  const S = canvas.width;
  const ctx = canvas.getContext("2d") as Ctx | null;
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, S, S);
  const k = FACE_K * S;
  ctx.setTransform(k, 0, 0, k, (0.5 - 120 * FACE_K) * S, (0.5 - 96 * FACE_K) * S);
  const skin = skinOf(look);
  const hair = hairOf(look);
  const eyeC = eyeOf(look);
  const eye2 = look.eyeColor2 >= 0 ? EYE_COLORS[look.eyeColor2] ?? eyeC : eyeC;
  const marks = new Set(look.marks);
  marksUnder(ctx, marks, skin);
  stubble(ctx, look.beard, hair);
  // On the round 3D head the features sit closer together and lower than on
  // the flat drawing, and the eyes are larger.
  const s = 1.15 * (1 + 0.08 * clamp(look.eyeSize, -2, 2));
  const gap = 2.4 * clamp(look.eyeGap, -2, 2);
  for (const [x, c, m] of [
    [102 - gap, eyeC, 1],
    [138 + gap, eye2, -1],
  ] as const) {
    ctx.save();
    ctx.translate(x, 110);
    ctx.scale(m * s, s);
    eye(ctx, look.eyeShape, c, skin, look.lashes);
    ctx.restore();
  }
  const brow = look.hair === 7 ? shade(hair, -0.2) : shade(hair, -0.25);
  for (const [x, m] of [
    [102 - gap, 1],
    [138 + gap, -1],
  ] as const) {
    ctx.save();
    ctx.translate(x, 91);
    ctx.scale(m * 0.95, 0.9);
    (BROWS[look.brows] ?? BROWS[0])(ctx, brow);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(120, 119);
  ctx.scale(0.8, 0.8);
  ctx.translate(-120, -113);
  nose(ctx, look.nose, skin);
  ctx.restore();
  ctx.save();
  ctx.translate(120, 128.5);
  ctx.scale(0.8, 0.8);
  ctx.translate(-120, -124);
  mouth(ctx, look.mouth);
  ctx.restore();
  marksOver(ctx, marks, !!scar);
}
