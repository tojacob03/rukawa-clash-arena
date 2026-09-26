// Small drawings for the inventory: one simple shape per item type, coloured
// like the item itself.

import { useId } from "react";
import type { ReactNode } from "react";
import type { Belt } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import { BELT } from "../format.ts";
import { shade } from "../avatarOptions.ts";
import { Patch, Pattern } from "./Avatar.tsx";
import Headwear from "./Headwear.tsx";
import { hatBox } from "../core/headwear.ts";

const OL = "#1c1526";

export default function ItemIcon({ item, belt, size = 48 }: { item: ItemDef; belt: Belt; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg className="item-ico" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      {art(item, belt, uid)}
    </svg>
  );
}

function art(item: ItemDef, belt: Belt, uid: string): ReactNode {
  const a = item.art;
  switch (item.slot) {
    case "gi": {
      const c = a.c ?? "#f4f1ea";
      return (
        <g strokeLinejoin="round">
          <path d="M14 10 L8 16 L4 30 L10 32 L13 22 L13 42 L35 42 L35 22 L38 32 L44 30 L40 16 L34 10 Z" fill={c} stroke={OL} strokeWidth={2} />
          <path d="M18 10 L28 30 L30 42 M30 10 L22 26" fill="none" stroke={a.lapel ?? shade(c, -0.15)} strokeWidth={4} />
          <path d="M18 10 L28 30 L30 42 M30 10 L22 26" fill="none" stroke={OL} strokeWidth={0.8} opacity={0.5} />
          {a.stitch ? <path d="M15 40 L33 40" stroke={a.stitch} strokeWidth={1.2} strokeDasharray="2 1.5" /> : null}
          <rect x={13} y={30} width={22} height={4} fill={BELT[belt].color} stroke={OL} strokeWidth={1} />
        </g>
      );
    }
    case "top": {
      const rank = a.pattern === "rank";
      const c = rank ? BELT[belt].color : a.c ?? "#1d1d26";
      const c2 = rank ? "#15151a" : a.c2 ?? "#34406b";
      const sl = a.sleeve ?? "long";
      const body =
        sl === "none"
          ? "M16 8 L13 14 L13 42 L35 42 L35 14 L32 8 Q24 16 16 8 Z"
          : sl === "short"
            ? "M15 8 L6 14 L4 22 L12 24 L13 20 L13 42 L35 42 L35 20 L36 24 L44 22 L42 14 L33 8 Q24 13 15 8 Z"
            : "M15 8 L6 14 L3 28 L10 30 L13 20 L13 42 L35 42 L35 20 L38 30 L45 28 L42 14 L33 8 Q24 13 15 8 Z";
      return (
        <g strokeLinejoin="round">
          <clipPath id={`t${uid}`}>
            <path d={body} />
          </clipPath>
          <path d={body} fill={c} />
          <g clipPath={`url(#t${uid})`}>
            {rank ? (
              <g fill={c2}>
                <rect x={3} y={8} width={9} height={34} />
                <rect x={36} y={8} width={9} height={34} />
              </g>
            ) : (
              <Pattern kind={a.pattern ?? "solid"} c2={c2} x={3} y={8} w={42} h={34} />
            )}
          </g>
          <path d={body} fill="none" stroke={OL} strokeWidth={2} />
        </g>
      );
    }
    case "bottom": {
      const c = a.c ?? "#1d1d26";
      const style = a.style ?? "shorts";
      const legs = "M12 6 L36 6 L35 44 L27 44 L24 18 L21 44 L13 44 Z";
      const shorts = "M8 8 L40 8 L44 32 L28 34 L24 20 L20 34 L4 32 Z";
      const patterned = a.pattern && a.pattern !== "solid";
      return (
        <g strokeLinejoin="round">
          {style === "spats" || style === "combo" ? (
            <g>
              <clipPath id={`l${uid}`}>
                <path d={legs} />
              </clipPath>
              <path d={legs} fill={style === "combo" ? a.c3 ?? "#1d1d26" : c} />
              {style === "spats" && patterned ? (
                <g clipPath={`url(#l${uid})`}>
                  <Pattern kind={a.pattern!} c2={a.c2 ?? "#9cc3ff"} x={10} y={6} w={28} h={38} />
                </g>
              ) : null}
              <path d={legs} fill="none" stroke={OL} strokeWidth={2} />
            </g>
          ) : null}
          {style === "shorts" || style === "combo" ? (
            <g>
              <clipPath id={`s${uid}`}>
                <path d={shorts} />
              </clipPath>
              <path d={shorts} fill={c} />
              {patterned ? (
                <g clipPath={`url(#s${uid})`}>
                  <Pattern kind={a.pattern!} c2={a.c2 ?? "#9cc3ff"} x={4} y={8} w={40} h={26} />
                </g>
              ) : null}
              <path d={shorts} fill="none" stroke={OL} strokeWidth={2} />
              <path d="M8 12 L40 12" stroke={shade(c, 0.25)} strokeWidth={2} />
            </g>
          ) : (
            <path d="M12 10 L36 10" stroke={shade(c, 0.25)} strokeWidth={2} />
          )}
        </g>
      );
    }
    case "head":
      if (a.style !== "bandana" && a.style !== "ears" && !(a.style === "band" && !a.cs))
        return (
          <svg x={0} y={0} width={48} height={48} viewBox={hatBox(a.style)} overflow="visible">
            <Headwear art={a} uid={uid} />
          </svg>
        );
      if (a.style === "bandana")
        return (
          <g strokeLinejoin="round">
            <path d="M6 30 Q4 8 24 6 Q44 8 42 30 Q24 24 6 30 Z" fill={a.c} stroke={OL} strokeWidth={2} />
            <g fill="#fff" opacity={0.7}>
              <circle cx={16} cy={16} r={1.6} />
              <circle cx={24} cy={12} r={1.6} />
              <circle cx={32} cy={16} r={1.6} />
              <circle cx={20} cy={22} r={1.2} />
              <circle cx={28} cy={22} r={1.2} />
            </g>
            <path d="M40 26 Q46 32 44 42 Q40 34 36 30 Z" fill={a.c} stroke={OL} strokeWidth={1.8} />
          </g>
        );
      return a.style === "ears" ? (
        <g>
          <path d="M11 26 Q11 6 24 6 Q37 6 37 26" fill="none" stroke={a.c} strokeWidth={4} />
          {[11, 37].map((x) => (
            <g key={x}>
              <circle cx={x} cy={30} r={9} fill={a.c} stroke={OL} strokeWidth={2} />
              <circle cx={x} cy={30} r={4.5} fill="none" stroke="#5a5a6a" strokeWidth={1.6} />
            </g>
          ))}
        </g>
      ) : (
        <g strokeLinejoin="round">
          <path d="M4 20 Q24 12 40 20 L40 28 Q24 20 4 28 Z" fill={a.c} stroke={OL} strokeWidth={2} />
          <path d="M40 22 Q46 28 44 40 Q40 32 36 28 Z" fill={a.c} stroke={OL} strokeWidth={1.8} />
          <circle cx={22} cy={21} r={3} fill={a.c === "#f4f1ea" ? "#c8302a" : "#fff"} />
        </g>
      );
    case "extra":
      if (a.style === "tape")
        return (
          <g>
            {[12, 20, 28, 36].map((x, i) => (
              <g key={x}>
                <rect x={x - 3} y={8 + (i === 0 || i === 3 ? 6 : 0)} width={6} height={30 - (i === 0 || i === 3 ? 6 : 0)} rx={3} fill="#efc49f" stroke={OL} strokeWidth={1.6} />
                <rect x={x - 3.5} y={22} width={7} height={5} fill="#fbfaf5" stroke={OL} strokeWidth={1} />
              </g>
            ))}
          </g>
        );
      if (a.style === "knee")
        return (
          <g>
            <path d="M16 6 L32 6 L34 42 L14 42 Z" fill={a.c} stroke={OL} strokeWidth={2} />
            <ellipse cx={24} cy={24} rx={7} ry={6} fill="none" stroke={shade(a.c ?? "#2a2a36", 0.3)} strokeWidth={2} />
          </g>
        );
      if (a.style === "towel")
        return (
          <g strokeLinejoin="round">
            <path d="M8 12 L40 12 L40 38 L8 38 Z" fill={a.c} stroke={OL} strokeWidth={2} />
            <path d="M8 18 L40 18 M8 32 L40 32" stroke="#fff" strokeWidth={2} opacity={0.7} />
            <path d="M8 12 Q4 25 8 38" fill="none" stroke={OL} strokeWidth={1.5} />
          </g>
        );
      return (
        <g>
          <path d="M16 4 L24 20 L32 4" fill="none" stroke="#c8302a" strokeWidth={5} />
          <circle cx={24} cy={30} r={12} fill={a.c ?? "#f1bf57"} stroke={OL} strokeWidth={2} />
          <circle cx={24} cy={30} r={7} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={1.5} />
        </g>
      );
    case "trait":
      return a.style === "ear" ? (
        <g>
          <path d="M18 8 Q36 6 36 24 Q36 40 22 42 Q16 36 20 30 Q12 26 16 18 Q12 12 18 8 Z" fill="#efc49f" stroke={OL} strokeWidth={2} />
          <circle cx={27} cy={18} r={4} fill="#d9a276" />
          <circle cx={25} cy={28} r={3.5} fill="#d9a276" />
          <circle cx={30} cy={33} r={2.5} fill="#d9a276" />
        </g>
      ) : (
        <g>
          <path d="M8 22 Q24 12 40 20" fill="none" stroke="#4a2f22" strokeWidth={4} strokeLinecap="round" />
          <path d="M26 10 L34 30 M31 10 L39 30" stroke="#b0525a" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      );
    case "talisman":
      return talisman(item.id);
    case "aura":
      return (
        <g>
          <defs>
            <radialGradient id={`a${uid}`}>
              <stop offset="0" stopColor={a.c} stopOpacity={0.95} />
              <stop offset="1" stopColor={a.c} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={24} cy={24} r={22} fill={`url(#a${uid})`} />
          <path d="M24 10 L27 21 L38 24 L27 27 L24 38 L21 27 L10 24 L21 21 Z" fill="#fff" opacity={0.9} />
        </g>
      );
    case "patch":
      return <Patch item={item} x={6} y={12} w={36} h={24} rot={0} uid={uid} />;
  }
}

function talisman(id: string): ReactNode {
  switch (id) {
    case "tl_omamori":
      return (
        <g strokeLinejoin="round">
          <path d="M24 3 Q20 8 24 10 Q28 8 24 3" fill="none" stroke="#f1bf57" strokeWidth={2} />
          <path d="M14 12 Q24 8 34 12 L34 42 L14 42 Z" fill="#c8302a" stroke={OL} strokeWidth={2} />
          <rect x={20} y={18} width={8} height={18} fill="#f4f1ea" />
          <path d="M22 22 L26 22 M22 26 L26 26 M22 30 L26 30" stroke="#c8302a" strokeWidth={1.4} />
        </g>
      );
    case "tl_rolle":
      return (
        <g strokeLinejoin="round">
          <rect x={10} y={10} width={28} height={28} fill="#f4ead2" stroke={OL} strokeWidth={2} />
          <rect x={6} y={6} width={36} height={6} rx={3} fill="#8a5a2b" stroke={OL} strokeWidth={2} />
          <rect x={6} y={36} width={36} height={6} rx={3} fill="#8a5a2b" stroke={OL} strokeWidth={2} />
          <path d="M16 18 L32 18 M16 24 L30 24 M16 30 L28 30" stroke="#6b7499" strokeWidth={1.6} />
        </g>
      );
    case "tl_zahn":
      return (
        <g strokeLinejoin="round">
          <path d="M10 8 Q24 16 38 8" fill="none" stroke="#8a5a2b" strokeWidth={2} />
          <path d="M18 12 Q24 14 30 12 Q30 30 24 44 Q18 30 18 12 Z" fill="#f4f1ea" stroke={OL} strokeWidth={2} />
        </g>
      );
    case "tl_knoten":
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M10 30 Q10 12 24 12 Q38 12 38 30 Q30 40 24 30 Q18 20 10 30 Z" stroke={OL} strokeWidth={7} />
          <path d="M10 30 Q10 12 24 12 Q38 12 38 30 Q30 40 24 30 Q18 20 10 30 Z" stroke="#8e929c" strokeWidth={4.5} />
        </g>
      );
    case "tl_hammer":
      return (
        <g strokeLinejoin="round">
          <rect x={22} y={16} width={5} height={28} rx={2} fill="#8a5a2b" stroke={OL} strokeWidth={1.8} transform="rotate(35 24 30)" />
          <rect x={10} y={6} width={24} height={12} rx={2} fill="#8e929c" stroke={OL} strokeWidth={2} transform="rotate(35 22 12)" />
        </g>
      );
    case "tl_glocke":
      return (
        <g strokeLinejoin="round">
          <path d="M24 4 L24 10" stroke={OL} strokeWidth={2} />
          <path d="M12 34 Q12 10 24 10 Q36 10 36 34 L40 38 L8 38 Z" fill="#f1bf57" stroke={OL} strokeWidth={2} />
          <circle cx={24} cy={41} r={3} fill="#d99b2c" stroke={OL} strokeWidth={1.5} />
        </g>
      );
    case "tl_mond":
      return (
        <g strokeLinejoin="round">
          <path d="M14 6 Q24 14 34 6" fill="none" stroke="#c3cbe0" strokeWidth={1.8} />
          <ellipse cx={24} cy={27} rx={11} ry={14} fill="#bcd2ff" stroke={OL} strokeWidth={2} />
          <path d="M28 18 Q20 22 22 32 Q26 38 30 34 Q24 30 28 18 Z" fill="#fff" opacity={0.75} />
        </g>
      );
    default:
      return (
        <g strokeLinejoin="round">
          <path d="M24 4 L24 12" stroke="#f1bf57" strokeWidth={2} />
          <path d="M24 12 Q36 24 30 38 Q24 44 18 38 Q12 24 24 12 Z" fill="#ff7a2c" stroke={OL} strokeWidth={2} />
          <path d="M24 24 Q29 30 26 36 Q24 38 22 36 Q20 30 24 24 Z" fill="#ffe39a" />
        </g>
      );
  }
}
