// The Scouter's target for a partner or an opponent: you and them on the mat.

import { useMemo } from "react";
import type { ArcData, ArcState, Attire, Belt, Size } from "../core/types.ts";
import { figureFactors } from "../core/body.ts";
import { useGear } from "../useGear.ts";
import type { DuelArgs } from "../fighter3d/duel.ts";
import type { Mount } from "./Scene3D.tsx";
import Scene3D from "./Scene3D.tsx";

const load = () => import("../fighter3d/duel.ts").then((m) => m.mountDuel as unknown as Mount);

export default function Duel({ data, st, belt, attire, size, label, fallback }: { data: ArcData; st: ArcState; belt: Belt; attire: Attire; size: Size; label: string; fallback: JSX.Element }) {
  const g = useGear(data, st);
  const p = data.profile;
  const args = useMemo<DuelArgs | null>(() => {
    if (!p) return null;
    const { b, lf } = figureFactors(g.character.look.height, p.heightCm, p.weightKg, null);
    return { you: { look: g.character.look, mode: attire, gear: g.gear, belt: p.belt, stripes: p.stripes, b, lf }, belt, attire, size };
  }, [g, p, belt, attire, size]);
  if (!args) return fallback;
  const key = JSON.stringify([args.belt, args.attire, args.size, Object.values(g.gear).map((x) => x?.id), g.character.look, p?.belt, p?.stripes]);
  return <Scene3D load={load} args={args} argsKey={key} box={[320, 240]} size={320} label={label} fallback={fallback} className="duel" />;
}
