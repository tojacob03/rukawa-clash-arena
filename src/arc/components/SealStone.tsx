// A carved seal stone as a picture (three/hanko.ts). Until it is drawn, and
// without WebGL, the drawn seal (a vermilion square with the character) is
// shown; the picture is kept in the browser so the next visit starts with it.

import { useEffect, useState } from "react";

const KEY = "waza-arc.seal-v1";

function kept(glyph: string, px: number): string | null {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, string>;
    return all[`${glyph}|${px}`] ?? null;
  } catch {
    return null;
  }
}

function keep(glyph: string, px: number, url: string) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, string>;
    all[`${glyph}|${px}`] = url;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Storage full or blocked: the stone is drawn again next time.
  }
}

export default function SealStone({ glyph, px, className }: { glyph: string; px: number; className: string }) {
  const [url, setUrl] = useState(() => kept(glyph, px));
  useEffect(() => {
    if (url) return;
    let gone = false;
    const run = () =>
      import("../three/hanko.ts")
        .then((m) => m.sealPicture(glyph, px))
        .then((u) => {
          keep(glyph, px, u);
          if (!gone) setUrl(u);
        })
        .catch(() => undefined);
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => void run(), { timeout: 4000 });
    else setTimeout(() => void run(), 1500);
    return () => {
      gone = true;
    };
  }, [glyph, px, url]);
  return (
    <span className={`${className}${url ? " stone" : ""}`} aria-hidden="true">
      {url ? <img src={url} alt="" draggable={false} /> : glyph}
    </span>
  );
}
