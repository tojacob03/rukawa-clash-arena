// The shelf above the fight record: a medal for every podium, a cup for every
// tournament won (three/trophies.ts). Without WebGL, the counts below it say
// the same.

import { useMemo } from "react";
import type { Competition } from "../core/types.ts";
import type { Award } from "../three/trophies.ts";
import type { Mount } from "./Scene3D.tsx";
import Scene3D from "./Scene3D.tsx";

const load = () => import("../three/trophies.ts").then((m) => m.mountShelf as unknown as Mount);

export default function TrophyShelf({ comps }: { comps: Competition[] }) {
  const awards = useMemo<Award[]>(() => {
    const podium = [...comps].filter((c) => c.place >= 1 && c.place <= 3).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt));
    const cups = podium.filter((c) => c.place === 1).slice(-4).map((c): Award => ({ kind: "cup", place: 1, name: c.name, year: c.date.slice(0, 4) }));
    const medals = podium.slice(-10).map((c): Award => ({ kind: "medal", place: c.place, name: c.name, year: c.date.slice(0, 4) }));
    return [...cups, ...medals];
  }, [comps]);
  if (!awards.length) return null;
  const n = (k: Award["kind"], p?: number) => awards.filter((a) => a.kind === k && (p === undefined || a.place === p)).length;
  const label = `Regal: ${n("cup")} ${n("cup") === 1 ? "Pokal" : "Pokale"}, Medaillen: ${n("medal", 1)} Gold, ${n("medal", 2)} Silber, ${n("medal", 3)} Bronze`;
  // Wider with more on the shelf, taller when cups stand on it.
  const wide = Math.max(2.2, n("medal") * 0.7 + n("cup") * 0.82 + 0.9);
  const tall = (n("cup") ? 2.12 : 1.14) + 0.12;
  return (
    <Scene3D load={load} args={awards} argsKey={JSON.stringify(awards)} box={[Math.min(wide + 0.3, 7), tall]} size={640} label={label} fallback={null} className="trophy-shelf" />
  );
}
