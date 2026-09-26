// The floor of the character stage: two tatami side by side, their long
// edges bound in black cloth (heri), as in any dōjō. The fighter stands on
// the seam between them.

import * as THREE from "three";

/** Rush straw: fine strands along the mat, a woven line every few strands. */
function strawTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#8f7f4c";
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
  return t;
}

export function dojo() {
  const g = new THREE.Group();
  g.name = "dojo";
  const straw = new THREE.MeshStandardMaterial({ map: strawTexture(), roughness: 0.92 });
  const heri = new THREE.MeshStandardMaterial({ color: "#17120f", roughness: 0.75 });
  const W = 0.95;
  const L = 1.9;
  const H = 0.05;
  for (const s of [-1, 1]) {
    const mat = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), straw);
    mat.position.set((s * W) / 2, -H / 2, -0.25);
    mat.receiveShadow = true;
    g.add(mat);
    for (const e of [-1, 1]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.055, H + 0.004, L + 0.004), heri);
      band.position.set((s * W) / 2 + e * (W / 2 - 0.0275), -H / 2 + 0.002, -0.25);
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
