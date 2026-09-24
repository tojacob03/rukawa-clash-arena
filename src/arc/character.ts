import type { ArcData, ArcState, Character, Slot } from "./core/types.ts";
import type { ItemDef, Owned } from "./core/items.ts";
import { DEFAULT_EQUIP, ITEM, SLOTS, dynamicItems } from "./core/items.ts";
import { DEFAULT_LOOK } from "./avatarOptions.ts";

export function getCharacter(data: ArcData): Character {
  const c = data.character;
  const flag = data.profile?.countries?.[0];
  const equipped = { ...DEFAULT_EQUIP, ...(flag ? { patch1: `flag:${flag}` } : {}), ...(c?.equipped ?? {}) };
  return { look: { ...DEFAULT_LOOK, ...(c?.look ?? {}) }, equipped, mode: c?.mode ?? "gi", seen: c?.seen ?? [] };
}

/** The item worn in each slot, falling back to default gear when an item is not owned (any more). */
export function resolveGear(data: ArcData, st: ArcState, owned: Map<string, Owned>): Partial<Record<Slot, ItemDef>> {
  const ch = getCharacter(data);
  const dyn = dynamicItems(data, st);
  const find = (id?: string) => (id ? ITEM[id] ?? dyn.find((x) => x.id === id) : undefined);
  const out: Partial<Record<Slot, ItemDef>> = {};
  for (const s of SLOTS) {
    const id = ch.equipped[s.id];
    if (id === "") continue;
    const item = id && owned.has(id) ? find(id) : undefined;
    const fallback = DEFAULT_EQUIP[s.id];
    out[s.id] = item ?? (fallback ? find(fallback) : undefined);
  }
  return out;
}

/** IBJJF age division from the birth year (the age reached in the current year counts). */
export function ageDivision(birthYear: number | undefined, year = new Date().getFullYear()) {
  if (!birthYear) return null;
  const age = year - birthYear;
  if (age < 18) return { age, name: "Jugend" };
  if (age < 30) return { age, name: "Adult" };
  // Master 1: 30-35, then five-year steps: 36-40, 41-45, ... Master 7: 61+.
  const master = age <= 35 ? 1 : Math.min(7, Math.floor((age - 36) / 5) + 2);
  return { age, name: `Master ${master}` };
}
