// The cover's kanji as a lacquered object (three/kintsugi.ts); the drawn
// character with its gold seam without WebGL.

import type { ReactNode } from "react";
import type { Mount } from "./Scene3D.tsx";
import Scene3D from "./Scene3D.tsx";

const load = () => import("../three/kintsugi.ts").then((m) => m.mountKintsugi as unknown as Mount);

export default function KintsugiKanji({ fallback }: { fallback: ReactNode }) {
  return <Scene3D load={load} args={null} argsKey="waza" box={[1, 1]} size={460} label="技, mit Gold geflickt" fallback={fallback} className="cover-3d" />;
}
