import { useMemo, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import type { Belt as BeltId } from "../core/types.ts";
import { SECTORS, TECHS } from "../core/techniques.ts";
import { RINGS } from "../core/lore.ts";
import { BELTS } from "../format.ts";
import { createProfile, loadDemo } from "../actions.ts";
import { Belt, Seg, Stepper } from "../components/ui.tsx";

export default function Start({ today }: { today: string }) {
  const [step, setStep] = useState<"hello" | "profile" | "known">("hello");
  const [name, setName] = useState("");
  const [belt, setBelt] = useState<BeltId>("weiss");
  const [stripes, setStripes] = useState(0);
  const [goal, setGoal] = useState(2);
  const [known, setKnown] = useState<Set<string>>(new Set(TECHS.filter((x) => x.sector === "fund").map((x) => x.id)));
  const [open, setOpen] = useState<string | null>("guard");

  const toggle = (id: string) =>
    setKnown((k) => {
      const n = new Set(k);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const byRing = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const s of SECTORS) m[s.id] = TECHS.filter((x) => x.sector === s.id && x.tier === 1).map((x) => x.id);
    return m;
  }, []);

  if (step === "hello") {
    return (
      <main className="start">
        <div className="start-burst" aria-hidden="true" />
        <p className="start-kanji" aria-hidden="true">
          技
        </p>
        <h1 className="start-title">
          <span>WAZA</span> <span className="gold">ARC</span>
        </h1>
        <p className="start-sub">
          Dein BJJ-Training als RPG. Nach dem Training trägst du in einer halben Minute ein, was passiert ist. Im Training zählst du nur eine Sache mit: deine
          Tagesquest. Daraus wird eine Sternkarte mit {TECHS.length} Techniken, ein Charakterbogen und dein Ki.
        </p>
        <div className="start-actions">
          <button type="button" className="btn primary big" onClick={() => setStep("profile")}>
            <span>Profil anlegen</span>
          </button>
          <button type="button" className="btn ghost big" onClick={() => loadDemo(today)}>
            <Sparkles size={16} aria-hidden="true" />
            <span>Demo-Dōjō ansehen</span>
          </button>
        </div>
        <p className="start-note">Deine Daten bleiben in diesem Browser. Über das Profil kannst du sie jederzeit exportieren.</p>
      </main>
    );
  }

  if (step === "profile") {
    return (
      <main className="start form-page">
        <p className="eyebrow">Schritt 1 von 2</p>
        <h1 className="page-h">Wer betritt die Matte?</h1>
        <label className="field">
          <span className="fl">Name oder Spitzname</span>
          <input id="arc-name" value={name} maxLength={32} onChange={(e) => setName(e.target.value)} placeholder="z. B. Rukawa" autoComplete="nickname" />
        </label>
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
          <div className="field">
            <span className="fl">Trainings pro Woche (Ziel)</span>
            <Seg value={goal} onChange={(v) => setGoal(v)} label="Wochenziel" options={[1, 2, 3, 4, 5].map((v) => ({ v, label: String(v) }))} />
          </div>
        </div>
        <p className="muted small">Das Wochenziel hält deine Flamme am Leben. Zwei Trainings sind ein guter Start, Pausen wegen Verletzung kannst du später markieren.</p>
        <div className="row">
          <button type="button" className="btn ghost" onClick={() => setStep("hello")}>
            Zurück
          </button>
          <button type="button" className="btn primary" disabled={!name.trim()} onClick={() => setStep("known")}>
            <span>Weiter</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="start form-page">
      <p className="eyebrow">Schritt 2 von 2</p>
      <h1 className="page-h">Was kennst du schon?</h1>
      <p className="lede">
        Markiere, was du schon gelernt hast. Das hebt die Technik auf Stufe 2 (vorläufig). Ab Stufe 3 zählen nur deine Rolls. Die Fundament-Techniken sind schon
        markiert.
      </p>
      <p className="counter">{known.size} markiert</p>
      <div className="known">
        {SECTORS.map((s) => (
          <section key={s.id} className={`known-sec${open === s.id ? " open" : ""}`}>
            <button type="button" className="known-head" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}>
              <span>{s.name}</span>
              <small>{TECHS.filter((x) => x.sector === s.id && known.has(x.id)).length} markiert</small>
              <ChevronDown size={18} aria-hidden="true" />
            </button>
            {open === s.id ? (
              <div className="known-body">
                <button type="button" className="chip" onClick={() => setKnown((k) => new Set([...k, ...byRing[s.id]]))}>
                  Alles aus {RINGS[1].jp} ({RINGS[1].de}) markieren
                </button>
                {s.branches.map((b) => (
                  <div key={b.id} className="known-branch">
                    <p className="k">{b.name}</p>
                    <div className="chips">
                      {TECHS.filter((x) => x.sector === s.id && x.branch === b.id).map((x) => (
                        <button key={x.id} type="button" className={`chip${known.has(x.id) ? " on" : ""}`} aria-pressed={known.has(x.id)} onClick={() => toggle(x.id)}>
                          {x.name}
                          <small>{RINGS[x.tier].jp}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
      <div className="row sticky-actions">
        <button type="button" className="btn ghost" onClick={() => setStep("profile")}>
          Zurück
        </button>
        <button type="button" className="btn primary" onClick={() => createProfile({ name: name.trim(), belt, stripes, weeklyGoal: goal }, today, [...known])}>
          <span>Dōjō betreten</span>
        </button>
      </div>
    </main>
  );
}
