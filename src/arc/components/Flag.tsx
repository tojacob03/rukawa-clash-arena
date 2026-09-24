import type { ReactNode } from "react";
import { COUNTRY } from "../core/countries.ts";

const W = "#FFFFFF";

function star(cx: number, cy: number, r: number, n = 5, inner = 0.4, rot = -90) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? r * inner : r;
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function bands(dir: "h" | "v", colors: string[], weights?: number[]) {
  const w = weights ?? colors.map(() => 1);
  const total = w.reduce((a, b) => a + b, 0);
  let pos = 0;
  return colors.map((c, i) => {
    const size = ((dir === "h" ? 20 : 30) * w[i]) / total;
    const el = dir === "h" ? <rect key={i} x={0} y={pos} width={30} height={size + 0.05} fill={c} /> : <rect key={i} x={pos} y={0} width={size + 0.05} height={20} fill={c} />;
    pos += size;
    return el;
  });
}

function unionJack(scaleX = 1, scaleY = 1) {
  return (
    <g transform={`scale(${scaleX} ${scaleY})`}>
      <rect width={30} height={20} fill="#012169" />
      <path d="M0 0L30 20M30 0L0 20" stroke={W} strokeWidth={4} />
      <path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" strokeWidth={1.4} />
      <rect x={12} y={0} width={6} height={20} fill={W} />
      <rect x={0} y={7} width={30} height={6} fill={W} />
      <rect x={13.2} y={0} width={3.6} height={20} fill="#C8102E" />
      <rect x={0} y={8.2} width={30} height={3.6} fill="#C8102E" />
    </g>
  );
}

function customArt(code: string): ReactNode {
  switch (code) {
    case "CH":
      return (
        <>
          <rect width={30} height={20} fill="#DA291C" />
          <rect x={12.5} y={4} width={5} height={12} fill={W} />
          <rect x={9} y={7.5} width={12} height={5} fill={W} />
        </>
      );
    case "PT":
      return (
        <>
          {bands("v", ["#046A38", "#DA291C"], [2, 3])}
          <circle cx={12} cy={10} r={3.6} fill="none" stroke="#FFE900" strokeWidth={1.2} />
          <rect x={10.6} y={8.4} width={2.8} height={3.4} rx={0.8} fill={W} stroke="#DA291C" strokeWidth={0.5} />
        </>
      );
    case "GB":
      return unionJack();
    case "ENG":
      return (
        <>
          <rect width={30} height={20} fill={W} />
          <rect x={13} y={0} width={4} height={20} fill="#CE1124" />
          <rect x={0} y={8} width={30} height={4} fill="#CE1124" />
        </>
      );
    case "SCO":
      return (
        <>
          <rect width={30} height={20} fill="#005EB8" />
          <path d="M0 0L30 20M30 0L0 20" stroke={W} strokeWidth={3.2} />
        </>
      );
    case "CZ":
      return (
        <>
          {bands("h", [W, "#D7141A"])}
          <polygon points="0,0 15,10 0,20" fill="#11457E" />
        </>
      );
    case "HR":
      return (
        <>
          {bands("h", ["#FF0000", W, "#171796"])}
          {Array.from({ length: 16 }, (_, i) => (
            <rect key={i} x={13 + (i % 4)} y={7.4 + Math.floor(i / 4) * 1.1} width={1} height={1.1} fill={(i + Math.floor(i / 4)) % 2 ? W : "#FF0000"} />
          ))}
        </>
      );
    case "BA":
      return (
        <>
          <rect width={30} height={20} fill="#002395" />
          <polygon points="8,0 22,0 22,20" fill="#FECB00" />
          {Array.from({ length: 7 }, (_, i) => (
            <polygon key={i} points={star(6.2 + i * 2.25, 1.2 + i * 3.1, 0.9)} fill={W} />
          ))}
        </>
      );
    case "GR": {
      const sh = 20 / 9;
      return (
        <>
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={0} y={i * sh} width={30} height={sh + 0.05} fill={i % 2 ? W : "#0D5EAF"} />
          ))}
          <rect x={0} y={0} width={5 * sh} height={5 * sh} fill="#0D5EAF" />
          <rect x={2 * sh} y={0} width={sh} height={5 * sh} fill={W} />
          <rect x={0} y={2 * sh} width={5 * sh} height={sh} fill={W} />
        </>
      );
    }
    case "TR":
      return (
        <>
          <rect width={30} height={20} fill="#E30A17" />
          <circle cx={11} cy={10} r={5} fill={W} />
          <circle cx={12.3} cy={10} r={4} fill="#E30A17" />
          <polygon points={star(17.4, 10, 2.3, 5, 0.4, 180)} fill={W} />
        </>
      );
    case "GE":
      return (
        <>
          <rect width={30} height={20} fill={W} />
          <rect x={13} y={0} width={4} height={20} fill="#FF0000" />
          <rect x={0} y={8} width={30} height={4} fill="#FF0000" />
          {[
            [6.5, 4],
            [23.5, 4],
            [6.5, 16],
            [23.5, 16],
          ].map(([cx, cy]) => (
            <g key={`${cx}-${cy}`} fill="#FF0000">
              <rect x={cx - 0.6} y={cy - 1.8} width={1.2} height={3.6} />
              <rect x={cx - 1.8} y={cy - 0.6} width={3.6} height={1.2} />
            </g>
          ))}
        </>
      );
    case "IL":
      return (
        <>
          <rect width={30} height={20} fill={W} />
          <rect x={0} y={2} width={30} height={3} fill="#0038B8" />
          <rect x={0} y={15} width={30} height={3} fill="#0038B8" />
          <polygon points="15,5.6 18.8,12.2 11.2,12.2" fill="none" stroke="#0038B8" strokeWidth={0.8} />
          <polygon points="15,14.4 18.8,7.8 11.2,7.8" fill="none" stroke="#0038B8" strokeWidth={0.8} />
        </>
      );
    case "AE":
      return (
        <>
          {bands("h", ["#009739", W, "#000000"])}
          <rect x={0} y={0} width={7.5} height={20} fill="#EF3340" />
        </>
      );
    case "MA":
      return (
        <>
          <rect width={30} height={20} fill="#C1272D" />
          <polygon points={star(15, 10.4, 5, 5, 0.38)} fill="none" stroke="#006233" strokeWidth={0.9} />
        </>
      );
    case "US": {
      const sh = 20 / 13;
      return (
        <>
          {Array.from({ length: 13 }, (_, i) => (
            <rect key={i} x={0} y={i * sh} width={30} height={sh + 0.05} fill={i % 2 ? W : "#B22234"} />
          ))}
          <rect x={0} y={0} width={12} height={7 * sh} fill="#3C3B6E" />
          {Array.from({ length: 9 }, (_, row) =>
            Array.from({ length: row % 2 ? 5 : 6 }, (_, col) => (
              <circle key={`${row}-${col}`} cx={1 + col * 2 + (row % 2 ? 1 : 0)} cy={0.9 + row * 1.12} r={0.34} fill={W} />
            )),
          )}
        </>
      );
    }
    case "CA":
      return (
        <>
          {bands("v", ["#D52B1E", W, "#D52B1E"], [1, 2, 1])}
          <path
            d="M15 3.2L16.2 5.6L17.6 5L17 8.4L19.4 6.6L19.8 7.8L21.8 7.4L21 9.6L22.2 10.2L18.4 13.2L18.8 14.4L15.4 14L15.4 16.8L14.6 16.8L14.6 14L11.2 14.4L11.6 13.2L7.8 10.2L9 9.6L8.2 7.4L10.2 7.8L10.6 6.6L13 8.4L12.4 5L13.8 5.6Z"
            fill="#D52B1E"
          />
        </>
      );
    case "MX":
      return (
        <>
          {bands("v", ["#006847", W, "#CE1126"])}
          <circle cx={15} cy={10} r={2.4} fill="#8C5A2B" />
          <path d="M12.8 11.4Q15 13.6 17.2 11.4" fill="none" stroke="#006847" strokeWidth={0.7} />
        </>
      );
    case "BR":
      return (
        <>
          <rect width={30} height={20} fill="#009C3B" />
          <polygon points="15,2 28,10 15,18 2,10" fill="#FFDF00" />
          <circle cx={15} cy={10} r={5} fill="#002776" />
          <path d="M10.2 9.2Q15 7.2 19.8 10.4" fill="none" stroke={W} strokeWidth={0.9} />
        </>
      );
    case "AR":
      return (
        <>
          {bands("h", ["#74ACDF", W, "#74ACDF"])}
          <circle cx={15} cy={10} r={1.9} fill="#F6B40E" />
        </>
      );
    case "JP":
      return (
        <>
          <rect width={30} height={20} fill={W} />
          <circle cx={15} cy={10} r={6} fill="#BC002D" />
        </>
      );
    case "CN":
      return (
        <>
          <rect width={30} height={20} fill="#EE1C25" />
          <polygon points={star(5, 5, 3)} fill="#FFFF00" />
          {[
            [10, 2],
            [12, 4],
            [12, 7],
            [10, 9],
          ].map(([cx, cy]) => (
            <polygon key={`${cx}-${cy}`} points={star(cx, cy, 1)} fill="#FFFF00" />
          ))}
        </>
      );
    case "VN":
      return (
        <>
          <rect width={30} height={20} fill="#DA251D" />
          <polygon points={star(15, 10.4, 6)} fill="#FFFF00" />
        </>
      );
    case "PH":
      return (
        <>
          {bands("h", ["#0038A8", "#CE1126"])}
          <polygon points="0,0 17.3,10 0,20" fill={W} />
          <circle cx={5.5} cy={10} r={2} fill="#FCD116" />
          {[
            [1.8, 2.4],
            [1.8, 17.6],
            [14.2, 10],
          ].map(([cx, cy]) => (
            <polygon key={`${cx}-${cy}`} points={star(cx, cy, 0.9)} fill="#FCD116" />
          ))}
        </>
      );
    case "IN":
      return (
        <>
          {bands("h", ["#FF9933", W, "#138808"])}
          <circle cx={15} cy={10} r={2.6} fill="none" stroke="#000080" strokeWidth={0.6} />
          <circle cx={15} cy={10} r={0.5} fill="#000080" />
        </>
      );
    case "AU":
      return (
        <>
          <rect width={30} height={20} fill="#012169" />
          {unionJack(0.5, 0.5)}
          <polygon points={star(7.5, 15, 2.4, 7, 0.45)} fill={W} />
          {[
            [22.5, 16.5, 1],
            [20, 9.5, 1],
            [22.5, 4, 1],
            [25.8, 8.2, 1],
            [24.2, 11.6, 0.55],
          ].map(([cx, cy, r]) => (
            <polygon key={`${cx}-${cy}`} points={star(cx, cy, r, 7, 0.45)} fill={W} />
          ))}
        </>
      );
    default:
      return <rect width={30} height={20} fill="#6b7499" />;
  }
}

export function FlagArt({ code }: { code: string }) {
  const c = COUNTRY[code];
  if (!c) return <rect width={30} height={20} fill="#6b7499" />;
  const f = c.flag;
  if (f.t === "h" || f.t === "v") return <>{bands(f.t, f.c, f.w)}</>;
  if (f.t === "nordic") {
    return (
      <>
        <rect width={30} height={20} fill={f.bg} />
        <rect x={9} y={0} width={f.inner ? 5 : 3.6} height={20} fill={f.cross} transform={f.inner ? "translate(-0.7 0)" : undefined} />
        <rect x={0} y={f.inner ? 7.5 : 8.2} width={30} height={f.inner ? 5 : 3.6} fill={f.cross} />
        {f.inner ? (
          <>
            <rect x={9.4} y={0} width={2.8} height={20} fill={f.inner} />
            <rect x={0} y={8.6} width={30} height={2.8} fill={f.inner} />
          </>
        ) : null}
      </>
    );
  }
  return <>{customArt(code)}</>;
}

/** A flag inside another SVG, stretched to the given box. */
export function FlagIn({ code, x, y, w, h }: { code: string; x: number; y: number; w: number; h: number }) {
  return (
    <svg x={x} y={y} width={w} height={h} viewBox="0 0 30 20" preserveAspectRatio="none" overflow="hidden">
      <FlagArt code={code} />
    </svg>
  );
}

/** Stand-alone flag icon. */
export function FlagIcon({ code, width = 24 }: { code: string; width?: number }) {
  const c = COUNTRY[code];
  return (
    <svg className="flag-ico" width={width} height={(width * 2) / 3} viewBox="0 0 30 20" role="img" aria-label={c ? `Flagge ${c.name}` : code}>
      <clipPath id={`fc-${code}`}>
        <rect width={30} height={20} rx={2} />
      </clipPath>
      <g clipPath={`url(#fc-${code})`}>
        <FlagArt code={code} />
      </g>
      <rect width={30} height={20} rx={2} fill="none" stroke="rgba(255,255,255,.25)" />
    </svg>
  );
}
