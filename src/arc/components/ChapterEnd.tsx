// Kapitelende: the summary after saving, with the app's most orchestrated
// motion, one GSAP timeline: the XP count up while the bar fills with them,
// a level-up fills the bar, turns the level badge over and starts the bar
// again, then the dōjō date stamp is pressed onto the page (which gives a
// little under it), the results appear in order and new items turn over.
// Skippable; instant with reduced motion. If the library has not loaded yet,
// a shorter CSS version of the same order plays.

import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ArcState, Belt } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import { RARITY, SLOTS } from "../core/items.ts";
import { rankOf } from "../core/lore.ts";
import { nf0 } from "../format.ts";
import ItemIcon from "./ItemIcon.tsx";
import Hanko from "./Hanko.tsx";
import { HeroKoma, LvlStep, SecTitle } from "./ui.tsx";
import { motionReady } from "../motion.ts";
import type { Timeline } from "../motion.ts";

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
  seal,
}: {
  kanji: string;
  title: string;
  before: ArcState;
  after: ArcState;
  rows: ChapterRow[];
  loot: ItemDef[];
  belt: Belt;
  actions: ReactNode;
  /** The dōjō stamp for the book: kind of session and its date. */
  seal?: { kind: string; date: string };
}) {
  const [skip, setSkip] = useState(false);
  const [running, setRunning] = useState(true);
  const [staged, setStaged] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<Timeline | null>(null);
  const gained = after.xp - before.xp;
  const up = after.lvl > before.lvl;
  const pct = (st: ArcState) => (100 * (st.xp - st.lo)) / (st.hi - st.lo);
  const from = pct(before);
  const to = pct(after);

  useLayoutEffect(() => {
    const m = motionReady();
    const el = root.current;
    if (!m || !el) {
      const t = window.setTimeout(() => setRunning(false), 2400);
      return () => window.clearTimeout(t);
    }
    const { gsap } = m;
    const q = gsap.utils.selector(el);
    setStaged(true);
    const num = q(".ch-num")[0]?.firstChild;
    const fill = q(".ch-fill");
    const badge = q(".chapter-lvl .hex-badge");
    const lvl = q(".chapter-lvl .hex-badge b")[0]?.firstChild;
    const count = { v: 0 };
    if (num instanceof Text) num.data = "0";
    const fillFor = up ? 0.9 : 1.1;
    const t = gsap.timeline({ delay: 0.15, onComplete: () => setRunning(false) });
    tl.current = t;
    t.from(q(".ch-stamp"), { scale: 1.4, opacity: 0, duration: 0.35, ease: "back.out(2)" }, 0);
    t.to(
      count,
      {
        v: gained,
        duration: up ? fillFor + 0.7 : fillFor,
        ease: "power2.out",
        onUpdate: () => {
          if (num instanceof Text) num.data = nf0.format(Math.round(count.v));
        },
      },
      0.1,
    );
    t.fromTo(fill, { width: `${from}%` }, { width: up ? "100%" : `${to}%`, duration: fillFor, ease: up ? "power2.in" : "power2.inOut" }, 0.1);
    let land = 0.1 + fillFor;
    if (up) {
      // Level-up: the badge turns over to the new level, the bar starts again.
      if (lvl instanceof Text) lvl.data = String(before.lvl);
      const beat = 0.1 + fillFor;
      t.to(badge, { rotationY: 90, transformPerspective: 500, duration: 0.16, ease: "power1.in" }, beat);
      t.call(() => {
        if (lvl instanceof Text) lvl.data = String(after.lvl);
      }, [], beat + 0.16);
      t.to(badge, { rotationY: 0, duration: 0.4, ease: "back.out(2.4)" }, beat + 0.16);
      t.set(fill, { width: "0%" }, beat + 0.05);
      t.to(fill, { width: `${to}%`, duration: 0.65, ease: "power2.out" }, beat + 0.1);
      // The level line only appears with the new level (fromTo hides it at once).
      t.fromTo(el.querySelector(".chapter-lvl > div"), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }, beat + 0.2);
      land = beat + 0.75;
    }
    // The stamp comes down on the beat the count lands, and the page gives under it.
    const seal = q(".ch-seal");
    if (seal.length) {
      t.fromTo(seal, { y: -16, scale: 1.55, rotation: -3, opacity: 0 }, { y: 0, scale: 1, rotation: -9, opacity: 1, duration: 0.42, ease: "arc.settle" }, land - 0.1);
      t.to(q(".chapter-xp"), { y: 3, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.out" }, land + 0.1);
    }
    t.from(q(".ch-in"), { x: -14, opacity: 0, duration: 0.35, ease: "power2.out", stagger: 0.09 }, land + 0.2);
    t.from(q(".ch-flip"), { rotationY: 90, transformPerspective: 700, opacity: 0, duration: 0.55, ease: "back.out(1.5)", stagger: 0.14 }, ">-0.1");
    return () => {
      t.revert();
      tl.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={root} className={`page chapter${skip ? " skip" : ""}${staged ? " staged" : ""}`}>
      <SecTitle kanji={kanji} eyebrow="Kapitelende" title={title} />
      <HeroKoma label="Erfahrung">
        <div className="chapter-xp">
          {seal ? <Hanko kind={seal.kind} date={seal.date} className="ch-seal" /> : null}
          <p className="xp-gain ch-stamp">
            +<span className="ch-num">{nf0.format(gained)}</span>
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
            <i className="ch-fill" style={{ width: `${to.toFixed(1)}%`, ["--from" as string]: `${(up ? 0 : from).toFixed(1)}%` } as CSSProperties} />
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
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              tl.current?.progress(1);
              setSkip(true);
            }}
          >
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
