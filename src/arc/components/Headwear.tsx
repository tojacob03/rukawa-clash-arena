// Headwear of the countries (see core/headwear.ts), drawn for the avatar's
// head: 240 wide, the skull from x 74 to 166 with its crown at y 48. Every
// hat is built from a few flat shapes with the avatar's outline, so it sits
// in the same drawing as the face below it.

import type { ReactNode } from "react";
import type { ItemArt } from "../core/items.ts";
import { shade } from "../avatarOptions.ts";

const OL = "#1c1526";
const WHITE = "#f4f1ea";
const line = { stroke: OL, strokeWidth: 2.2, strokeLinejoin: "round" as const };
const thin = { stroke: OL, strokeWidth: 1.6, strokeLinejoin: "round" as const };

/** True for colours dark enough to need light texture. */
function dark(c: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(c);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 110;
}
/** Texture on a colour: lighter on dark cloth, darker on light cloth. */
const tex = (c: string, k = 0.3) => (dark(c) ? shade(c, k + 0.1) : shade(c, -k * 0.8));

/** A quadratic curve's y at x, for a curve from (x0,y0) over (mid x, yc) to (x1,y0). */
const qy = (x: number, x0: number, x1: number, y0: number, yc: number) => {
  const t = (x - x0) / (x1 - x0);
  return y0 + 2 * t * (1 - t) * (yc - y0);
};

function star(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}

/** Rows of small curls, the texture of lambskin. */
function curls(c: string, rows: number[], x0: number, x1: number, step = 9) {
  const k = tex(c, 0.28);
  return (
    <g fill="none" stroke={k} strokeWidth={1.3} strokeLinecap="round">
      {rows.map((y, r) => {
        const out: ReactNode[] = [];
        for (let x = x0 + (r % 2 ? step / 2 : 0); x <= x1; x += step) out.push(<path key={x} d={`M${x - 3} ${y} a3 3 0 1 1 6 0`} />);
        return <g key={y}>{out}</g>;
      })}
    </g>
  );
}

/** Short strokes, the texture of fur. */
function fur(c: string, pts: [number, number][]) {
  return (
    <g stroke={tex(c, 0.25)} strokeWidth={1.4} strokeLinecap="round" fill="none">
      {pts.map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} l${i % 2 ? 2 : -2} -4`} />
      ))}
    </g>
  );
}

const grid = (x0: number, x1: number, y0: number, y1: number, sx: number, sy: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = y0, r = 0; y <= y1; y += sy, r++) for (let x = x0 + (r % 2 ? sx / 2 : 0); x <= x1; x += sx) out.push([x, y]);
  return out;
};

const PAPAKHA = "M82 74 L80 38 Q80 29 92 27 Q120 22 148 27 Q160 29 160 38 L158 74 Q120 64 82 74 Z";

export default function Headwear({ art, uid }: { art: ItemArt; uid: string }) {
  const c = art.c ?? WHITE;
  const c2 = art.c2 ?? shade(c, -0.3);
  const c3 = art.c3 ?? c2;
  const clip = (id: string) => `url(#hw${id}${uid})`;
  switch (art.style) {
    case "band": {
      // A hachimaki: a white one carries the red sun, a striped one the colours of a flag.
      const cs = art.cs ?? [c];
      const n = cs.length;
      const top = (x: number) => qy(x, 74, 166, 76, 60);
      return (
        <g>
          <path d="M166 80 Q186 86 192 104 Q182 96 170 92 Z" fill={cs[n - 1]} {...line} strokeWidth={2} />
          <path d="M166 82 Q188 80 198 92 Q184 90 170 88 Z" fill={cs[0]} {...line} strokeWidth={2} />
          {cs.map((k, i) => {
            const t0 = (12 * i) / n;
            const t1 = (12 * (i + 1)) / n;
            return <path key={i} d={`M74 ${76 + t0} Q120 ${60 + t0} 166 ${76 + t0} L166 ${76 + t1} Q120 ${60 + t1} 74 ${76 + t1} Z`} fill={k} />;
          })}
          {art.trim === "check" || art.trim === "kente"
            ? [82, 90, 98, 106, 114, 122, 130, 138, 146, 154, 162].map((x, i) =>
                art.trim === "kente" ? (
                  i % 2 ? <rect key={x} x={x - 2} y={top(x) + 4} width={4} height={4} fill={c2} /> : null
                ) : (
                  <path key={x} d={`M${x} ${top(x)} l0 12`} stroke={c2} strokeWidth={1.4} opacity={0.75} />
                ),
              )
            : null}
          <path d="M74 76 Q120 60 166 76 L166 88 Q120 72 74 88 Z" fill="none" {...line} />
          {!art.cs ? <circle cx={120} cy={73} r={4.5} fill={c === WHITE ? "#c8302a" : "#fff"} opacity={0.9} /> : null}
        </g>
      );
    }
    case "sombrero":
      return (
        <g>
          <ellipse cx={120} cy={68} rx={80} ry={14} fill={c} {...line} />
          <ellipse cx={120} cy={68} rx={72} ry={10.5} fill="none" stroke={c2} strokeWidth={2.4} strokeDasharray="5 4" />
          <ellipse cx={120} cy={68} rx={64} ry={8} fill="none" stroke={c3} strokeWidth={1.4} strokeDasharray="2 5" />
          <path d="M94 70 Q92 42 104 30 Q120 20 136 30 Q148 42 146 70 Q120 76 94 70 Z" fill={shade(c, 0.04)} {...line} />
          <path d="M94.6 61 Q120 67 145.4 61 L146 69 Q120 75 94 69 Z" fill={c2} {...thin} />
          <path d="M100 66 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3" fill="none" stroke={c3} strokeWidth={1.3} />
          <path d="M106 34 Q112 28 121 27" fill="none" stroke="#fff" strokeWidth={2} opacity={0.35} strokeLinecap="round" />
        </g>
      );
    case "beret":
      return (
        <g>
          <path d="M70 74 Q64 50 96 38 Q134 28 164 42 Q182 54 168 72 Q120 58 70 74 Z" fill={c} {...line} />
          {art.trim === "tam" ? (
            <g>
              <path d="M72 70 Q120 56 166 67" fill="none" stroke={c2} strokeWidth={5} />
              <path d="M72 70 Q120 56 166 67" fill="none" stroke={c3} strokeWidth={5} strokeDasharray="4 4" />
              <circle cx={126} cy={33} r={8.5} fill={c2} {...line} />
              <path d="M121 30 l3 3 M128 28 l-2 4 M130 35 l-4 -1" stroke={shade(c2, -0.3)} strokeWidth={1.2} />
            </g>
          ) : (
            <g>
              <path d="M73 70 Q120 56 166 67" fill="none" stroke={tex(c, 0.25)} strokeWidth={1.4} />
              <path d="M117 38 L119 30" stroke={OL} strokeWidth={4.6} strokeLinecap="round" />
              <path d="M117 38 L119 30" stroke={c} strokeWidth={2.4} strokeLinecap="round" />
            </g>
          )}
          <path d="M92 46 Q110 38 132 38" fill="none" stroke={tex(c, 0.3)} strokeWidth={1.6} strokeLinecap="round" opacity={0.8} />
        </g>
      );
    case "flatcap":
      return (
        <g>
          <path d="M72 76 Q66 52 100 42 Q140 34 164 50 Q174 60 166 72 Q120 60 72 76 Z" fill={c} {...line} />
          <path d="M100 43 Q114 54 126 58" fill="none" stroke={shade(c, -0.25)} strokeWidth={1.3} />
          <g fill={c2}>
            {[
              [92, 56],
              [108, 48],
              [124, 50],
              [140, 46],
              [152, 58],
              [100, 64],
              [136, 58],
              [84, 66],
              [116, 42],
            ].map(([x, y]) => (
              <circle key={`${x}${y}`} cx={x} cy={y} r={1.3} />
            ))}
          </g>
          <path d="M82 72 Q120 58 160 68 Q158 80 120 82 Q92 82 82 72 Z" fill={shade(c, -0.14)} {...line} />
          <path d="M92 76 Q120 78 150 73" fill="none" stroke={shade(c, 0.2)} strokeWidth={1.2} opacity={0.6} />
        </g>
      );
    case "bowler":
      return (
        <g>
          <path d="M62 64 Q66 58 78 60 Q120 66 162 60 Q174 58 178 64 Q176 72 162 72 Q120 76 78 72 Q64 72 62 64 Z" fill={c} {...line} />
          <path d="M82 66 Q78 28 120 24 Q162 28 158 66 Q120 72 82 66 Z" fill={c} {...line} />
          <path d="M82.4 58 Q120 64 157.6 58 L158 66 Q120 72 82 66 Z" fill={c2} {...thin} />
          <path d="M96 36 Q106 29 122 27" fill="none" stroke="#fff" strokeWidth={2.2} opacity={0.25} strokeLinecap="round" />
        </g>
      );
    case "tyrolean": {
      const band = (x: number) => qy(x, 88.5, 151.5, 63.5, 69.5);
      return (
        <g>
          <path d="M60 66 Q62 58 76 62 Q120 70 164 62 Q178 58 180 66 Q176 76 160 75 Q120 80 80 75 Q64 76 60 66 Z" fill={shade(c, -0.08)} {...line} />
          <path d="M88 68 Q86 44 96 32 Q108 38 120 34 Q132 38 144 32 Q154 44 152 68 Q120 74 88 68 Z" fill={c} {...line} />
          <path d="M100 36 Q120 44 140 36" fill="none" stroke={tex(c, 0.25)} strokeWidth={1.4} />
          <path d="M88.5 60 Q120 66 151.5 60 L152 67 Q120 73 88 67 Z" fill={c2} {...thin} />
          {art.trim === "feather" ? <path d="M89 63.5 Q120 69.5 151 63.5" fill="none" stroke={WHITE} strokeWidth={2} strokeDasharray="3 3" /> : null}
          {art.trim === "shells"
            ? [94, 102, 110, 118, 126, 134, 142].map((x) => <ellipse key={x} cx={x} cy={band(x)} rx={2.4} ry={1.7} fill={c3} stroke={OL} strokeWidth={0.6} />)
            : null}
          {art.trim === "feather" ? (
            <g>
              <path d="M146 62 Q150 42 166 24 Q172 20 170 28 Q158 44 152 62 Z" fill={c3} {...thin} />
              <path d="M166 24 Q176 22 174 32" fill="none" stroke={c3} strokeWidth={3} strokeLinecap="round" />
            </g>
          ) : null}
          {art.trim === "crane" ? (
            <g>
              <path d="M144 62 Q148 38 164 14 Q160 40 151 62 Z" fill={c3} {...thin} />
              <path d="M147.5 60 Q152 38 162 20" fill="none" stroke={shade(c3, -0.3)} strokeWidth={0.9} />
            </g>
          ) : null}
          {art.trim === "gamsbart" ? (
            <g strokeLinecap="round" fill="none">
              {[-30, -18, -6, 6, 18].map((a, i) => {
                const r = (a * Math.PI) / 180;
                const x = 150 + 30 * Math.sin(r);
                const y = 60 - 30 * Math.cos(r);
                return (
                  <g key={a}>
                    <path d={`M150 61 Q${150 + 10 * Math.sin(r)} ${48} ${x.toFixed(1)} ${y.toFixed(1)}`} stroke={c3} strokeWidth={2.6} />
                    <path d={`M${(150 + 22 * Math.sin(r)).toFixed(1)} ${(60 - 22 * Math.cos(r)).toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)}`} stroke={shade(c3, 0.55)} strokeWidth={2} opacity={i % 2 ? 0.9 : 0.7} />
                  </g>
                );
              })}
              <ellipse cx={150} cy={62} rx={4} ry={3} fill="#c9ced6" stroke={OL} strokeWidth={1} />
            </g>
          ) : null}
        </g>
      );
    }
    case "cap": {
      const t = art.trim;
      const body =
        t === "qeleshe"
          ? "M80 72 Q76 30 120 28 Q164 30 160 72 Q120 62 80 72 Z"
          : t === "doppi"
            ? "M80 72 L82 46 Q120 38 158 46 L160 72 Q120 62 80 72 Z"
            : t === "peci"
              ? "M80 72 L84 44 Q120 38 156 44 L160 72 Q120 64 80 72 Z"
              : t === "kumma"
                ? "M80 72 Q80 46 120 44 Q160 46 160 72 Q120 62 80 72 Z"
                : "M80 72 Q78 42 120 38 Q162 42 160 72 Q120 62 80 72 Z";
      return (
        <g>
          <defs>
            <clipPath id={`hwcap${uid}`}>
              <path d={body} />
            </clipPath>
          </defs>
          <path d={body} fill={c} {...line} />
          <g clipPath={clip("cap")}>
            {t === "kaeppi" ? (
              <g>
                <path d="M78 74 Q120 62 162 74 L162 66 Q120 54 78 66 Z" fill={c3} />
                <path d="M80 70 Q120 58 160 70" fill="none" stroke={c2} strokeWidth={1.6} strokeDasharray="1.5 3" />
              </g>
            ) : null}
            {t === "guapi" ? (
              <g fill="none" stroke={tex(c, 0.25)} strokeWidth={1.2}>
                <path d="M120 38 Q98 44 90 68 M120 38 Q108 48 104 66 M120 38 L120 64 M120 38 Q132 48 136 66 M120 38 Q142 44 150 68" />
                <path d="M78 74 Q120 62 162 74 L162 67 Q120 55 78 67 Z" fill={shade(c, 0.12)} stroke="none" />
              </g>
            ) : null}
            {t === "doppi"
              ? [96, 120, 144].map((x) => (
                  <g key={x}>
                    <path d={`M${x} ${x === 120 ? 47 : 50} q7 6 0 14 q-7 -6 0 -14 Z`} fill={c2} />
                    <path d={`M${x} ${x === 120 ? 47 : 50} q-4 -4 -1 -6`} fill="none" stroke={c2} strokeWidth={1.2} />
                  </g>
                ))
              : null}
            {t === "doppi" ? <path d="M82 46 Q120 54 158 46" fill="none" stroke={tex(c, 0.3)} strokeWidth={1.4} /> : null}
            {t === "kumma" ? (
              <g>
                {[84, 92, 100, 108, 116, 124, 132, 140, 148, 156].map((x, i) => (
                  <g key={x}>
                    <circle cx={x} cy={qy(x, 80, 160, 64, 55)} r={2.2} fill={i % 2 ? c2 : c3} />
                    <path d={`M${x - 3} ${qy(x, 80, 160, 56, 49) + 2} l3 -4 l3 4`} fill="none" stroke={i % 2 ? c3 : c2} strokeWidth={1.2} />
                  </g>
                ))}
                <path d={star(120, 47, 4)} fill={c2} />
              </g>
            ) : null}
            {t === "peci" ? (
              <g>
                <ellipse cx={120} cy={43} rx={36} ry={5.5} fill={shade(c, 0.14)} />
                <path d="M92 50 L89 66" stroke="#fff" strokeWidth={2} opacity={0.18} strokeLinecap="round" />
              </g>
            ) : null}
            {t === "qeleshe" ? <path d="M146 36 Q160 50 158 72 L170 72 L166 30 Z" fill={shade(c, -0.12)} /> : null}
          </g>
          <path d={body} fill="none" {...line} />
          {t === "peci" ? <ellipse cx={120} cy={43} rx={36} ry={5.5} fill="none" {...thin} /> : null}
          {t === "kaeppi" ? (
            <g>
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <ellipse key={a} cx={120} cy={49} rx={2} ry={4.6} fill={c2} transform={`rotate(${a} 120 53)`} />
              ))}
              <circle cx={120} cy={53} r={2.2} fill="#e0b040" />
            </g>
          ) : null}
          {t === "guapi" ? <circle cx={120} cy={37} r={4.5} fill={c2} {...thin} /> : null}
          {t === "qeleshe" ? <path d="M96 38 Q104 32 116 31" fill="none" stroke="#fff" strokeWidth={2} opacity={0.6} strokeLinecap="round" /> : null}
        </g>
      );
    }
    case "fez":
      return art.trim === "short" ? (
        <g>
          <path d="M82 72 Q80 44 120 42 Q160 44 158 72 Q120 62 82 72 Z" fill={c} {...line} />
          <path d="M98 46 Q120 52 142 46" fill="none" stroke={shade(c, -0.28)} strokeWidth={1.4} />
          <path d="M92 52 Q96 48 102 47" fill="none" stroke="#fff" strokeWidth={1.8} opacity={0.3} strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <path d="M90 72 L96 34 Q120 30 144 34 L150 72 Q120 64 90 72 Z" fill={c} {...line} />
          <ellipse cx={120} cy={34} rx={24} ry={4.5} fill={shade(c, -0.2)} {...thin} />
          <path d="M100 42 L97 64" stroke="#fff" strokeWidth={2} opacity={0.22} strokeLinecap="round" />
          <path d="M120 33 Q138 30 147 41" fill="none" stroke={c2} strokeWidth={1.8} />
          <path d="M144 41 L150 41 L153 62 Q147 65 141 62 Z" fill={c2} {...thin} />
          <path d="M144 50 L143 61 M147 50 L147 62 M150 50 L151 61" stroke={shade(c2, 0.35)} strokeWidth={0.8} />
        </g>
      );
    case "keffiyeh": {
      const cloth = "M64 150 Q58 70 80 46 Q120 22 160 46 Q182 70 176 150 L160 150 Q162 96 156 80 Q120 64 84 80 Q78 96 80 150 Z";
      return (
        <g>
          <defs>
            <clipPath id={`hwkef${uid}`}>
              <path d={cloth} />
            </clipPath>
          </defs>
          <path d={cloth} fill={c} {...line} />
          <g clipPath={clip("kef")}>
            {art.trim === "pattern" ? (
              <g fill="none" stroke={c3} strokeLinecap="round">
                <path d="M69 150 Q64 74 84 54 Q120 34 156 54 Q176 74 171 150" strokeWidth={2} strokeDasharray="0.1 4.5" />
                <path d="M74 150 Q70 80 90 60 Q120 44 150 60 Q170 80 166 150" strokeWidth={2} strokeDasharray="0.1 4.5" />
                <path d="M86 90 Q84 120 86 150 M154 90 Q156 120 154 150" strokeWidth={1.6} strokeDasharray="3 2.5" />
                <path d="M84 78 Q120 62 156 78" strokeWidth={2.4} strokeDasharray="3 2" />
              </g>
            ) : (
              <path d="M150 50 Q176 72 172 150 L180 150 L180 40 Z" fill={shade(c, -0.08)} />
            )}
          </g>
          <path d="M84 80 Q120 64 156 80" fill="none" stroke={shade(c, -0.18)} strokeWidth={3} />
          <path d="M84 80 Q120 64 156 80" fill="none" {...thin} />
          <path d="M64 150 L80 150 M160 150 L176 150" stroke={OL} strokeWidth={2} />
          {art.trim === "pattern" ? <path d="M66 151 l0 5 M70 151 l0 5 M74 151 l0 5 M78 151 l0 5 M162 151 l0 5 M166 151 l0 5 M170 151 l0 5 M174 151 l0 5" stroke={c3} strokeWidth={1.3} /> : null}
          <ellipse cx={120} cy={47} rx={40} ry={9} fill="none" stroke={OL} strokeWidth={6.4} />
          <ellipse cx={120} cy={47} rx={40} ry={9} fill="none" stroke={c2} strokeWidth={4} />
          <ellipse cx={120} cy={53} rx={42} ry={9.5} fill="none" stroke={OL} strokeWidth={6.4} />
          <ellipse cx={120} cy={53} rx={42} ry={9.5} fill="none" stroke={c2} strokeWidth={4} />
        </g>
      );
    }
    case "papakha":
      return (
        <g>
          <path d={PAPAKHA} fill={c} {...line} />
          {curls(c, [34, 42, 50, 58], 88, 152)}
          <path d="M81 36 Q120 44 159 36" fill="none" stroke={tex(c, 0.35)} strokeWidth={1.4} />
          <path d={PAPAKHA} fill="none" {...line} />
        </g>
      );
    case "kalpak":
      return (
        <g>
          <path d="M84 72 L84 46 Q120 38 156 46 L156 72 Q120 64 84 72 Z" fill={c} {...line} />
          {curls(c, [46, 54, 62], 90, 150)}
          <path d="M84 46 Q120 54 156 46" fill="none" stroke={tex(c, 0.35)} strokeWidth={1.4} />
          <path d="M84 72 L84 46 Q120 38 156 46 L156 72 Q120 64 84 72 Z" fill="none" {...line} />
        </g>
      );
    case "borik":
      return (
        <g>
          <path d="M88 62 Q86 32 120 30 Q154 32 152 62 Z" fill={c2} {...line} />
          <path d="M112 52 q-8 -8 -1 -13 q5 -2 5 4 M128 52 q8 -8 1 -13 q-5 -2 -5 4 M120 54 L120 38" fill="none" stroke={c3} strokeWidth={1.6} strokeLinecap="round" />
          <path d="M96 40 Q104 34 114 33" fill="none" stroke="#fff" strokeWidth={1.8} opacity={0.25} strokeLinecap="round" />
          <path d="M80 74 Q78 60 88 57 Q120 51 152 57 Q162 60 160 74 Q120 64 80 74 Z" fill={c} {...line} />
          {fur(c, grid(86, 154, 62, 68, 6, 5))}
          <path d="M80 74 Q78 60 88 57 Q120 51 152 57 Q162 60 160 74 Q120 64 80 74 Z" fill="none" {...line} />
        </g>
      );
    case "ushanka":
      return (
        <g>
          <path d="M72 70 Q66 98 72 118 Q80 124 86 114 L86 74 Z" fill={c2} {...line} />
          <path d="M168 70 Q174 98 168 118 Q160 124 154 114 L154 74 Z" fill={c2} {...line} />
          {fur(c2, [
            [76, 88],
            [80, 98],
            [76, 108],
            [164, 88],
            [160, 98],
            [164, 108],
          ])}
          <path d="M80 66 Q80 34 120 32 Q160 34 160 66 Z" fill={c} {...line} />
          <path d="M94 44 Q106 36 120 35" fill="none" stroke={tex(c, 0.3)} strokeWidth={1.4} />
          <path d="M74 74 Q74 54 120 52 Q166 54 166 74 Q120 64 74 74 Z" fill={c2} {...line} />
          {fur(c2, grid(82, 158, 60, 66, 7, 5))}
          <path d="M74 74 Q74 54 120 52 Q166 54 166 74 Q120 64 74 74 Z" fill="none" {...line} />
        </g>
      );
    case "wreath": {
      const t = art.trim;
      const N = t === "oak" ? 18 : t === "hibiscus" ? 11 : 13;
      const spots = Array.from({ length: N }, (_, i) => {
        const a = (i / N) * Math.PI * 2 + 0.12;
        return { i, x: 120 + 50 * Math.cos(a), y: 58 + 13 * Math.sin(a), front: Math.sin(a) > 0, tan: (Math.atan2(13 * Math.cos(a), -50 * Math.sin(a)) * 180) / Math.PI };
      }).sort((a, b) => a.y - b.y);
      const flowerC = [c2, c3, art.cs?.[0] ?? c2];
      const flower = (x: number, y: number, r: number, k: string, key: number) => (
        <g key={key}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={x + r * 0.62 * Math.cos((a * Math.PI) / 180)} cy={y + r * 0.62 * Math.sin((a * Math.PI) / 180)} r={r * 0.56} fill={k} stroke={OL} strokeWidth={0.9} />
          ))}
          <circle cx={x} cy={y} r={r * 0.34} fill={k === c3 ? shade(c3, -0.4) : "#f7d24a"} />
        </g>
      );
      return (
        <g>
          {art.cs
            ? art.cs.map((k, i) => {
                const x = i < art.cs!.length / 2 ? 66 + i * 5 : 164 + (i - art.cs!.length / 2) * 5;
                return <path key={i} d={`M${x} 62 Q${x - 5} 100 ${x + 3} 146`} fill="none" stroke={k} strokeWidth={4.4} strokeLinecap="round" />;
              })
            : null}
          <ellipse cx={120} cy={58} rx={50} ry={13} fill="none" stroke={OL} strokeWidth={7} />
          <ellipse cx={120} cy={58} rx={50} ry={13} fill="none" stroke={c} strokeWidth={4.6} />
          {spots.map((s) => {
            const r = s.front ? 7 : 5.2;
            if (t === "oak")
              return (
                <g key={s.i}>
                  <ellipse cx={s.x} cy={s.y} rx={r + 1.5} ry={r * 0.5} fill={s.i % 2 ? c : shade(c, 0.18)} stroke={OL} strokeWidth={1} transform={`rotate(${s.tan + (s.i % 2 ? 28 : -28)} ${s.x} ${s.y})`} />
                  {s.i % 5 === 0 && s.front ? <ellipse cx={s.x + 2} cy={s.y + 4} rx={2.4} ry={3} fill={c2} stroke={OL} strokeWidth={0.8} /> : null}
                </g>
              );
            if (t === "hibiscus")
              return (
                <g key={s.i}>
                  <ellipse cx={s.x + 4} cy={s.y - 2} rx={r * 0.9} ry={r * 0.4} fill={c} stroke={OL} strokeWidth={0.9} transform={`rotate(${s.tan} ${s.x} ${s.y})`} />
                  {s.i % 2 ? flower(s.x, s.y, r + 1, c2, s.i) : flower(s.x, s.y, r, c3, s.i)}
                </g>
              );
            return flower(s.x, s.y, r, flowerC[s.i % 3], s.i);
          })}
        </g>
      );
    }
    case "knit": {
      const body = "M76 74 Q72 38 120 34 Q168 38 164 74 Z";
      return (
        <g>
          <defs>
            <clipPath id={`hwknit${uid}`}>
              <path d={body} />
            </clipPath>
          </defs>
          <path d={body} fill={c} {...line} />
          <g clipPath={clip("knit")}>
            <path d="M70 52 l7 -6 l7 6 l7 -6 l7 6 l7 -6 l7 6 l7 -6 l7 6 l7 -6 l7 6 l7 -6 l7 6 l7 -6 l7 6" fill="none" stroke={c2} strokeWidth={2.4} />
            {[84, 98, 112, 126, 140, 154].map((x) => (
              <path key={x} d={star(x, 60, 2.6)} fill={c2} />
            ))}
            <path d="M70 43 L170 43" stroke={c2} strokeWidth={1.6} strokeDasharray="2 3" />
          </g>
          <path d={body} fill="none" {...line} />
          <path d="M74 80 Q120 66 166 80 L166 68 Q120 54 74 68 Z" fill={c} {...line} />
          {[80, 86, 92, 98, 104, 110, 116, 122, 128, 134, 140, 146, 152, 158].map((x) => {
            const y = qy(x, 74, 166, 68, 54);
            return <path key={x} d={`M${x} ${y + 1} l0 10`} stroke={tex(c, 0.25)} strokeWidth={1.1} />;
          })}
          <circle cx={120} cy={32} r={10} fill={c2} {...line} />
          <path d="M114 28 l3 3 M122 25 l-1 4 M126 31 l-4 1 M117 36 l2 -3" stroke={tex(c2, 0.3)} strokeWidth={1.2} strokeLinecap="round" />
        </g>
      );
    }
    case "svan":
      return (
        <g>
          <path d="M80 68 Q78 42 120 40 Q162 42 160 68 Q120 58 80 68 Z" fill={c} {...line} />
          <path d="M82 64 Q120 54 158 64" fill="none" stroke={c2} strokeWidth={1.4} strokeDasharray="3 2" />
          <path d="M120 42 L120 60 M100 50 Q120 46 140 50" fill="none" stroke={c2} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M96 48 l-4 -3 M96 48 l-4 3 M144 48 l4 -3 M144 48 l4 3" stroke={c2} strokeWidth={1.4} strokeLinecap="round" />
          <path d="M80 68 Q120 58 160 68" fill="none" stroke={c2} strokeWidth={3.2} />
          <path d="M80 68 Q78 42 120 40 Q162 42 160 68" fill="none" {...line} />
        </g>
      );
    case "akkalpak":
      return (
        <g>
          <path d="M88 66 Q88 38 110 22 Q120 14 130 22 Q152 38 152 66 Z" fill={c} {...line} />
          <path d="M104 32 Q120 42 136 32 M98 44 Q120 54 142 44" fill="none" stroke={c2} strokeWidth={1.3} />
          <path d="M110 24 Q112 40 108 60 M130 24 Q128 40 132 60" fill="none" stroke={shade(c, -0.12)} strokeWidth={1.2} />
          <path d="M120 17 L120 10" stroke={c2} strokeWidth={2} strokeLinecap="round" />
          <circle cx={120} cy={9} r={2.6} fill={c2} />
          <path d="M82 72 Q84 56 116 58 L120 66 L124 58 Q156 56 158 72 Q120 62 82 72 Z" fill={c2} {...line} />
        </g>
      );
    case "janjin":
      return (
        <g>
          <path d="M156 60 Q170 80 168 112 M160 60 Q178 78 178 106" fill="none" stroke={c3} strokeWidth={4} strokeLinecap="round" />
          <path d="M84 68 Q84 46 104 36 Q116 30 120 26 Q124 30 136 36 Q156 46 156 68 Z" fill={c} {...line} />
          <path d="M120 28 Q112 46 104 62 M120 28 Q128 46 136 62 M120 28 L120 62" fill="none" stroke={c2} strokeWidth={1.2} />
          <path d="M120 21 L120 14" stroke={c2} strokeWidth={2} strokeLinecap="round" />
          <circle cx={120} cy={24} r={4.5} fill={c2} {...thin} />
          <path d="M80 72 Q82 60 100 58 L120 64 L140 58 Q158 60 160 72 Q120 62 80 72 Z" fill="#1d1d26" {...line} />
        </g>
      );
    case "gat":
      return (
        <g>
          <ellipse cx={120} cy={60} rx={74} ry={11} fill={c} fillOpacity={0.5} stroke={OL} strokeWidth={2} />
          <ellipse cx={120} cy={60} rx={66} ry={8.5} fill="none" stroke={OL} strokeWidth={0.8} strokeDasharray="1 2.5" opacity={0.7} />
          <path d="M102 60 L104 24 Q120 20 136 24 L138 60 Q120 64 102 60 Z" fill={c} fillOpacity={0.62} {...line} />
          <ellipse cx={120} cy={24} rx={16} ry={3} fill={c} fillOpacity={0.8} {...thin} />
          <path d="M102.3 54 Q120 58 137.7 54 L138 60 Q120 64 102 60 Z" fill={c} {...thin} />
          <path d="M82 66 Q78 110 110 146 M158 66 Q162 110 130 146" fill="none" stroke={c} strokeWidth={1.3} strokeDasharray="4 1.5" />
        </g>
      );
    case "conical": {
      const flat = art.trim === "flat";
      const apex = flat ? 34 : 16;
      const rim = flat ? 70 : 74;
      const x0 = flat ? 44 : 40;
      const x1 = 240 - x0;
      const bot = (x: number) => qy(x, x0, x1, rim, rim + 12);
      return (
        <g>
          <path d={`M${x0} ${rim} L120 ${apex} L${x1} ${rim} Q120 ${rim + 12} ${x0} ${rim} Z`} fill={c} {...line} />
          <g fill="none" stroke={c2} strokeWidth={1} opacity={0.85}>
            {[60, 80, 100, 120, 140, 160, 180].map((x) => (
              <path key={x} d={`M120 ${apex + 2} L${x} ${bot(x) - 1}`} />
            ))}
            {[0.36, 0.7].map((f) => {
              const y = apex + (rim - apex) * f;
              const dx = (x1 - 120) * f;
              return <path key={f} d={`M${120 - dx} ${y} Q120 ${y + 12 * f} ${120 + dx} ${y}`} />;
            })}
          </g>
          <path d={`M${x0} ${rim} Q120 ${rim + 12} ${x1} ${rim}`} fill="none" stroke={shade(c, -0.3)} strokeWidth={2.4} />
          <path d={`M${x0} ${rim} L120 ${apex} L${x1} ${rim} Q120 ${rim + 12} ${x0} ${rim} Z`} fill="none" {...line} />
          {flat ? <circle cx={120} cy={apex} r={3} fill={c2} {...thin} /> : null}
        </g>
      );
    }
    case "mongkol":
      return (
        <g>
          <path d="M158 68 Q182 58 186 32 Q190 26 190 36 Q188 60 162 76 Z" fill={c} {...line} />
          <path d="M163 66 Q180 56 184 38" fill="none" stroke={c2} strokeWidth={1.6} strokeDasharray="3 4" />
          <path d="M72 76 Q120 58 168 76" fill="none" stroke={OL} strokeWidth={10} strokeLinecap="round" />
          <path d="M72 76 Q120 58 168 76" fill="none" stroke={c} strokeWidth={7} strokeLinecap="round" />
          <path d="M72 76 Q120 58 168 76" fill="none" stroke={c2} strokeWidth={7} strokeDasharray="2.5 6" />
          <path d="M72 76 Q120 58 168 76" fill="none" stroke={c3} strokeWidth={7} strokeDasharray="1.2 7.3" strokeDashoffset={-4} />
        </g>
      );
    case "salakot":
      return (
        <g>
          <path d="M50 72 Q58 40 120 30 Q182 40 190 72 Q120 84 50 72 Z" fill={c} {...line} />
          {[1, 2, 3].map((k) => (
            <path key={k} d={`M${50 + 16 * k} ${72 - 9 * k} Q120 ${84 - 14 * k} ${190 - 16 * k} ${72 - 9 * k}`} fill="none" stroke={shade(c, -0.25)} strokeWidth={1.2} />
          ))}
          <path d="M50 72 Q120 84 190 72" fill="none" stroke={shade(c, -0.35)} strokeWidth={2.6} />
          <path d="M50 72 Q58 40 120 30 Q182 40 190 72 Q120 84 50 72 Z" fill="none" {...line} />
          <path d="M113 33 L120 16 L127 33 Z" fill={c2} {...thin} />
          <circle cx={120} cy={15} r={3.2} fill={c2} {...thin} />
        </g>
      );
    case "wrap": {
      const t = art.trim;
      const body = "M74 76 Q70 38 120 32 Q170 38 166 76 Q120 62 74 76 Z";
      return (
        <g>
          <defs>
            <clipPath id={`hwwrap${uid}`}>
              <path d={body} />
            </clipPath>
          </defs>
          {t === "check" ? (
            <g>
              <path d="M162 58 Q178 48 184 58 Q174 62 164 66 Z" fill={c} {...thin} />
              <path d="M164 64 Q180 70 178 86 Q170 76 162 70 Z" fill={c} {...thin} />
            </g>
          ) : null}
          <path d={body} fill={c} {...line} />
          <g clipPath={clip("wrap")}>
            {t === "pagri" ? (
              <g fill="none" strokeLinecap="round">
                <path d="M70 72 Q108 50 170 50" stroke={c2} strokeWidth={6} />
                <path d="M70 60 Q112 40 170 38" stroke={c3} strokeWidth={5} />
                <path d="M78 48 Q116 32 164 30" stroke={c2} strokeWidth={4} />
                <path d="M70 72 Q108 50 170 50 M70 60 Q112 40 170 38" stroke={OL} strokeWidth={0.8} opacity={0.5} transform="translate(0 3.5)" />
              </g>
            ) : null}
            {t === "fringe" ? (
              <g fill={c2}>
                {grid(80, 162, 40, 70, 8, 7).map(([x, y]) => (
                  <circle key={`${x}${y}`} cx={x} cy={y} r={1.1} />
                ))}
              </g>
            ) : null}
            {t === "check" ? (
              <g stroke={c2} strokeWidth={1.8} opacity={0.9}>
                {[82, 94, 106, 118, 130, 142, 154].map((x) => (
                  <path key={x} d={`M${x} 30 L${x} 80`} />
                ))}
                {[42, 54, 66].map((y) => (
                  <path key={y} d={`M70 ${y} L170 ${y}`} />
                ))}
              </g>
            ) : null}
            <path d="M74 64 Q120 46 166 60 M78 50 Q120 34 160 46" fill="none" stroke={shade(c, -0.25)} strokeWidth={1.3} />
          </g>
          <path d={body} fill="none" {...line} />
          {t === "pagri" ? <path d="M140 34 Q146 14 160 16 Q160 26 150 38 Z" fill={c3} {...thin} /> : null}
          {t === "fringe"
            ? [82, 88, 94, 100, 106, 112, 118, 124, 130, 136, 142, 148, 154, 160].map((x) => {
                const y = qy(x, 74, 166, 76, 62);
                return <path key={x} d={`M${x} ${y} l0 5`} stroke={c} strokeWidth={2.2} strokeLinecap="round" />;
              })
            : null}
        </g>
      );
    }
    case "cowboy": {
      const bush = art.trim === "bush";
      return (
        <g>
          {bush ? (
            <path d="M50 68 Q52 62 70 62 Q120 66 170 62 Q188 62 190 68 Q184 80 160 80 Q120 86 80 80 Q56 80 50 68 Z" fill={shade(c, -0.08)} {...line} />
          ) : (
            <path d="M42 56 Q56 70 120 70 Q184 70 198 56 Q196 72 180 78 Q120 88 60 78 Q44 72 42 56 Z" fill={shade(c, -0.08)} {...line} />
          )}
          <path d="M88 72 Q84 48 92 32 Q104 38 120 32 Q136 38 148 32 Q156 48 152 72 Q120 78 88 72 Z" fill={c} {...line} />
          <path d="M100 36 Q120 44 140 36" fill="none" stroke={shade(c, -0.25)} strokeWidth={1.5} />
          <path d="M88.6 64 Q120 70 151.4 64 L152 71 Q120 77 88 71 Z" fill={c2} {...thin} />
          <path d="M98 40 Q100 54 96 62" fill="none" stroke="#fff" strokeWidth={1.8} opacity={0.2} strokeLinecap="round" />
        </g>
      );
    }
    case "flatbrim":
      return (
        <g>
          <ellipse cx={120} cy={66} rx={66} ry={9} fill={shade(c, -0.06)} {...line} />
          <path d="M92 68 L94 38 Q120 34 146 38 L148 68 Q120 72 92 68 Z" fill={c} {...line} />
          <ellipse cx={120} cy={38} rx={26} ry={4} fill={shade(c, dark(c) ? 0.14 : -0.08)} {...thin} />
          <path d="M92.6 60 Q120 64 147.4 60 L148 67 Q120 71 92 67 Z" fill={c2} {...thin} />
        </g>
      );
    case "straw":
      return (
        <g>
          <path d="M46 70 Q54 60 80 62 Q120 66 160 62 Q186 60 194 70 Q188 82 160 82 Q120 88 80 82 Q52 82 46 70 Z" fill={shade(c, -0.05)} {...line} />
          <path d="M58 72 Q120 84 182 72" fill="none" stroke={shade(c, -0.22)} strokeWidth={1.2} strokeDasharray="3 3" />
          <path d="M90 70 Q88 38 120 34 Q152 38 150 70 Q120 76 90 70 Z" fill={c} {...line} />
          <path d="M96 50 Q120 56 144 50" fill="none" stroke={shade(c, -0.22)} strokeWidth={1.2} strokeDasharray="3 3" />
          <path d="M90.4 62 Q120 68 149.6 62 L150 69 Q120 75 90 69 Z" fill={c2} {...thin} />
        </g>
      );
    case "panama": {
      const striped = art.trim === "stripes";
      return (
        <g>
          <path d="M58 66 Q60 60 76 62 Q120 68 164 62 Q180 60 182 66 Q178 76 160 76 Q120 82 80 76 Q62 76 58 66 Z" fill={shade(c, -0.05)} {...line} />
          {striped ? (
            <g fill="none" stroke={c2}>
              <path d="M64 70 Q120 82 176 70" strokeWidth={1.8} strokeDasharray="6 3" />
              <path d="M70 66 Q120 76 170 66" strokeWidth={1.4} strokeDasharray="2 4" />
            </g>
          ) : null}
          <path d="M90 68 Q86 44 96 32 Q108 40 120 36 Q132 40 144 32 Q154 44 150 68 Q120 74 90 68 Z" fill={c} {...line} />
          {striped ? (
            <g fill="none" stroke={c2}>
              <path d="M91 52 Q120 58 149 52" strokeWidth={2.2} />
              <path d="M93 44 Q120 50 147 44" strokeWidth={1.4} strokeDasharray="3 2" />
            </g>
          ) : (
            <path d="M102 36 Q108 46 110 56 M138 36 Q132 46 130 56" fill="none" stroke={shade(c, -0.2)} strokeWidth={1.2} />
          )}
          <path d="M90.4 60 Q120 66 149.6 60 L150 67 Q120 73 90 67 Z" fill={c2} {...thin} />
        </g>
      );
    }
    case "chullo": {
      const body = "M76 76 Q72 36 120 32 Q168 36 164 76 Z";
      return (
        <g>
          <defs>
            <clipPath id={`hwchullo${uid}`}>
              <path d={body} />
            </clipPath>
          </defs>
          <path d="M78 116 L80 134 M162 116 L160 134" stroke={c2} strokeWidth={1.6} />
          <circle cx={80} cy={137} r={3.6} fill={c3} {...thin} />
          <circle cx={160} cy={137} r={3.6} fill={c3} {...thin} />
          <path d="M72 70 Q70 96 78 116 Q86 100 90 76 Z" fill={c} {...line} />
          <path d="M168 70 Q170 96 162 116 Q154 100 150 76 Z" fill={c} {...line} />
          <path d="M76 90 l4 4 l4 -4 M164 90 l-4 4 l-4 -4" fill="none" stroke={c2} strokeWidth={1.6} />
          <path d={body} fill={c} {...line} />
          <g clipPath={clip("chullo")}>
            <path d="M70 48 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5" fill="none" stroke={c2} strokeWidth={2.4} />
            <path d="M70 58 L170 58" stroke={c3} strokeWidth={5} />
            {[80, 92, 104, 116, 128, 140, 152, 164].map((x) => (
              <path key={x} d={`M${x} 55 l3 3 l-3 3 l-3 -3 Z`} fill={c2} />
            ))}
            <path d="M70 68 l5 4 l5 -4 l5 4 l5 -4 l5 4 l5 -4 l5 4 l5 -4 l5 4 l5 -4 l5 4 l5 -4 l5 4 l5 -4 l5 4 l5 -4 l5 4 l5 -4 l5 4 l5 -4" fill="none" stroke={c2} strokeWidth={1.8} />
          </g>
          <path d={body} fill="none" {...line} />
          <circle cx={120} cy={31} r={5} fill={c3} {...thin} />
        </g>
      );
    }
    case "boater":
      return (
        <g>
          <path d="M146 58 Q156 66 160 84 L154 82 Q152 70 144 62 Z" fill={c2} {...thin} />
          <path d="M148 60 Q164 66 170 80 L164 82 Q158 70 146 64 Z" fill={c2} {...thin} />
          <ellipse cx={120} cy={64} rx={58} ry={8.5} fill={shade(c, -0.05)} {...line} />
          <ellipse cx={120} cy={64} rx={50} ry={6.4} fill="none" stroke={shade(c, -0.22)} strokeWidth={1} strokeDasharray="2.5 2.5" />
          <path d="M92 64 L93 40 Q120 36 147 40 L148 64 Q120 69 92 64 Z" fill={c} {...line} />
          <ellipse cx={120} cy={40} rx={27} ry={4.5} fill={shade(c, 0.08)} {...thin} />
          <path d="M92.4 55 Q120 60 147.6 55 L148 63 Q120 68 92 63 Z" fill={c2} {...thin} />
        </g>
      );
    case "stocking":
      return (
        <g>
          <path d="M76 74 Q72 42 108 34 Q146 28 164 48 Q176 62 184 90 Q178 96 172 90 Q168 78 162 70 Q120 60 76 74 Z" fill={c} {...line} />
          <path d="M112 38 Q140 36 158 52 Q168 64 176 84" fill="none" stroke={shade(c, -0.22)} strokeWidth={1.3} />
          <path d="M76 74 Q120 60 162 70 L162 63 Q120 53 77 67 Z" fill={c2} {...thin} />
          <circle cx={179} cy={94} r={4.6} fill={c2} {...thin} />
        </g>
      );
    case "sajkaca":
      return (
        <g>
          <path d="M80 72 L82 50 Q98 42 116 50 L120 54 L124 50 Q142 42 158 50 L160 72 Q120 64 80 72 Z" fill={c} {...line} />
          <path d="M82 62 Q120 54 158 62" fill="none" stroke={shade(c, -0.28)} strokeWidth={1.4} />
          <path d="M120 54 L120 64" stroke={shade(c, -0.28)} strokeWidth={1.4} />
          <path d="M90 50 Q100 46 110 48" fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.2} strokeLinecap="round" />
        </g>
      );
    case "capa":
      return (
        <g>
          {art.trim === "fringe" ? (
            <g stroke={c2} strokeWidth={1.4} strokeLinecap="round">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <path key={i} d={`M${140 + i * 2} 50 Q${150 + i * 2} 60 ${150 + i * 2.6} ${72 + (i % 3) * 2}`} fill="none" />
              ))}
            </g>
          ) : null}
          <path d="M88 60 L88 46 L152 46 L152 60 Q120 54 88 60 Z" fill={c2} {...line} />
          <ellipse cx={120} cy={46} rx={32} ry={6.5} fill={c} {...line} />
          {art.trim === "gold" ? (
            <g fill="none" stroke={c3} strokeWidth={1.2}>
              <path d="M126 48 Q134 40 142 46 M128 49 Q134 43 140 47 M130 50 Q134 46 138 48" />
            </g>
          ) : null}
        </g>
      );
    case "fisher":
      return (
        <g>
          <path d="M76 70 Q72 46 100 40 Q140 34 164 48 Q170 58 166 70 Q120 58 76 70 Z" fill={c} {...line} />
          <path d="M76 70 Q120 58 166 70 L166 63 Q120 51 77 63 Z" fill={c2} {...thin} />
          <path d="M84 65 Q120 55 158 63" fill="none" stroke={shade(c2, 0.45)} strokeWidth={1.3} strokeDasharray="2 2" />
          <path d="M86 70 Q120 60 156 68 Q150 82 120 82 Q94 82 86 70 Z" fill={c3} {...line} />
          <path d="M98 74 Q120 78 142 74" fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.3} strokeLinecap="round" />
          <circle cx={84} cy={66} r={2} fill="#c9ced6" {...thin} strokeWidth={0.8} />
          <circle cx={158} cy={64} r={2} fill="#c9ced6" {...thin} strokeWidth={0.8} />
        </g>
      );
    case "welsh":
      return (
        <g>
          <path d="M66 62 Q70 56 84 58 Q120 64 156 58 Q170 56 174 62 Q170 70 156 70 Q120 74 84 70 Q70 70 66 62 Z" fill={c} {...line} />
          <path d="M98 62 L103 16 Q120 12 137 16 L142 62 Q120 66 98 62 Z" fill={c} {...line} />
          <ellipse cx={120} cy={16} rx={17} ry={3} fill={shade(c, 0.16)} {...thin} />
          <path d="M98.8 55 Q120 59 141.2 55 L142 62 Q120 66 98 62 Z" fill={c2} {...thin} />
          <path d="M108 22 L106 50" stroke="#fff" strokeWidth={2} opacity={0.18} strokeLinecap="round" />
        </g>
      );
    case "couro":
      return (
        <g>
          <path d="M76 72 Q78 110 110 146 M164 72 Q162 110 130 146" fill="none" stroke={shade(c, -0.3)} strokeWidth={1.8} />
          <path d="M72 76 Q120 62 168 76 L168 70 Q120 56 72 70 Z" fill={shade(c, -0.2)} {...thin} />
          <path d="M64 72 Q62 30 120 18 Q178 30 176 72 Q160 58 120 56 Q80 58 64 72 Z" fill={c} {...line} />
          <path d="M72 64 Q72 36 120 26 Q168 36 168 64" fill="none" stroke={c2} strokeWidth={3} />
          <path d="M72 64 Q72 36 120 26 Q168 36 168 64" fill="none" stroke={c3} strokeWidth={2.2} strokeDasharray="0.1 6" strokeLinecap="round" />
          <path d={star(120, 40, 7)} fill={c3} {...thin} strokeWidth={1} />
          <path d={star(100, 46, 4.4)} fill={c3} />
          <path d={star(140, 46, 4.4)} fill={c3} />
        </g>
      );
    case "fila": {
      const body = "M78 74 Q74 44 108 38 Q144 32 164 44 Q178 54 170 66 Q162 64 156 70 Q120 60 78 74 Z";
      return (
        <g>
          <defs>
            <clipPath id={`hwfila${uid}`}>
              <path d={body} />
            </clipPath>
          </defs>
          <path d={body} fill={c} {...line} />
          <g clipPath={clip("fila")} stroke={c2} strokeWidth={1} opacity={0.7}>
            {[82, 88, 94, 100, 106, 112, 118, 124, 130, 136, 142, 148, 154, 160, 166].map((x) => (
              <path key={x} d={`M${x} 30 L${x - 4} 80`} />
            ))}
          </g>
          <path d={body} fill="none" {...line} />
          <path d="M128 38 Q164 30 180 46 Q186 58 174 70 Q168 56 156 50 Q144 44 128 38 Z" fill={shade(c, -0.14)} {...line} />
          <path d="M150 44 Q168 44 176 58" fill="none" stroke={c2} strokeWidth={1} opacity={0.7} />
        </g>
      );
    }
    default:
      return null;
  }
}
