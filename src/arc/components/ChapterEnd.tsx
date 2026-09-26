// Kapitelende: the summary after saving, with the app's most orchestrated
// motion, one GSAP timeline: the XP count up while the bar fills with them,
// a level-up fills the bar, turns the level badge over and starts the bar
// again, then the dōjō date stamp is pressed onto the page (which gives a
// little under it). Then the page is read in the order of the five ways:
// effort, skill (the buds that opened open again), strength, the voyage (the
// ship sails its miles along the leg), seals, and new items turn over.
// Skippable; instant with reduced motion. If the library has not loaded yet,
// a shorter CSS version of the same order plays.

import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ArcState, Belt } from "../core/types.ts";
import type { ItemDef } from "../core/items.ts";
import type { SeaStep } from "../core/reward.ts";
import type { Feature, Opening } from "../core/unlocks.ts";
import { OPENING } from "../core/unlocks.ts";
import { RARITY, SLOTS } from "../core/items.ts";
import { rankOf } from "../core/lore.ts";
import { nf0, nf1, power } from "../format.ts";
import ItemIcon from "./ItemIcon.tsx";
import Hanko from "./Hanko.tsx";
import { HeroKoma, LvlStep, SecTitle } from "./ui.tsx";
import { motionReady } from "../motion.ts";
import type { Timeline } from "../motion.ts";
import type { Mood } from "../fighter3d/face.ts";
import { moodOf } from "../chapterMood.ts";

export interface ChapterRow {
  key: string;
  icon?: ReactNode;
  text: ReactNode;
  /** A change shown beside the line, e.g. "+12". */
  delta?: string;
  /** The icon is a bud that opened: it opens again on the page. */
  bloom?: boolean;
}

/** What moved, in the order of the ways (core/systems.ts); the voyage comes separately. */
export interface ChapterWays {
  effort: ChapterRow[];
  skill: ChapterRow[];
  strength: ChapterRow[];
  seals: ChapterRow[];
}

export default function ChapterEnd({
  kanji,
  title,
  before,
  after,
  ways,
  sea,
  opened = [],
  closed = [],
  loot,
  belt,
  actions,
  seal,
  fighter,
}: {
  kanji: string;
  title: string;
  before: ArcState;
  after: ArcState;
  ways: ChapterWays;
  sea?: SeaStep;
  /** Ways this entry opened (progressive disclosure, core/unlocks.ts). */
  opened?: Opening[];
  /** Ways still closed after it: their lines stay out of the page. */
  closed?: Feature[];
  loot: ItemDef[];
  belt: Belt;
  actions: ReactNode;
  /** The dōjō stamp for the book: kind of session and its date. */
  seal?: { kind: string; date: string };
  /** The fighter's head, with the face it makes (moodOf) once the XP land. */
  fighter?: (mood: Mood | undefined) => ReactNode;
}) {
  const [skip, setSkip] = useState(false);
  const [running, setRunning] = useState(true);
  const [staged, setStaged] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<Timeline | null>(null);
  const mood = moodOf(before, after, ways);
  // The face stays as it was until the count lands, then it reacts.
  const [face, setFace] = useState<Mood | undefined>(() => (motionReady() ? undefined : mood));
  const gained = after.xp - before.xp;
  const up = after.lvl > before.lvl;
  const pct = (st: ArcState) => (100 * (st.xp - st.lo)) / (st.hi - st.lo);
  const from = pct(before);
  const to = pct(after);

  useLayoutEffect(() => {
    const m = motionReady();
    const el = root.current;
    if (!m || !el) {
      setFace(mood);
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
    // The fighter reacts on the beat the count lands: a small start, then the new face.
    t.call(() => setFace(mood), [], land - 0.15);
    if (mood) t.fromTo(q(".ch-face"), { y: 0 }, { y: mood === "tired" ? 3 : -5, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out" }, land - 0.1);
    // The stamp comes down on the beat the count lands, and the page gives under it.
    const seal = q(".ch-seal");
    if (seal.length) {
      t.fromTo(seal, { y: -16, scale: 1.55, rotation: -3, opacity: 0 }, { y: 0, scale: 1, rotation: -9, opacity: 1, duration: 0.42, ease: "arc.settle" }, land - 0.1);
      t.to(q(".chapter-xp"), { y: 3, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.out" }, land + 0.1);
    }
    // The ways, one after the other, each with its own beat.
    let at = land + 0.2;
    for (const way of q(".cw")) {
      const w = gsap.utils.selector(way);
      t.from(way, { opacity: 0, y: 10, duration: 0.35, ease: "power2.out" }, at);
      t.from(w(".cw-k"), { opacity: 0, scale: 1.3, duration: 0.3, ease: "power2.out" }, at);
      t.from(w(".ch-in"), { x: -12, opacity: 0, duration: 0.3, ease: "power2.out", stagger: 0.07 }, at + 0.12);
      // Buds that opened open again: from closed to their new flower.
      t.from(w(".ch-bloom"), { scale: 0.2, rotation: -40, transformOrigin: "50% 50%", duration: 0.6, ease: "back.out(2.2)", stagger: 0.12 }, at + 0.2);
      const ship = w(".ch-ship")[0] as Element | undefined;
      if (ship && sea && !sea.crew) {
        const miles = w(".ch-miles")[0]?.firstChild;
        const m = { v: 0 };
        t.fromTo(ship, { x: LEG_X0 + sea.before * LEG_W }, { x: LEG_X0 + sea.after * LEG_W, duration: 1.1, ease: "power1.inOut" }, at + 0.15);
        t.fromTo(w(".ch-wake"), { attr: { x2: LEG_X0 + sea.before * LEG_W } }, { attr: { x2: LEG_X0 + sea.after * LEG_W }, duration: 1.1, ease: "power1.inOut" }, at + 0.15);
        t.to(
          m,
          {
            v: sea.gained,
            duration: 1.1,
            ease: "power1.out",
            onUpdate: () => {
              if (miles instanceof Text) miles.data = nf1.format(m.v);
            },
          },
          at + 0.15,
        );
        at += 0.6;
      }
      at += 0.26 + 0.06 * w(".ch-in").length;
    }
    t.from(q(".ch-flip"), { rotationY: 90, transformPerspective: 700, opacity: 0, duration: 0.55, ease: "back.out(1.5)", stagger: 0.14 }, at);
    return () => {
      t.revert();
      tl.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={root} className={`page chapter${skip ? " skip" : ""}${staged ? " staged" : ""}`}>
      <SecTitle h1 kanji={kanji} eyebrow="Kapitelende" title={title} />
      <HeroKoma label="Erfahrung">
        <div className="chapter-xp">
          {seal ? <Hanko kind={seal.kind} date={seal.date} className="ch-seal" /> : null}
          <div className="ch-hero">
            {fighter ? <div className="ch-face">{fighter(face)}</div> : null}
            <p className="xp-gain ch-stamp">
              +<span className="ch-num">{nf0.format(gained)}</span>
              <small>XP</small>
            </p>
          </div>
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

      <ol className="ways-page" aria-label="Was sich bewegt hat">
        <Way k="稽" name="Einsatz" i={0} rows={ways.effort} />
        <Way k="技" name="Können" i={1} rows={ways.skill} quiet="Heute ist keine Knospe weitergewachsen. Quest-Treffer und Rolls lassen den Zweig wachsen." />
        <Way
          k="測"
          name="Stärke"
          i={2}
          rows={[
            // The first reading, the day the Scouter opens.
            ...(opened.some((o) => o.id === "power") && !ways.strength.some((r) => r.key === "power") ? [{ key: "power", text: `Power Level ${power(after.ru)}, deine erste Messung` }] : []),
            ...ways.strength.filter((r) => !(closed.includes("power") && r.key === "power") && !(closed.includes("hexagon") && r.key === "hex")),
          ]}
          quiet={closed.includes("power") ? `Mit deinem ${OPENING.power.after}. Training misst der Scouter zum ersten Mal dein Power Level.` : "Ohne Rolls misst der Scouter heute nichts."}
        />
        {sea ? (
          <Way k="海" name="Reise" i={3} rows={[]}>
            <SeaLeg sea={sea} />
          </Way>
        ) : null}
        {ways.seals.length ? <Way k="章" name="Siegel" i={4} rows={ways.seals} /> : null}
        {opened.length ? (
          <Way
            k="新"
            name="Neu in deinem Heft"
            i={5}
            rows={opened.map((o) => ({
              key: `open-${o.id}`,
              icon: <span className="cw-open">{o.kanji}</span>,
              text: (
                <>
                  <b>{o.name}</b>: {o.says}
                </>
              ),
            }))}
          />
        ) : null}
      </ol>

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

function Way({ k, name, i, rows, quiet, children }: { k: string; name: string; i: number; rows: ChapterRow[]; quiet?: string; children?: ReactNode }) {
  return (
    <li className="cw" style={{ ["--i" as string]: i } as CSSProperties}>
      <span className="cw-k" aria-hidden="true">
        {k}
      </span>
      <div className="cw-b">
        <h2 className="cw-h">{name}</h2>
        {rows.length ? (
          <ul className="cw-rows">
            {rows.map((r, j) => (
              <li key={r.key} className="ch-in" style={{ ["--i" as string]: i + j * 0.3 } as CSSProperties}>
                {r.icon ? <span className={r.bloom ? "cw-ico ch-bloom" : "cw-ico"}>{r.icon}</span> : null}
                <span className="cw-t">{r.text}</span>
                {r.delta ? <b className={`cw-d${r.delta.startsWith("-") || r.delta.startsWith("−") ? " down" : ""}`}>{r.delta}</b> : null}
              </li>
            ))}
          </ul>
        ) : children ? null : quiet ? (
          <p className="cw-quiet ch-in">{quiet}</p>
        ) : null}
        {children}
      </div>
    </li>
  );
}

/** The leg the ship sails on, in the viewBox of SeaLeg. */
const LEG_X0 = 18;
const LEG_W = 284;

/** The leg of the voyage this entry sailed on: the island behind, the one ahead, the ship between. */
function SeaLeg({ sea }: { sea: SeaStep }) {
  const x = LEG_X0 + sea.after * LEG_W;
  return (
    <div className="sea-leg">
      <p className="ch-in">
        <b className="sea-gain">
          +<span className="ch-miles">{nf1.format(sea.gained)}</span> sm
        </b>{" "}
        {sea.crew ? (
          <>an Bord der {sea.crew}. Deine Crew segelt gemeinsam weiter.</>
        ) : (
          <>
            {sea.arrived.length ? (
              <>
                Angekommen auf <b>{sea.arrived.map((x) => x.name).join(", dann ")}</b>.{" "}
              </>
            ) : null}
            Noch {nf0.format(Math.ceil(sea.left))} Seemeilen bis {sea.to.name}.
          </>
        )}
      </p>
      {sea.crew ? null : (
        <>
      <svg className="leg" viewBox="0 0 320 44" role="img" aria-label={`Das Schiff zwischen ${sea.from.name} und ${sea.to.name}`}>
        <line x1={LEG_X0} y1={24} x2={LEG_X0 + LEG_W} y2={24} className="leg-course" />
        <line x1={LEG_X0} y1={24} x2={x} y2={24} className="leg-wake ch-wake" />
        <circle cx={LEG_X0} cy={24} r={5} className="leg-isle" />
        <circle cx={LEG_X0 + LEG_W} cy={24} r={5} className="leg-isle ahead" />
        <g className="ch-ship" transform={`translate(${x} 0)`}>
          <path d="M-9 20 L9 20 L6 26 L-6 26 Z" className="leg-hull" />
          <path d="M0 6 L0 20 M0 7 L8 17 L0 17" className="leg-sail" />
        </g>
      </svg>
      <p className="leg-names" aria-hidden="true">
        <span>{sea.from.name}</span>
        <span>{sea.to.name}</span>
      </p>
        </>
      )}
    </div>
  );
}

function slotName(x: ItemDef) {
  return x.slot === "patch" ? "Aufnäher" : SLOTS.find((s) => s.id === x.slot)?.name ?? x.slot;
}
