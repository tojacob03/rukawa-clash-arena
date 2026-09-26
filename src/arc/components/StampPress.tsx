// A new stamp in the mat passport is pressed by a carved stone
// (three/stamp.ts), drawn over the print that sits just before it.

import { useEffect, useRef } from "react";

export default function StampPress({ ink, tilt, onTouch, onDone }: { ink: string; tilt: number; onTouch: () => void; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cb = useRef({ onTouch, onDone });
  cb.current = { onTouch, onDone };
  useEffect(() => {
    let stop: (() => void) | null = null;
    let gone = false;
    import("../three/stamp.ts")
      .then((m) => {
        if (gone || !ref.current) return;
        const c = ref.current;
        // The print's size (unturned) and its middle, in the stamp's box.
        const print = c.previousElementSibling;
        const box = c.parentElement?.getBoundingClientRect();
        const pr = print?.getBoundingClientRect();
        const width = print ? parseFloat(getComputedStyle(print).width) || 132 : 132;
        const x = pr && box ? pr.left + pr.width / 2 - box.left : width / 2;
        const y = pr && box ? pr.top + pr.height / 2 - box.top : 46;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        c.width = c.height = Math.round(width * m.FIT * dpr);
        Object.assign(c.style, { width: `${width * m.FIT}px`, height: `${width * m.FIT}px`, left: `${x}px`, top: `${y}px` });
        stop = m.pressStamp(c, ink, tilt, () => cb.current.onTouch(), () => cb.current.onDone());
      })
      .catch(() => {
        cb.current.onTouch();
        cb.current.onDone();
      });
    return () => {
      gone = true;
      stop?.();
    };
  }, [ink, tilt]);
  return <canvas ref={ref} className="stamp-press" aria-hidden="true" />;
}
