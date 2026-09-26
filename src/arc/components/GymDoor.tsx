// The gym page's entrance: a dōjō door with a noren in the gym's colours (three/noren.ts).

import { Building2 } from "lucide-react";
import type { Mount } from "./Scene3D.tsx";
import Scene3D from "./Scene3D.tsx";

const load = () => import("../three/noren.ts").then((m) => m.mountNoren as unknown as Mount);

export default function GymDoor({ name }: { name: string }) {
  return (
    <Scene3D
      load={load}
      args={{ name }}
      argsKey={name}
      box={[10, 9.5]}
      size={220}
      label={`Eingang des Dōjō ${name}, ein Noren mit seinem Wappen`}
      fallback={<Building2 size={40} aria-hidden="true" />}
      className="gym-door"
    />
  );
}
