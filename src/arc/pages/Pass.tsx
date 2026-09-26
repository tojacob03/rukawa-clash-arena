// The mat passport: a stamp for every gym you trained in as a guest, the form
// to enter visits from before, and the headwear the countries give you.

import { useId, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { ArcData, ArcState, Belt } from "../core/types.ts";
import type { Stamp } from "../core/visits.ts";
import { cleanGuest, knownGyms, newVisit, stamps, visitedCountries } from "../core/visits.ts";
import { COUNTRIES, COUNTRY } from "../core/countries.ts";
import { dynamicItem } from "../core/items.ts";
import { isoOf } from "../core/model.ts";
import { dayDate } from "../format.ts";
import { addVisit, deleteVisit } from "../actions.ts";
import { uid } from "../store.ts";
import ItemIcon from "../components/ItemIcon.tsx";
import { FlagIcon } from "../components/Flag.tsx";

/** Deterministic tilt and ink per stamp, so the page looks stamped by hand but never reshuffles. */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return (h >>> 0) / 4294967296;
}
const INKS = ["beni", "ai", "asagi"];

function GymStamp({ s }: { s: Stamp }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const r = hash(s.key);
  const tilt = Math.round((r - 0.5) * 16);
  const [y, m, d] = s.first.split("-");
  const land = COUNTRY[s.country]?.name ?? s.country;
  const top = land.length > 14 ? s.country : land;
  return (
    <svg className={`gym-stamp ink-${INKS[Math.floor(r * 97) % 3]}`} viewBox="0 0 120 84" style={{ transform: `rotate(${tilt}deg)` }} aria-hidden="true">
      <defs>
        <filter id={`${id}ink`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(r * 50)} result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#${id}ink)`} className="gs-ink">
        <rect x={4} y={4} width={112} height={76} rx={10} fill="none" strokeWidth={3.4} />
        <rect x={10} y={10} width={100} height={64} rx={6} fill="none" strokeWidth={1.2} />
        <text x={60} y={30} textAnchor="middle" className="gs-top">
          {top}
        </text>
        <path d="M22 38 H98 M22 58 H98" strokeWidth={1.2} />
        <text x={60} y={53} textAnchor="middle" className="gs-date">
          {`${Number(d)}.${Number(m)}.${y}`}
        </text>
        <text x={60} y={70} textAnchor="middle" className="gs-foot">
          道場
        </text>
      </g>
    </svg>
  );
}

export default function PassTab({ data, st, belt }: { data: ArcData; st: ArcState; belt: Belt }) {
  const today = isoOf(st.asOf);
  const list = useMemo(() => stamps(data), [data]);
  const visited = useMemo(() => visitedCountries(data, today), [data, today]);
  const own = data.profile?.countries ?? [];
  const lands = new Set(list.map((s) => s.country));
  const hats = [...new Set([...own, ...visited.keys()])].map((c) => ({ code: c, item: dynamicItem(`hat:${c}`) })).filter((x) => x.item);

  return (
    <div className="pass">
      <section className="pass-book washi-sheet" aria-labelledby="arc-pass-h">
        <header className="pass-head">
          <span className="pass-k" aria-hidden="true">
            旅
          </span>
          <div>
            <h2 id="arc-pass-h" className="h2">
              Mattenpass
            </h2>
            <p className="pass-sub">
              {list.length ? `${list.length} ${list.length === 1 ? "Gym" : "Gyms"} in ${lands.size} ${lands.size === 1 ? "Land" : "Ländern"}` : "Noch keine Stempel"}
            </p>
          </div>
        </header>
        {list.length ? (
          <ul className="pass-stamps">
            {list.map((s) => (
              <li key={s.key}>
                <GymStamp s={s} />
                <p className="ps-cap">
                  <b>{s.gym}</b>
                  <span>
                    {[s.city, COUNTRY[s.country]?.name].filter(Boolean).join(", ")}
                    {s.times > 1 ? `, ${s.times}-mal` : ""}
                  </span>
                  <span className="sr-only">Erster Besuch {dayDate(s.first)}</span>
                </p>
                {s.manual.length ? (
                  <button type="button" className="ps-del" aria-label={`Besuch in ${s.gym} löschen`} onClick={() => s.manual.forEach(deleteVisit)}>
                    <X size={16} aria-hidden="true" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="pass-empty">Trainierst du als Gast in einem anderen Gym, hak es beim Eintragen an. Frühere Besuche trägst du hier nach. Jedes Land schenkt dir seine traditionelle Kopfbedeckung.</p>
        )}
      </section>

      <div className="pass-side">
        <section className="reg" aria-labelledby="arc-visit-h">
          <h2 id="arc-visit-h" className="h3 reg-h">
            Besuch nachtragen
          </h2>
          <div className="reg-b">
            <VisitForm data={data} today={today} />
          </div>
        </section>
        <section className="reg" aria-labelledby="arc-hats-h">
          <h2 id="arc-hats-h" className="h3 reg-h">
            Kopfbedeckungen
          </h2>
          <div className="reg-b">
            <p className="muted small">
              {hats.length} von {COUNTRIES.length}. Die deiner Länder aus dem Steckbrief trägst du von Anfang an, jedes weitere Land gibt dir seine, sobald du dort trainiert hast. Ausrüsten kannst du sie unter Ausrüstung, Kopf.
            </p>
            {hats.length ? (
              <ul className="hat-list">
                {hats.map(({ code, item }) => (
                  <li key={code}>
                    <span className="hat-ico">
                      <ItemIcon item={item!} belt={belt} size={44} />
                    </span>
                    <span>
                      <b>{item!.name}</b>
                      <small>
                        <FlagIcon code={code} width={16} /> {COUNTRY[code]?.name}
                        {own.includes(code) ? "" : `, seit ${dayDate(visited.get(code)!)}`}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function VisitForm({ data, today }: { data: ArcData; today: string }) {
  const [gym, setGym] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState(today);
  const [done, setDone] = useState<string | null>(null);
  const known = useMemo(() => knownGyms(data), [data]);
  const guest = cleanGuest({ gym, city, country });
  const ok = !!guest && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today;

  const pickGym = (v: string) => {
    setGym(v);
    const k = known.find((g) => g.gym.toLowerCase() === v.trim().toLowerCase());
    if (k) {
      setCountry(k.country);
      if (k.city) setCity(k.city);
    }
  };

  return (
    <form
      className="visit-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok || !guest) return;
        addVisit(newVisit(guest, date, uid()));
        setDone(`${guest.gym} gestempelt.`);
        setGym("");
        setCity("");
      }}
    >
      <label className="field">
        <span className="fl">Gym</span>
        <input id="arc-visit-gym" value={gym} maxLength={60} list="arc-visit-gyms" autoComplete="off" onChange={(e) => pickGym(e.target.value)} />
        <datalist id="arc-visit-gyms">
          {known.map((g) => (
            <option key={`${g.country}${g.gym}`} value={g.gym} />
          ))}
        </datalist>
      </label>
      <div className="row wrap">
        <label className="field grow">
          <span className="fl">Stadt (optional)</span>
          <input id="arc-visit-city" value={city} maxLength={40} onChange={(e) => setCity(e.target.value)} />
        </label>
        <label className="field grow">
          <span className="fl">Land</span>
          <select id="arc-visit-country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Land wählen</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="fl">Erster Besuch</span>
          <input id="arc-visit-date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      <button type="submit" className="btn primary seal-btn" disabled={!ok}>
        <span className="seal" aria-hidden="true">
          印
        </span>
        <span>Stempeln</span>
      </button>
      <p className="muted small" role="status">
        {done}
      </p>
    </form>
  );
}
