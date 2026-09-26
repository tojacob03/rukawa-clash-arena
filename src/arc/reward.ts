// The voyage part of the chapter end, for an entry just saved: on your own
// ship, or on the crew ship it was logged aboard.

import type { ArcData } from "./core/types.ts";
import { seaStep } from "./core/reward.ts";
import type { SeaStep } from "./core/reward.ts";
import { entryMiles } from "./core/voyage.ts";
import { aboardFor } from "./ship.ts";

export function seaFor(before: ArcData, after: ArcData, asOf: string, date: string, kind: "session" | "comp" | "cross"): SeaStep {
  const aboard = aboardFor(before, date, kind);
  return seaStep(before, after, asOf, aboard ? { name: aboard.name, miles: entryMiles(before, date, kind) } : undefined);
}
