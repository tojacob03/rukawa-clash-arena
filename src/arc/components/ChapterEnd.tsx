// Kapitelende: the summary after saving. It is the only place in the app
// with orchestrated motion: the XP stamps in, the bar fills, the results
// appear in order and new items turn over. Skippable; instant with reduced
// motion.

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ArcState, Belt } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import { RARITY, SLOTS } from "../core/items.ts";
import { rankOf } from "../core/lore.ts";
import { nf0 } from "../format.ts";
import ItemIcon from "./ItemIcon.tsx";
import { HeroKoma, LvlStep, SecTitle } from "./ui.tsx";

export interface ChapterRow {
  key: string;
  icon: ReactNode;
  text: ReactNode;
}

export default function ChapterEnd({
  kanji,
  title,
  before,
  after,
  rows,
  loot,
  belt,
  actions,
}: {
  kanji: string;
  title: string;
  before: ArcState;
  after: ArcState;
  rows: ChapterRow[];
  loot: ItemDef[];
  belt: Belt;
  actions: ReactNode;
}) {
  const [skip, setSkip] = useState(false);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setRunning(false), 2400);
    return () => window.clearTimeout(t);
  }, []);
  const gained = after.xp - before.xp;
  const up = after.lvl > before.lvl;
  const pct = (st: ArcState) => (100 * (st.xp - st.lo)) / (st.hi - st.lo);
  const from = up ? 0 : pct(before);
  const to = pct(after);

  return (
    <div className={`page chapter${skip ? " skip" : ""}`}>
      <SecTitle kanji={kanji} eyebrow="Kapitelende" title={title} />
      <HeroKoma label="Erfahrung">
        <div className="chapter-xp">
          <p className="xp-gain ch-stamp">
            +{nf0.format(gained)}
            <small>XP</small>
          </p>
          <div className="chapter-lvl">
            <span className="hex-badge big" aria-hidden="true">
              <b>{after.lvl}</b>
            </span>
            <div>
              {up ? <p className="eyebrow">Level-Aufstieg</p> : null}
              <p className="h3">
                Level {after.lvl}, {rankOf(after.lvl)}
              </p>
              {up ? <LvlStep from={before.lvl} to={after.lvl} label="Level" /> : null}
            </div>
          </div>
          <div className="xpbar" role="img" aria-label={`${nf0.format(after.xp - after.lo)} von ${nf0.format(after.hi - after.lo)} XP bis Level ${after.lvl + 1}`}>
            <i className="ch-fill" style={{ width: `${to.toFixed(1)}%`, ["--from" as string]: `${from.toFixed(1)}%` } as CSSProperties} />
          </div>
          <p className="small muted">
            Noch {nf0.format(after.hi - after.xp)} XP bis Level {after.lvl + 1}.
          </p>
        </div>
      </HeroKoma>

      {rows.length ? (
        <ul className="chapter-list" aria-label="Was sich bewegt hat">
          {rows.map((r, i) => (
            <li key={r.key} className="ch-in" style={{ ["--i" as string]: i } as CSSProperties}>
              {r.icon}
              {r.text}
            </li>
          ))}
        </ul>
      ) : null}

      {loot.length ? (
        <section className="loot" aria-label="Beute">
          <h2 className="h2">Beute</h2>
          <div className="chapter-loot">
            {loot.map((x, i) => (
              <div key={x.id} className={`item r-${x.rarity} ch-flip`} style={{ ["--rc" as string]: RARITY[x.rarity].color, ["--i" as string]: i } as CSSProperties}>
                <ItemIcon item={x} belt={belt} size={56} />
                <b>{x.name}</b>
                <small className="rar">
                  <i aria-hidden="true" />
                  {RARITY[x.rarity].name}, {slotName(x)}
                </small>
                <small className="desc">{x.desc}</small>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="row wrap">
        {actions}
        {running && !skip ? (
          <button type="button" className="btn ghost" onClick={() => setSkip(true)}>
            Überspringen
          </button>
        ) : null}
      </div>
    </div>
  );
}

function slotName(x: ItemDef) {
  return x.slot === "patch" ? "Aufnäher" : SLOTS.find((s) => s.id === x.slot)?.name ?? x.slot;
}
