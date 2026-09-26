// The belt of the exam on the fighter itself: a new stripe is taped round
// the rank bar, a new belt takes its colour at the knot (fighter3d/belt.ts).

import { useMemo } from "react";
import type { ArcData, ArcState, Belt as BeltId } from "../core/types.ts";
import { figureFactors } from "../core/body.ts";
import { BELT } from "../format.ts";
import { useGear } from "../useGear.ts";
import type { BeltArgs } from "../fighter3d/belt.ts";
import type { Mount } from "./Scene3D.tsx";
import Scene3D from "./Scene3D.tsx";
import { Belt } from "./ui.tsx";

const load = () => import("../fighter3d/belt.ts").then((m) => m.mountBelt as unknown as Mount);

export default function BeltExam({ data, st, belt, stripes }: { data: ArcData; st: ArcState; belt: BeltId; stripes: number }) {
  const g = useGear(data, st);
  const p = data.profile;
  const you = useMemo(() => {
    const { b, lf } = figureFactors(g.character.look.height, p?.heightCm, p?.weightKg, null);
    return { look: g.character.look, mode: "gi" as const, gear: g.gear, belt, stripes, b, lf };
  }, [g, p, belt, stripes]);
  const args: BeltArgs = { you, belt, stripes };
  const fallback = <Belt belt={belt} stripes={stripes} width={360} tape />;
  return (
    <Scene3D
      load={load}
      args={args}
      argsKey={`${belt}|${stripes}|${g.gear.gi?.id ?? ""}`}
      box={[320, 200]}
      size={420}
      label={`${BELT[belt].name}gurt mit ${stripes} Streifen`}
      fallback={fallback}
      className="belt-3d"
    />
  );
}
