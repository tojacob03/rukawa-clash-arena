// What the garments and the skin of the 3D fighter show: patterns, patches
// and tattoos, drawn in the body frame by the components of the flat fighter.

import type { Attire, Look, Slot } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import { Patch, Pattern, Tattoo } from "../components/AvatarSvg.tsx";
import { frameTexture, toSvg } from "./textures.tsx";

type Gear = Partial<Record<Slot, ItemDef | undefined>>;

const cx = 120;
const ink = "#1f2a44";
const full = { x: 24, y: 124, w: 192, h: 192 };

function patches(gear: Gear, low?: number) {
  return (
    <>
      <Patch item={gear.patch1} x={cx - 57} y={170} w={20} h={13} rot={16} uid="p1" />
      <Patch item={gear.patch2} x={cx + 13} y={169} w={20} h={13} rot={-4} uid="p2" />
      {low !== undefined ? <Patch item={gear.patch3} x={cx - 27} y={low} w={16} h={11} rot={-6} uid="p3" /> : null}
    </>
  );
}

const fill = (c: string) => <rect x={full.x} y={full.y} width={full.w} height={full.h} fill={c} />;

/** Skin with the arm and neck tattoos. The arms run from shoulder to wrist as in tools/fighter/body.py. */
export function bodyTexture(look: Look, skin: string) {
  const arms: JSX.Element[] = [];
  if (look.tattoo) {
    for (const s of [-1, 1] as const) {
      if (!(look.tattooSide === 2 || (look.tattooSide === 0 ? s === -1 : s === 1))) continue;
      const [x0, y0] = toSvg(0.285 * s, 1.0);
      const [x1, y1] = toSvg(0.418 * s, 0.578);
      const deg = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
      const len = Math.hypot(x1 - x0, y1 - y0);
      arms.push(
        <g key={s} transform={`translate(${x0} ${y0}) rotate(${deg})`}>
          <Tattoo kind={look.tattoo} from={6} to={len + 4} hw={13} />
        </g>,
      );
    }
  }
  return frameTexture(
    <>
      {fill(skin)}
      {arms}
      {look.neckTattoo ? <path d={`M${cx + 3} 134 q4 3 2 7 q-3 4 1 8 M${cx + 7} 132 l2 4`} fill="none" stroke={ink} strokeWidth={1.6} opacity={0.8} /> : null}
    </>,
  );
}

export function giTexture(gear: Gear) {
  const c = gear.gi?.art.c ?? "#f4f1ea";
  return frameTexture(
    <>
      {fill(c)}
      {patches(gear, 252)}
    </>,
  );
}

export function topTexture(gear: Gear, beltColor: string) {
  const top = gear.top?.art ?? { pattern: "rank" as const };
  const c = top.pattern === "rank" ? beltColor : top.c ?? "#1d1d26";
  const c2 = top.pattern === "rank" ? "#15151a" : top.c2 ?? "#34406b";
  return frameTexture(
    <>
      {fill(c)}
      {top.pattern === "rank" ? (
        <g fill={c2}>
          <rect x={cx - 54} y={124} width={17} height={130} />
          <rect x={cx + 37} y={124} width={17} height={130} />
        </g>
      ) : (
        <Pattern kind={top.pattern ?? "solid"} c2={c2} x={40} y={130} w={160} h={110} />
      )}
      {patches(gear)}
    </>,
  );
}

export function bottomTexture(gear: Gear, mode: Attire) {
  const art = gear.bottom?.art ?? { c: "#1d1d26", style: "shorts" };
  const c = art.c ?? "#1d1d26";
  return frameTexture(
    <>
      {fill(c)}
      {art.pattern && art.pattern !== "solid" ? <Pattern kind={art.pattern} c2={art.c2 ?? "#9cc3ff"} x={cx - 48} y={200} w={96} h={62} /> : null}
      {mode !== "gi" ? <Patch item={gear.patch3} x={cx - 27} y={238} w={16} h={11} rot={-6} uid="p3" /> : null}
    </>,
  );
}

export function spatsTexture(gear: Gear) {
  const art = gear.bottom?.art ?? { c: "#1d1d26", style: "spats" };
  const combo = art.style === "combo";
  const c = combo ? art.c3 ?? "#1d1d26" : art.c ?? "#1d1d26";
  return frameTexture(
    <>
      {fill(c)}
      {!combo && art.pattern && art.pattern !== "solid" ? <Pattern kind={art.pattern} c2={art.c2 ?? "#9cc3ff"} x={cx - 42} y={205} w={84} h={92} /> : null}
      {!combo ? <Patch item={gear.patch3} x={cx - 27} y={238} w={16} h={11} rot={-6} uid="p3" /> : null}
    </>,
  );
}
