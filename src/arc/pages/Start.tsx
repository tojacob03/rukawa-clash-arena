import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Sparkles, Wand2 } from "lucide-react";
import type { Attire, Belt as BeltId, ClassId, Look, SeaId, Slot, SportId } from "../core/types.ts";
import { DEFAULT_SEA } from "../core/sea.ts";
import type { ItemDef } from "../core/items.ts";
import { DEFAULT_EQUIP, ITEM } from "../core/items.ts";
import { CLASS } from "../core/classes.ts";
import { SECTORS, TECHS } from "../core/techniques.ts";
import { RINGS, rankOf } from "../core/lore.ts";
import { BELT_R, PROLOG_LEVEL, prologXp } from "../core/model.ts";
import { BELT, BELTS, nf0, power } from "../format.ts";
import { createProfile, loadDemo } from "../actions.ts";
import { DEFAULT_LOOK } from "../avatarOptions.ts";
import { ageDivision } from "../character.ts";
import Avatar from "../components/Avatar.tsx";
import { ClassPicker, CountryPicker, LookEditor, SeaPicker, SportsPicker } from "../components/CharacterForms.tsx";
import { SPORT } from "../core/sports.ts";
import { Belt, HeroKoma, Seg, Stepper } from "../components/ui.tsx";
import { cloudConfigured } from "../cloud/state.ts";
import { go } from "../store.ts";

type Step = "hello" | "steckbrief" | "rang" | "klasse" | "aussehen" | "technik";
const STEPS: Step[] = ["steckbrief", "rang", "klasse", "aussehen", "technik"];
/** Self-assessment: 2 = kenne ich (seen/drilled), 3 = klappt im Roll, 4 = Stärke. */
type Mark = 2 | 3 | 4;
const MAX_STRENGTHS = 5;
const MARK_NAME: Record<Mark, string> = { 2: "Kenne ich", 3: "Klappt im Roll", 4: "Stärke" };

/** How deep into the rings a belt usually has seen and drilled techniques. */
function presetDepth(belt: BeltId, stripes: number) {
  return { weiss: stripes >= 2 ? 1 : 0, blau: stripes >= 2 ? 2 : 1, lila: 2, braun: 3, schwarz: 3 }[belt];
}

export default function Start({ today }: { today: string }) {
  const [step, setStep] = useState<Step>("hello");
  const [name, setName] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [birthYear, setBirthYear] = useState("");
  const [weight, setWeight] = useState("");
  const [belt, setBelt] = useState<BeltId>("weiss");
  const [stripes, setStripes] = useState(0);
  const [since, setSince] = useState("");
  const [goal, setGoal] = useState(2);
  const [cls, setCls] = useState<ClassId | undefined>(undefined);
  const [sea, setSea] = useState<SeaId>(DEFAULT_SEA);
  const [look, setLook] = useState<Look>(DEFAULT_LOOK);
  const [mode, setMode] = useState<Attire>("gi");
  const [marks, setMarks] = useState<Record<string, Mark> | null>(null);
  const [sports, setSports] = useState<{ id: SportId; since?: number }[]>([]);

  const year = Number(today.slice(0, 4));
  const byRaw = parseNum(birthYear, year - 90, year - 4);
  const by = byRaw === null ? null : Math.round(byRaw);
  const kg = parseNum(weight, 30, 200);
  const idx = STEPS.indexOf(step);
  const next = () => {
    const n = STEPS[idx + 1];
    if (n === "technik" && !marks) setMarks(preset(belt, stripes, sports));
    if (n) setStep(n);
    window.scrollTo({ top: 0 });
  };
  const back = () => {
    setStep(idx <= 0 ? "hello" : STEPS[idx - 1]);
    window.scrollTo({ top: 0 });
  };
  const finish = () => {
    const m = marks ?? {};
    const known = Object.keys(m);
    const claims = Object.fromEntries(Object.entries(m).filter(([, v]) => v >= 3));
    createProfile(
      {
        name: name.trim(),
        belt,
        stripes,
        weeklyGoal: goal,
        countries,
        birthYear: by ?? undefined,
        weightKg: kg ?? undefined,
        trainingSince: since || undefined,
        cls,
        homeSea: sea,
        sports,
      },
      today,
      known,
      claims,
      look,
      mode,
    );
  };

  if (step === "hello") {
    return (
      <main className="start">
        <div className="cover">
          <div className="cover-art" aria-hidden="true">
            <p className="cover-kanji">技</p>
          </div>
          <div className="cover-text">
            <h1 className="start-title">
              Waza <span className="gold">Arc</span>
            </h1>
            <p className="start-sub">
              Dein BJJ-Training als RPG. Nach dem Training trägst du in einer halben Minute ein, was passiert ist. Im Training zählst du nur eine Sache mit, deine
              Tagesquest. Daraus entstehen eine Sternkarte mit {TECHS.length} Techniken, ein Charakter mit Ausrüstung, eine Seekarte deiner Reise und dein Power Level.
            </p>
            <div className="start-actions">
              <button type="button" className="btn primary big" onClick={() => setStep("steckbrief")}>
                <span>Charakter erstellen</span>
              </button>
              <button type="button" className="btn big" onClick={() => loadDemo(today)}>
                <Sparkles size={18} aria-hidden="true" />
                <span>Demo-Dōjō ansehen</span>
              </button>
            </div>
            {cloudConfigured ? (
              <p className="start-note">
                Schon ein Konto?{" "}
                <button type="button" className="linkish strong" onClick={() => go("konto")}>
                  Anmelden und Fortschritt laden
                </button>
              </p>
            ) : null}
            <p className="start-note">Ohne Konto bleiben deine Daten in diesem Browser. Mit Konto sind sie gesichert und auf jedem Gerät gleich.</p>
          </div>
        </div>
      </main>
    );
  }

  const gear = previewGear(countries[0]);
  const preview = (
    <Avatar look={look} mode={mode} gear={gear} belt={belt} stripes={stripes} weightKg={kg ?? undefined} size={220} label={name ? `${name}, dein Charakter` : "Dein Charakter"} />
  );
  const head = (title: string) => (
    <>
      <div className="stepper-dots" aria-label={`Schritt ${idx + 1} von ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <i key={s} className={i < idx ? "done" : i === idx ? "on" : ""} />
        ))}
        <span>
          Schritt {idx + 1} von {STEPS.length}
        </span>
      </div>
      <h1 className="page-h">{title}</h1>
    </>
  );

  if (step === "steckbrief") {
    const div = ageDivision(by ?? undefined, year);
    return (
      <main className="start form-page">
        {head("Wer betritt die Matte?")}
        <label className="field">
          <span className="fl">Name oder Spitzname</span>
          <input id="arc-name" value={name} maxLength={32} onChange={(e) => setName(e.target.value)} placeholder="z. B. Rukawa" autoComplete="nickname" />
        </label>
        <div className="row wrap">
          <label className="field">
            <span className="fl">Geburtsjahr (optional)</span>
            <input id="arc-year" inputMode="numeric" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder={String(year - 28)} />
          </label>
          <label className="field">
            <span className="fl">Gewicht in kg (optional)</span>
            <input id="arc-weight" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="76" />
          </label>
        </div>
        <p className="muted small">
          {div ? `Altersklasse nach IBJJF: ${div.name}. ` : ""}Das Gewicht bestimmt die Statur deines Charakters. Beides bleibt in diesem Browser und ist später im Steckbrief änderbar.
        </p>
        <div className="field">
          <span className="fl">Land oder Länder</span>
          <CountryPicker value={countries} onChange={setCountries} />
          <small className="muted">Jedes Land wird ein Aufnäher für Gi und Rashguard. Das erste kommt auf die Schulter.</small>
        </div>
        <div className="field">
          <span className="fl">Weitere Sportarten (optional)</span>
          <SportsPicker value={sports} onChange={setSports} />
          <small className="muted">Mit Ringen, Judo oder Sambo im Hintergrund füllt die App deine Stand-Techniken später als „klappt im Roll“ vor.</small>
        </div>
        <div className="field">
          <span className="fl">Heimatmeer</span>
          <SeaPicker value={sea} onChange={setSea} />
          <small className="muted">Hier beginnt deine Reise auf der Seekarte. Jeder Streifen ist eine Insel.</small>
        </div>
        <Nav back={back} next={next} ok={!!name.trim() && (birthYear === "" || by !== null) && (weight === "" || kg !== null)} />
      </main>
    );
  }

  if (step === "rang") {
    const lvl = PROLOG_LEVEL[belt] + stripes;
    return (
      <main className="start form-page">
        {head("Wo stehst du?")}
        <p className="lede">Du hast schon trainiert, bevor es diese App gab. Dein Gürtel ist dein Prolog: Er setzt Startlevel, Power Level und deine Insel auf der Seekarte.</p>
        <div className="field">
          <span className="fl">Gürtel</span>
          <div className="belt-pick" role="radiogroup" aria-label="Gürtel">
            {BELTS.map((b) => (
              <button key={b.id} type="button" role="radio" aria-checked={belt === b.id} className={belt === b.id ? "on" : ""} onClick={() => setBelt(b.id)}>
                <Belt belt={b.id} stripes={belt === b.id ? stripes : 0} width={72} />
                <span>{b.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="row wrap">
          <div className="field">
            <span className="fl">Streifen</span>
            <Stepper value={stripes} onChange={setStripes} max={4} label="Streifen" />
          </div>
          <label className="field">
            <span className="fl">Trainiert seit (optional)</span>
            <input id="arc-since" type="month" value={since} max={today.slice(0, 7)} onChange={(e) => setSince(e.target.value)} />
          </label>
          <div className="field">
            <span className="fl">Trainings pro Woche (Ziel)</span>
            <Seg value={goal} onChange={(v) => setGoal(v)} label="Wochenziel" options={[1, 2, 3, 4, 5].map((v) => ({ v, label: String(v) }))} />
          </div>
        </div>
        <HeroKoma className="prolog-card" label="Prolog">
          <div className="prolog">
            <span className="hex-badge big" aria-hidden="true">
              <b>{lvl}</b>
            </span>
            <div>
              <p className="eyebrow">Prolog</p>
              <p className="prolog-line">
                Du startest als <b>{rankOf(lvl)}</b> auf Level {lvl}.
              </p>
              <p className="muted small">
                {nf0.format(prologXp(belt, stripes))} XP für die Zeit vor der App und ein Power Level von {power(BELT_R[belt] + 20 * stripes)} als {BELT[belt].name}gurt mit {stripes}{" "}
                Streifen.
              </p>
            </div>
          </div>
        </HeroKoma>
        <p className="muted small">Das Wochenziel hält deine Flamme am Leben. Pausen wegen Verletzung kannst du später markieren.</p>
        <Nav back={back} next={next} ok />
      </main>
    );
  }

  if (step === "klasse") {
    return (
      <main className="start form-page">
        {head("Welche Klasse spielst du?")}
        <p className="lede">
          Dein Spielstil. Die Klasse gibt Quest-XP-Bonus auf ihre Techniken. Die App schaut außerdem, wofür deine Daten sprechen, und zeigt es dir, wenn sich dein Spiel
          verändert. Du kannst jederzeit wechseln.
        </p>
        <ClassPicker value={cls} onChange={setCls} />
        <Nav back={back} next={next} ok={!!cls} hint={cls ? CLASS[cls].perk : "Wähle eine Klasse. Unsicher? Wandler passt zu allem."} />
      </main>
    );
  }

  if (step === "aussehen") {
    return (
      <main className="start form-page wide">
        {head("Wie siehst du aus?")}
        <div className="studio">
          <div className="studio-stage">{preview}</div>
          <LookEditor look={look} onChange={setLook} mode={mode} onMode={setMode} />
        </div>
        <p className="muted small">Mehr Kleidung, Aufnäher, Talismane und Auren findest du im Training: als Beute, für Siegel und für Level.</p>
        <Nav back={back} next={next} ok />
      </main>
    );
  }

  return <TechStep marks={marks ?? {}} setMarks={setMarks} belt={belt} stripes={stripes} head={head("Was kannst du schon?")} back={back} finish={finish} />;
}

function TechStep({
  marks,
  setMarks,
  belt,
  stripes,
  head,
  back,
  finish,
}: {
  marks: Record<string, Mark>;
  setMarks: (m: Record<string, Mark>) => void;
  belt: BeltId;
  stripes: number;
  head: ReactNode;
  back: () => void;
  finish: () => void;
}) {
  const [brush, setBrush] = useState<Mark>(2);
  const [open, setOpen] = useState<string | null>("guard");
  const count = (v: Mark) => Object.values(marks).filter((m) => m === v).length;
  const strengths = count(4);
  const byRing = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const s of SECTORS) m[s.id] = TECHS.filter((x) => x.sector === s.id && x.tier === 1).map((x) => x.id);
    return m;
  }, []);

  const paint = (id: string) => {
    const n = { ...marks };
    if (n[id] === brush) delete n[id];
    else if (brush === 4 && strengths >= MAX_STRENGTHS) return;
    else n[id] = brush;
    setMarks(n);
  };

  return (
    <main className="start form-page">
      {head}
      <p className="lede">
        Markiere, was du schon kannst. <b>Kenne ich</b>: gesehen und gedrillt (Stufe 2). <b>Klappt im Roll</b>: gelingt dir live (Stufe 3). <b>Stärke</b>: eine deiner
        besten Techniken (Stufe 4, höchstens {MAX_STRENGTHS}). Selbsteinschätzungen gelten vorläufig und geben keine XP. Deine Rolls bestätigen sie, dann gibt es XP und die
        Stufe wird fest.
      </p>
      <div className="brushbar">
        <Seg
          value={brush}
          onChange={(v) => setBrush(v as Mark)}
          label="Markierung"
          options={([2, 3, 4] as Mark[]).map((v) => ({ v, label: <span className={`brush b${v}`}>{MARK_NAME[v]}</span> }))}
        />
        <p className="counter">
          {count(2)} kenne ich, {count(3)} klappen, {strengths} von {MAX_STRENGTHS} Stärken
        </p>
      </div>
      <div className="row wrap">
        <button type="button" className="btn ghost small" onClick={() => setMarks({ ...preset(belt, stripes), ...marks })}>
          <Wand2 size={14} aria-hidden="true" /> <span>Vorschlag für {BELT[belt].name}gurt</span>
        </button>
        <button type="button" className="linkish" onClick={() => setMarks({})}>
          Alles leeren
        </button>
      </div>
      <div className="known">
        {SECTORS.map((s) => (
          <section key={s.id} className={`known-sec${open === s.id ? " open" : ""}`}>
            <button type="button" className="known-head" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}>
              <span>{s.name}</span>
              <small>{TECHS.filter((x) => x.sector === s.id && marks[x.id]).length} markiert</small>
              <ChevronDown size={18} aria-hidden="true" />
            </button>
            {open === s.id ? (
              <div className="known-body">
                {byRing[s.id]?.length ? (
                  <button type="button" className="chip" onClick={() => setMarks({ ...Object.fromEntries(byRing[s.id].map((id) => [id, 2 as Mark])), ...marks })}>
                    Alles aus {RINGS[1].jp} ({RINGS[1].de}) als „kenne ich“
                  </button>
                ) : null}
                {s.branches.map((b) => (
                  <div key={b.id} className="known-branch">
                    <p className="k">{b.name}</p>
                    <div className="chips">
                      {TECHS.filter((x) => x.sector === s.id && x.branch === b.id).map((x) => {
                        const m = marks[x.id];
                        return (
                          <button
                            key={x.id}
                            type="button"
                            className={`chip mark${m ? ` m${m}` : ""}`}
                            aria-pressed={!!m}
                            aria-label={`${x.name}${m ? `, ${MARK_NAME[m]}` : ""}`}
                            onClick={() => paint(x.id)}
                          >
                            {x.name}
                            <small>{m ? MARK_NAME[m] : RINGS[x.tier].jp}</small>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
      <div className="row sticky-actions">
        <button type="button" className="btn ghost" onClick={back}>
          Zurück
        </button>
        <button type="button" className="btn primary" onClick={finish}>
          <span>Dōjō betreten</span>
        </button>
      </div>
    </main>
  );
}

function Nav({ back, next, ok, hint }: { back: () => void; next: () => void; ok: boolean; hint?: string }) {
  return (
    <div className="row wrap sticky-actions">
      {hint ? <p className="muted small grow">{hint}</p> : null}
      <button type="button" className="btn ghost" onClick={back}>
        Zurück
      </button>
      <button type="button" className="btn primary" disabled={!ok} onClick={next}>
        <span>Weiter</span>
      </button>
    </div>
  );
}

function preset(belt: BeltId, stripes: number, sports: { id: SportId }[] = []): Record<string, Mark> {
  const depth = presetDepth(belt, stripes);
  const out: Record<string, Mark> = Object.fromEntries(TECHS.filter((x) => x.tier <= depth).map((x) => [x.id, 2 as Mark]));
  // A wrestling, judo or sambo background: stand-up basics already work live.
  if (sports.some((s) => SPORT[s.id].grappling)) for (const x of TECHS) if (x.sector === "stand" && x.tier <= 2) out[x.id] = 3;
  return out;
}

function previewGear(country?: string): Partial<Record<Slot, ItemDef>> {
  const g: Partial<Record<Slot, ItemDef>> = {};
  for (const [slot, id] of Object.entries(DEFAULT_EQUIP) as [Slot, string][]) g[slot] = ITEM[id];
  if (country) g.patch1 = { id: `flag:${country}`, name: country, slot: "patch", rarity: "common", desc: "", src: { t: "country", code: country }, art: { emblem: "flag", code: country } };
  return g;
}

function parseNum(v: string, min: number, max: number) {
  if (!v.trim()) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 10) / 10 : null;
}
