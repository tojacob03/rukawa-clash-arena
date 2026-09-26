// The player's own fighter as worn right now, for pages that only know the data.

import type { ArcData, ArcState } from "../core/types.ts";
import { useGear } from "../useGear.ts";
import Avatar from "./Avatar.tsx";
import type { AvatarProps } from "./Avatar.tsx";

export default function OwnAvatar({ data, st, ...rest }: { data: ArcData; st: ArcState } & Partial<AvatarProps>) {
  const g = useGear(data, st);
  const p = data.profile;
  if (!p) return null;
  return (
    <Avatar
      look={g.character.look}
      mode={g.character.mode}
      gear={g.gear}
      belt={p.belt}
      stripes={p.stripes}
      weightKg={p.weightKg}
      heightCm={p.heightCm}
      label={`${p.name}, dein Charakter`}
      {...rest}
    />
  );
}
