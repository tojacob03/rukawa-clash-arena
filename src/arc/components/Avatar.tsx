// The player's fighter: an original chibi-style SVG drawing. Everything is
// built from simple shapes so outfits, patterns, flags and auras can be
// swapped freely.

import { useId } from "react";
import type { ReactNode } from "react";
import type { Attire, Belt, Look, Slot } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import { BELT } from "../format.ts";
import { EYE_COLORS, HAIR_COLORS, SKIN, shade } from "../avatarOptions.ts";
import { FlagIn } from "./Flag.tsx";

const OL = "#1c1526";
const CX = 120;

export interface AvatarProps {
  look: Look;
  mode: Attire;
  gear: Partial<Record<Slot, ItemDef | undefined>>;
  belt: Belt;
  stripes: number;
  weightKg?: number;
  size?: number;
  label?: string;
  still?: boolean;
}

export default function Avatar({ look, mode, gear, belt, stripes, weightKg, size = 240, label, still }: AvatarProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const b = weightKg ? Math.min(1.25, Math.max(0.86, 0.86 + (weightKg - 58) / 110)) : 1;
  const skin = SKIN[look.skin] ?? SKIN[1];
  const skinD = shade(skin, -0.18);
  const hair = HAIR_COLORS[look.hairColor] ?? HAIR_COLORS[0];
  const hairD = shade(hair, -0.35);
  const eye = EYE_COLORS[look.eyeColor] ?? EYE_COLORS[0];
  const gi = gear.gi?.art ?? { c: "#f4f1ea", lapel: "#e2d9c6" };
  const top = gear.top?.art ?? { pattern: "rank" as const };
  const bottom = gear.bottom?.art ?? { c: "#1d1d26", style: "shorts" };
  const beltC = BELT[belt];
  const topC = top.pattern === "rank" ? beltC.color : top.c ?? "#1d1d26";
  const topC2 = top.pattern === "rank" ? "#15151a" : top.c2 ?? "#34406b";
  const sleeve = mode === "gi" ? gi.c ?? "#f4f1ea" : topC;
  const extra = gear.extra?.art.style;
  const trait = gear.trait?.art.style;

  // Torso outline, shared by clothing and pattern clip.
  const torso = `M${CX - 40 * b} 150 Q${CX} 141 ${CX + 40 * b} 150 Q${CX + 48 * b} 154 ${CX + 46 * b} 172 L${CX + 38 * b} 233 L${CX - 38 * b} 233 L${CX - 46 * b} 172 Q${CX - 48 * b} 154 ${CX - 40 * b} 150 Z`;
  const shoulderL: [number, number] = [CX - 41 * b, 162];
  const shoulderR: [number, number] = [CX + 41 * b, 162];
  const handL: [number, number] = [CX - 55 * b, 238];
  const handR: [number, number] = [CX + 55 * b, 238];

  return (
    <svg className={`avatar${still ? "" : " alive"}`} width={size} height={(size * 4) / 3} viewBox="0 0 240 320" role="img" aria-label={label ?? "Dein Charakter"}>
      <defs>
        <radialGradient id={`glow${uid}`} cx="50%" cy="52%" r="50%">
          <stop offset="0" stopColor={gear.aura?.art.c ?? "#5f90ea"} stopOpacity={gear.aura ? 0.55 : 0.18} />
          <stop offset="1" stopColor={gear.aura?.art.c ?? "#5f90ea"} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`torso${uid}`}>
          <path d={torso} />
        </clipPath>
      </defs>

      <Aura id={gear.aura?.id} color={gear.aura?.art.c} glow={`url(#glow${uid})`} />
      <ellipse cx={CX} cy={304} rx={62 * b} ry={8} fill="#000" opacity={0.35} />

      <g className="avatar-body">
        <BackHair style={look.hair} hair={hair} hairD={hairD} />

        {/* Legs */}
        {mode === "gi" ? (
          <GiPants b={b} c={gi.c ?? "#f4f1ea"} skin={skin} />
        ) : (
          <NoGiLegs b={b} art={bottom} skin={skin} knee={extra === "knee"} uid={uid} />
        )}

        {/* Neck */}
        <rect x={CX - 10} y={126} width={20} height={26} fill={skinD} stroke={OL} strokeWidth={2.2} />

        {/* Torso */}
        {mode === "gi" ? (
          <GiTop torso={torso} b={b} art={gi} skin={skin} />
        ) : (
          <g>
            <path d={torso} fill={topC} stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
            <g clipPath={`url(#torso${uid})`}>
              <TopPattern pattern={top.pattern ?? "solid"} c2={topC2} b={b} />
            </g>
            <path d={torso} fill="none" stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
            <path d={`M${CX - 12} 148 Q${CX} 158 ${CX + 12} 148`} fill="none" stroke={shade(topC, -0.35)} strokeWidth={3} strokeLinecap="round" />
          </g>
        )}

        {/* Arms */}
        {[
          [shoulderL, handL],
          [shoulderR, handR],
        ].map(([s, h], i) => (
          <g key={i}>
            <line x1={s[0]} y1={s[1]} x2={h[0]} y2={h[1] - 10} stroke={OL} strokeWidth={27} strokeLinecap="round" />
            <line x1={s[0]} y1={s[1]} x2={h[0]} y2={h[1] - 10} stroke={sleeve} strokeWidth={22} strokeLinecap="round" />
            {mode === "gi" ? <line x1={h[0] - 1} y1={h[1] - 16} x2={h[0] + 1} y2={h[1] - 11} stroke={gi.lapel ?? shade(sleeve, -0.1)} strokeWidth={22} /> : null}
            <circle cx={h[0]} cy={h[1]} r={11.5} fill={skin} stroke={OL} strokeWidth={2.2} />
            {extra === "tape" ? (
              <g stroke="#fbfaf5" strokeWidth={2.6} strokeLinecap="round">
                <line x1={h[0] - 6} y1={h[1] + 3} x2={h[0] - 6} y2={h[1] + 8} />
                <line x1={h[0] - 1} y1={h[1] + 4} x2={h[0] - 1} y2={h[1] + 9} />
                <line x1={h[0] + 4} y1={h[1] + 3} x2={h[0] + 4} y2={h[1] + 8} />
              </g>
            ) : null}
          </g>
        ))}

        {/* Belt (only with the gi) */}
        {mode === "gi" ? <BeltKnot b={b} color={beltC.color} bar={beltC.bar} stripes={stripes} /> : null}

        {/* Patches */}
        <Patch item={gear.patch1} x={CX - 57 * b} y={170} w={20} h={13} rot={16} uid={uid + "p1"} />
        <Patch item={gear.patch2} x={CX + 13} y={169} w={20} h={13} rot={-4} uid={uid + "p2"} />
        <Patch item={gear.patch3} x={CX - 27 * b} y={mode === "gi" ? 252 : 238} w={16} h={11} rot={-6} uid={uid + "p3"} />

        {extra === "towel" ? <Towel b={b} c={gear.extra?.art.c ?? "#6fb3c9"} /> : null}
        {extra === "medal" ? <Medal /> : null}

        {/* Head */}
        <Ears skin={skin} cauli={trait === "ear"} />
        <ellipse cx={CX} cy={96} rx={46} ry={48} fill={skin} stroke={OL} strokeWidth={2.6} />
        <ellipse cx={CX - 27} cy={115} rx={7} ry={3.5} fill="#ff7a8a" opacity={0.32} />
        <ellipse cx={CX + 27} cy={115} rx={7} ry={3.5} fill="#ff7a8a" opacity={0.32} />
        <Beard kind={look.beard} hair={hair} />
        <Face face={look.face} eye={eye} skin={skin} brow={look.hair === 7 ? "#3a2a22" : hairD} />
        {trait === "scar" ? <path d={`M${CX + 30} 80 L${CX + 38} 92 M${CX + 34} 80 L${CX + 42} 92`} stroke="#b0525a" strokeWidth={2} strokeLinecap="round" opacity={0.8} /> : null}
        <FrontHair style={look.hair} hair={hair} hairD={hairD} />
        <Headgear art={gear.head?.art} />
      </g>
    </svg>
  );
}

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
  }
  return (
    <g aria-hidden="true">
      <ellipse cx={CX} cy={168} rx={118} ry={150} fill={glow} />
      {fx}
    </g>
  );
}

function BackHair({ style, hair, hairD }: { style: number; hair: string; hairD: string }) {
  if (style === 3)
    return (
      <g>
        <circle cx={CX} cy={44} r={15} fill={hair} stroke={OL} strokeWidth={2.4} />
        <path d="M108 50 Q120 56 132 50" fill="none" stroke={hairD} strokeWidth={3} />
      </g>
    );
  if (style === 4) return <path d="M150 58 Q194 70 186 124 Q182 144 168 150 Q176 116 158 84 Z" fill={hair} stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />;
  if (style === 5) return <path d="M72 88 Q62 150 78 176 L162 176 Q178 150 168 88 Z" fill={hair} stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />;
  return null;
}

function FrontHair({ style, hair, hairD }: { style: number; hair: string; hairD: string }) {
  const p = { fill: hair, stroke: OL, strokeWidth: 2.4, strokeLinejoin: "round" as const };
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
          <path d="M76 90 Q76 50 120 46 Q164 50 164 90 Z" fill={hair} />
          {Array.from({ length: 9 }, (_, i) => {
            const a = ((200 + i * 17.5) * Math.PI) / 180;
            return <circle key={i} cx={CX + Math.cos(a) * 42} cy={92 + Math.sin(a) * 44} r={13} {...p} />;
          })}
        </g>
      );
    default:
      return <ellipse cx={104} cy={62} rx={14} ry={7} fill="#fff" opacity={0.25} transform="rotate(-20 104 62)" />;
  }
}

function Face({ face, eye, skin, brow }: { face: number; eye: string; skin: string; brow: string }) {
  const one = (
    <g>
      {face === 0 ? (
        <>
          <path d="M88 104 Q98 93 112 100 Q102 116 88 104 Z" fill="#fff" stroke={OL} strokeWidth={1.6} />
          <ellipse cx={101} cy={105} rx={6.5} ry={7.5} fill={eye} />
          <ellipse cx={101} cy={105} rx={3} ry={4} fill={OL} />
          <circle cx={98.5} cy={102} r={2.4} fill="#fff" />
          <path d="M87 104 Q98 91 113 99" fill="none" stroke={OL} strokeWidth={3.4} strokeLinecap="round" />
          <path d="M86 88 L111 93" stroke={brow} strokeWidth={4} strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx={100} cy={104} rx={11} ry={13} fill="#fff" stroke={OL} strokeWidth={1.6} />
          <ellipse cx={100} cy={106} rx={8} ry={10.5} fill={eye} />
          <ellipse cx={100} cy={107} rx={3.6} ry={5} fill={OL} />
          <circle cx={97} cy={101.5} r={3.2} fill="#fff" />
          <circle cx={103} cy={110} r={1.6} fill="#fff" />
          {face === 2 ? <path d="M88 90 L112 90 L112 104 Q100 107 88 104 Z" fill={skin} stroke={OL} strokeWidth={1.6} /> : null}
          <path d={face === 2 ? "M88 104 Q100 107 112 104" : "M88 98 Q100 86 112 98"} fill="none" stroke={OL} strokeWidth={3.2} strokeLinecap="round" />
          <path d={face === 2 ? "M89 84 L111 85" : "M89 84 Q100 78 111 84"} fill="none" stroke={brow} strokeWidth={3.6} strokeLinecap="round" />
        </>
      )}
    </g>
  );
  const mouth =
    face === 0 ? (
      <path d="M113 124 Q121 127 128 121" fill="none" stroke={OL} strokeWidth={2.6} strokeLinecap="round" />
    ) : face === 1 ? (
      <path d="M111 121 Q120 131 129 121 Q120 124 111 121 Z" fill="#9b3242" stroke={OL} strokeWidth={2.2} strokeLinejoin="round" />
    ) : (
      <ellipse cx={121} cy={124} rx={3.4} ry={2.6} fill="#9b3242" stroke={OL} strokeWidth={1.8} />
    );
  return (
    <g>
      {one}
      <g transform="translate(240 0) scale(-1 1)">{one}</g>
      <path d="M120 110 L118 116" stroke={shade(skin, -0.3)} strokeWidth={2} strokeLinecap="round" />
      {mouth}
    </g>
  );
}

function Beard({ kind, hair }: { kind: number; hair: string }) {
  if (kind === 1) return <path d="M78 110 Q84 138 120 144 Q156 138 162 110 Q150 132 120 134 Q90 132 78 110 Z" fill={hair} opacity={0.28} />;
  if (kind === 2)
    return (
      <g>
        <path d="M76 104 Q80 146 120 150 Q160 146 164 104 Q156 124 140 128 Q130 120 120 122 Q110 120 100 128 Q84 124 76 104 Z" fill={hair} stroke={OL} strokeWidth={2.2} strokeLinejoin="round" />
      </g>
    );
  return null;
}

function Ears({ skin, cauli }: { skin: string; cauli: boolean }) {
  return (
    <g>
      {cauli ? (
        <g>
          {[
            [72, 94, 8],
            [70, 104, 8],
            [75, 110, 6.5],
            [73, 99, 6],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={shade(skin, -0.12)} stroke={OL} strokeWidth={2} />
          ))}
          <path d="M70 98 Q74 102 71 106" fill="none" stroke="#a0606e" strokeWidth={1.4} />
        </g>
      ) : (
        <ellipse cx={74} cy={102} rx={8} ry={11} fill={skin} stroke={OL} strokeWidth={2.2} />
      )}
      <ellipse cx={166} cy={102} rx={8} ry={11} fill={skin} stroke={OL} strokeWidth={2.2} />
    </g>
  );
}

function Headgear({ art }: { art?: ItemDef["art"] }) {
  if (!art) return null;
  if (art.style === "band") {
    return (
      <g>
        <path d="M74 76 Q120 60 166 76 L166 88 Q120 72 74 88 Z" fill={art.c} stroke={OL} strokeWidth={2.2} strokeLinejoin="round" />
        <path d="M166 80 Q186 86 192 104 Q182 96 170 92 Z M166 82 Q188 80 198 92 Q184 90 170 88 Z" fill={art.c} stroke={OL} strokeWidth={2} strokeLinejoin="round" />
        <circle cx={120} cy={73} r={4.5} fill={art.c === "#f4f1ea" ? "#c8302a" : "#fff"} opacity={0.9} />
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
  return null;
}

function GiPants({ b, c, skin }: { b: number; c: string; skin: string }) {
  return (
    <g>
      {[-1, 1].map((s) => (
        <g key={s}>
          <path
            d={`M${CX + s * 2} 226 L${CX + s * 32 * b} 226 L${CX + s * 29 * b} 292 L${CX + s * 5} 292 Z`}
            fill={c}
            stroke={OL}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
          <line x1={CX + s * 6} y1={286} x2={CX + s * 28 * b} y2={286} stroke={shade(c, -0.15)} strokeWidth={2} />
          <ellipse cx={CX + s * 17 * b} cy={298} rx={13} ry={6.5} fill={skin} stroke={OL} strokeWidth={2.2} />
        </g>
      ))}
    </g>
  );
}

function NoGiLegs({ b, art, skin, knee, uid }: { b: number; art: ItemDef["art"]; skin: string; knee: boolean; uid: string }) {
  const c = art.c ?? "#1d1d26";
  const spats = art.style === "spats";
  return (
    <g>
      {[-1, 1].map((s) => (
        <g key={s}>
          <path
            d={`M${CX + s * 4} 226 L${CX + s * 27 * b} 226 L${CX + s * 25 * b} 292 L${CX + s * 8} 292 Z`}
            fill={spats ? c : skin}
            stroke={OL}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
          {spats && art.pattern ? (
            <g clipPath={`url(#leg${uid}${s})`}>
              <clipPath id={`leg${uid}${s}`}>
                <path d={`M${CX + s * 4} 226 L${CX + s * 27 * b} 226 L${CX + s * 25 * b} 292 L${CX + s * 8} 292 Z`} />
              </clipPath>
              {art.pattern === "wave"
                ? [240, 256, 272].map((y) => <path key={y} d={`M${CX - 40} ${y} q8 -6 16 0 t16 0 t16 0 t16 0 t16 0`} fill="none" stroke={art.c2} strokeWidth={2.2} />)
                : Array.from({ length: 10 }, (_, i) => <circle key={i} cx={CX + s * (8 + ((i * 7) % 18))} cy={232 + ((i * 13) % 56)} r={1.4} fill={art.c2} />)}
            </g>
          ) : null}
          {knee && !spats ? <rect x={s < 0 ? CX - 26 * b : CX + 6} y={262} width={20 * b} height={15} rx={4} fill="#2a2a36" stroke={OL} strokeWidth={2} /> : null}
          <ellipse cx={CX + s * 16 * b} cy={298} rx={12} ry={6.5} fill={skin} stroke={OL} strokeWidth={2.2} />
        </g>
      ))}
      {!spats ? (
        <path
          d={`M${CX - 38 * b} 222 L${CX + 38 * b} 222 L${CX + 33 * b} 262 L${CX + 3} 262 L${CX} 248 L${CX - 3} 262 L${CX - 33 * b} 262 Z`}
          fill={c}
          stroke={OL}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
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
      {/* skirt of the jacket below the belt */}
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

function TopPattern({ pattern, c2, b }: { pattern: string; c2: string; b: number }) {
  switch (pattern) {
    case "rank":
      return (
        <g fill={c2}>
          <rect x={CX - 50 * b} y={140} width={16 * b} height={100} />
          <rect x={CX + 34 * b} y={140} width={16 * b} height={100} />
        </g>
      );
    case "wave":
      return (
        <g fill="none" stroke={c2} strokeWidth={3}>
          {[180, 198, 216].map((y) => (
            <path key={y} d={`M${CX - 60} ${y} q10 -8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0`} />
          ))}
        </g>
      );
    case "bolt":
      return <polygon points={`${CX + 6},148 ${CX - 16},190 ${CX},190 ${CX - 12},232 ${CX + 22},180 ${CX + 6},180 ${CX + 20},148`} fill={c2} />;
    case "petals":
      return (
        <g fill={c2}>
          {Array.from({ length: 12 }, (_, i) => {
            const x = CX - 40 + ((i * 29) % 80);
            const y = 156 + ((i * 17) % 74);
            return <ellipse key={i} cx={x} cy={y} rx={5} ry={3} transform={`rotate(${i * 33} ${x} ${y})`} />;
          })}
        </g>
      );
    case "tiger":
      return (
        <g fill={c2}>
          {[160, 182, 204, 224].map((y, i) => (
            <g key={y}>
              <path d={`M${CX - 60} ${y} Q${CX - 30} ${y - 6 + i} ${CX - 12} ${y + 6} Q${CX - 34} ${y + 2} ${CX - 60} ${y + 8} Z`} />
              <path d={`M${CX + 60} ${y + 4} Q${CX + 30} ${y - 2} ${CX + 12} ${y + 10} Q${CX + 34} ${y + 6} ${CX + 60} ${y + 12} Z`} />
            </g>
          ))}
        </g>
      );
    case "stars":
      return (
        <g fill={c2}>
          {Array.from({ length: 16 }, (_, i) => (
            <circle key={i} cx={CX - 42 + ((i * 23) % 84)} cy={154 + ((i * 31) % 76)} r={i % 4 === 0 ? 2.4 : 1.2} />
          ))}
          <path d={`M${CX - 30} 170 L${CX - 8} 184 L${CX + 18} 176 L${CX + 30} 196`} fill="none" stroke={c2} strokeWidth={1} opacity={0.7} />
        </g>
      );
    case "flame":
      return (
        <g fill={c2} opacity={0.9}>
          {[-30, -8, 14, 34].map((dx, i) => (
            <path key={dx} d={`M${CX + dx - 12} 234 Q${CX + dx - 14} ${200 - i * 6} ${CX + dx} ${176 - (i % 2) * 14} Q${CX + dx + 14} ${204 - i * 4} ${CX + dx + 12} 234 Z`} />
          ))}
        </g>
      );
    default:
      return <path d={`M${CX - 60} 196 L${CX + 60} 168 L${CX + 60} 178 L${CX - 60} 206 Z`} fill={c2} opacity={0.8} />;
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
    const bg = e === "tokui" ? "#f1bf57" : e === "crown" ? "#2a1330" : "#141c34";
    const fg = e === "tokui" ? "#1c1526" : "#f1bf57";
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

function Medal() {
  return (
    <g>
      <path d={`M${CX - 12} 146 L${CX} 188 L${CX + 12} 146`} fill="none" stroke="#c8302a" strokeWidth={5} />
      <circle cx={CX} cy={194} r={10} fill="#f1bf57" stroke={OL} strokeWidth={2.2} />
      <path d={`M${CX} 187 L${CX + 2} 192 L${CX + 7} 194 L${CX + 2} 196 L${CX} 201 L${CX - 2} 196 L${CX - 7} 194 L${CX - 2} 192 Z`} fill="#fff3d0" />
    </g>
  );
}
