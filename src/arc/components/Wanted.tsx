// Wanted poster ("Steckbrief") with your bounty. The wanted poster is an old
// western and pirate trope; layout and wording here are original.

import type { ReactNode } from "react";
import { nf0 } from "../format.ts";

export default function Wanted({ name, bounty, portrait, line }: { name: string; bounty: number; portrait: ReactNode; line: string }) {
  return (
    <figure className="wanted" aria-label={`Steckbrief ${name}, Kopfgeld ${nf0.format(bounty)} Gold`}>
      <p className="w-title">Gesucht</p>
      <p className="w-sub">auf jeder Matte der vier Meere</p>
      <div className="w-photo">{portrait}</div>
      <p className="w-name">{name}</p>
      <p className="w-bounty">
        <span aria-hidden="true">◎</span> {nf0.format(bounty)} <small>Gold</small>
      </p>
      <figcaption className="w-line">{line}</figcaption>
    </figure>
  );
}
