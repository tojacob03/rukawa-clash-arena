import { Activity, Dumbbell, Flower2, Hand, PersonStanding, Shield, Shirt, Swords } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SportId } from "./core/types.ts";

export const SPORT_ICON: Record<SportId, LucideIcon> = {
  ringen: PersonStanding,
  judo: Shirt,
  sambo: Shield,
  kraft: Dumbbell,
  ausdauer: Activity,
  striking: Hand,
  mma: Swords,
  mobility: Flower2,
};
