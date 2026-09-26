// The flat SVG fighter: the fallback when WebGL is missing, and the source of
// the patterns, patches and tattoos the 3D fighter wears as textures
// (fighter3d/textures.ts).

import { useId } from "react";
import type { ReactNode } from "react";
import type { Attire, Belt, Look, Slot } from "../core/types.ts";
import type { ItemDef, PatternKind } from "../core/items.ts";
import { BELT } from "../format.ts";
import { EYE_COLORS, HAIR_COLORS, eyeOf, hairOf, normalizeLook, shade, skinOf } from "../avatarOptions.ts";
import { FlagIn } from "./Flag.tsx";
import Headwear from "./Headwear.tsx";
import { bodyOf } from "../core/body.ts";
import type { Body } from "../core/body.ts";

const OL = "#1c1526";
const CX = 120;
const INK = "#1f2a44";

export interface AvatarProps {
  look: Partial<Look>;
  mode: Attire;
  gear: Partial<Record<Slot, ItemDef | undefined>>;
  belt: Belt;
  stripes: number;
  weightKg?: number;
  heightCm?: number;
  /** Height and build from someone else's card; wins over height and weight. */
  body?: Body | null;
  size?: number;
  label?: string;
  still?: boolean;
  /** "head" shows only the head, for option thumbnails. */
  crop?: "full" | "head" | "face";
}

const FACE_W = [46, 48, 46, 46, 43, 51];
/** Hair, beards and headgear are drawn for a head 46 wide on each side; wider heads stretch them so the skull never shows past the hair. */
const HAIR_BASE_W = 46;

export default function AvatarSvg({ look: raw, mode, gear, belt, stripes, weightKg, heightCm, body, size = 240, label, still, crop = "full" }: AvatarProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const look = normalizeLook(raw);
  const head = crop !== "full";
  // Height and build from the body you entered; the height slider only counts without a height.
  const fig = body ?? bodyOf(heightCm, weightKg);
  const b = fig.b * (1 + 0.07 * clamp(look.build, -2, 2));
  const m = clamp(look.muscle, 0, 3);
  const lf = body || heightCm ? fig.h : 1 + 0.08 * clamp(look.height, -2, 2);
  const lift = head ? 0 : -72 * (lf - 1);
  const skin = skinOf(look);
  const skinD = shade(skin, -0.18);
  const hair = hairOf(look);
  const hairD = shade(hair, -0.35);
  const tips = look.hairTips >= 0 ? HAIR_COLORS[look.hairTips] : null;
  const hairFill = tips ? `url(#hg${uid})` : hair;
  const eye = eyeOf(look);
  const eye2 = look.eyeColor2 >= 0 ? EYE_COLORS[look.eyeColor2] ?? eye : eye;
  const gi = gear.gi?.art ?? { c: "#f4f1ea", lapel: "#e2d9c6" };
  const top = gear.top?.art ?? { pattern: "rank" as const };
  const bottom = gear.bottom?.art ?? { c: "#1d1d26", style: "shorts" };
  const beltC = BELT[belt];
  const topC = top.pattern === "rank" ? beltC.color : top.c ?? "#1d1d26";
  const topC2 = top.pattern === "rank" ? "#15151a" : top.c2 ?? "#34406b";
  const sleeveLen = mode === "gi" ? "long" : top.sleeve ?? "long";
  const sleeveC = mode === "gi" ? gi.c ?? "#f4f1ea" : topC;
  const extra = gear.extra?.art.style;
  const trait = gear.trait?.art.style;
  const halfW = FACE_W[look.faceShape] ?? 46;
  const fit = halfW > HAIR_BASE_W ? `translate(${CX} 0) scale(${halfW / HAIR_BASE_W} 1) translate(${-CX} 0)` : undefined;
  const marks = new Set(look.marks);

  // Torso outline, shared by clothing and pattern clip.
  const sh = 40 + 1.5 * m;
  const torso = `M${CX - sh * b} 150 Q${CX} 141 ${CX + sh * b} 150 Q${CX + (sh + 8) * b} 154 ${CX + (sh + 6) * b} 172 L${CX + 38 * b} 233 L${CX - 38 * b} 233 L${CX - (sh + 6) * b} 172 Q${CX - (sh + 8) * b} 154 ${CX - sh * b} 150 Z`;

  const box = crop === "face" ? [80, 74, 80, 64] : crop === "head" ? [58, 16, 124, 136] : [0, 0, 240, 320];
  const viewBox = box.join(" ");
  const w = size;
  const h = (size * box[3]) / box[2];

  return (
    <svg className={`avatar${head ? " crop" : still ? "" : " alive"}`} width={w} height={h} viewBox={viewBox} role="img" aria-label={label ?? "Dein Charakter"}>
      <defs>
        {gear.aura ? (
          <radialGradient id={`glow${uid}`} cx="50%" cy="52%" r="50%">
            <stop offset="0" stopColor={gear.aura.art.c ?? "#5f90ea"} stopOpacity={0.55} />
            <stop offset="1" stopColor={gear.aura.art.c ?? "#5f90ea"} stopOpacity="0" />
          </radialGradient>
        ) : null}
        {tips ? (
          <linearGradient id={`hg${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hair} />
            <stop offset="0.55" stopColor={hair} />
            <stop offset="1" stopColor={tips} />
          </linearGradient>
        ) : null}
        <clipPath id={`torso${uid}`}>
          <path d={torso} />
        </clipPath>
        <clipPath id={`skull${uid}`}>
          <HeadShape shape={look.faceShape} skin={skin} />
        </clipPath>
      </defs>

      {head || !gear.aura ? null : <Aura id={gear.aura.id} color={gear.aura.art.c} glow={`url(#glow${uid})`} />}
      {head ? null : <ellipse cx={CX} cy={304} rx={62 * b} ry={8} fill="#000" opacity={0.35} />}

      <g className="avatar-body">
        <g transform={`translate(0 ${lift})`}>
          <g transform={fit}>
            <BackHair style={look.hair} fill={hairFill} hairD={hairD} />
          </g>

          {/* Legs */}
          <g transform={`translate(0 226) scale(1 ${lf}) translate(0 -226)`}>
            {mode === "gi" ? <GiPants b={b} c={gi.c ?? "#f4f1ea"} skin={skin} /> : <NoGiLegs b={b} art={bottom} skin={skin} knee={extra === "knee"} uid={uid} />}
          </g>

          {/* Neck */}
          <rect x={CX - 10} y={126} width={20} height={26} fill={skinD} stroke={OL} strokeWidth={2.2} />
          {look.neckTattoo ? <path d={`M${CX + 3} 134 q4 3 2 7 q-3 4 1 8 M${CX + 7} 132 l2 4`} fill="none" stroke={INK} strokeWidth={1.6} opacity={0.8} /> : null}

          {/* Torso */}
          {mode === "gi" ? (
            <GiTop torso={torso} b={b} art={gi} skin={skin} />
          ) : (
            <g>
              <path d={torso} fill={topC} stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
              <g clipPath={`url(#torso${uid})`}>
                {top.pattern === "rank" ? (
                  <g fill={topC2}>
                    <rect x={CX - 52 * b} y={140} width={16 * b} height={100} />
                    <rect x={CX + 36 * b} y={140} width={16 * b} height={100} />
                  </g>
                ) : (
                  <Pattern kind={top.pattern ?? "solid"} c2={topC2} x={CX - 62} y={140} w={124} h={96} />
                )}
              </g>
              <path d={torso} fill="none" stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
              <path d={`M${CX - 12} 148 Q${CX} 158 ${CX + 12} 148`} fill="none" stroke={shade(topC, -0.35)} strokeWidth={3} strokeLinecap="round" />
            </g>
          )}

          {/* Arms */}
          {([-1, 1] as const).map((s) => (
            <Arm
              key={s}
              s={s}
              b={b}
              m={m}
              skin={skin}
              sleeve={sleeveLen}
              sleeveC={sleeveC}
              cuff={mode === "gi" ? gi.lapel ?? shade(sleeveC, -0.1) : shade(sleeveC, -0.3)}
              tattoo={look.tattoo && (look.tattooSide === 2 || (look.tattooSide === 0 ? s === -1 : s === 1)) ? look.tattoo : 0}
              tape={extra === "tape"}
              uid={uid}
            />
          ))}

          {/* Belt (only with the gi) */}
          {mode === "gi" ? <BeltKnot b={b} color={beltC.color} bar={beltC.bar} stripes={stripes} /> : null}

          {/* Patches */}
          <Patch item={gear.patch1} x={CX - 57 * b} y={170} w={20} h={13} rot={16} uid={uid + "p1"} />
          <Patch item={gear.patch2} x={CX + 13} y={169} w={20} h={13} rot={-4} uid={uid + "p2"} />
          <g transform={`translate(0 226) scale(1 ${lf}) translate(0 -226)`}>
            <Patch item={gear.patch3} x={CX - 27 * b} y={mode === "gi" ? 252 : 238} w={16} h={11} rot={-6} uid={uid + "p3"} />
          </g>

          {extra === "towel" ? <Towel b={b} c={gear.extra?.art.c ?? "#6fb3c9"} /> : null}
          {extra === "medal" ? <Medal c={gear.extra?.art.c ?? "#f1bf57"} /> : null}

          {/* Head */}
          <Ears shape={look.ears} halfW={halfW} skin={skin} cauli={trait === "ear"} earring={look.earring} />
          <HeadShape shape={look.faceShape} skin={skin} />
          <Marks marks={marks} skin={skin} layer="under" />
          <g transform={fit}>
            <Beard kind={look.beard} fill={hairFill} hair={hair} />
          </g>
          <Eyes look={look} eye={eye} eye2={eye2} skin={skin} uid={uid} />
          <Brows kind={look.brows} color={look.hair === 7 ? shade(hair, -0.2) : hairD} gap={look.eyeGap} />
          <Nose kind={look.nose} skin={skin} />
          <Mouth kind={look.mouth} />
          <Marks marks={marks} skin={skin} layer="over" />
          {trait === "scar" ? <path d={`M${CX + 30} 80 L${CX + 38} 92 M${CX + 34} 80 L${CX + 42} 92`} stroke="#b0525a" strokeWidth={2} strokeLinecap="round" opacity={0.8} /> : null}
          <g clipPath={`url(#skull${uid})`}>
            <g transform={fit}>
              <HairCap style={look.hair} fill={hairFill} />
            </g>
          </g>
          <g transform={fit}>
            <FrontHair style={look.hair} fill={hairFill} hair={hair} hairD={hairD} />
            <Headgear art={gear.head?.art} uid={uid} />
          </g>
        </g>
      </g>
    </svg>
  );
}

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, Number.isFinite(x) ? x : 0));

/* ── Aura ──────────────────────────────────────────────────────────────── */

function Aura({ id, color, glow }: { id?: string; color?: string; glow: string }) {
  const c = color ?? "#5f90ea";
  let fx: ReactNode = null;
  if (id === "au_blau") {
    fx = (
      <g className="fx-flicker" fill={c} opacity={0.7}>
        {[-70, -48, 48, 70].map((dx, i) => (
          <path key={i} d={`M${CX + dx} 300 Q${CX + dx - 14} 250 ${CX + dx + (dx < 0 ? -4 : 4)} ${210 - (i % 2) * 30} Q${CX + dx + 14} 250 ${CX + dx} 300 Z`} />
        ))}
      </g>
    );
  } else if (id === "au_gold") {
    fx = (
      <g className="fx-spin" style={{ transformOrigin: "120px 165px" }} fill={c} opacity={0.35}>
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i * 22.5 * Math.PI) / 180;
          const x1 = CX + Math.cos(a - 0.05) * 150;
          const y1 = 165 + Math.sin(a - 0.05) * 150;
          const x2 = CX + Math.cos(a + 0.05) * 150;
          const y2 = 165 + Math.sin(a + 0.05) * 150;
          return <polygon key={i} points={`${CX},165 ${x1},${y1} ${x2},${y2}`} />;
        })}
      </g>
    );
  } else if (id === "au_sakura") {
    fx = (
      <g fill={c}>
        {Array.from({ length: 16 }, (_, i) => (
          <ellipse key={i} className="fx-fall" style={{ animationDelay: `${(i * 0.37) % 4}s` }} cx={20 + ((i * 53) % 200)} cy={20 + ((i * 97) % 260)} rx={5} ry={3} transform={`rotate(${i * 40} ${20 + ((i * 53) % 200)} ${20 + ((i * 97) % 260)})`} opacity={0.8} />
        ))}
      </g>
    );
  } else if (id === "au_sterne") {
    fx = (
      <g fill={c}>
        {Array.from({ length: 18 }, (_, i) => {
          const x = 16 + ((i * 61) % 208);
          const y = 16 + ((i * 89) % 280);
          return <path key={i} className="fx-twinkle" style={{ animationDelay: `${(i * 0.29) % 3}s` }} d={`M${x} ${y - 5}L${x + 1.4} ${y - 1.4}L${x + 5} ${y}L${x + 1.4} ${y + 1.4}L${x} ${y + 5}L${x - 1.4} ${y + 1.4}L${x - 5} ${y}L${x - 1.4} ${y - 1.4}Z`} />;
        })}
      </g>
    );
  } else if (id === "au_donner") {
    fx = (
      <g className="fx-flash" fill="none" stroke={c} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
        <path d="M30 60 L50 110 L36 112 L58 170" />
        <path d="M210 70 L188 118 L204 120 L180 182" />
        <path d="M24 200 L40 236 L28 238 L44 280" opacity={0.6} />
      </g>
    );
  } else if (id === "au_gischt") {
    fx = (
      <g className="fx-flicker" fill="none" stroke={c} strokeWidth={3} strokeLinecap="round" opacity={0.7}>
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${20 + i * 8} ${300 - i * 8} Q60 ${250 - i * 20} 120 ${270 - i * 12} T${220 - i * 8} ${300 - i * 8}`} />
        ))}
      </g>
    );
  }
  return (
    <g aria-hidden="true">
      <ellipse cx={CX} cy={168} rx={118} ry={150} fill={glow} />
      {fx}
    </g>
  );
}

/* ── Head ──────────────────────────────────────────────────────────────── */

function HeadShape({ shape, skin }: { shape: number; skin: string }) {
  const p = { fill: skin, stroke: OL, strokeWidth: 2.6, strokeLinejoin: "round" as const };
  switch (shape) {
    case 1:
      return <ellipse cx={CX} cy={97} rx={48} ry={46} {...p} />;
    case 2:
      return <path {...p} d="M74 94 Q73 48 120 47 Q167 48 166 94 L165 116 Q162 136 142 143 L98 143 Q78 136 75 116 Z" />;
    case 3:
      return <path {...p} d="M74 90 Q72 48 120 48 Q168 48 166 90 Q165 120 142 136 Q128 146 120 147 Q112 146 98 136 Q75 120 74 90 Z" />;
    case 4:
      return <ellipse cx={CX} cy={97} rx={43} ry={51} {...p} />;
    case 5:
      return <ellipse cx={CX} cy={97} rx={51} ry={46} {...p} />;
    default:
      return <ellipse cx={CX} cy={96} rx={46} ry={48} {...p} />;
  }
}

function Ears({ shape, halfW, skin, cauli, earring }: { shape: number; halfW: number; skin: string; cauli: boolean; earring: number }) {
  const inner = shade(skin, -0.22);
  const one = (x: number, side: -1 | 1) => {
    const lobeY = shape === 1 ? 109 : 112;
    let ear: ReactNode;
    if (shape === 3) {
      ear = <path d={`M${x - side * 3} 94 L${x + side * 16} 76 L${x + side * 7} 110 Q${x} 116 ${x - side * 3} 108 Z`} fill={skin} stroke={OL} strokeWidth={2.2} strokeLinejoin="round" />;
    } else {
      const rx = [8, 6, 11][shape] ?? 8;
      const ry = [11, 8, 13][shape] ?? 11;
      ear = <ellipse cx={x + (shape === 2 ? side * 3 : 0)} cy={102} rx={rx} ry={ry} fill={skin} stroke={OL} strokeWidth={2.2} transform={shape === 2 ? `rotate(${side * 14} ${x} 102)` : undefined} />;
    }
    return (
      <g key={side}>
        {ear}
        {shape !== 3 ? <path d={`M${x + side * 2} 96 Q${x + side * 5} 102 ${x + side * 2} 108`} fill="none" stroke={inner} strokeWidth={1.6} /> : null}
        {earring === 1 || earring === 2 || (earring === 3 && side === -1) ? (
          earring === 1 ? (
            <circle cx={x + side * 1} cy={lobeY} r={1.9} fill="#f1bf57" stroke={OL} strokeWidth={0.8} />
          ) : (
            <circle cx={x + side * 1} cy={lobeY + 3} r={3.4} fill="none" stroke="#f1bf57" strokeWidth={1.5} />
          )
        ) : null}
      </g>
    );
  };
  const xl = CX - halfW + 1;
  const xr = CX + halfW - 1;
  return (
    <g>
      {cauli ? (
        <g>
          {[
            [xl - 1, 94, 8],
            [xl - 3, 104, 8],
            [xl + 1, 110, 6.5],
            [xl - 1, 99, 6],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={shade(skin, -0.12)} stroke={OL} strokeWidth={2} />
          ))}
          <path d={`M${xl - 4} 98 Q${xl} 102 ${xl - 3} 106`} fill="none" stroke="#a0606e" strokeWidth={1.4} />
        </g>
      ) : (
        one(xl, -1)
      )}
      {one(xr, 1)}
    </g>
  );
}

function Eyes({ look, eye, eye2, skin, uid }: { look: Look; eye: string; eye2: string; skin: string; uid: string }) {
  const s = 1 + 0.08 * clamp(look.eyeSize, -2, 2);
  const gap = 2.6 * clamp(look.eyeGap, -2, 2);
  return (
    <g>
      <g transform={`translate(${101 - gap} 104) scale(${s})`}>
        <Eye shape={look.eyeShape} color={eye} skin={skin} lashes={look.lashes} id={`${uid}l`} />
      </g>
      <g transform={`translate(${139 + gap} 104) scale(${-s} ${s})`}>
        <Eye shape={look.eyeShape} color={eye2} skin={skin} lashes={look.lashes} id={`${uid}r`} />
      </g>
    </g>
  );
}

/** One eye in local coordinates around (0, 0), drawn as the viewer's left eye. */
function Eye({ shape, color, skin, lashes, id }: { shape: number; color: string; skin: string; lashes: number; id: string }) {
  const lash =
    lashes > 0 ? (
      <path d={lashes === 2 ? "M-12 -4 L-18 -8 M-10 -8 L-15 -13 M-6 -10 L-9 -15" : "M-12 -4 L-16 -7 M-9 -8 L-12 -11"} stroke={OL} strokeWidth={1.8} strokeLinecap="round" />
    ) : null;
  const iris = (cx: number, cy: number, rx: number, ry: number) => (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} />
      <ellipse cx={cx} cy={cy + ry * 0.35} rx={rx * 0.8} ry={ry * 0.5} fill={shade(color, 0.25)} opacity={0.45} />
      <ellipse cx={cx} cy={cy + 0.5} rx={rx * 0.44} ry={ry * 0.48} fill={OL} />
      <circle cx={cx - rx * 0.4} cy={cy - ry * 0.35} r={Math.max(1.4, rx * 0.34)} fill="#fff" />
    </>
  );
  switch (shape) {
    case 0:
      return (
        <g>
          <ellipse cx={0} cy={0} rx={11} ry={13} fill="#fff" stroke={OL} strokeWidth={1.6} />
          {iris(0, 2, 8, 10.5)}
          <circle cx={3} cy={6} r={1.6} fill="#fff" />
          <path d="M-12 -6 Q0 -18 12 -6" fill="none" stroke={OL} strokeWidth={3.2} strokeLinecap="round" />
          {lash}
        </g>
      );
    case 1:
    case 2: {
      const d = shape === 1 ? "M-12 1 Q-2 -10 12 -2 Q2 10 -12 1 Z" : "M-12 1 Q0 -5 12 0 Q0 5 -12 1 Z";
      return (
        <g>
          <clipPath id={`e${id}`}>
            <path d={d} />
          </clipPath>
          <path d={d} fill="#fff" stroke={OL} strokeWidth={1.4} />
          <g clipPath={`url(#e${id})`}>{iris(1, 0, shape === 1 ? 6.5 : 5, shape === 1 ? 7 : 5.5)}</g>
          <path d={shape === 1 ? "M-13 1 Q-2 -11 13 -3" : "M-13 1 Q0 -6 13 -1"} fill="none" stroke={OL} strokeWidth={3.2} strokeLinecap="round" />
          {lash}
        </g>
      );
    }
    case 4:
      return (
        <g>
          <ellipse cx={0} cy={0} rx={11} ry={13} fill="#fff" stroke={OL} strokeWidth={1.6} />
          {iris(0, 2, 8, 10.5)}
          <path d="M-13 -16 L13 -16 L13 0 Q0 3 -13 0 Z" fill={skin} stroke={OL} strokeWidth={1.4} />
          <path d="M-12 0 Q0 3 12 0" fill="none" stroke={OL} strokeWidth={3.2} strokeLinecap="round" />
          {lash}
        </g>
      );
    case 5:
      return (
        <g>
          <path d="M-10 3 Q0 -8 10 3" fill="none" stroke={OL} strokeWidth={3.4} strokeLinecap="round" />
          {lash}
        </g>
      );
    case 6:
      return (
        <g>
          <ellipse cx={0} cy={2} rx={3.4} ry={4.6} fill={OL} />
          <circle cx={-1} cy={0.4} r={1.1} fill="#fff" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M-12 0 Q-2 -11 12 -4 Q2 12 -12 0 Z" fill="#fff" stroke={OL} strokeWidth={1.6} />
          {iris(1, 1, 6.5, 7.5)}
          <path d="M-13 0 Q-2 -13 13 -5" fill="none" stroke={OL} strokeWidth={3.4} strokeLinecap="round" />
          {lash}
        </g>
      );
  }
}

function Brows({ kind, color, gap }: { kind: number; color: string; gap: number }) {
  const g = 2.6 * clamp(gap, -2, 2);
  const shapes: Record<number, ReactNode> = {
    0: <path d="M-12 1 L11 1" stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />,
    1: <path d="M-12 3 Q0 -5 11 1" stroke={color} strokeWidth={3.6} strokeLinecap="round" fill="none" />,
    2: <path d="M-13 3 Q-1 -6 12 0 L11 5 Q0 1 -12 7 Z" fill={color} />,
    3: <path d="M-11 2 Q0 -3 10 1" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />,
    4: <path d="M-13 -2 L11 5" stroke={color} strokeWidth={4.2} strokeLinecap="round" fill="none" />,
    5: <path d="M-13 5 L11 -2" stroke={color} strokeWidth={3.6} strokeLinecap="round" fill="none" />,
    6: <path d="M-13 1 L-3 1 M1 1 L11 1" stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />,
  };
  const one = shapes[kind] ?? shapes[0];
  return (
    <g>
      <g transform={`translate(${100 - g} 86)`}>{one}</g>
      <g transform={`translate(${140 + g} 86) scale(-1 1)`}>{one}</g>
    </g>
  );
}

function Nose({ kind, skin }: { kind: number; skin: string }) {
  const c = shade(skin, -0.32);
  const p = { stroke: c, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  switch (kind) {
    case 1:
      return <path {...p} d="M121 106 L116 116 L121 117" />;
    case 2:
      return <path {...p} d="M115 116 Q120 119 125 116 M114 112 Q112 117 116 117 M126 112 Q128 117 124 117" strokeWidth={1.8} />;
    case 3:
      return <path {...p} d="M119 100 Q127 110 121 117 L117 116" />;
    case 4:
      return (
        <g>
          <path {...p} d="M117 115 Q120 118 123 115" strokeWidth={1.8} />
          <circle cx={118} cy={114} r={0.9} fill={c} />
          <circle cx={122} cy={114} r={0.9} fill={c} />
        </g>
      );
    case 5:
      return <path {...p} d="M120 103 L123 108 L118 112 L122 117 L117 117" strokeWidth={2.2} />;
    case 6:
      return <path d="M119 112 L122 116 L117.5 116 Z" fill={c} opacity={0.6} />;
    default:
      return <path {...p} d="M120 110 L118 116" />;
  }
}

function Mouth({ kind }: { kind: number }) {
  const line = { fill: "none", stroke: OL, strokeWidth: 2.6, strokeLinecap: "round" as const };
  switch (kind) {
    case 0:
      return <path {...line} d="M113 124 L127 124" />;
    case 1:
      return <path d="M111 121 Q120 131 129 121 Q120 124 111 121 Z" fill="#9b3242" stroke={OL} strokeWidth={2.2} strokeLinejoin="round" />;
    case 3:
      return <path {...line} d="M110 127 Q112 124 120 124 Q128 124 130 127" />;
    case 4:
      return (
        <g>
          <path d="M111 120 Q120 116 129 120 Q128 134 120 135 Q112 134 111 120 Z" fill="#7a2233" stroke={OL} strokeWidth={2} strokeLinejoin="round" />
          <path d="M113 121 Q120 119 127 121 L126 123 Q120 122 114 123 Z" fill="#fff" />
          <ellipse cx={120} cy={131} rx={4} ry={2} fill="#d86a7a" />
        </g>
      );
    case 5:
    case 6: {
      const fill = kind === 6 ? "#2f7de1" : "#fff";
      return (
        <g>
          <path d="M110 120 Q120 124 130 120 Q128 132 120 132 Q112 132 110 120 Z" fill={fill} stroke={OL} strokeWidth={2} strokeLinejoin="round" />
          <path d="M111 124.5 Q120 127.5 129 124.5" fill="none" stroke={kind === 6 ? "#9cc3ff" : "#c9c4cf"} strokeWidth={1.2} />
          {kind === 5 ? <path d="M116 122 V129 M120 122.5 V130 M124 122 V129" stroke="#d8d3dc" strokeWidth={0.8} /> : null}
        </g>
      );
    }
    case 7:
      return (
        <g>
          <path d="M117 124 Q117 131 121 131 Q124 130 123 124 Z" fill="#e07a8a" stroke={OL} strokeWidth={1.4} />
          <path {...line} d="M112 123 Q120 127 128 123" />
        </g>
      );
    default:
      return <path {...line} d="M113 124 Q121 127 128 121" />;
  }
}

function Marks({ marks, skin, layer }: { marks: Set<string>; skin: string; layer: "under" | "over" }) {
  const dark = shade(skin, -0.35);
  if (layer === "under") {
    return (
      <g>
        {marks.has("blush") ? (
          <g fill="#ff7a8a" opacity={0.32}>
            <ellipse cx={93} cy={115} rx={7} ry={3.5} />
            <ellipse cx={147} cy={115} rx={7} ry={3.5} />
          </g>
        ) : null}
        {marks.has("freckles") ? (
          <g fill={dark} opacity={0.55}>
            {[
              [106, 112],
              [110, 115],
              [104, 116],
              [134, 112],
              [130, 115],
              [136, 116],
              [115, 110],
              [125, 110],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={0.9} />
            ))}
          </g>
        ) : null}
        {marks.has("bags") ? <path d="M92 117 Q101 121 110 117 M130 117 Q139 121 148 117" fill="none" stroke={dark} strokeWidth={1.4} opacity={0.6} /> : null}
        {marks.has("paint") ? (
          <g stroke="#1c1526" strokeWidth={2.4} strokeLinecap="round" opacity={0.75}>
            <path d="M89 119 L108 121 M91 124 L106 125" />
            <path d="M151 119 L132 121 M149 124 L134 125" />
          </g>
        ) : null}
        {marks.has("matburn") ? <ellipse cx={150} cy={106} rx={6} ry={3.2} fill="#d8646a" opacity={0.55} transform="rotate(-20 150 106)" /> : null}
        {marks.has("mole") ? <circle cx={136} cy={127} r={1.3} fill="#4a2f22" /> : null}
        {marks.has("scarCheek") ? <path d="M139 112 L152 121 M142 112 L140 116 M146 115 L144 119 M150 118 L148 122" fill="none" stroke="#b0525a" strokeWidth={1.6} strokeLinecap="round" opacity={0.85} /> : null}
      </g>
    );
  }
  return (
    <g>
      {marks.has("scarEye") ? <path d="M97 88 L104 124" stroke="#b0525a" strokeWidth={2} strokeLinecap="round" opacity={0.85} /> : null}
      {marks.has("bandage") ? (
        <g transform="rotate(-8 120 109)">
          <rect x={110} y={106} width={20} height={6} rx={1.5} fill="#f1d7b5" stroke={OL} strokeWidth={1} />
          <rect x={117} y={106.5} width={6} height={5} fill="#e7c49a" />
        </g>
      ) : null}
    </g>
  );
}

function Beard({ kind, fill, hair }: { kind: number; fill: string; hair: string }) {
  const p = { fill, stroke: OL, strokeWidth: 2.2, strokeLinejoin: "round" as const };
  switch (kind) {
    case 1:
      return <path d="M78 110 Q84 138 120 144 Q156 138 162 110 Q150 132 120 134 Q90 132 78 110 Z" fill={hair} opacity={0.28} />;
    case 2:
      return <path {...p} d="M76 104 Q80 146 120 150 Q160 146 164 104 Q156 124 140 128 Q130 120 120 122 Q110 120 100 128 Q84 124 76 104 Z" />;
    case 3:
      return <path {...p} d="M106 133 Q120 152 134 133 Q120 139 106 133 Z" />;
    case 4:
      return <path {...p} d="M106 121 Q113 114 120 118 Q127 114 134 121 Q127 122 120 121 Q113 122 106 121 Z" strokeWidth={1.6} />;
    case 5:
      return (
        <g>
          <path {...p} d="M107 121 Q113 115 120 118 Q127 115 133 121 Q127 122 120 121 Q113 122 107 121 Z" strokeWidth={1.6} />
          <path {...p} d="M111 131 Q120 146 129 131 Q120 135 111 131 Z" />
        </g>
      );
    case 6:
      return <path {...p} d="M77 106 Q80 150 104 168 Q120 180 136 168 Q160 150 163 106 Q154 128 140 130 Q130 122 120 124 Q110 122 100 130 Q86 128 77 106 Z" />;
    case 7:
      return (
        <g fill={fill}>
          <path d="M76 94 L84 94 L84 124 Q79 124 77 116 Z" stroke={OL} strokeWidth={1.4} />
          <path d="M164 94 L156 94 L156 124 Q161 124 163 116 Z" stroke={OL} strokeWidth={1.4} />
        </g>
      );
    default:
      return null;
  }
}

/* ── Hair ──────────────────────────────────────────────────────────────── */

function BackHair({ style, fill, hairD }: { style: number; fill: string; hairD: string }) {
  const p = { fill, stroke: OL, strokeWidth: 2.4, strokeLinejoin: "round" as const };
  switch (style) {
    case 3:
      return (
        <g>
          <circle cx={CX} cy={44} r={15} {...p} />
          <path d="M108 50 Q120 56 132 50" fill="none" stroke={hairD} strokeWidth={3} />
        </g>
      );
    case 4:
      return <path {...p} d="M150 58 Q194 70 186 124 Q182 144 168 150 Q176 116 158 84 Z" />;
    case 5:
      return <path {...p} d="M72 88 Q62 150 78 176 L162 176 Q178 150 168 88 Z" />;
    case 10:
    case 21:
      return <path {...p} d="M72 90 Q66 138 82 146 L158 146 Q174 138 168 90 Z" />;
    case 12:
      return (
        <g>
          {[104, 114, 126, 136].map((x) => (
            <g key={x}>
              <path d={`M${x} 130 L${x + 1} 160`} stroke={fill} strokeWidth={5} strokeLinecap="round" />
              <circle cx={x + 1} cy={162} r={2.6} fill="#f1bf57" stroke={OL} strokeWidth={1} />
            </g>
          ))}
        </g>
      );
    case 13:
      return (
        <g>
          <circle cx={CX} cy={78} r={62} {...p} />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i * 22.5 * Math.PI) / 180;
            return <circle key={i} cx={CX + Math.cos(a) * 58} cy={78 + Math.sin(a) * 58} r={10} fill={fill} />;
          })}
        </g>
      );
    case 15:
      return <path {...p} d="M113 42 Q113 26 120 24 Q127 26 127 42 Z" />;
    case 16:
      return <path {...p} d="M70 88 Q64 136 80 142 L160 142 Q176 136 170 88 Z" />;
    case 17:
      return (
        <g>
          {Array.from({ length: 9 }, (_, i) => {
            const x = 78 + i * 10.5;
            const len = 150 + ((i * 17) % 30);
            return <path key={i} d={`M${x} 80 Q${x - 4 + (i % 3) * 3} ${(80 + len) / 2} ${x + (i % 2 ? 4 : -4)} ${len}`} stroke={OL} strokeWidth={9.4} strokeLinecap="round" fill="none" />;
          })}
          {Array.from({ length: 9 }, (_, i) => {
            const x = 78 + i * 10.5;
            const len = 150 + ((i * 17) % 30);
            return <path key={`f${i}`} d={`M${x} 80 Q${x - 4 + (i % 3) * 3} ${(80 + len) / 2} ${x + (i % 2 ? 4 : -4)} ${len}`} stroke={fill} strokeWidth={6.4} strokeLinecap="round" fill="none" />;
          })}
        </g>
      );
    case 19:
      return (
        <g>
          <circle cx={84} cy={50} r={15} {...p} />
          <circle cx={156} cy={50} r={15} {...p} />
        </g>
      );
    case 20:
      return (
        <g>
          {Array.from({ length: 7 }, (_, i) => (
            <ellipse key={i} cx={158 + i * 2} cy={104 + i * 13} rx={8 - i * 0.4} ry={8} {...p} strokeWidth={2} />
          ))}
          <circle cx={172} cy={196} r={3} fill="#c8302a" stroke={OL} strokeWidth={1} />
        </g>
      );
    default:
      return null;
  }
}

/** Spiky styles leave gaps between the spikes; this fills the gaps that fall on the skull so no forehead shows through. Same outline as the style, minus the notches. */
function HairCap({ style, fill }: { style: number; fill: string }) {
  switch (style) {
    case 1:
      return <path fill={fill} d="M70 102 L60 72 L72 44 L106 26 L144 28 L172 44 L180 76 L170 102 Q162 78 148 72 L140 86 L128 72 L116 88 L104 72 L94 86 L88 72 Q78 82 70 102 Z" />;
    case 14:
      return <path fill={fill} d="M72 104 L66 84 L70 64 L86 46 L108 38 L130 36 L152 44 L170 60 L176 86 L168 104 Q160 84 150 78 L144 90 L134 76 L124 92 L112 76 L100 88 L94 76 Q82 86 72 104 Z" />;
    default:
      return null;
  }
}

function FrontHair({ style, fill, hair, hairD }: { style: number; fill: string; hair: string; hairD: string }) {
  const p = { fill, stroke: OL, strokeWidth: 2.4, strokeLinejoin: "round" as const };
  switch (style) {
    case 0:
      return <path {...p} d="M74 98 Q70 50 120 44 Q170 50 166 98 Q160 78 150 72 Q140 86 126 76 Q112 88 98 74 Q86 84 74 98 Z" />;
    case 1:
      return <path {...p} d="M70 102 L60 72 L80 76 L72 44 L98 58 L106 26 L124 52 L144 28 L148 60 L172 44 L162 78 L180 76 L170 102 Q162 78 148 72 L140 86 L128 72 L116 88 L104 72 L94 86 L88 72 Q78 82 70 102 Z" />;
    case 2:
      return (
        <g>
          <path d="M74 98 Q72 84 80 76 L84 96 Z M166 98 Q168 84 160 76 L156 96 Z" fill={hair} opacity={0.45} />
          <path {...p} d="M78 82 Q74 42 120 38 Q168 42 162 82 Q150 64 120 66 Q92 64 78 82 Z" />
          <path d="M100 48 Q116 44 136 50" fill="none" stroke={hairD} strokeWidth={2} />
        </g>
      );
    case 3:
    case 4:
    case 20:
      return (
        <g>
          <path {...p} d="M74 94 Q72 48 120 44 Q168 48 166 94 Q158 64 120 62 Q82 64 74 94 Z" />
          <path d="M92 56 Q118 50 146 58" fill="none" stroke={hairD} strokeWidth={2} />
        </g>
      );
    case 5:
      return <path {...p} d="M70 118 Q66 44 120 40 Q174 44 170 118 Q164 82 152 70 Q132 82 112 70 Q92 78 80 92 Q74 100 70 118 Z" />;
    case 6:
      return (
        <g>
          <path d="M76 90 Q76 50 120 46 Q164 50 164 90 Z" fill={fill} />
          {Array.from({ length: 9 }, (_, i) => {
            const a = ((200 + i * 17.5) * Math.PI) / 180;
            return <circle key={i} cx={CX + Math.cos(a) * 42} cy={92 + Math.sin(a) * 44} r={13} {...p} />;
          })}
        </g>
      );
    case 7:
      return <ellipse cx={104} cy={62} rx={14} ry={7} fill="#fff" opacity={0.25} transform="rotate(-20 104 62)" />;
    case 8:
      return (
        <g>
          <path d="M76 92 Q74 50 120 47 Q166 50 164 92 Q160 70 120 67 Q80 70 76 92 Z" fill={fill} opacity={0.92} stroke={hairD} strokeWidth={1} />
          <path d="M90 60 l2 2 M104 55 l2 2 M120 53 l2 2 M136 55 l2 2 M150 60 l2 2 M98 64 l2 2 M142 64 l2 2" stroke={hairD} strokeWidth={1.2} strokeLinecap="round" />
        </g>
      );
    case 9:
      return (
        <g>
          <path {...p} d="M74 100 Q70 48 118 42 Q170 44 168 96 Q160 72 140 66 Q116 60 98 70 Q86 74 74 100 Z" />
          <path {...p} d="M98 70 Q132 56 162 82 Q140 70 110 78 Z" />
          <path d="M102 46 Q98 58 98 70" fill="none" stroke={hairD} strokeWidth={2} />
        </g>
      );
    case 10:
      return <path {...p} d="M72 110 Q68 46 120 42 Q172 46 168 110 L164 82 Q120 88 76 82 Z" />;
    case 11:
      return (
        <g>
          <path d="M76 92 Q74 50 120 47 Q166 50 164 92 Q160 70 120 67 Q80 70 76 92 Z" fill={hair} opacity={0.25} />
          <path {...p} d="M104 72 L98 40 L110 50 L110 22 L122 44 L128 18 L132 46 L142 34 L136 72 Q120 64 104 72 Z" />
        </g>
      );
    case 12:
      return (
        <g>
          <path {...p} d="M76 92 Q74 48 120 45 Q166 48 164 92 Q160 70 120 66 Q80 70 76 92 Z" />
          {[-24, -12, 0, 12, 24].map((dx) => (
            <path key={dx} d={`M${CX + dx * 1.2} 68 Q${CX + dx} 54 ${CX + dx * 0.6} 46`} fill="none" stroke={hairD} strokeWidth={1.8} strokeDasharray="3 2" />
          ))}
        </g>
      );
    case 13:
      // The dome covers the top of every head shape and melts into the afro behind; only the hairline is outlined.
      return (
        <g>
          <path d="M72 100 Q64 38 120 30 Q176 38 168 100 Q158 72 120 70 Q82 72 72 100 Z" fill={hair} />
          <path d="M72 100 Q82 72 120 70 Q158 72 168 100" fill="none" stroke={OL} strokeWidth={2.4} strokeLinecap="round" />
        </g>
      );
    case 14:
      return <path {...p} d="M72 104 L66 84 L78 84 L70 64 L88 66 L86 46 L102 56 L108 38 L118 52 L130 36 L136 54 L152 44 L152 62 L170 60 L162 78 L176 86 L168 104 Q160 84 150 78 L144 90 L134 76 L124 92 L112 76 L100 88 L94 76 Q82 86 72 104 Z" />;
    case 15:
      return (
        <g>
          <path {...p} d="M76 92 Q74 48 120 44 Q166 48 164 92 Q158 64 120 60 Q82 64 76 92 Z" />
          <path d="M92 58 Q120 50 148 58 M98 66 Q120 58 142 66" fill="none" stroke={hairD} strokeWidth={1.6} />
          <rect x={112} y={40} width={16} height={6} rx={2} fill="#c8302a" stroke={OL} strokeWidth={1.4} />
        </g>
      );
    case 16:
      return <path {...p} d="M70 124 Q64 44 120 40 Q176 44 170 124 Q166 94 156 76 Q138 86 120 78 Q102 86 84 76 Q74 94 70 124 Z" />;
    case 17:
      return (
        <g>
          <path {...p} d="M76 92 Q74 48 120 44 Q166 48 164 92 Q158 66 120 64 Q82 66 76 92 Z" />
          {[88, 100, 140, 152].map((x) => (
            <path key={x} d={`M${x} 66 Q${x - 2} 80 ${x + 1} 94`} stroke={OL} strokeWidth={8.4} strokeLinecap="round" fill="none" />
          ))}
          {[88, 100, 140, 152].map((x) => (
            <path key={`f${x}`} d={`M${x} 66 Q${x - 2} 80 ${x + 1} 94`} stroke={fill} strokeWidth={5.6} strokeLinecap="round" fill="none" />
          ))}
        </g>
      );
    case 18:
      return (
        <g>
          <path {...p} d="M76 90 Q72 42 120 38 Q168 42 164 90 Q156 60 120 56 Q84 60 76 90 Z" />
          <path d="M94 54 Q118 44 146 52 M100 62 Q120 52 142 60 M108 48 Q124 42 138 46" fill="none" stroke={hairD} strokeWidth={1.6} />
        </g>
      );
    case 19:
      return (
        <g>
          <path {...p} d="M74 94 Q72 48 120 44 Q168 48 166 94 Q158 64 120 62 Q82 64 74 94 Z" />
          <path d="M120 44 L120 62" fill="none" stroke={hairD} strokeWidth={2} />
        </g>
      );
    case 21:
      return (
        <g>
          <path {...p} d="M120 42 Q80 42 74 72 Q70 94 72 120 Q80 92 92 78 Q106 68 120 58 Q134 68 148 78 Q160 92 168 120 Q170 94 166 72 Q160 42 120 42 Z" />
          <path d="M120 44 L120 58" fill="none" stroke={hairD} strokeWidth={2} />
        </g>
      );
    default:
      return null;
  }
}

function Headgear({ art, uid }: { art?: ItemDef["art"]; uid: string }) {
  if (!art) return null;
  if (art.style === "bandana") {
    return (
      <g>
        <path d="M72 84 Q70 40 120 36 Q170 40 168 84 Q120 70 72 84 Z" fill={art.c} stroke={OL} strokeWidth={2.2} strokeLinejoin="round" />
        <g fill="#fff" opacity={0.7}>
          <circle cx={100} cy={56} r={2} />
          <circle cx={120} cy={50} r={2} />
          <circle cx={140} cy={56} r={2} />
          <circle cx={110} cy={68} r={1.5} />
          <circle cx={130} cy={68} r={1.5} />
        </g>
        <path d="M164 78 Q182 88 180 110 Q172 96 162 90 Z" fill={art.c} stroke={OL} strokeWidth={2} strokeLinejoin="round" />
      </g>
    );
  }
  if (art.style === "ears") {
    return (
      <g>
        <path d="M76 96 Q76 34 120 32 Q164 34 164 96" fill="none" stroke={art.c} strokeWidth={6} />
        {[74, 166].map((x) => (
          <g key={x}>
            <circle cx={x} cy={102} r={13} fill={art.c} stroke={OL} strokeWidth={2.2} />
            <circle cx={x} cy={102} r={7} fill="none" stroke="#4a4a5a" strokeWidth={2} />
          </g>
        ))}
      </g>
    );
  }
  // Hachimaki and the headwear of the countries.
  return <Headwear art={art} uid={uid} />;
}

/* ── Body and clothes ──────────────────────────────────────────────────── */

function Arm({
  s,
  b,
  m,
  skin,
  sleeve,
  sleeveC,
  cuff,
  tattoo,
  tape,
  uid,
}: {
  s: -1 | 1;
  b: number;
  m: number;
  skin: string;
  sleeve: "long" | "short" | "none";
  sleeveC: string;
  cuff: string;
  tattoo: number;
  tape: boolean;
  uid: string;
}) {
  const S = [CX + s * (41 + 1.5 * m) * b, 162];
  const H = [CX + s * (55 * b + m * 1.5), 238];
  const E = [H[0], H[1] - 10];
  const L = Math.hypot(E[0] - S[0], E[1] - S[1]);
  const deg = (Math.atan2(E[1] - S[1], E[0] - S[0]) * 180) / Math.PI;
  const w = 21 + 2.4 * m;
  const end = sleeve === "long" ? L - 2 : sleeve === "short" ? L * 0.42 : 0;
  const id = `arm${uid}${s}`;
  return (
    <g>
      <g transform={`translate(${S[0]} ${S[1]}) rotate(${deg})`}>
        <line x1={0} y1={0} x2={L} y2={0} stroke={OL} strokeWidth={w + 5} strokeLinecap="round" />
        <line x1={0} y1={0} x2={L} y2={0} stroke={skin} strokeWidth={w} strokeLinecap="round" />
        {tattoo && end < L - 4 ? (
          <g>
            <clipPath id={id}>
              <rect x={end} y={-w / 2} width={L - end + w / 2} height={w} rx={w / 2} />
            </clipPath>
            <g clipPath={`url(#${id})`}>
              <Tattoo kind={tattoo} from={end} to={L + 4} hw={w / 2} />
            </g>
          </g>
        ) : null}
        {end > 0 ? (
          <g>
            <circle cx={0} cy={0} r={w / 2 + 0.5} fill={sleeveC} />
            <line x1={0} y1={0} x2={end} y2={0} stroke={sleeveC} strokeWidth={w + 1} />
            <line x1={end - 2.5} y1={-w / 2 - 0.5} x2={end - 2.5} y2={w / 2 + 0.5} stroke={cuff} strokeWidth={5} />
            <line x1={end} y1={-w / 2 - 2} x2={end} y2={w / 2 + 2} stroke={OL} strokeWidth={1.6} />
          </g>
        ) : null}
      </g>
      <circle cx={H[0]} cy={H[1]} r={11.5 + m * 0.5} fill={skin} stroke={OL} strokeWidth={2.2} />
      {tape ? (
        <g stroke="#fbfaf5" strokeWidth={2.6} strokeLinecap="round">
          <line x1={H[0] - 6} y1={H[1] + 3} x2={H[0] - 6} y2={H[1] + 8} />
          <line x1={H[0] - 1} y1={H[1] + 4} x2={H[0] - 1} y2={H[1] + 9} />
          <line x1={H[0] + 4} y1={H[1] + 3} x2={H[0] + 4} y2={H[1] + 8} />
        </g>
      ) : null}
    </g>
  );
}

/** Tattoo in arm coordinates: x runs along the arm, y across it. */
export function Tattoo({ kind, from, to, hw }: { kind: number; from: number; to: number; hw: number }) {
  const len = to - from;
  const p = { fill: "none", stroke: INK, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case 1: {
      const pts: string[] = [];
      for (let x = from; x <= to; x += 7) pts.push(`${x},${-hw * 0.2}`, `${x + 3.5},${-hw * 0.9}`, `${x + 5},${hw * 0.1}`);
      return <polyline points={pts.join(" ")} {...p} strokeWidth={2.4} />;
    }
    case 2:
      return (
        <g>
          {[-hw * 0.45, 0, hw * 0.45].map((y) => (
            <path key={y} {...p} d={`M${from} ${y} ${Array.from({ length: Math.ceil(len / 8) }, (_, i) => `q2 ${i % 2 ? 3 : -3} 4 0 t4 0`).join(" ")}`} />
          ))}
        </g>
      );
    case 3:
      return (
        <g>
          {Array.from({ length: Math.floor(len / 5) }, (_, i) => (
            <path key={i} {...p} strokeWidth={1.3} d={`M${from + 2 + i * 5} ${-2 + (i % 3)} l2 ${i % 2 ? 3 : -3}`} />
          ))}
        </g>
      );
    case 4:
      return (
        <g>
          <path {...p} d={`M${from} 0 ${Array.from({ length: Math.ceil(len / 10) }, (_, i) => `q5 ${i % 2 ? hw * 0.8 : -hw * 0.8} 10 0`).join(" ")}`} />
          {Array.from({ length: Math.floor(len / 10) }, (_, i) => (
            <ellipse key={i} cx={from + 5 + i * 10} cy={(i % 2 ? 1 : -1) * hw * 0.55} rx={2.2} ry={1.2} fill={INK} opacity={0.8} />
          ))}
        </g>
      );
    case 5:
      return (
        <g>
          {Array.from({ length: Math.ceil(len / 5) }, (_, i) =>
            [-hw * 0.6, -hw * 0.1, hw * 0.4].map((y, j) => <path key={`${i}-${j}`} {...p} strokeWidth={1.2} d={`M${from + i * 5 + (j % 2) * 2.5} ${y} a2.5 2.5 0 0 0 5 0`} />),
          )}
        </g>
      );
    case 6:
      return (
        <g opacity={0.9}>
          <rect x={from} y={-hw} width={len} height={hw * 2} fill={INK} opacity={0.55} />
          {Array.from({ length: Math.ceil(len / 9) }, (_, i) => (
            <circle key={i} cx={from + 4 + i * 9} cy={(i % 2 ? 1 : -1) * hw * 0.3} r={2.4} fill="none" stroke="#e8e2d0" strokeWidth={0.9} opacity={0.6} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

function GiPants({ b, c, skin }: { b: number; c: string; skin: string }) {
  return (
    <g>
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M${CX + s * 2} 226 L${CX + s * 32 * b} 226 L${CX + s * 29 * b} 292 L${CX + s * 5} 292 Z`} fill={c} stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
          <line x1={CX + s * 6} y1={286} x2={CX + s * 28 * b} y2={286} stroke={shade(c, -0.15)} strokeWidth={2} />
          <ellipse cx={CX + s * 17 * b} cy={298} rx={13} ry={6.5} fill={skin} stroke={OL} strokeWidth={2.2} />
        </g>
      ))}
    </g>
  );
}

function NoGiLegs({ b, art, skin, knee, uid }: { b: number; art: ItemDef["art"]; skin: string; knee: boolean; uid: string }) {
  const c = art.c ?? "#1d1d26";
  const style = art.style ?? "shorts";
  const combo = style === "combo";
  const spats = style === "spats" || combo;
  const shorts = style === "shorts" || combo;
  const legC = combo ? art.c3 ?? "#1d1d26" : spats ? c : skin;
  const leg = (s: number) => `M${CX + s * 4} 226 L${CX + s * 27 * b} 226 L${CX + s * 25 * b} 292 L${CX + s * 8} 292 Z`;
  const shortsD = `M${CX - 38 * b} 222 L${CX + 38 * b} 222 L${CX + 33 * b} 262 L${CX + 3} 262 L${CX} 248 L${CX - 3} 262 L${CX - 33 * b} 262 Z`;
  return (
    <g>
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={leg(s)} fill={legC} stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
          {style === "spats" && art.pattern && art.pattern !== "solid" ? (
            <g>
              <clipPath id={`leg${uid}${s}`}>
                <path d={leg(s)} />
              </clipPath>
              <g clipPath={`url(#leg${uid}${s})`}>
                <Pattern kind={art.pattern} c2={art.c2 ?? "#9cc3ff"} x={CX - 36 * b} y={226} w={72 * b} h={70} />
              </g>
              <path d={leg(s)} fill="none" stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
            </g>
          ) : null}
          {knee && !spats ? <rect x={s < 0 ? CX - 26 * b : CX + 6} y={262} width={20 * b} height={15} rx={4} fill="#2a2a36" stroke={OL} strokeWidth={2} /> : null}
          <ellipse cx={CX + s * 16 * b} cy={298} rx={12} ry={6.5} fill={skin} stroke={OL} strokeWidth={2.2} />
        </g>
      ))}
      {shorts ? (
        <g>
          <path d={shortsD} fill={c} stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
          {art.pattern && art.pattern !== "solid" ? (
            <g>
              <clipPath id={`sh${uid}`}>
                <path d={shortsD} />
              </clipPath>
              <g clipPath={`url(#sh${uid})`}>
                <Pattern kind={art.pattern} c2={art.c2 ?? "#9cc3ff"} x={CX - 40 * b} y={222} w={80 * b} h={42} />
              </g>
              <path d={shortsD} fill="none" stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
            </g>
          ) : null}
          <path d={`M${CX - 37 * b} 227 L${CX + 37 * b} 227`} stroke={shade(c, -0.3)} strokeWidth={2} />
        </g>
      ) : (
        <path d={`M${CX - 38 * b} 222 L${CX + 38 * b} 222 L${CX + 30 * b} 238 L${CX - 30 * b} 238 Z`} fill={c} stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
      )}
    </g>
  );
}

function GiTop({ torso, b, art, skin }: { torso: string; b: number; art: ItemDef["art"]; skin: string }) {
  const c = art.c ?? "#f4f1ea";
  const lapel = art.lapel ?? shade(c, -0.1);
  return (
    <g>
      <path d={`M${CX - 38 * b} 228 L${CX + 38 * b} 228 L${CX + 37 * b} 250 L${CX - 37 * b} 250 Z`} fill={c} stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
      <path d={`M${CX + 4} 232 L${CX - 8} 250`} stroke={OL} strokeWidth={1.8} />
      <path d={torso} fill={c} stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
      <polygon points={`${CX - 15},146 ${CX + 15},146 ${CX},180`} fill={skin} />
      <line x1={CX - 15} y1={146} x2={CX + 9} y2={200} stroke={OL} strokeWidth={11} strokeLinecap="round" />
      <line x1={CX - 15} y1={146} x2={CX + 9} y2={200} stroke={lapel} strokeWidth={8} strokeLinecap="round" />
      <line x1={CX + 15} y1={146} x2={CX - 10} y2={216} stroke={OL} strokeWidth={11} strokeLinecap="round" />
      <line x1={CX + 15} y1={146} x2={CX - 10} y2={216} stroke={lapel} strokeWidth={8} strokeLinecap="round" />
      {art.stitch ? <line x1={CX + 13} y1={150} x2={CX - 8} y2={212} stroke={art.stitch} strokeWidth={1.4} strokeDasharray="3 3" /> : null}
    </g>
  );
}

/** Surface pattern inside a box; the caller clips it to the garment. */
export function Pattern({ kind, c2, x, y, w, h }: { kind: PatternKind; c2: string; x: number; y: number; w: number; h: number }) {
  const cx = x + w / 2;
  const r = (i: number, n: number) => ((i * 7919) % 97) / 97 * n;
  switch (kind) {
    case "wave":
      return (
        <g fill="none" stroke={c2} strokeWidth={Math.max(1.6, h / 32)}>
          {[0.4, 0.6, 0.8].map((f) => (
            <path key={f} d={`M${x - 4} ${y + h * f} ${Array.from({ length: Math.ceil(w / 20) + 1 }, () => "q5 -4 10 0 t10 0").join(" ")}`} />
          ))}
        </g>
      );
    case "bolt":
      return <polygon points={`${cx + 6},${y + 8} ${cx - 16},${y + h * 0.5} ${cx},${y + h * 0.5} ${cx - 12},${y + h * 0.95} ${cx + 22},${y + h * 0.42} ${cx + 6},${y + h * 0.42} ${cx + 20},${y + 8}`} fill={c2} />;
    case "petals":
      return (
        <g fill={c2}>
          {Array.from({ length: 12 }, (_, i) => {
            const px = x + 10 + r(i, w - 20);
            const py = y + 8 + r(i + 5, h - 16);
            return <ellipse key={i} cx={px} cy={py} rx={5} ry={3} transform={`rotate(${i * 33} ${px} ${py})`} />;
          })}
        </g>
      );
    case "tiger":
      return (
        <g fill={c2}>
          {[0.2, 0.42, 0.64, 0.84].map((f, i) => {
            const yy = y + h * f;
            return (
              <g key={f}>
                <path d={`M${x} ${yy} Q${x + w * 0.25} ${yy - 6 + i} ${x + w * 0.4} ${yy + 6} Q${x + w * 0.22} ${yy + 2} ${x} ${yy + 8} Z`} />
                <path d={`M${x + w} ${yy + 4} Q${x + w * 0.75} ${yy - 2} ${x + w * 0.6} ${yy + 10} Q${x + w * 0.78} ${yy + 6} ${x + w} ${yy + 12} Z`} />
              </g>
            );
          })}
        </g>
      );
    case "stars":
      return (
        <g fill={c2}>
          {Array.from({ length: 16 }, (_, i) => (
            <circle key={i} cx={x + 8 + r(i, w - 16)} cy={y + 6 + r(i + 3, h - 12)} r={i % 4 === 0 ? 2.4 : 1.2} />
          ))}
        </g>
      );
    case "flame":
      return (
        <g fill={c2} opacity={0.9}>
          {[0.25, 0.43, 0.61, 0.79].map((f, i) => {
            const fx = x + w * f;
            return <path key={f} d={`M${fx - 12} ${y + h} Q${fx - 14} ${y + h * (0.62 - i * 0.05)} ${fx} ${y + h * (0.38 - (i % 2) * 0.14)} Q${fx + 14} ${y + h * (0.66 - i * 0.04)} ${fx + 12} ${y + h} Z`} />;
          })}
        </g>
      );
    case "stripes":
      return (
        <g fill={c2}>
          {Array.from({ length: Math.ceil(h / 14) }, (_, i) => (
            <rect key={i} x={x} y={y + 6 + i * 14} width={w} height={5} />
          ))}
        </g>
      );
    case "split":
      return <rect x={cx} y={y} width={w / 2} height={h} fill={c2} />;
    case "side":
      return (
        <g fill={c2}>
          <rect x={x} y={y} width={w * 0.13} height={h} />
          <rect x={x + w * 0.87} y={y} width={w * 0.13} height={h} />
        </g>
      );
    case "camo":
      return (
        <g>
          {Array.from({ length: 14 }, (_, i) => (
            <ellipse key={i} cx={x + r(i, w)} cy={y + r(i + 7, h)} rx={6 + r(i + 2, 8)} ry={4 + r(i + 4, 5)} fill={i % 2 ? c2 : shade(c2, -0.35)} transform={`rotate(${i * 27} ${x + r(i, w)} ${y + r(i + 7, h)})`} />
          ))}
        </g>
      );
    case "hex":
      return (
        <g fill="none" stroke={c2} strokeWidth={1.4}>
          {Array.from({ length: Math.ceil(h / 13) + 1 }, (_, row) =>
            Array.from({ length: Math.ceil(w / 15) + 1 }, (_, col) => {
              const hx = x + col * 15 + (row % 2 ? 7.5 : 0);
              const hy = y + row * 13;
              return <polygon key={`${row}-${col}`} points={`${hx},${hy - 7} ${hx + 6},${hy - 3.5} ${hx + 6},${hy + 3.5} ${hx},${hy + 7} ${hx - 6},${hy + 3.5} ${hx - 6},${hy - 3.5}`} />;
            }),
          )}
        </g>
      );
    case "sunset":
      return (
        <g fill={c2}>
          <rect x={x} y={y + h * 0.55} width={w} height={h * 0.45} opacity={0.35} />
          <rect x={x} y={y + h * 0.7} width={w} height={h * 0.3} opacity={0.45} />
          <rect x={x} y={y + h * 0.84} width={w} height={h * 0.16} opacity={0.7} />
          <circle cx={cx} cy={y + h * 0.55} r={Math.min(w, h) * 0.18} opacity={0.8} />
        </g>
      );
    case "chevron":
      return (
        <g fill="none" stroke={c2} strokeWidth={3}>
          {[0.3, 0.55, 0.8].map((f) => (
            <path key={f} d={`M${x} ${y + h * f} ${Array.from({ length: Math.ceil(w / 12) }, () => "l6 -6 l6 6").join(" ")}`} />
          ))}
        </g>
      );
    case "kraken":
      return (
        <g fill="none" stroke={c2} strokeWidth={4} strokeLinecap="round">
          {[0.15, 0.4, 0.62, 0.85].map((f, i) => {
            const tx = x + w * f;
            return (
              <g key={f}>
                <path d={`M${tx} ${y + h + 4} Q${tx + (i % 2 ? 14 : -14)} ${y + h * 0.6} ${tx + (i % 2 ? -4 : 4)} ${y + h * 0.3} q${i % 2 ? -8 : 8} -6 ${i % 2 ? -2 : 2} -12`} />
                {[0.8, 0.6, 0.45].map((g) => (
                  <circle key={g} cx={tx + (i % 2 ? 6 : -6) * g} cy={y + h * g} r={1.1} fill={shade(c2, 0.4)} stroke="none" />
                ))}
              </g>
            );
          })}
        </g>
      );
    case "chart":
      return (
        <g>
          <path d={`M${x + 6} ${y + h * 0.8} Q${x + w * 0.3} ${y + h * 0.3} ${x + w * 0.55} ${y + h * 0.6} T${x + w - 6} ${y + h * 0.25}`} fill="none" stroke={c2} strokeWidth={1.6} strokeDasharray="4 3" />
          <g transform={`translate(${x + w * 0.72} ${y + h * 0.62})`} fill={c2}>
            <polygon points="0,-9 2,-2 9,0 2,2 0,9 -2,2 -9,0 -2,-2" />
            <circle r={2} fill="none" stroke={c2} strokeWidth={0.8} />
          </g>
          <path d={`M${x + w * 0.18} ${y + h * 0.3} l4 4 m0 -4 l-4 4`} stroke={c2} strokeWidth={1.6} />
        </g>
      );
    case "checker":
      return (
        <g fill={c2}>
          {Array.from({ length: Math.ceil(h / 10) }, (_, row) =>
            Array.from({ length: Math.ceil(w / 10) }, (_, col) => ((row + col) % 2 ? <rect key={`${row}-${col}`} x={x + col * 10} y={y + row * 10} width={10} height={10} /> : null)),
          )}
        </g>
      );
    case "scales":
      return (
        <g fill="none" stroke={c2} strokeWidth={1.4}>
          {Array.from({ length: Math.ceil(h / 7) + 1 }, (_, row) =>
            Array.from({ length: Math.ceil(w / 10) + 1 }, (_, col) => (
              <path key={`${row}-${col}`} d={`M${x + col * 10 + (row % 2 ? 5 : 0) - 5} ${y + row * 7} a5 5 0 0 0 10 0`} />
            )),
          )}
        </g>
      );
    case "solid":
      return <path d={`M${x} ${y + h * 0.58} L${x + w} ${y + h * 0.29} L${x + w} ${y + h * 0.39} L${x} ${y + h * 0.68} Z`} fill={c2} opacity={0.8} />;
    default:
      return null;
  }
}

function BeltKnot({ b, color, bar, stripes }: { b: number; color: string; bar: string; stripes: number }) {
  return (
    <g>
      <rect x={CX - 39 * b} y={221} width={78 * b} height={11} fill={color} stroke={OL} strokeWidth={2.2} />
      <path d={`M${CX - 8} 232 L${CX - 1} 232 L${CX - 11} 264 L${CX - 18} 264 Z`} fill={color} stroke={OL} strokeWidth={2} strokeLinejoin="round" />
      <path d={`M${CX + 1} 232 L${CX + 8} 232 L${CX + 18} 264 L${CX + 11} 264 Z`} fill={color} stroke={OL} strokeWidth={2} strokeLinejoin="round" />
      <path d={`M${CX + 5.4} 248 L${CX + 12.4} 248 L${CX + 16.6} 260 L${CX + 9.6} 260 Z`} fill={bar} />
      {Array.from({ length: Math.min(4, stripes) }, (_, i) => (
        <line key={i} x1={CX + 7.2 + i * 1.9} y1={249.5} x2={CX + 10.8 + i * 1.9} y2={258.5} stroke="#f6f3ea" strokeWidth={1.1} />
      ))}
      <rect x={CX - 9} y={217} width={18} height={17} rx={4} fill={color} stroke={OL} strokeWidth={2.2} />
    </g>
  );
}

export function Patch({ item, x, y, w, h, rot, uid }: { item?: ItemDef; x: number; y: number; w: number; h: number; rot: number; uid: string }) {
  if (!item) return null;
  const e = item.art.emblem;
  const cx = x + w / 2;
  const cy = y + h / 2;
  let inner: ReactNode;
  if (e === "flag" && item.art.code) inner = <FlagIn code={item.art.code} x={x} y={y} w={w} h={h} />;
  else {
    const bg = item.art.c ?? (e === "tokui" ? "#f1bf57" : e === "crown" ? "#2a1330" : "#141c34");
    const fg = item.art.c2 ?? (e === "tokui" ? "#1c1526" : "#f1bf57");
    const s = h * 0.36;
    inner = (
      <g>
        <rect x={x} y={y} width={w} height={h} fill={bg} />
        {e === "flame" ? (
          <path d={`M${cx} ${cy - s} Q${cx + s} ${cy} ${cx} ${cy + s} Q${cx - s} ${cy} ${cx} ${cy - s} Z`} fill="#ff9a4a" />
        ) : e === "crown" ? (
          <polygon points={`${cx - s * 1.3},${cy + s * 0.8} ${cx - s * 1.3},${cy - s * 0.4} ${cx - s * 0.6},${cy + s * 0.1} ${cx},${cy - s} ${cx + s * 0.6},${cy + s * 0.1} ${cx + s * 1.3},${cy - s * 0.4} ${cx + s * 1.3},${cy + s * 0.8}`} fill={fg} />
        ) : e === "wave" ? (
          <path d={`M${x + 2} ${cy} q${w / 8} -${h / 4} ${w / 4} 0 t${w / 4} 0 t${w / 4} 0`} fill="none" stroke="#9cc3ff" strokeWidth={1.6} />
        ) : e === "logo" ? (
          <g>
            <polygon points={`${cx},${cy - s * 1.2} ${cx + s},${cy - s * 0.6} ${cx + s},${cy + s * 0.6} ${cx},${cy + s * 1.2} ${cx - s},${cy + s * 0.6} ${cx - s},${cy - s * 0.6}`} fill="none" stroke={fg} strokeWidth={1.1} />
            <circle cx={cx} cy={cy} r={s * 0.35} fill={fg} />
          </g>
        ) : e === "anchor" ? (
          <path d={`M${cx} ${cy - s} V${cy + s} M${cx - s * 0.6} ${cy - s * 0.5} H${cx + s * 0.6} M${cx - s * 1.1} ${cy + s * 0.2} Q${cx - s} ${cy + s} ${cx} ${cy + s} Q${cx + s} ${cy + s} ${cx + s * 1.1} ${cy + s * 0.2}`} fill="none" stroke={fg} strokeWidth={1.2} strokeLinecap="round" />
        ) : e === "skull" ? (
          <g>
            <path d={`M${cx - s * 1.3} ${cy - s * 0.9} L${cx + s * 1.3} ${cy + s * 0.9} M${cx + s * 1.3} ${cy - s * 0.9} L${cx - s * 1.3} ${cy + s * 0.9}`} stroke={fg} strokeWidth={1.2} strokeLinecap="round" />
            <circle cx={cx} cy={cy - s * 0.1} r={s * 0.75} fill="#f4f1ea" />
            <circle cx={cx - s * 0.28} cy={cy - s * 0.15} r={s * 0.18} fill={bg} />
            <circle cx={cx + s * 0.28} cy={cy - s * 0.15} r={s * 0.18} fill={bg} />
          </g>
        ) : e === "compass" ? (
          <g>
            <circle cx={cx} cy={cy} r={s * 1.05} fill="none" stroke={fg} strokeWidth={0.8} />
            <polygon points={`${cx},${cy - s} ${cx + s * 0.25},${cy} ${cx},${cy + s} ${cx - s * 0.25},${cy}`} fill={fg} />
            <polygon points={`${cx - s},${cy} ${cx},${cy - s * 0.25} ${cx + s},${cy} ${cx},${cy + s * 0.25}`} fill={fg} opacity={0.6} />
          </g>
        ) : (
          <path d={`M${cx} ${cy - s}L${cx + s * 0.3} ${cy - s * 0.3}L${cx + s} ${cy}L${cx + s * 0.3} ${cy + s * 0.3}L${cx} ${cy + s}L${cx - s * 0.3} ${cy + s * 0.3}L${cx - s} ${cy}L${cx - s * 0.3} ${cy - s * 0.3}Z`} fill={fg} />
        )}
      </g>
    );
  }
  return (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <clipPath id={`clip${uid}`}>
        <rect x={x} y={y} width={w} height={h} rx={2} />
      </clipPath>
      <g clipPath={`url(#clip${uid})`}>{inner}</g>
      <rect x={x} y={y} width={w} height={h} rx={2} fill="none" stroke={OL} strokeWidth={1.6} />
      <rect x={x + 1.4} y={y + 1.4} width={w - 2.8} height={h - 2.8} rx={1.4} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={0.6} strokeDasharray="1.4 1.2" />
    </g>
  );
}

function Towel({ b, c }: { b: number; c: string }) {
  return (
    <g>
      <path d={`M${CX + 22} 146 Q${CX + 44 * b} 140 ${CX + 50 * b} 158 L${CX + 42 * b} 206 Q${CX + 34 * b} 210 ${CX + 28 * b} 204 L${CX + 34 * b} 162 Q${CX + 28} 156 ${CX + 18} 156 Z`} fill={c} stroke={OL} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={`M${CX + 30 * b} 196 L${CX + 42 * b} 198`} stroke="#fff" strokeWidth={2} opacity={0.8} />
    </g>
  );
}

function Medal({ c }: { c: string }) {
  return (
    <g>
      <path d={`M${CX - 12} 146 L${CX} 188 L${CX + 12} 146`} fill="none" stroke="#c8302a" strokeWidth={5} />
      <circle cx={CX} cy={194} r={10} fill={c} stroke={OL} strokeWidth={2.2} />
      <path d={`M${CX} 187 L${CX + 2} 192 L${CX + 7} 194 L${CX + 2} 196 L${CX} 201 L${CX - 2} 196 L${CX - 7} 194 L${CX - 2} 192 Z`} fill="#fff3d0" opacity={0.85} />
    </g>
  );
}
