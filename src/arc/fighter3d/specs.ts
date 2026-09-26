// A fighter to draw from what a friend or crewmate shares on their card.

import type { SocialCard } from "../core/social.ts";
import { gearItems } from "../core/social.ts";
import { figureFactors } from "../core/body.ts";
import type { Spec } from "./figure.ts";

export function cardSpec(c: SocialCard): Spec {
  const { b, lf } = figureFactors(c.look.height, undefined, undefined, c.body);
  return { look: c.look, mode: c.mode, gear: gearItems(c.gear), belt: c.belt, stripes: c.stripes, b, lf };
}
