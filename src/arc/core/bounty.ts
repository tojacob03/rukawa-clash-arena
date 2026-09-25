// Bounty on the wanted poster: what you have achieved, not how often you
// trained. Belt, level, Tokui-Waza, seals and competition results.

import type { ArcData, ArcState } from "./types.ts";
import { rankIndex } from "./sea.ts";

export function bounty(data: ArcData, st: ArcState) {
  const p = data.profile;
  const rank = p ? rankIndex(p.belt, p.stripes) : 0;
  const seals = st.seals.filter((s) => s.got).length;
  const c = st.comps;
  const points =
    st.lvl * st.lvl * 1500 +
    rank * 12000 +
    st.tokui.length * 15000 +
    seals * 4000 +
    c.events * 5000 +
    c.w * 8000 +
    c.subs * 6000 +
    c.medals[0] * 60000 +
    c.medals[1] * 35000 +
    c.medals[2] * 20000;
  return Math.round(points / 1000) * 10000;
}
