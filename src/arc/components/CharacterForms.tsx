// Editors shared by the onboarding and the character page: look, countries
// and class.

import { useMemo, useState } from "react";
import { Dices, Search, X } from "lucide-react";
import type { Attire, ClassId, Look } from "../core/types.ts";
import { CLASSES } from "../core/classes.ts";
import { COUNTRIES, COUNTRY } from "../core/countries.ts";
import { BEARDS, EYE_COLORS, FACES, HAIR_COLORS, HAIR_STYLES, SKIN, randomLook } from "../avatarOptions.ts";
import { CLASS_ICON } from "../classIcons.ts";
import { FlagIcon } from "./Flag.tsx";
import { Seg } from "./ui.tsx";

export const MAX_COUNTRIES = 4;

export function LookEditor({ look, onChange, mode, onMode }: { look: Look; onChange: (l: Look) => void; mode: Attire; onMode: (m: Attire) => void }) {
  const set = (patch: Partial<Look>) => onChange({ ...look, ...patch });
  return (
    <div className="look-editor">
      <div className="row wrap between">
        <Seg value={mode} onChange={onMode} label="Kleidung in der Vorschau" options={[{ v: "gi", label: "Gi" }, { v: "nogi", label: "No-Gi" }]} />
        <button type="button" className="btn ghost small" onClick={() => onChange(randomLook())}>
          <Dices size={15} aria-hidden="true" /> <span>Zufall</span>
        </button>
      </div>
      <Swatches label="Hautton" colors={SKIN} value={look.skin} onPick={(skin) => set({ skin })} />
      <ChipPick label="Frisur" names={HAIR_STYLES} value={look.hair} onPick={(hair) => set({ hair })} />
      <Swatches label="Haarfarbe" colors={HAIR_COLORS} value={look.hairColor} onPick={(hairColor) => set({ hairColor })} />
      <Swatches label="Augenfarbe" colors={EYE_COLORS} value={look.eyeColor} onPick={(eyeColor) => set({ eyeColor })} />
      <ChipPick label="Gesicht" names={FACES} value={look.face} onPick={(face) => set({ face })} />
      <ChipPick label="Bart" names={BEARDS} value={look.beard} onPick={(beard) => set({ beard })} />
    </div>
  );
}

function Swatches({ label, colors, value, onPick }: { label: string; colors: string[]; value: number; onPick: (i: number) => void }) {
  return (
    <div className="field">
      <span className="fl">{label}</span>
      <div className="swatches" role="radiogroup" aria-label={label}>
        {colors.map((c, i) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${label} ${i + 1}`}
            className={`swatch${value === i ? " on" : ""}`}
            style={{ ["--c" as string]: c }}
            onClick={() => onPick(i)}
          />
        ))}
      </div>
    </div>
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
