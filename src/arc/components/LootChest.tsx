// A find at the end of a chapter, in a lacquer chest that opens when you
// see it (three/chest.ts); its drawing without WebGL.

import type { Belt } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import type { Mount } from "./Scene3D.tsx";
import Scene3D from "./Scene3D.tsx";
import ItemIcon from "./ItemIcon.tsx";

const load = () => import("../three/chest.ts").then((m) => m.mountChest as unknown as Mount);

export default function LootChest({ item, belt, index }: { item: ItemDef; belt: Belt; index: number }) {
  return (
    <Scene3D
      load={load}
      args={{ item, belt, delay: 0.35 + index * 0.45 }}
      argsKey={item.id}
      box={[6, 5]}
      size={160}
      label={`Truhe mit ${item.name}`}
      fallback={<ItemIcon item={item} belt={belt} size={56} />}
      className="loot-chest"
    />
  );
}
