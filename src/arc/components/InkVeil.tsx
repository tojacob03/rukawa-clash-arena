// The change of page: ink covers the old page and draws back from where you
// touched, with a gold edge along its front, the seam of kintsugi. One small
// WebGL shader, no library. Nothing runs with reduced motion or without WebGL.

import { useEffect, useLayoutEffect, useRef } from "react";
import { reducedMotion } from "../motion.ts";

const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform vec2 u_o;
uniform float u_p;
uniform float u_seed;
uniform vec3 u_ink;
uniform vec3 u_gold;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  float a = hash(i); float b = hash(i + vec2(1.0, 0.0)); float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
void main() {
  vec2 uv = gl_FragCoord.xy / u_res.y;
  vec2 o = u_o / u_res.y;
  float n = fbm(uv * 2.6 + u_seed);
  float fine = fbm(uv * 16.0 - u_seed);
  // Distance from the touch, roughened like ink soaking into paper fibres.
  float field = distance(uv, o) + (n - 0.5) * 0.42 + (fine - 0.5) * 0.07;
  float reach = length(vec2(u_res.x / u_res.y, 1.0)) + 0.45;
  float t = u_p * reach - 0.12;
  float e = 0.014;
  float ink = smoothstep(t - e * 0.4, t + e * 0.4, field);
  float seam = (smoothstep(t - e * 1.8, t - e * 0.3, field) - smoothstep(t + e * 0.2, t + e * 1.1, field)) * (1.0 - smoothstep(0.75, 1.0, u_p));
  vec3 col = mix(u_ink * (0.9 + 0.12 * fine), u_gold * (0.85 + 0.3 * fine), clamp(seam * 1.4, 0.0, 1.0));
  float a = clamp(max(ink, seam), 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}`;

const hex = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];

let origin: { x: number; y: number } | null = null;

/** Where the next change of page starts: the last pointer down before it. */
function remember(e: PointerEvent) {
  origin = { x: e.clientX, y: e.clientY };
}

export default function InkVeil({ route }: { route: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const gl = useRef<{ ctx: WebGLRenderingContext; loc: Record<string, WebGLUniformLocation | null> } | null>(null);
  const first = useRef(true);
  const raf = useRef(0);

  useEffect(() => {
    document.addEventListener("pointerdown", remember, true);
    return () => document.removeEventListener("pointerdown", remember, true);
  }, []);

  // Set up once; a context that cannot be made leaves the veil off for good.
  useEffect(() => {
    const c = canvas.current;
    if (!c || reducedMotion()) return;
    const ctx = c.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!ctx) return;
    const sh = (type: number, src: string) => {
      const s = ctx.createShader(type)!;
      ctx.shaderSource(s, src);
      ctx.compileShader(s);
      return s;
    };
    const prog = ctx.createProgram()!;
    ctx.attachShader(prog, sh(ctx.VERTEX_SHADER, VERT));
    ctx.attachShader(prog, sh(ctx.FRAGMENT_SHADER, FRAG));
    ctx.linkProgram(prog);
    if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) return;
    ctx.useProgram(prog);
    const buf = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
    const p = ctx.getAttribLocation(prog, "p");
    ctx.enableVertexAttribArray(p);
    ctx.vertexAttribPointer(p, 2, ctx.FLOAT, false, 0, 0);
    ctx.enable(ctx.BLEND);
    ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
    const loc = Object.fromEntries(["u_res", "u_o", "u_p", "u_seed", "u_ink", "u_gold"].map((n) => [n, ctx.getUniformLocation(prog, n)]));
    gl.current = { ctx, loc };
    return () => {
      cancelAnimationFrame(raf.current);
      gl.current = null;
    };
  }, []);

  // On every change of page after the first: cover at once, then draw back.
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const g = gl.current;
    const c = canvas.current;
    if (!g || !c || reducedMotion()) return;
    const { ctx, loc } = g;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(window.innerWidth * dpr);
    const h = Math.round(window.innerHeight * dpr);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    ctx.viewport(0, 0, w, h);
    const o = origin ?? { x: window.innerWidth / 2, y: window.innerHeight - 40 };
    origin = null;
    const light = getComputedStyle(document.documentElement).colorScheme === "light";
    ctx.uniform2f(loc.u_res, w, h);
    ctx.uniform2f(loc.u_o, o.x * dpr, h - o.y * dpr);
    ctx.uniform1f(loc.u_seed, Math.random() * 40);
    ctx.uniform3fv(loc.u_ink, hex(light ? "#1b1512" : "#0b0908"));
    ctx.uniform3fv(loc.u_gold, hex(light ? "#b88a2e" : "#d9ad4c"));
    const dur = 720;
    const t0 = performance.now();
    c.classList.add("on");
    cancelAnimationFrame(raf.current);
    const frame = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      // Fast at first, like ink meeting dry paper, then slow as it thins out.
      const p = 1 - Math.pow(1 - k, 2.2);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.uniform1f(loc.u_p, p);
      ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
      if (k < 1) raf.current = requestAnimationFrame(frame);
      else c.classList.remove("on");
    };
    frame(t0);
  }, [route]);

  return <canvas ref={canvas} className="ink-veil" aria-hidden="true" />;
}
