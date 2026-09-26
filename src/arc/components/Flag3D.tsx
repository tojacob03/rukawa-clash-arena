// A crew flag as cloth in the wind (three/flag.tsx); the drawn waving flag without WebGL.

import type { FlagDesign } from "../core/types.ts";
import { normalizeFlag } from "../core/crewflag.ts";
import type { Mount } from "./Scene3D.tsx";
import Scene3D from "./Scene3D.tsx";
import { WavingFlag } from "./CrewFlag.tsx";

const load = () => import("../three/flag.tsx").then((m) => m.mountFlag as unknown as Mount);

export default function Flag3D({ design, wind, width = 150, label }: { design?: Partial<FlagDesign> | null; wind: number; width?: number; label: string }) {
  const key = JSON.stringify([normalizeFlag(design), Math.round(wind * 20)]);
  return (
    <Scene3D
      load={load}
      args={{ design, wind }}
      argsKey={key}
      box={[134, 108]}
      size={width}
      label={label}
      fallback={<WavingFlag design={design} wind={wind} width={width} label={label} />}
      className="flag-3d"
    />
  );
}
