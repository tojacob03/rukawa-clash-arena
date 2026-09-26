// A ship on the chart as a picture of the 3D model (three/ship.ts), in the
// box of the drawn ship. Your own ship's flag waves: a few moments of its
// wave shown in turn, as fast as the wind; with reduced motion, in a hidden
// tab or without WebGL it holds still (or the drawing stays).

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ShipLook } from "./ShipArt.tsx";
import type { Spec } from "../fighter3d/figure.ts";

// The sprite box in the drawing's units (three/ship.ts, SPRITE).
const BOX = { x: 0, y: -46, w: 200, h: 196 };

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function useShipSprites(look: ShipLook, wind: number, px: number, frames: number) {
  const key = JSON.stringify([look, Math.round(wind * 10), px, frames]);
  const [urls, setUrls] = useState<{ key: string; list: string[] } | null>(null);
  useEffect(() => {
    let gone = false;
    import("../three/ship.ts")
      .then((m) => Promise.all(Array.from({ length: frames }, (_, i) => m.shipPicture(look, wind, px, i, frames))))
      .then((list) => !gone && setUrls({ key, list }))
      .catch(() => undefined);
    return () => {
      gone = true;
    };
    // The key stands for the look, the wind, the size and the frames.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls?.key === key ? urls.list : urls?.list ?? null;
}

export default function ShipSprite({ look, wind, px = 320, frames = 1, children }: { look: ShipLook; wind: number; px?: number; frames?: number; children: ReactNode }) {
  const list = useShipSprites(look, wind, px, frames);
  const [i, setI] = useState(0);
  const n = list?.length ?? 0;
  useEffect(() => {
    if (n < 2 || reduced()) return;
    const period = (2 - Math.max(0, Math.min(1, wind)) * 1.05) * 1000;
    const id = window.setInterval(() => !document.hidden && setI((v) => (v + 1) % n), period / n);
    return () => window.clearInterval(id);
  }, [n, wind]);
  if (!list) return <>{children}</>;
  return <image className="ship-3d" href={list[i % n]} x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} preserveAspectRatio="xMidYMid meet" />;
}

/** The crew standing on deck, drawn over the ship's picture in the same box (nothing until it is there). */
export function CrewSprite({ look, crew, px }: { look: ShipLook; crew: Spec[]; px: number }) {
  const key = JSON.stringify([look, px]) + crew.length;
  const [url, setUrl] = useState<{ key: string; url: string } | null>(null);
  useEffect(() => {
    if (!crew.length) return;
    let gone = false;
    import("../three/deck.ts")
      .then((m) => m.crewPicture(look, crew, px))
      .then((u) => !gone && setUrl({ key, url: u }))
      .catch(() => undefined);
    return () => {
      gone = true;
    };
    // The look, the size and the crew (a new array only when it changed) stand for what is drawn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, crew]);
  if (!url || !crew.length) return null;
  return <image className="ship-crew" href={url.url} x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} preserveAspectRatio="xMidYMid meet" />;
}
