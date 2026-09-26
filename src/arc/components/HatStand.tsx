// The hats of the mat passport on a turning stand: one at a time, a drag
// turns it, the arrows (or the arrow keys) go through the collection.

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ItemDef } from "../core/items.ts";
import { COUNTRY } from "../core/countries.ts";
import type { Mounted } from "./Scene3D.tsx";

type Stand = Mounted & { turn: (rad: number) => void };

export default function HatStand({ hats }: { hats: { code: string; item: ItemDef }[] }) {
  const [i, setI] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLCanvasElement>(null);
  const stand = useRef<Stand | null>(null);
  const drag = useRef<{ x: number; turn: number } | null>(null);
  const turn = useRef(0);
  const n = hats.length;
  const cur = hats[((i % n) + n) % n];

  useEffect(() => {
    let gone = false;
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(c.clientWidth * dpr) || 560;
    c.height = Math.round(c.width * 0.8);
    import("../three/hatStand.ts")
      .then((m) => m.mountHatStand(c, { item: cur?.item ?? null }, () => !gone && setReady(true)))
      .then((s) => {
        if (gone) return s.stop();
        stand.current = s;
      })
      .catch(() => !gone && setFailed(true));
    return () => {
      gone = true;
      stand.current?.stop();
      stand.current = null;
    };
    // The stand is built once; the hat changes below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    void stand.current?.set({ item: cur?.item ?? null } as never);
  }, [cur?.item]);

  if (failed || !cur) return null;
  const step = (d: number) => setI((v) => v + d);
  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: e.clientX, turn: turn.current };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    turn.current = drag.current.turn + ((e.clientX - drag.current.x) / e.currentTarget.clientWidth) * Math.PI * 2;
    stand.current?.turn(turn.current);
  };
  return (
    <figure className="hat-stand">
      <canvas
        ref={ref}
        className={`scene3d${ready ? " ready" : ""}`}
        role="img"
        aria-label={`${cur.item.name}, ${COUNTRY[cur.code]?.name ?? cur.code}, auf dem Hutständer`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      />
      {n > 1 ? (
        <div className="hs-nav">
          <button type="button" className="btn ghost small" aria-label="Vorheriger Hut" onClick={() => step(-1)}>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <figcaption aria-live="polite">
            <b>{cur.item.name}</b>
            <small>
              {COUNTRY[cur.code]?.name}, {((i % n) + n) % n + 1} von {n}
            </small>
          </figcaption>
          <button type="button" className="btn ghost small" aria-label="Nächster Hut" onClick={() => step(1)}>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <figcaption>
          <b>{cur.item.name}</b>
          <small>{COUNTRY[cur.code]?.name}</small>
        </figcaption>
      )}
    </figure>
  );
}
