// Your ship on the water and the weekly boss in its sea, as live 3D scenes
// (three/sea.ts); the drawings without WebGL.

import type { ShipLook } from "./ShipArt.tsx";
import Ship from "./ShipArt.tsx";
import SeaSerpent from "./SeaSerpent.tsx";
import type { WeatherKind } from "../core/voyage.ts";
import type { Mount } from "./Scene3D.tsx";
import Scene3D from "./Scene3D.tsx";

const loadShip = () => import("../three/sea.ts").then((m) => m.mountShipScene as unknown as Mount);
const loadSerpent = () => import("../three/sea.ts").then((m) => m.mountSerpentScene as unknown as Mount);

export function ShipOnWater({ look, weather, width, label }: { look: ShipLook; weather: WeatherKind; width: number; label: string }) {
  return (
    <Scene3D
      load={loadShip}
      args={{ look, weather }}
      argsKey={JSON.stringify([look, weather])}
      box={[220, 170]}
      size={width}
      label={label}
      fallback={<Ship look={look} width={width} weather={weather} label={label} />}
      className="ship-3d-scene"
    />
  );
}

export function BossSerpent({ hp, max, height, label }: { hp: number; max: number; height: number; label: string }) {
  const n = Math.max(1, Math.min(8, max));
  const w = 36 + n * 16 + 40;
  return (
    <Scene3D
      load={loadSerpent}
      args={{ hp, max }}
      argsKey={`${hp}|${max}`}
      box={[w, 56]}
      size={(height * w) / 56}
      label={label}
      fallback={<SeaSerpent hp={hp} max={max} height={height} label={label} />}
      className="serpent-3d-scene"
    />
  );
}
