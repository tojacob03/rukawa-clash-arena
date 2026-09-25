// Editors shared by the onboarding and the character page: look, countries
// and class.

import { useMemo, useState } from "react";
import { Dices, Palette, RotateCcw, Search, X } from "lucide-react";
import type { Attire, ClassId, Look, SeaId, SportId } from "../core/types.ts";
import { SPORT, SPORTS } from "../core/sports.ts";
import { SPORT_ICON } from "../sportIcons.ts";
import { SEAS } from "../core/sea.ts";
import { CLASSES } from "../core/classes.ts";
import { COUNTRIES, COUNTRY } from "../core/countries.ts";
import {
  BEARDS,
  BROWS,
  DEFAULT_LOOK,
  EARRINGS,
  EARS,
  EYE_COLORS,
  EYE_SHAPES,
  FACE_SHAPES,
  HAIR_COLORS,
  HAIR_STYLES,
  LASHES,
  MARKS,
  MOUTHS,
  NOSES,
  SKIN,
  TATTOOS,
  TATTOO_SIDES,
  normalizeLook,
  randomLook,
} from "../avatarOptions.ts";
import Avatar from "./Avatar.tsx";
import { CLASS_ICON } from "../classIcons.ts";
import { FlagIcon } from "./Flag.tsx";
import { Seg } from "./ui.tsx";

export const MAX_COUNTRIES = 4;

type Cat = "koerper" | "gesicht" | "augen" | "haare" | "bart" | "merkmale" | "tattoo";
const CATS: { id: Cat; label: string }[] = [
  { id: "koerper", label: "Körper" },
  { id: "gesicht", label: "Gesicht" },
  { id: "augen", label: "Augen" },
  { id: "haare", label: "Haare" },
  { id: "bart", label: "Bart" },
  { id: "merkmale", label: "Merkmale" },
  { id: "tattoo", label: "Tattoo & Schmuck" },
];

/** Full character editor: categories, face thumbnails, sliders and custom colours. */
export function LookEditor({ look: raw, onChange, mode, onMode, heightCm }: { look: Look; onChange: (l: Look) => void; mode: Attire; onMode: (m: Attire) => void; heightCm?: number }) {
  const look = normalizeLook(raw);
  const [cat, setCat] = useState<Cat>("koerper");
  const set = (patch: Partial<Look>) => onChange({ ...look, ...patch });
  const thumbs = (label: string, names: string[], key: keyof Look, crop: "head" | "face" = "head") => (
    <OptionGrid label={label} names={names} value={look[key] as number} onPick={(i) => set({ [key]: i } as Partial<Look>)} render={(i) => ({ ...look, [key]: i })} crop={crop} />
  );
  return (
    <div className="look-editor">
      <div className="row wrap between">
        <Seg value={mode} onChange={onMode} label="Kleidung in der Vorschau" options={[{ v: "gi", label: "Gi" }, { v: "nogi", label: "No-Gi" }]} />
        <div className="row">
          <button type="button" className="btn ghost small" onClick={() => onChange(randomLook())}>
            <Dices size={15} aria-hidden="true" /> <span>Zufall</span>
          </button>
          <button type="button" className="btn ghost small" onClick={() => onChange(DEFAULT_LOOK)}>
            <RotateCcw size={14} aria-hidden="true" /> <span>Standard</span>
          </button>
        </div>
      </div>
      <nav className="cat-tabs" aria-label="Kategorien">
        {CATS.map((c) => (
          <button key={c.id} type="button" className={cat === c.id ? "on" : ""} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </nav>

      {cat === "koerper" ? (
        <>
          <ColorPick label="Hautton" colors={SKIN} value={look.skin} hex={look.skinHex} onPick={(skin) => set({ skin, skinHex: undefined })} onHex={(skinHex) => set({ skinHex })} />
          {heightCm ? null : <Slider label="Größe" min={-2} max={2} value={look.height} left="klein" right="groß" onChange={(height) => set({ height })} />}
          <Slider label="Statur" min={-2} max={2} value={look.build} left="schmal" right="breit" onChange={(build) => set({ build })} />
          <Slider label="Muskeln" min={0} max={3} value={look.muscle} left="drahtig" right="massiv" onChange={(muscle) => set({ muscle })} />
          <p className="muted small">
            {heightCm
              ? `Die Figur ist so groß wie du (${heightCm} cm), die Statur ergibt sich aus deinem Gewicht im Verhältnis zur Größe. Die Regler verfeinern sie.`
              : "Größe und Gewicht aus dem Steckbrief fließen in die Figur ein: die Größe in die Körperhöhe, das Gewicht im Verhältnis dazu in die Statur."}
          </p>
        </>
      ) : null}

      {cat === "gesicht" ? (
        <>
          {thumbs("Gesichtsform", FACE_SHAPES, "faceShape")}
          {thumbs("Nase", NOSES, "nose", "face")}
          {thumbs("Mund", MOUTHS, "mouth", "face")}
          {thumbs("Ohren", EARS, "ears")}
        </>
      ) : null}

      {cat === "augen" ? (
        <>
          {thumbs("Augenform", EYE_SHAPES, "eyeShape", "face")}
          <ColorPick label="Augenfarbe" colors={EYE_COLORS} value={look.eyeColor} hex={look.eyeHex} onPick={(eyeColor) => set({ eyeColor, eyeHex: undefined })} onHex={(eyeHex) => set({ eyeHex })} />
          <div className="field">
            <span className="fl">Zweite Augenfarbe (rechtes Auge)</span>
            <div className="swatches" role="radiogroup" aria-label="Zweite Augenfarbe">
              <button type="button" role="radio" aria-checked={look.eyeColor2 < 0} className={`swatch none${look.eyeColor2 < 0 ? " on" : ""}`} aria-label="Keine" onClick={() => set({ eyeColor2: -1 })} />
              {EYE_COLORS.map((c, i) => (
                <button key={c} type="button" role="radio" aria-checked={look.eyeColor2 === i} aria-label={`Farbe ${i + 1}`} className={`swatch${look.eyeColor2 === i ? " on" : ""}`} style={{ ["--c" as string]: c }} onClick={() => set({ eyeColor2: i })} />
              ))}
            </div>
          </div>
          <Slider label="Augengröße" min={-2} max={2} value={look.eyeSize} left="klein" right="groß" onChange={(eyeSize) => set({ eyeSize })} />
          <Slider label="Augenabstand" min={-2} max={2} value={look.eyeGap} left="eng" right="weit" onChange={(eyeGap) => set({ eyeGap })} />
          <ChipPick label="Wimpern" names={LASHES} value={look.lashes} onPick={(lashes) => set({ lashes })} />
          {thumbs("Augenbrauen", BROWS, "brows", "face")}
        </>
      ) : null}

      {cat === "haare" ? (
        <>
          {thumbs("Frisur", HAIR_STYLES, "hair")}
          <ColorPick label="Haarfarbe" colors={HAIR_COLORS} value={look.hairColor} hex={look.hairHex} onPick={(hairColor) => set({ hairColor, hairHex: undefined })} onHex={(hairHex) => set({ hairHex })} />
          <div className="field">
            <span className="fl">Spitzen und Strähnen</span>
            <div className="swatches" role="radiogroup" aria-label="Spitzen">
              <button type="button" role="radio" aria-checked={look.hairTips < 0} className={`swatch none${look.hairTips < 0 ? " on" : ""}`} aria-label="Keine" onClick={() => set({ hairTips: -1 })} />
              {HAIR_COLORS.map((c, i) => (
                <button key={c} type="button" role="radio" aria-checked={look.hairTips === i} aria-label={`Farbe ${i + 1}`} className={`swatch${look.hairTips === i ? " on" : ""}`} style={{ ["--c" as string]: c }} onClick={() => set({ hairTips: i })} />
              ))}
            </div>
          </div>
        </>
      ) : null}

      {cat === "bart" ? thumbs("Bart", BEARDS, "beard") : null}

      {cat === "merkmale" ? (
        <div className="field">
          <span className="fl">Merkmale (mehrere möglich)</span>
          <div className="chips">
            {MARKS.map((mk) => {
              const on = look.marks.includes(mk.id);
              return (
                <button key={mk.id} type="button" className={`chip${on ? " on" : ""}`} aria-pressed={on} onClick={() => set({ marks: on ? look.marks.filter((x) => x !== mk.id) : [...look.marks, mk.id] })}>
                  {mk.name}
                </button>
              );
            })}
          </div>
          <small className="muted">Blumenkohlohr und Narbe gibt es zusätzlich als Merkmal-Items, die man sich auf der Matte verdient.</small>
        </div>
      ) : null}

      {cat === "tattoo" ? (
        <>
          <ChipPick label="Tattoo am Arm" names={TATTOOS} value={look.tattoo} onPick={(tattoo) => set({ tattoo })} />
          {look.tattoo ? <ChipPick label="Arm" names={TATTOO_SIDES} value={look.tattooSide} onPick={(tattooSide) => set({ tattooSide })} /> : null}
          <label className="check">
            <input type="checkbox" checked={look.neckTattoo} onChange={(e) => set({ neckTattoo: e.target.checked })} /> Tattoo am Hals
          </label>
          <ChipPick label="Ohrringe" names={EARRINGS} value={look.earring} onPick={(earring) => set({ earring })} />
          <p className="muted small">Tattoos am Arm sieht man im No-Gi mit kurzen Ärmeln oder Tanktop.</p>
        </>
      ) : null}
    </div>
  );
}

function OptionGrid({ label, names, value, onPick, render, crop }: { label: string; names: string[]; value: number; onPick: (i: number) => void; render: (i: number) => Look; crop: "head" | "face" }) {
  return (
    <div className="field">
      <span className="fl">{label}</span>
      <div className={`opt-grid${crop === "face" ? " face" : ""}`} role="radiogroup" aria-label={label}>
        {names.map((n, i) => (
          <button key={n} type="button" role="radio" aria-checked={value === i} className={`opt${value === i ? " on" : ""}`} onClick={() => onPick(i)}>
            <Avatar look={render(i)} mode="gi" gear={{}} belt="weiss" stripes={0} size={crop === "face" ? 70 : 64} crop={crop} still label={n} />
            <span>{n}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorPick({ label, colors, value, hex, onPick, onHex }: { label: string; colors: string[]; value: number; hex?: string; onPick: (i: number) => void; onHex: (h: string) => void }) {
  return (
    <div className="field">
      <span className="fl">{label}</span>
      <div className="swatches" role="radiogroup" aria-label={label}>
        {colors.map((c, i) => (
          <button key={c} type="button" role="radio" aria-checked={!hex && value === i} aria-label={`${label} ${i + 1}`} className={`swatch${!hex && value === i ? " on" : ""}`} style={{ ["--c" as string]: c }} onClick={() => onPick(i)} />
        ))}
        <label className={`swatch custom${hex ? " on" : ""}`} style={hex ? { ["--c" as string]: hex } : undefined} title="Eigene Farbe">
          <Palette size={15} aria-hidden="true" />
          <input type="color" value={hex ?? colors[value] ?? "#888888"} onChange={(e) => onHex(e.target.value)} aria-label={`${label}: eigene Farbe`} />
        </label>
      </div>
    </div>
  );
}

function Slider({ label, min, max, value, left, right, onChange }: { label: string; min: number; max: number; value: number; left: string; right: string; onChange: (v: number) => void }) {
  return (
    <label className="field slider">
      <span className="fl">{label}</span>
      <span className="slider-row">
        <small>{left}</small>
        <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <small>{right}</small>
      </span>
    </label>
  );
}

function ChipPick({ label, names, value, onPick }: { label: string; names: string[]; value: number; onPick: (i: number) => void }) {
  return (
    <div className="field">
      <span className="fl">{label}</span>
      <div className="chips" role="radiogroup" aria-label={label}>
        {names.map((n, i) => (
          <button key={n} type="button" role="radio" aria-checked={value === i} className={`chip${value === i ? " on" : ""}`} onClick={() => onPick(i)}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CountryPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return COUNTRIES.filter((c) => !value.includes(c.code) && (!s || c.name.toLowerCase().includes(s) || c.code.toLowerCase() === s));
  }, [q, value]);
  const full = value.length >= MAX_COUNTRIES;
  return (
    <div className="country-pick">
      {value.length ? (
        <ul className="country-sel">
          {value.map((code, i) => (
            <li key={code}>
              <FlagIcon code={code} width={30} />
              <span>
                {COUNTRY[code]?.name ?? code}
                {i === 0 ? <small>Schulter-Aufnäher</small> : null}
              </span>
              {i > 0 ? (
                <button type="button" className="linkish" onClick={() => onChange([code, ...value.filter((c) => c !== code)])}>
                  nach vorn
                </button>
              ) : null}
              <button type="button" className="icon-btn" aria-label={`${COUNTRY[code]?.name ?? code} entfernen`} onClick={() => onChange(value.filter((c) => c !== code))}>
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {full ? (
        <p className="muted small">Maximal {MAX_COUNTRIES} Länder.</p>
      ) : (
        <>
          <label className="search">
            <Search size={16} aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Land suchen" aria-label="Land suchen" />
          </label>
          <div className="country-list">
            {list.map((c) => (
              <button
                key={c.code}
                type="button"
                className="country-opt"
                onClick={() => {
                  onChange([...value, c.code]);
                  setQ("");
                }}
              >
                <FlagIcon code={c.code} width={24} />
                <span>{c.name}</span>
              </button>
            ))}
            {!list.length ? <p className="muted small">Kein Treffer. Die Liste enthält {COUNTRIES.length} Länder.</p> : null}
          </div>
        </>
      )}
    </div>
  );
}

export function SportsPicker({ value, onChange }: { value: { id: SportId; since?: number }[]; onChange: (v: { id: SportId; since?: number }[]) => void }) {
  const has = (id: SportId) => value.some((x) => x.id === id);
  return (
    <div className="sport-list">
      <div className="chips" role="group" aria-label="Weitere Sportarten">
        {SPORTS.map((s) => {
          const Icon = SPORT_ICON[s.id];
          const on = has(s.id);
          return (
            <button key={s.id} type="button" className={`chip${on ? " on" : ""}`} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x.id !== s.id) : [...value, { id: s.id }])}>
              <Icon size={16} aria-hidden="true" /> {s.name}
            </button>
          );
        })}
      </div>
      {value.map((v) => (
        <SinceRow key={v.id} id={v.id} since={v.since} onCommit={(since) => onChange(value.map((x) => (x.id === v.id ? { ...x, since } : x)))} />
      ))}
    </div>
  );
}

function SinceRow({ id, since, onCommit }: { id: SportId; since?: number; onCommit: (since: number | undefined) => void }) {
  const year = new Date().getFullYear();
  const [v, setV] = useState(since ? String(since) : "");
  const commit = () => {
    const n = Number(v);
    onCommit(n >= 1950 && n <= year ? n : undefined);
    if (!(n >= 1950 && n <= year)) setV("");
  };
  return (
    <div className="sport-row">
      <b>{SPORT[id].name}</b>
      <label className="field">
        <span className="sr-only">{SPORT[id].name} seit welchem Jahr</span>
        <input inputMode="numeric" maxLength={4} placeholder={`seit ${year - 3}`} value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, "").slice(0, 4))} onBlur={commit} />
      </label>
    </div>
  );
}

export function SeaPicker({ value, onChange }: { value: SeaId; onChange: (s: SeaId) => void }) {
  return (
    <div className="sea-pick" role="radiogroup" aria-label="Heimatmeer">
      {SEAS.map((s) => (
        <button key={s.id} type="button" role="radio" aria-checked={value === s.id} className={`sea-opt${value === s.id ? " on" : ""}`} style={{ ["--sc" as string]: s.color }} onClick={() => onChange(s.id)}>
          <b>{s.name}</b>
          <small>{s.desc}</small>
        </button>
      ))}
    </div>
  );
}

export function ClassPicker({ value, detected, onChange }: { value?: ClassId; detected?: ClassId; onChange: (c: ClassId) => void }) {
  return (
    <div className="class-grid" role="radiogroup" aria-label="Klasse">
      {CLASSES.map((c) => {
        const Icon = CLASS_ICON[c.id];
        const on = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            className={`class-card${on ? " on" : ""}`}
            style={{ ["--cc" as string]: c.color }}
            onClick={() => onChange(c.id)}
          >
            <span className="class-sigil" aria-hidden="true">
              <Icon size={22} strokeWidth={2.2} />
            </span>
            <span className="class-txt">
              <b>{c.name}</b>
              <small className="class-style">{c.style}</small>
              <span className="class-desc">{c.desc}</span>
              <small className="class-perk">{c.perk}</small>
            </span>
            {detected === c.id ? <span className="class-flag">Deine Daten</span> : null}
          </button>
        );
      })}
    </div>
  );
}
