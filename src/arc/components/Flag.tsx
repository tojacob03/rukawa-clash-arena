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

/** Crescent opening to the right: outer circle minus an inner circle shifted by dx. */
function crescent(cx: number, cy: number, r1: number, dx: number, r2: number) {
  const x = cx + (dx * dx + r1 * r1 - r2 * r2) / (2 * dx);
  const h = Math.sqrt(Math.max(0, r1 * r1 - (x - cx) ** 2));
  const f = (n: number) => n.toFixed(2);
  return `M${f(x)} ${f(cy - h)}A${r1} ${r1} 0 ${x > cx ? 1 : 0} 0 ${f(x)} ${f(cy + h)}A${r2} ${r2} 0 ${x > cx + dx ? 1 : 0} 1 ${f(x)} ${f(cy - h)}Z`;
}

const stripes = (n: number, a: string, b: string) => {
  const sh = 20 / n;
  return Array.from({ length: n }, (_, i) => <rect key={i} x={0} y={i * sh} width={30} height={sh + 0.05} fill={i % 2 ? b : a} />);
};

const EAGLE =
  "M15 5L13.6 3.4L12.2 4L13 5.4L11 5L7.5 6.5L10 7.2L7 8.6L10.2 9L8 10.6L11.2 10.4L12.2 12.2L11.4 15L13.6 14L15 16.2L16.4 14L18.6 15L17.8 12.2L18.8 10.4L22 10.6L19.8 9L23 8.6L20 7.2L22.5 6.5L19 5L17 5.4L17.8 4L16.4 3.4Z";

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
    // ── Europe ──
    case "AL":
      return (
        <>
          <rect width={30} height={20} fill="#E41E20" />
          <path d={EAGLE} fill="#000" />
        </>
      );
    case "XK":
      return (
        <>
          <rect width={30} height={20} fill="#244AA5" />
          <path d="M11 9.6L14.4 8.6L17.6 9.2L19.6 11L19 13.6L16.8 15.4L13.6 15.6L11.4 14.2L10.6 11.8Z" fill="#D0A650" />
          {[9.6, 11.8, 14, 16, 18.2, 20.4].map((x, i) => (
            <polygon key={x} points={star(x, 6.4 - Math.sin((i / 5) * Math.PI) * 1.2, 0.9)} fill={W} />
          ))}
        </>
      );
    case "MK":
      return (
        <>
          <rect width={30} height={20} fill="#D20000" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * 45 * Math.PI) / 180;
            const p = (d: number, o: number) => `${(15 + Math.cos(a + o) * d).toFixed(2)},${(10 + Math.sin(a + o) * d).toFixed(2)}`;
            return <polygon key={i} points={`${p(2, -0.35)} ${p(24, -0.12)} ${p(24, 0.12)} ${p(2, 0.35)}`} fill="#FFE600" />;
          })}
          <circle cx={15} cy={10} r={2.6} fill="#FFE600" />
          <circle cx={15} cy={10} r={2.1} fill="none" stroke="#D20000" strokeWidth={0.45} />
        </>
      );
    case "ME":
      return (
        <>
          <rect width={30} height={20} fill="#D3AE3B" />
          <rect x={1} y={1} width={28} height={18} fill="#C40308" />
          <path d={EAGLE} fill="#D3AE3B" transform="translate(15 10) scale(0.8) translate(-15 -10)" />
        </>
      );
    case "SI":
      return (
        <>
          {bands("h", [W, "#005DA4", "#ED1C24"])}
          <path d="M6 3.4H11V7.4Q11 10 8.5 11Q6 10 6 7.4Z" fill="#005DA4" stroke="#ED1C24" strokeWidth={0.45} />
          <polygon points="6.6,8.6 8.5,5.6 10.4,8.6" fill={W} />
        </>
      );
    case "SK":
      return (
        <>
          {bands("h", [W, "#0B4EA2", "#EE1C25"])}
          <path d="M6 4.2H13V10Q13 13.8 9.5 15Q6 13.8 6 10Z" fill="#EE1C25" stroke={W} strokeWidth={0.6} />
          <rect x={9} y={5.4} width={1} height={6.4} fill={W} />
          <rect x={7.6} y={6.6} width={3.8} height={0.9} fill={W} />
          <rect x={7.2} y={8.4} width={4.6} height={0.9} fill={W} />
          <path d="M7.2 12.4Q9.5 10.8 11.8 12.4Q11 14.2 9.5 14.6Q8 14.2 7.2 12.4Z" fill="#0B4EA2" />
        </>
      );
    case "MD":
      return (
        <>
          {bands("v", ["#0046AE", "#FFD200", "#CC092F"])}
          <path d="M15 6.4L13.2 8L13.6 11.8L15 13.6L16.4 11.8L16.8 8Z" fill="#B07E2F" />
        </>
      );
    case "CY":
      return (
        <>
          <rect width={30} height={20} fill={W} />
          <path d="M8.4 9.2L12 7.8L16.6 7.2L21.6 5.6L19.4 7.8L18.8 9.6L15.6 11L11.6 10.8Z" fill="#D57800" />
          <path d="M11.6 13.6Q15 15.4 18.4 13.6" fill="none" stroke="#4E5B31" strokeWidth={0.9} strokeDasharray="1.2 0.5" />
        </>
      );
    case "MT":
      return (
        <>
          {bands("v", [W, "#CF142B"])}
          <g fill="#A7A7A7" stroke="#CF142B" strokeWidth={0.25}>
            <rect x={3.4} y={1.6} width={1.2} height={3.8} />
            <rect x={2.1} y={2.9} width={3.8} height={1.2} />
          </g>
        </>
      );
    case "WAL":
      return (
        <>
          {bands("h", [W, "#00AB39"])}
          <path d="M7.5 12.5Q9 8.6 13 9.4L15 5.8L16.6 9.2Q19.6 8.2 21.2 9.8L23.6 8.6L22.6 11.8Q19.8 13.8 17 12.8L16.2 15L14.6 13Q11.6 13.4 9.4 15.6L10 12.8Z" fill="#C8102E" />
        </>
      );

    // ── Caucasus and Central Asia ──
    case "AZ":
      return (
        <>
          {bands("h", ["#00B5E2", "#EF3340", "#509E2F"])}
          <path d={crescent(14, 10, 2.6, 0.7, 2.1)} fill={W} />
          <polygon points={star(16.6, 10, 1.25, 8, 0.5)} fill={W} />
        </>
      );
    case "KZ":
      return (
        <>
          <rect width={30} height={20} fill="#00AFCA" />
          <polygon points={star(15, 8.2, 4, 32, 0.72)} fill="#FEC50C" />
          <circle cx={15} cy={8.2} r={2.4} fill="#FEC50C" />
          <path d="M9.4 13.4Q15 10.8 20.6 13.4Q15 12.4 9.4 13.4Z" fill="#FEC50C" />
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={i} x={1.4} y={1.6 + i * 3} width={1.6} height={1.6} transform={`rotate(45 2.2 ${2.4 + i * 3})`} fill="#FEC50C" />
          ))}
        </>
      );
    case "UZ":
      return (
        <>
          <rect width={30} height={20} fill={W} />
          <rect width={30} height={6.4} fill="#0099B5" />
          <rect y={13.6} width={30} height={6.4} fill="#1EB53A" />
          <rect y={6.4} width={30} height={0.45} fill="#CE1126" />
          <rect y={13.15} width={30} height={0.45} fill="#CE1126" />
          <path d={crescent(4.2, 3.2, 2.2, 0.8, 1.9)} fill={W} />
          {[
            [9, 1.4],
            [10.6, 1.4],
            [12.2, 1.4],
            [7.4, 3.2],
            [9, 3.2],
            [10.6, 3.2],
            [12.2, 3.2],
            [7.4, 5],
            [9, 5],
            [10.6, 5],
            [12.2, 5],
          ].map(([x, y]) => (
            <polygon key={`${x}-${y}`} points={star(x, y, 0.55)} fill={W} />
          ))}
        </>
      );
    case "KG":
      return (
        <>
          <rect width={30} height={20} fill="#E8112D" />
          <polygon points={star(15, 10, 6.2, 40, 0.6)} fill="#FFEF00" />
          <circle cx={15} cy={10} r={3.4} fill="#FFEF00" />
          <circle cx={15} cy={10} r={2.3} fill="none" stroke="#E8112D" strokeWidth={0.5} />
          <path d="M13.4 8.4Q15 10 13.4 11.6M16.6 8.4Q15 10 16.6 11.6M12.8 10H17.2" fill="none" stroke="#E8112D" strokeWidth={0.4} />
        </>
      );
    case "TJ":
      return (
        <>
          {bands("h", ["#CC0000", W, "#006600"], [2, 3, 2])}
          <path d="M13.2 11.2L13.4 9.8L14.2 10.6L15 9.4L15.8 10.6L16.6 9.8L16.8 11.2Z" fill="#F8C300" />
          {[12, 13, 14, 15, 16, 17, 18].map((x, i) => (
            <polygon key={x} points={star(x, 8.6 - Math.sin((i / 6) * Math.PI) * 1.1, 0.45)} fill="#F8C300" />
          ))}
        </>
      );
    case "MN":
      return (
        <>
          {bands("v", ["#C4272F", "#015197", "#C4272F"])}
          <g fill="#F9CF02">
            <polygon points="5,2.6 5.8,4.2 4.2,4.2" />
            <circle cx={5} cy={5.6} r={1} />
            <path d={crescent(5, 7.4, 1, 0.01, 1)} />
            <rect x={3.9} y={8.2} width={2.2} height={0.5} />
            <rect x={3.9} y={9.2} width={2.2} height={3.4} />
            <rect x={3.9} y={13.2} width={2.2} height={0.5} />
            <rect x={2.9} y={8.2} width={0.6} height={7} />
            <rect x={6.5} y={8.2} width={0.6} height={7} />
          </g>
        </>
      );

    // ── Middle East ──
    case "IR":
      return (
        <>
          {bands("h", ["#239F40", W, "#DA0000"])}
          <path d="M0 6.3H30M0 13.7H30" stroke={W} strokeWidth={0.5} strokeDasharray="0.9 0.6" opacity={0.85} />
          <path d="M15 7.6V12.4M13.2 8.2Q12 10 13.4 12.1M16.8 8.2Q18 10 16.6 12.1M14 12.4H16" fill="none" stroke="#DA0000" strokeWidth={0.6} strokeLinecap="round" />
        </>
      );
    case "IQ":
      return (
        <>
          {bands("h", ["#CE1126", W, "#000000"])}
          <path d="M10.6 11.6Q11.6 8.6 12.4 11.6L13.4 9.2L14.4 11.6H16.6Q17.2 9.2 18.2 11.6L19.4 8.8" fill="none" stroke="#007A3D" strokeWidth={0.7} strokeLinecap="round" />
        </>
      );
    case "SY":
      return (
        <>
          {bands("h", ["#007A3D", W, "#000000"])}
          {[9.4, 15, 20.6].map((x) => (
            <polygon key={x} points={star(x, 10, 1.8)} fill="#CE1126" />
          ))}
        </>
      );
    case "LB":
      return (
        <>
          {bands("h", ["#ED1C24", W, "#ED1C24"], [1, 2, 1])}
          <polygon points="15,6 18.4,10 16.6,10 19.6,13 10.4,13 13.4,10 11.6,10" fill="#00A651" />
          <rect x={14.6} y={13} width={0.8} height={1.2} fill="#00A651" />
        </>
      );
    case "JO":
      return (
        <>
          {bands("h", ["#000000", W, "#007A3D"])}
          <polygon points="0,0 15,10 0,20" fill="#CE1126" />
          <polygon points={star(4.6, 10, 1.5, 7, 0.45)} fill={W} />
        </>
      );
    case "PS":
      return (
        <>
          {bands("h", ["#000000", W, "#009736"])}
          <polygon points="0,0 10,10 0,20" fill="#EE2A35" />
        </>
      );
    case "SA":
      return (
        <>
          <rect width={30} height={20} fill="#006C35" />
          <path d="M8 8.4Q9.2 6.6 10.4 8.4T12.8 8.4T15.2 8.4T17.6 8.4T20 8.4T22.4 8.4" fill="none" stroke={W} strokeWidth={0.7} />
          <path d="M9 13H20.6M20.6 12.3V13.7M8.2 13L9 12.6" fill="none" stroke={W} strokeWidth={0.8} strokeLinecap="round" />
        </>
      );
    case "QA": {
      const n = 9;
      const sh = 20 / n;
      const pts = ["0,0", "7.5,0"];
      for (let i = 0; i < n; i++) pts.push(`10.5,${((i + 0.5) * sh).toFixed(2)}`, `7.5,${((i + 1) * sh).toFixed(2)}`);
      pts.push("0,20");
      return (
        <>
          <rect width={30} height={20} fill="#8A1538" />
          <polygon points={pts.join(" ")} fill={W} />
        </>
      );
    }
    case "KW":
      return (
        <>
          {bands("h", ["#007A3D", W, "#CE1126"])}
          <polygon points="0,0 7.5,6.67 7.5,13.33 0,20" fill="#000000" />
        </>
      );
    case "BH": {
      const n = 5;
      const sh = 20 / n;
      const pts = ["0,0", "6,0"];
      for (let i = 0; i < n; i++) pts.push(`9.6,${((i + 0.5) * sh).toFixed(2)}`, `6,${((i + 1) * sh).toFixed(2)}`);
      pts.push("0,20");
      return (
        <>
          <rect width={30} height={20} fill="#CE1126" />
          <polygon points={pts.join(" ")} fill={W} />
        </>
      );
    }
    case "OM":
      return (
        <>
          <rect width={30} height={20} fill="#DB161B" />
          <rect x={7.5} y={0} width={22.5} height={6.67} fill={W} />
          <rect x={7.5} y={13.33} width={22.5} height={6.67} fill="#008000" />
          <path d="M1.6 1.6L5.8 5.8M5.8 1.6L1.6 5.8M3.7 1.2V6" stroke={W} strokeWidth={0.6} strokeLinecap="round" />
        </>
      );
    case "KUR":
      return (
        <>
          {bands("h", ["#ED2024", W, "#278E43"])}
          <polygon points={star(15, 10, 3.2, 21, 0.62)} fill="#FEBD11" />
          <circle cx={15} cy={10} r={1.8} fill="#FEBD11" />
        </>
      );

    // ── South, East and Southeast Asia, Pacific ──
    case "PK":
      return (
        <>
          <rect width={30} height={20} fill="#01411C" />
          <rect width={7.5} height={20} fill={W} />
          <path d={crescent(18.8, 10, 5, 1.8, 4.2)} fill={W} transform="rotate(-40 18.8 10)" />
          <polygon points={star(21.6, 7.4, 1.4, 5, 0.4, -54)} fill={W} />
        </>
      );
    case "BD":
      return (
        <>
          <rect width={30} height={20} fill="#006A4E" />
          <circle cx={13.5} cy={10} r={5} fill="#F42A41" />
        </>
      );
    case "LK":
      return (
        <>
          <rect width={30} height={20} fill="#FFB700" />
          <rect x={1} y={1} width={3.2} height={18} fill="#005F56" />
          <rect x={4.2} y={1} width={3.2} height={18} fill="#EB7400" />
          <rect x={8.4} y={1} width={20.6} height={18} fill="#8D153A" />
          <path d="M14 13.6L14.6 8.6L17.4 6.8L20 7.4L21.6 9.4L23.6 9.2L23 12.2L21 13.6Z" fill="#FFB700" />
        </>
      );
    case "KR":
      return (
        <>
          <rect width={30} height={20} fill={W} />
          <circle cx={15} cy={10} r={5} fill="#0047A0" />
          <path d="M10 10A5 5 0 0 1 20 10A2.5 2.5 0 0 0 15 10A2.5 2.5 0 0 1 10 10Z" fill="#CD2E3A" transform="rotate(33.7 15 10)" />
          {[
            [5.2, 3.6, 33.7],
            [24.8, 16.4, 33.7],
            [24.8, 3.6, -33.7],
            [5.2, 16.4, -33.7],
          ].map(([x, y, r]) => (
            <g key={`${x}-${y}`} transform={`rotate(${r} ${x} ${y})`} fill="#000">
              {[-1.2, 0, 1.2].map((dy) => (
                <rect key={dy} x={x - 2} y={y + dy - 0.35} width={4} height={0.7} />
              ))}
            </g>
          ))}
        </>
      );
    case "TW":
      return (
        <>
          <rect width={30} height={20} fill="#FE0000" />
          <rect width={15} height={10} fill="#000095" />
          <polygon points={star(7.5, 5, 3.4, 12, 0.6)} fill={W} />
          <circle cx={7.5} cy={5} r={1.9} fill="#000095" />
          <circle cx={7.5} cy={5} r={1.6} fill={W} />
        </>
      );
    case "MY":
      return (
        <>
          {stripes(14, "#CC0001", W)}
          <rect width={15} height={11.43} fill="#010066" />
          <path d={crescent(5.6, 5.7, 3.8, 1.2, 3.2)} fill="#FFCC00" />
          <polygon points={star(10.4, 5.7, 2.5, 14, 0.45)} fill="#FFCC00" />
        </>
      );
    case "SG":
      return (
        <>
          {bands("h", ["#EF3340", W])}
          <path d={crescent(5.2, 5, 3.2, 1.3, 2.9)} fill={W} />
          {Array.from({ length: 5 }, (_, i) => {
            const a = ((-90 + i * 72) * Math.PI) / 180;
            return <polygon key={i} points={star(8.6 + Math.cos(a) * 1.6, 5 + Math.sin(a) * 1.6, 0.6)} fill={W} />;
          })}
        </>
      );
    case "KH":
      return (
        <>
          {bands("h", ["#032EA1", "#E00025", "#032EA1"], [1, 2, 1])}
          <path d="M9.4 13.4H20.6V12.4H19.6V10.2L19 9L18.4 10.2V11H17.2V9.2L16.2 6.6L15 5.2L13.8 6.6L12.8 9.2V11H11.6V10.2L11 9L10.4 10.2V12.4H9.4Z" fill={W} />
        </>
      );
    case "NZ":
      return (
        <>
          <rect width={30} height={20} fill="#012169" />
          {unionJack(0.5, 0.5)}
          {[
            [22.5, 15.6, 1.05],
            [19.6, 8.6, 0.9],
            [25.6, 7.8, 0.9],
            [22.5, 3.8, 1],
          ].map(([cx, cy, r]) => (
            <g key={`${cx}-${cy}`}>
              <polygon points={star(cx, cy, r * 1.35)} fill={W} />
              <polygon points={star(cx, cy, r)} fill="#C8102E" />
            </g>
          ))}
        </>
      );
    case "WS":
      return (
        <>
          <rect width={30} height={20} fill="#CE1126" />
          <rect width={15} height={10} fill="#002B7F" />
          {[
            [7.6, 2, 1],
            [5, 5, 1],
            [10.2, 4.4, 1],
            [8.6, 6.4, 0.6],
            [7.6, 8.2, 1.1],
          ].map(([cx, cy, r]) => (
            <polygon key={`${cx}-${cy}`} points={star(cx, cy, r)} fill={W} />
          ))}
        </>
      );
    case "TO":
      return (
        <>
          <rect width={30} height={20} fill="#C10000" />
          <rect width={12} height={10} fill={W} />
          <rect x={5.1} y={1.6} width={1.8} height={6.8} fill="#C10000" />
          <rect x={2.6} y={4.1} width={6.8} height={1.8} fill="#C10000" />
        </>
      );

    // ── Africa ──
    case "EG":
      return (
        <>
          {bands("h", ["#CE1126", W, "#000000"])}
          <path d="M15 7.2L14 8.2L12.2 8L13.4 9.6L13.6 12.4H16.4L16.6 9.6L17.8 8L16 8.2Z" fill="#C09300" />
        </>
      );
    case "TN":
      return (
        <>
          <rect width={30} height={20} fill="#E70013" />
          <circle cx={15} cy={10} r={5} fill={W} />
          <path d={crescent(14.6, 10, 3.8, 1.1, 3.1)} fill="#E70013" />
          <polygon points={star(16.4, 10, 2, 5, 0.4, 180)} fill="#E70013" />
        </>
      );
    case "DZ":
      return (
        <>
          {bands("v", ["#006233", W])}
          <path d={crescent(15, 10, 4.2, 1.3, 3.5)} fill="#D21034" />
          <polygon points={star(17.4, 10, 2, 5, 0.4, 180)} fill="#D21034" />
        </>
      );
    case "LY":
      return (
        <>
          {bands("h", ["#E70013", "#000000", "#239E46"], [1, 2, 1])}
          <path d={crescent(14.2, 10, 2.8, 0.9, 2.3)} fill={W} />
          <polygon points={star(16.8, 10, 1.3, 5, 0.4, 180)} fill={W} />
        </>
      );
    case "SO":
      return (
        <>
          <rect width={30} height={20} fill="#4189DD" />
          <polygon points={star(15, 10.4, 4.2)} fill={W} />
        </>
      );
    case "ET":
      return (
        <>
          {bands("h", ["#078930", "#FCDD09", "#DA121A"])}
          <circle cx={15} cy={10} r={4.4} fill="#0F47AF" />
          <polygon points={star(15, 10.3, 3, 5, 0.38)} fill="none" stroke="#FCDD09" strokeWidth={0.5} />
        </>
      );
    case "KE":
      return (
        <>
          {bands("h", ["#000000", W, "#BB0000", W, "#006600"], [6, 1, 6, 1, 6])}
          <path d="M11.8 4.2L18.2 15.8M18.2 4.2L11.8 15.8" stroke={W} strokeWidth={0.5} />
          <ellipse cx={15} cy={10} rx={2.6} ry={5.4} fill="#BB0000" />
          <path d="M12.4 10A2.6 5.4 0 0 1 15 4.6A2.6 5.4 0 0 1 17.6 10Z" fill="#000" transform="rotate(180 15 10)" opacity={0.9} />
          <ellipse cx={15} cy={10} rx={0.6} ry={1.4} fill={W} />
        </>
      );
    case "GH":
      return (
        <>
          {bands("h", ["#CE1126", "#FCD116", "#006B3F"])}
          <polygon points={star(15, 10.3, 3.2)} fill="#000000" />
        </>
      );
    case "SN":
      return (
        <>
          {bands("v", ["#00853F", "#FDEF42", "#E31B23"])}
          <polygon points={star(15, 10.3, 3)} fill="#00853F" />
        </>
      );
    case "CM":
      return (
        <>
          {bands("v", ["#007A5E", "#CE1126", "#FCD116"])}
          <polygon points={star(15, 10.3, 3)} fill="#FCD116" />
        </>
      );
    case "CD":
      return (
        <>
          <rect width={30} height={20} fill="#007FFF" />
          <rect x={-5} y={7.2} width={40} height={5.6} fill="#F7D618" transform="rotate(-33.69 15 10)" />
          <rect x={-5} y={8.1} width={40} height={3.8} fill="#CE1021" transform="rotate(-33.69 15 10)" />
          <polygon points={star(5, 4.6, 3)} fill="#F7D618" />
        </>
      );
    case "ZA":
      return (
        <>
          <rect width={30} height={20} fill={W} />
          <rect width={30} height={6.67} fill="#E03C31" />
          <rect y={13.33} width={30} height={6.67} fill="#001489" />
          <path d="M-1 -1L11 10L-1 21M11 10H31" fill="none" stroke={W} strokeWidth={6.67} />
          <path d="M-1 -1L11 10L-1 21M11 10H31" fill="none" stroke="#007749" strokeWidth={4} />
          <polygon points="0,3.4 7.4,10 0,16.6" fill="#FFB81C" />
          <polygon points="0,5 5.6,10 0,15" fill="#000000" />
        </>
      );

    // ── Americas ──
    case "CL":
      return (
        <>
          {bands("h", [W, "#D52B1E"])}
          <rect width={10} height={10} fill="#0039A6" />
          <polygon points={star(5, 5.2, 2.2)} fill={W} />
        </>
      );
    case "UY":
      return (
        <>
          {stripes(9, W, "#0038A8")}
          <rect width={11} height={11.1} fill={W} />
          <polygon points={star(5.5, 5.5, 3.6, 16, 0.6)} fill="#FCD116" />
          <circle cx={5.5} cy={5.5} r={2} fill="#FCD116" stroke="#7B3F00" strokeWidth={0.2} />
        </>
      );
    case "PY":
      return (
        <>
          {bands("h", ["#D52B1E", W, "#0038A8"])}
          <circle cx={15} cy={10} r={2.3} fill="none" stroke="#0038A8" strokeWidth={0.4} />
          <polygon points={star(15, 10, 0.9)} fill="#FCD116" />
        </>
      );
    case "EC":
      return (
        <>
          {bands("h", ["#FFDD00", "#034EA2", "#ED1C24"], [2, 1, 1])}
          <ellipse cx={15} cy={9.6} rx={2.2} ry={2.8} fill="#5DA7DB" stroke="#7B5B2B" strokeWidth={0.4} />
          <path d="M11.4 7.6Q15 5 18.6 7.6" fill="none" stroke="#3B2A1A" strokeWidth={0.8} />
        </>
      );
    case "VE":
      return (
        <>
          {bands("h", ["#FFCC00", "#00247D", "#CF142B"])}
          {Array.from({ length: 8 }, (_, i) => {
            const a = ((200 + i * (140 / 7)) * Math.PI) / 180;
            return <polygon key={i} points={star(15 + Math.cos(a) * 4.4, 12.4 + Math.sin(a) * 4.4, 0.6)} fill={W} />;
          })}
        </>
      );
    case "CU":
      return (
        <>
          {stripes(5, "#002A8F", W)}
          <polygon points="0,0 13,10 0,20" fill="#CF142B" />
          <polygon points={star(4.4, 10, 2.4)} fill={W} />
        </>
      );
    case "DO":
      return (
        <>
          <rect width={30} height={20} fill={W} />
          <rect width={13.3} height={8.8} fill="#002D62" />
          <rect x={16.7} width={13.3} height={8.8} fill="#CE1126" />
          <rect y={11.2} width={13.3} height={8.8} fill="#CE1126" />
          <rect x={16.7} y={11.2} width={13.3} height={8.8} fill="#002D62" />
          <circle cx={15} cy={10} r={1} fill="#00843D" />
        </>
      );
    case "PR":
      return (
        <>
          {stripes(5, "#ED0000", W)}
          <polygon points="0,0 13,10 0,20" fill="#0050F0" />
          <polygon points={star(4.4, 10, 2.4)} fill={W} />
        </>
      );
    case "JM":
      return (
        <>
          <rect width={30} height={20} fill="#000000" />
          <polygon points="0,0 30,0 15,10" fill="#009B3A" />
          <polygon points="0,20 30,20 15,10" fill="#009B3A" />
          <path d="M0 0L30 20M30 0L0 20" stroke="#FED100" strokeWidth={2.6} />
        </>
      );
    case "PA":
      return (
        <>
          <rect width={30} height={20} fill={W} />
          <rect x={15} width={15} height={10} fill="#DA121A" />
          <rect y={10} width={15} height={10} fill="#072357" />
          <polygon points={star(7.5, 5, 2.2)} fill="#072357" />
          <polygon points={star(22.5, 15, 2.2)} fill="#DA121A" />
        </>
      );
    case "GT":
      return (
        <>
          {bands("v", ["#4997D0", W, "#4997D0"])}
          <circle cx={15} cy={10} r={2.6} fill="none" stroke="#4E8A3A" strokeWidth={0.7} />
          <path d="M13.4 11.4L16.6 8.6M13.4 8.6L16.6 11.4" stroke="#8A8A8A" strokeWidth={0.4} />
        </>
      );
    case "HN":
      return (
        <>
          {bands("h", ["#0073CF", W, "#0073CF"])}
          {[
            [15, 10],
            [11.6, 8.2],
            [11.6, 11.8],
            [18.4, 8.2],
            [18.4, 11.8],
          ].map(([x, y]) => (
            <polygon key={`${x}-${y}`} points={star(x, y, 0.95)} fill="#0073CF" />
          ))}
        </>
      );
    case "SV":
      return (
        <>
          {bands("h", ["#0047AB", W, "#0047AB"])}
          <polygon points="15,7.8 17.6,12 12.4,12" fill="none" stroke="#C9A227" strokeWidth={0.5} />
          <circle cx={15} cy={10.2} r={3} fill="none" stroke="#2E7D32" strokeWidth={0.35} />
        </>
      );
    case "HT":
      return (
        <>
          {bands("h", ["#00209F", "#D21034"])}
          <rect x={11} y={7.2} width={8} height={5.6} fill={W} />
          <path d="M15 12.2V8.4M13.4 9Q15 7.8 16.6 9" fill="none" stroke="#016A16" strokeWidth={0.6} />
          <rect x={12.4} y={11.4} width={5.2} height={0.8} fill="#016A16" />
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
