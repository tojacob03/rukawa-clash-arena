// A technique as a plum bud or blossom (sumi-e): unknown, a closed bud, a bud
// with a touch of red, a half-open blossom, a full red blossom, a gold one
// with a kintsugi seam for a Tokui-Waza; rusting techniques wilt grey. Used on
// the branch and, small, in every list.

const PETALS = [0, 72, 144, 216, 288];

export function BlossomGlyph({ level, rust, prov, fog, deg = -90, r = 10 }: { level: number; rust?: boolean; prov?: boolean; fog?: boolean; deg?: number; r?: number }) {
  if (fog) return <circle className="bl-fog" r={r * 0.24} />;
  if (level === 0) return <circle className="bl-seed" r={r * 0.42} />;
  if (level <= 2) {
    // A closed bud pointing away from its stalk; drilled buds show red at the tip.
    const s = r * 0.62;
    return (
      <g transform={`rotate(${deg + 90})`} className={`bl-bud${prov ? " prov" : ""}${rust ? " rust" : ""}`}>
        <path d={`M0 ${-s * 1.25} C${s * 0.85} ${-s * 0.55} ${s * 0.8} ${s * 0.55} 0 ${s * 0.7} C${-s * 0.8} ${s * 0.55} ${-s * 0.85} ${-s * 0.55} 0 ${-s * 1.25}Z`} />
        {level === 2 ? <circle className="bl-tip" cy={-s * 0.62} r={s * 0.36} /> : null}
      </g>
    );
  }
  const kind = rust ? "wilt" : level === 3 ? "half" : level === 4 ? "full" : "gold";
  const open = kind === "half" ? 0.78 : 1;
  const pr = r * (kind === "wilt" ? 0.4 : 0.46) * open;
  const pd = r * 0.5 * open;
  return (
    <g className={`bl-flower ${kind}${prov ? " prov" : ""}`} transform={`rotate(${deg})`}>
      {PETALS.map((a, i) => {
        // Wilted blossoms have lost a petal and hang the rest.
        if (kind === "wilt" && i === 3) return null;
        const aa = a + (kind === "wilt" ? (i % 2 ? 9 : -7) : 0);
        const x = Math.cos((aa * Math.PI) / 180) * pd;
        const y = Math.sin((aa * Math.PI) / 180) * pd;
        return <circle key={a} className="bl-petal" cx={x.toFixed(2)} cy={y.toFixed(2)} r={pr.toFixed(2)} />;
      })}
      <circle className="bl-heart" r={r * 0.2} />
      {kind === "full" || kind === "gold"
        ? PETALS.map((a) => {
            const x = Math.cos(((a + 36) * Math.PI) / 180) * r * 0.36;
            const y = Math.sin(((a + 36) * Math.PI) / 180) * r * 0.36;
            return <circle key={a} className="bl-stamen" cx={x.toFixed(2)} cy={y.toFixed(2)} r={r * 0.07} />;
          })
        : null}
      {kind === "gold" ? <path className="bl-seam" d={`M${-r * 0.95} ${-r * 0.2} L${-r * 0.35} ${r * 0.08} L${r * 0.1} ${-r * 0.22} L${r * 0.55} ${r * 0.15} L${r * 0.95} ${r * 0.02}`} /> : null}
    </g>
  );
}

/** The glyph on its own, for lists and legends. */
export function Blossom({ level, rust, prov, fog, size = 18 }: { level: number; rust?: boolean; prov?: boolean; fog?: boolean; size?: number }) {
  return (
    <svg className="blossom-ico" width={size} height={size} viewBox="-12 -12 24 24" aria-hidden="true">
      <BlossomGlyph level={level} rust={rust} prov={prov} fog={fog} r={10.5} />
    </svg>
  );
}
