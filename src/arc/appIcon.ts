// The app's icon from the player's own fighter (b10): the head as a
// portrait on the black lacquer tile of the app icon, set as the tab icon
// and as the icon a phone takes when the app is added to the home screen.
// Without WebGL, or before a profile exists, the drawn icon stays.

import type { Spec } from "./fighter3d/figure.ts";

let last = "";

function tile(head: HTMLCanvasElement, size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = size * 0.22;
  g.beginPath();
  g.roundRect(0, 0, size, size, r);
  g.fillStyle = "#110d0b";
  g.fill();
  // The gold edge of the drawn icon, as a thin ring inside the tile.
  g.lineWidth = Math.max(1.5, size * 0.03);
  g.strokeStyle = "#d4a94f";
  g.beginPath();
  g.roundRect(size * 0.06, size * 0.06, size * 0.88, size * 0.88, r * 0.7);
  g.stroke();
  g.save();
  g.beginPath();
  g.roundRect(size * 0.06, size * 0.06, size * 0.88, size * 0.88, r * 0.7);
  g.clip();
  g.drawImage(head, size * 0.1, size * 0.13, size * 0.8, size * 0.8);
  g.restore();
  return c.toDataURL("image/png");
}

function link(rel: string, href: string, type?: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  if (type) el.type = type;
  else el.removeAttribute("type");
  el.href = href;
}

export async function setOwnIcon(spec: Spec) {
  const key = JSON.stringify([spec.look, spec.mode, Object.values(spec.gear).map((g) => g?.id ?? ""), spec.belt]);
  if (key === last) return;
  const r = await import("./fighter3d/renderer.ts");
  const head = document.createElement("canvas");
  head.width = head.height = 360;
  await r.still(head, spec, "icon");
  last = key;
  link("icon", tile(head, 64), "image/png");
  link("apple-touch-icon", tile(head, 180));
}
