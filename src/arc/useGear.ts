import { useMemo } from "react";
import type { ArcData, ArcState } from "./core/types.ts";
import { inventory } from "./core/items.ts";
import { getCharacter, resolveGear } from "./character.ts";

/** Owned items, what is worn, and the character settings. */
export function useGear(data: ArcData, st: ArcState) {
  return useMemo(() => {
    const owned = inventory(data, st);
    const character = getCharacter(data);
    const gear = resolveGear(data, st, owned);
    const unseen = [...owned.keys()].filter((id) => !character.seen.includes(id));
    return { owned, character, gear, unseen };
  }, [data, st]);
}
