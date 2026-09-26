// The crew photo on the crew page: everyone on board who shares a card,
// together on the mat, the captain in the middle.

import { useMemo } from "react";
import type { Peer } from "../core/social.ts";
import { gearItems } from "../core/social.ts";
import { figureFactors } from "../core/body.ts";
import type { Spec } from "../fighter3d/figure.ts";
import type { Mount } from "./Scene3D.tsx";
import Scene3D from "./Scene3D.tsx";

const load = () => import("../fighter3d/group.ts").then((m) => m.mountCrew as unknown as Mount);

export default function CrewPhoto({ members, name }: { members: Peer[]; name: string }) {
  const shown = useMemo(() => [...members].filter((m) => m.card).sort((a, b) => Number(!!b.captain) - Number(!!a.captain)).slice(0, 12), [members]);
  const specs = useMemo<Spec[]>(
    () =>
      shown.map((m) => {
        const c = m.card!;
        const { b, lf } = figureFactors(c.look.height, undefined, undefined, c.body);
        return { look: c.look, mode: c.mode, gear: gearItems(c.gear), belt: c.belt, stripes: c.stripes, b, lf };
      }),
    [shown],
  );
  if (!specs.length) return null;
  const two = specs.length > 6;
  const key = JSON.stringify(shown.map((m) => [m.id, m.updated]));
  return (
    <figure className="crew-photo">
      <Scene3D
        load={load}
        args={specs}
        argsKey={key}
        box={two ? [16, 9] : [16, 7]}
        size={720}
        label={`Crew-Foto der ${name}: ${shown.map((m) => m.name).join(", ")}`}
        fallback={null}
      />
      <figcaption className="small muted">{shown.map((m) => m.name).join(" · ")}</figcaption>
    </figure>
  );
}
