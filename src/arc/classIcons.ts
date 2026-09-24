import { Anchor, Castle, ChevronsDown, Crosshair, Footprints, Ghost, Network, Shuffle, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ClassId } from "./core/types.ts";

export const CLASS_ICON: Record<ClassId, LucideIcon> = {
  netzweber: Network,
  druckwalze: ChevronsDown,
  anker: Anchor,
  schatten: Ghost,
  jaeger: Crosshair,
  ferse: Footprints,
  sturm: Wind,
  festung: Castle,
  wandler: Shuffle,
};
