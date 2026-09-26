// A picture of a 3D model placed in an SVG (the sea chart): the drawing
// stays until the picture is there, and without WebGL.

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const made = new Map<string, string>();

export default function MapSprite({ id, draw, x, y, w, h, className, children }: { id: string; draw: () => Promise<string>; x: number; y: number; w: number; h: number; className?: string; children: ReactNode }) {
  const [url, setUrl] = useState(() => made.get(id) ?? null);
  useEffect(() => {
    const hit = made.get(id);
    if (hit) return setUrl(hit);
    let gone = false;
    draw()
      .then((u) => {
        made.set(id, u);
        if (!gone) setUrl(u);
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
    // The id stands for what is drawn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  if (!url) return <>{children}</>;
  return <image className={className} href={url} x={x} y={y} width={w} height={h} preserveAspectRatio="none" />;
}
