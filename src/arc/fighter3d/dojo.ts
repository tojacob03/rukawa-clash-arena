// The floor of the character stage: tatami side by side, their long edges
// bound in black cloth (heri), as in any dōjō. A single fighter stands on
// the seam between two of them.

import * as THREE from "three";

let straw: THREE.CanvasTexture | null = null;

/** Rush straw: fine strands along the mat, a woven line every few strands. */
export function strawTexture() {
  if (straw) return straw;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#7b7250";
  g.fillRect(0, 0, 256, 512);
  for (let x = 0; x < 256; x += 2) {
    const k = Math.sin(x * 12.9898) * 43758.5453;
    const r = k - Math.floor(k);
    g.fillStyle = r > 0.5 ? "rgba(255, 244, 200, 0.08)" : "rgba(60, 44, 16, 0.1)";
    g.fillRect(x, 0, 1, 512);
  }
  g.fillStyle = "rgba(60, 44, 16, 0.16)";
  for (let y = 0; y < 512; y += 16) g.fillRect(0, y, 256, 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  straw = t;
  return t;
}

/** n tatami side by side (two for one fighter, more for a crew), centred on the seam or the middle mat. */
export function dojo(n = 2, z = -0.25) {
  const g = new THREE.Group();
  g.name = "dojo";
  const straw = new THREE.MeshStandardMaterial({ map: strawTexture(), roughness: 0.95 });
  const heri = new THREE.MeshStandardMaterial({ color: "#17120f", roughness: 0.75 });
  const W = 0.95;
  const L = 1.9;
  const H = 0.05;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * W;
    const mat = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), straw);
    mat.position.set(x, -H / 2, z);
    mat.receiveShadow = true;
    g.add(mat);
    for (const e of [-1, 1]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.055, H + 0.004, L + 0.004), heri);
      band.position.set(x + e * (W / 2 - 0.0275), -H / 2 + 0.002, z);
      band.receiveShadow = true;
      g.add(band);
    }
  }
  return g;
}

/** A shadow catcher whose shadow fades out away from the fighter, so it never ends at the canvas edge. */
export function shadowCatcher() {
  const m = new THREE.ShadowMaterial({ opacity: 0.42 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vFloor;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\n  vFloor = (modelMatrix * vec4(position, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vFloor;")
      .replace("gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );", "gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) * ( 1.0 - smoothstep( 0.45, 1.05, length( vFloor.xz ) ) ) );");
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), m);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  return floor;
}
