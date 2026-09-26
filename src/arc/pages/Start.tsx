import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Cloud, Wand2 } from "lucide-react";
import type { Attire, Belt as BeltId, ClassId, Look, SeaId, Slot, SportId } from "../core/types.ts";
import { DEFAULT_SEA } from "../core/sea.ts";
import type { ItemDef } from "../core/items.ts";
import { DEFAULT_EQUIP, ITEM } from "../core/items.ts";
import { CLASS } from "../core/classes.ts";
import { SECTORS, TECH, TECHS } from "../core/techniques.ts";
import { RINGS, rankOf } from "../core/lore.ts";
import { BELT_R, PROLOG_LEVEL, prologXp } from "../core/model.ts";
import { BELT, BELTS, nf0, power } from "../format.ts";
import { createProfile, loadDemo } from "../actions.ts";
import { DEFAULT_LOOK } from "../avatarOptions.ts";
import { ageDivision } from "../character.ts";
import Avatar from "../components/Avatar.tsx";
import { ClassPicker, CountryPicker, LookEditor, SeaPicker, SincePicker, SportsPicker } from "../components/CharacterForms.tsx";
import { SPORT } from "../core/sports.ts";
import { Belt, HeroKoma, Seg, Stepper } from "../components/ui.tsx";
import { cloudConfigured, afterSignIn, useCloud } from "../cloud/state.ts";
import { go } from "../store.ts";
import { HEIGHT_CM } from "../core/body.ts";

type Step = "hello" | "steckbrief" | "rang" | "klasse" | "aussehen" | "technik" | "sichern";
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
  const [height, setHeight] = useState("");
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
  const cloud = useCloud();
  // Without an account the last step offers one, so the new character does not live in this browser only.
  const steps: Step[] = cloud.configured && cloud.status !== "signedIn" ? [...STEPS, "sichern"] : STEPS;

  const year = Number(today.slice(0, 4));
  const byRaw = parseNum(birthYear, year - 90, year - 4);
  const by = byRaw === null ? null : Math.round(byRaw);
  const kg = parseNum(weight, 30, 200);
  const cm = parseNum(height, HEIGHT_CM.min, HEIGHT_CM.max);
  const idx = steps.indexOf(step);
  const next = () => {
    const n = steps[idx + 1];
    if (n === "technik" && !marks) setMarks(preset(belt, stripes, sports));
    if (n) setStep(n);
    window.scrollTo({ top: 0 });
  };
  const back = () => {
    setStep(idx <= 0 ? "hello" : steps[idx - 1]);
    window.scrollTo({ top: 0 });
  };
  const finish = (account = false) => {
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
        heightCm: cm === null ? undefined : Math.round(cm),
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
    if (account) {
      // Came in through an invitation link: back to it after signing in.
      const invite = /^#\/einladung\/([^/]+)$/.exec(window.location.hash);
      if (invite) afterSignIn("einladung", decodeURIComponent(invite[1]));
      else afterSignIn("heute");
      go("konto");
    }
  };

  if (step === "hello") {
    return (
      <main className="start">
        <div className="cover">
          <div className="cover-art" aria-hidden="true">
            <p className="cover-kanji">技</p>
            {/* Kintsugi: the character broke and was mended with gold, the way a
                technique gets better every time it fails on the mat. */}
            <svg className="cover-seam" viewBox="0 0 400 600" preserveAspectRatio="none">
              <path className="main" d="M252 0 L244 58 L262 104 L236 162 L258 214 L221 266 L247 318 L208 372 L231 430 L196 488 L214 546 L189 600" />
              <path className="twig" d="M236 162 L206 186 L214 214 L188 236" />
              <path className="twig" d="M221 266 L262 290 L286 282 L305 306" />
              <path className="twig" d="M231 430 L266 452 L262 478" />
            </svg>
            <p className="cover-cap">
              <b>技</b> waza, die Technik
            </p>
          </div>
          <div className="cover-text">
            <h1 className="start-title">
              Waza <span className="gold">Arc</span>
            </h1>
            <p className="start-sub">
              Dein BJJ-Training als RPG. Nach dem Training trägst du kurz ein, was passiert ist. Im Training zählst du nur eine Sache mit, deine
              Tagesquest. Daraus entstehen ein Zweig mit {TECHS.length} Techniken, ein Charakter mit Ausrüstung, eine Seekarte deiner Reise und dein Power Level.
            </p>
            <div className="start-actions">
              <button type="button" className="btn primary big" onClick={() => setStep("steckbrief")}>
                <span>Charakter erstellen</span>
              </button>
              <button type="button" className="btn big" onClick={() => loadDemo(today)}>
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
    <Avatar look={look} mode={mode} gear={gear} belt={belt} stripes={stripes} weightKg={kg ?? undefined} heightCm={cm ?? undefined} size={220} label={name ? `${name}, dein Charakter` : "Dein Charakter"} />
  );
  // Each step opens like a chapter: its number written large in kanji beside the title.
  const head = (title: string) => (
    <header className="onb-head">
      <span className="onb-k" aria-hidden="true">
        {"一二三四五六七"[idx] ?? ""}
      </span>
      <div className="onb-t">
        <div className="stepper-dots" aria-label={`Schritt ${idx + 1} von ${steps.length}`}>
          {steps.map((s, i) => (
            <i key={s} className={i < idx ? "done" : i === idx ? "on" : ""} />
          ))}
          <span>
            Schritt {idx + 1} von {steps.length}
          </span>
        </div>
        <h1 className="page-h">{title}</h1>
      </div>
    </header>
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
            <span className="fl">Größe in cm (optional)</span>
            <input id="arc-height" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="178" />
          </label>
          <label className="field">
            <span className="fl">Gewicht in kg (optional)</span>
            <input id="arc-weight" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="76" />
          </label>
        </div>
        <p className="muted small">
          {div ? `Altersklasse nach IBJJF: ${div.name}. ` : ""}Größe und Gewicht formen deinen Charakter: die Größe seine Körperhöhe, das Gewicht im Verhältnis zur Größe seine Statur. Freunde und Crew sehen nur die Figur, nie die Zahlen. Später im Steckbrief änderbar.
        </p>
        <div className="field">
          <span className="fl">Land oder Länder</span>
          <CountryPicker value={countries} onChange={setCountries} />
          <small className="muted">Jedes Land wird ein Aufnäher für Gi und Rashguard und bringt seine traditionelle Kopfbedeckung mit. Das erste kommt auf die Schulter.</small>
        </div>
        <div className="field">
          <span className="fl">Weitere Sportarten (optional)</span>
          <SportsPicker value={sports} onChange={setSports} />
          <small className="muted">Mit Ringen, Judo oder Sambo im Hintergrund füllt die App deine Stand-Techniken später als „klappt im Roll“ vor.</small>
        </div>
        <div className="field">
          <span className="fl">Heimatmeer</span>
          <SeaPicker value={sea} onChange={setSea} />
          <small className="muted">Hier legt dein Schiff ab. Jedes Training bringt es weiter, ob Gi oder No-Gi.</small>
        </div>
        <Nav back={back} next={next} ok={!!name.trim() && (birthYear === "" || by !== null) && (weight === "" || kg !== null) && (height === "" || cm !== null)} />
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
          <SincePicker id="arc-since" label="Trainiert seit (optional)" value={since || undefined} today={today} onChange={(v) => setSince(v ?? "")} />
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
          <LookEditor look={look} onChange={setLook} mode={mode} onMode={setMode} heightCm={cm === null ? undefined : Math.round(cm)} />
        </div>
        <p className="muted small">Mehr Kleidung, Aufnäher, Talismane und Auren findest du im Training: als Beute, für Siegel und für Level.</p>
        <Nav back={back} next={next} ok />
      </main>
    );
  }

  if (step === "sichern") {
    return (
      <main className="start form-page">
        {head("Sichere deinen Charakter")}
        <div className="save-offer">
          <div className="save-offer-art">
            <Avatar look={look} mode={mode} gear={gear} belt={belt} stripes={stripes} weightKg={kg ?? undefined} heightCm={cm ?? undefined} size={150} crop="head" label={name ? `${name}, dein Charakter` : "Dein Charakter"} />
          </div>
          <div className="save-offer-text">
            <p className="lede">Dein Charakter ist fertig. Ohne Konto lebt er nur in diesem Browser: Räumt der Browser auf oder wechselst du das Handy, ist der Fortschritt weg.</p>
            <ul className="save-offer-list">
              <li>Gesichert, auch wenn der Browser seine Daten löscht.</li>
              <li>Auf Handy, Tablet und Laptop derselbe Stand.</li>
              <li>Anmelden geht ohne Passwort, mit einem Code per E-Mail.</li>
            </ul>
          </div>
        </div>
        <p className="muted small">Dein Charakter wird in beiden Fällen jetzt angelegt. Das Konto kannst du später im Profil nachholen.</p>
        <div className="row wrap save-offer-actions">
          <button type="button" className="btn ghost" onClick={back}>
            Zurück
          </button>
          <button type="button" className="btn" onClick={() => finish()}>
            Ohne Konto weiter
          </button>
          <button type="button" className="btn primary" onClick={() => finish(true)}>
            <Cloud size={18} aria-hidden="true" />
            <span>Konto erstellen</span>
          </button>
        </div>
      </main>
    );
  }

  const last = idx === steps.length - 1;
  return (
    <TechStep
      marks={marks ?? {}}
      setMarks={setMarks}
      suggestion={() => preset(belt, stripes, sports)}
      suggestionLabel={`Vorschlag für ${BELT[belt].name}gurt`}
      head={head("Was kannst du schon?")}
      back={back}
      done={last ? () => finish() : next}
      doneLabel={last ? "Dōjō betreten" : "Weiter"}
    />
  );
}

/** A whole block at once: 0 clears it, 2 and 3 set every technique in it (strengths stay). */
type Level = 0 | 2 | 3;
const LEVELS: { v: Level; label: string; title?: string }[] = [
  { v: 0, label: "Nichts" },
  { v: 2, label: "Kenne ich" },
  { v: 3, label: "Klappt", title: "Klappt im Roll" },
];
const MIXED = -1;

/** The common level of a block, or MIXED. Strengths are set one by one and do not count. */
function blockLevel(ids: string[], marks: Record<string, Mark>): Level | typeof MIXED {
  let lvl: Level | null = null;
  let strong = false;
  for (const id of ids) {
    const m = marks[id];
    if (m === 4) {
      strong = true;
      continue;
    }
    const v: Level = m ?? 0;
    if (lvl === null) lvl = v;
    else if (lvl !== v) return MIXED;
  }
  if (lvl === null || (strong && lvl === 0)) return MIXED;
  return lvl;
}

const FUND_IDS = TECHS.filter((x) => x.sector === "fund").map((x) => x.id);
const RING_IDS = RINGS.map((_, tier) => TECHS.filter((x) => x.tier === tier).map((x) => x.id));

function TechStep({
  marks,
  setMarks,
  suggestion,
  suggestionLabel,
  head,
  back,
  done,
  doneLabel,
}: {
  marks: Record<string, Mark>;
  setMarks: (m: Record<string, Mark>) => void;
  suggestion: () => Record<string, Mark>;
  suggestionLabel: string;
  head: ReactNode;
  back: () => void;
  done: () => void;
  doneLabel: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const count = (v: Mark) => Object.values(marks).filter((m) => m === v).length;
  const strengths = count(4);
  const bySector = useMemo(() => {
    const m: Record<string, { ids: string[]; branches: { id: string; name: string; ids: string[] }[] }> = {
      fund: { ids: FUND_IDS, branches: [{ id: "fund", name: "Fundament", ids: FUND_IDS }] },
    };
    for (const s of SECTORS) {
      const branches = s.branches.map((b) => ({ ...b, ids: TECHS.filter((x) => x.sector === s.id && x.branch === b.id).map((x) => x.id) }));
      m[s.id] = { ids: branches.flatMap((b) => b.ids), branches };
    }
    return m;
  }, []);
  const sections = [{ id: "fund", name: "Fundament" }, ...SECTORS.map((s) => ({ id: s.id, name: s.name }))];

  const setBlock = (ids: string[], lvl: Level) => {
    const n = { ...marks };
    for (const id of ids) {
      if (lvl === 0) delete n[id];
      else if (n[id] !== 4) n[id] = lvl;
    }
    setHint(null);
    setMarks(n);
  };
  /** One tap moves a technique a level up: Kenne ich, Klappt im Roll, Stärke, then back to nothing. */
  const cycle = (id: string, name: string) => {
    const n = { ...marks };
    const m = n[id];
    let next: Mark | undefined = m === undefined ? 2 : m === 2 ? 3 : m === 3 ? 4 : undefined;
    if (next === 4 && strengths >= MAX_STRENGTHS) {
      next = undefined;
      setHint(`Schon ${MAX_STRENGTHS} Stärken. ${name} ist wieder leer; nimm erst eine andere Stärke zurück.`);
    } else setHint(null);
    if (next) n[id] = next;
    else delete n[id];
    setMarks(n);
  };
  const blockSeg = (ids: string[], label: string) => (
    <div className="block-seg">
      <Seg value={blockLevel(ids, marks)} onChange={(v) => setBlock(ids, v as Level)} label={label} options={LEVELS} />
    </div>
  );

  return (
    <main className="start form-page">
      {head}
      <p className="lede">
        Stufe erst ganze Blöcke ein, dann einzelne Techniken. <b>Kenne ich</b>: gesehen und gedrillt. <b>Klappt</b>: gelingt dir im Roll. <b>Stärke</b>: eine deiner besten,
        höchstens {MAX_STRENGTHS}, nur einzeln. Selbsteinschätzungen gelten vorläufig und geben keine XP; deine Rolls bestätigen sie.
      </p>
      <div className="row wrap">
        <button type="button" className="btn ghost small" onClick={() => setMarks({ ...suggestion(), ...marks })}>
          <Wand2 size={14} aria-hidden="true" /> <span>{suggestionLabel}</span>
        </button>
        <button type="button" className="linkish" onClick={() => setMarks({})}>
          Alles leeren
        </button>
      </div>
      <div className="known-bar">
        <p className="counter" aria-live="polite">
          {count(2)} kenne ich, {count(3)} klappen, {strengths} von {MAX_STRENGTHS} Stärken
        </p>
        {hint ? (
          <p className="known-hint" role="status">
            {hint}
          </p>
        ) : null}
      </div>

      <h2 className="h3 known-h">Nach Ring</h2>
      <div className="block-list">
        {RINGS.map((r, tier) =>
          tier === 0 ? null : (
            <div key={r.jp} className="block-row">
              <div className="block-name">
                <b>
                  {r.jp}, {r.de}
                </b>
                <small>
                  {RING_IDS[tier].filter((id) => marks[id]).length} von {RING_IDS[tier].length} markiert
                </small>
              </div>
              {blockSeg(RING_IDS[tier], `Alle Techniken aus ${r.jp}`)}
            </div>
          ),
        )}
      </div>

      <h2 className="h3 known-h">Nach Bereich</h2>
      <div className="block-list">
        {sections.map((s) => {
          const sec = bySector[s.id];
          const isOpen = open === s.id;
          return (
            <section key={s.id} className={`known-sec${isOpen ? " open" : ""}`} aria-label={s.name}>
              <div className="block-row">
                <div className="block-name">
                  <b>{s.name}</b>
                  <small>
                    {sec.ids.filter((id) => marks[id]).length} von {sec.ids.length} markiert
                  </small>
                </div>
                {blockSeg(sec.ids, `Alle Techniken aus ${s.name}`)}
                <button type="button" className="btn ghost small known-toggle" aria-expanded={isOpen} aria-controls={`known-${s.id}`} onClick={() => setOpen(isOpen ? null : s.id)}>
                  <span>Einzeln</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
              </div>
              {isOpen ? (
                <div className="known-body" id={`known-${s.id}`}>
                  {sec.branches.map((b) => (
                    <div key={b.id} className="known-branch">
                      {sec.branches.length > 1 ? (
                        <div className="block-row sub">
                          <p className="block-name">
                            <b>{b.name}</b>
                          </p>
                          {blockSeg(b.ids, `Alle Techniken aus ${b.name}`)}
                        </div>
                      ) : null}
                      <div className="chips">
                        {b.ids.map((id) => {
                          const x = TECH[id];
                          const m = marks[id];
                          return (
                            <button
                              key={id}
                              type="button"
                              className={`chip mark${m ? ` m${m}` : ""}`}
                              aria-label={`${x.name}: ${m ? MARK_NAME[m] : "nicht markiert"}`}
                              onClick={() => cycle(id, x.name)}
                            >
                              {x.name}
                              <small>{m ? MARK_NAME[m] : RINGS[x.tier].jp}</small>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <p className="muted small">Antippen setzt eine Stufe höher: Kenne ich, Klappt im Roll, Stärke, dann wieder leer.</p>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
      <div className="row sticky-actions">
        <button type="button" className="btn ghost" onClick={back}>
          Zurück
        </button>
        <button type="button" className="btn primary" onClick={done}>
          <span>{doneLabel}</span>
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
