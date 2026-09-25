import { useRef, useState } from "react";
import { Cloud, Download, HeartPulse, LogOut, Trash2, Upload } from "lucide-react";
import type { ArcData, ArcState, Belt as BeltId } from "../core/types.ts";
import { APP_NAME } from "../core/lore.ts";
import { BELTS, BELT, shortDate } from "../format.ts";
import { exportJson, importJson, promote, resetAll, togglePause, updateProfile } from "../actions.ts";
import { arcStore } from "../store.ts";
import { Belt, HeroKoma, SecTitle, Seg, Stepper } from "../components/ui.tsx";
import { useTheme } from "../theme.ts";
import { useCloud } from "../cloud/state.ts";
import { go } from "../store.ts";
import { getPlan } from "../plan.ts";

export default function Profil({ data, st, today }: { data: ArcData; st: ArcState; today: string }) {
  const p = data.profile;
  const [name, setName] = useState(p?.name ?? "");
  const [belt, setBelt] = useState<BeltId>(p?.belt ?? "weiss");
  const [stripes, setStripes] = useState(p?.stripes ?? 0);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useTheme();
  const plan = getPlan(data);
  const cloud = useCloud();
  const signedIn = cloud.status === "signedIn";
  if (!p) return null;
  const changedRank = belt !== p.belt || stripes !== p.stripes;

  return (
    <div className="page profil">
      <SecTitle kanji="道" eyebrow="Profil" title="Dein Weg" />
      {data.demo ? (
        <section className="panel demo-note">
          <p>
            <b>Demo-Dōjō.</b> Das sind simulierte Daten eines Blaugurts über 20 Wochen. Wenn du fertig geschaut hast, leg dein eigenes Profil an.
          </p>
          <button type="button" className="btn primary" onClick={resetAll}>
            <LogOut size={16} aria-hidden="true" /> <span>Demo verlassen</span>
          </button>
        </section>
      ) : null}

      <section className="reg" aria-label="Grundlagen">
        <h2 className="h3 reg-h">Grundlagen</h2>
        <div className="reg-b">
        <label className="field">
          <span className="fl">Name</span>
          <input id="arc-profile-name" value={name} maxLength={32} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && updateProfile({ name: name.trim() })} />
        </label>
        <div className="field">
          <span className="fl">Trainings pro Woche (Ziel)</span>
          <Seg value={p.weeklyGoal} onChange={(v) => updateProfile({ weeklyGoal: v })} label="Wochenziel" options={[1, 2, 3, 4, 5].map((v) => ({ v, label: String(v) }))} />
        </div>
        <div className="field">
          <span className="fl">Heilungsmodus</span>
          <button type="button" className={`chip${st.paused ? " on" : ""}`} aria-pressed={st.paused} onClick={() => togglePause(today)}>
            <HeartPulse size={14} aria-hidden="true" /> {st.paused ? "Diese Woche pausiert" : "Diese Woche pausieren"}
          </button>
          <small className="muted">Eine pausierte Woche bricht deine Flamme nicht. Es wird kein Grund gespeichert.</small>
        </div>
              </div>
      </section>

      <section className="reg" aria-label="Wochenplan">
        <h2 className="h3 reg-h">Wochenplan und Erinnerungen</h2>
        <div className="reg-b">
        <p className="small">
          {plan.slots.length
            ? `${plan.slots.length} ${plan.slots.length === 1 ? "Training" : "Trainings"} pro Woche im Plan, davon ${plan.slots.filter((x) => x.sport === "bjj").length} BJJ. Erinnerung ${plan.lead} Minuten vorher.`
            : "Noch kein Plan. Mit Trainingszeiten erinnert dich Waza Arc vor jedem Training an deine Quest, per Benachrichtigung, E-Mail oder Kalender."}
        </p>
        <button type="button" className="btn" onClick={() => go("plan")}>
          <span>{plan.slots.length ? "Wochenplan öffnen" : "Wochenplan anlegen"}</span>
        </button>
              </div>
      </section>

      {cloud.configured ? (
        <section className="reg" aria-label="Crew und Gym">
        <h2 className="h3 reg-h">Crew, Freundeskreis und Gym</h2>
        <div className="reg-b">
          <p className="small">Segelt als Crew zusammen, fügt euch per Code hinzu und seht, wer aus deinem Gym heute trainiert. Andere sehen nur deine Karte, nie dein Trainingstagebuch.</p>
          <div className="row wrap">
            <button type="button" className="btn" onClick={() => go("meer", "crew")}>
              <span>Crew und Freundeskreis</span>
            </button>
            <button type="button" className="btn" onClick={() => go("gym")}>
              <span>Gym</span>
            </button>
          </div>
                </div>
      </section>
      ) : null}

      {cloud.configured ? (
        <section className="reg konto-teaser" aria-label="Konto und Sicherung">
        <h2 className="h3 reg-h">Konto und Sicherung</h2>
        <div className="reg-b">
          {signedIn ? (
            <p className="small">
              <Cloud size={16} aria-hidden="true" /> Angemeldet als {cloud.user?.email ?? cloud.user?.phone ?? (cloud.user?.anonymous ? "Gast" : "Konto")}.{" "}
              {cloud.sync.pending ? `${cloud.sync.pending} Änderungen warten auf die Sicherung.` : "Alles gesichert."}
            </p>
          ) : (
            <p className="small">Noch kein Konto: Deine Daten liegen nur in diesem Browser. Mit Konto sind sie gesichert und auf jedem Gerät gleich.</p>
          )}
          <button type="button" className={`btn${signedIn ? "" : " primary"}`} onClick={() => go("konto")}>
            <span>{signedIn ? "Konto verwalten" : "Anmelden oder Konto erstellen"}</span>
          </button>
                </div>
      </section>
      ) : null}

      <section className="reg" aria-label="Darstellung">
        <h2 className="h3 reg-h">Darstellung</h2>
        <div className="reg-b">
        <Seg
          label="Ausgabe"
          value={theme}
          onChange={setTheme}
          options={[
            { v: "nacht", label: "Urushi" },
            { v: "papier", label: "Washi" },
            { v: "system", label: "Wie das System" },
          ]}
        />
        <small className="muted">Urushi ist schwarzer Lack mit Blattgold, Washi helles Papier mit Tusche.</small>
              </div>
      </section>

      <HeroKoma label="Gürtelprüfung">
        <div className="exam">
          <h2 className="h2">Gürtelprüfung</h2>
          <div className="belt-hero">
            <Belt belt={belt} stripes={stripes} width={360} tape />
          </div>
          <p className="muted small">Neuer Streifen oder Gürtel? Trag ihn hier ein. Das Datum wird gespeichert, damit sich später prüfen lässt, ob deine Werte vor einer Prüfung steigen. Auf der Seekarte segelt dein Schiff damit zur nächsten Insel.</p>
          <div className="belt-pick" role="radiogroup" aria-label="Gürtel">
            {BELTS.map((b) => (
              <button key={b.id} type="button" role="radio" aria-checked={belt === b.id} className={belt === b.id ? "on" : ""} onClick={() => setBelt(b.id)}>
                <Belt belt={b.id} stripes={belt === b.id ? stripes : 0} width={72} />
                <span>{b.name}</span>
              </button>
            ))}
          </div>
          <div className="row wrap">
            <div className="field">
              <span className="fl">Streifen</span>
              <Stepper value={stripes} onChange={setStripes} max={4} label="Streifen" />
            </div>
            <button type="button" className="btn primary" disabled={!changedRank} onClick={() => promote(today, belt, stripes)}>
              <span>Prüfung eintragen</span>
            </button>
          </div>
          {data.promotions.length ? (
            <ul className="promos">
              {[...data.promotions].reverse().map((pr, i) => (
                <li key={i}>
                  <Belt belt={pr.belt} stripes={pr.stripes} width={56} /> {BELT[pr.belt].name}, {pr.stripes} Streifen, am {shortDate(pr.date)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </HeroKoma>

      <section className="reg" aria-label="Daten">
        <h2 className="h3 reg-h">Daten</h2>
        <div className="reg-b">
        <p className="muted small">
          {signedIn
            ? `${APP_NAME} speichert in diesem Browser und in deinem Konto. Der Export ist eine zusätzliche Kopie als Datei.`
            : `${APP_NAME} speichert alles nur in diesem Browser. Mit dem Export sicherst du deine Daten oder nimmst sie auf ein anderes Gerät mit.`}
          {arcStore.saved() ? "" : " Achtung: Der Browser lässt gerade kein Speichern zu (privates Fenster?). Exportiere deine Daten, bevor du die Seite schließt."}
        </p>
        <div className="row wrap">
          <button type="button" className="btn ghost" onClick={() => exportJson(data)}>
            <Download size={16} aria-hidden="true" /> <span>Exportieren</span>
          </button>
          <button type="button" className="btn ghost" onClick={() => file.current?.click()}>
            <Upload size={16} aria-hidden="true" /> <span>Importieren</span>
          </button>
          <input
            ref={file}
            id="arc-import"
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const err = await importJson(f);
              setMsg(err ?? "Import erfolgreich.");
              e.target.value = "";
            }}
          />
        </div>
        {msg ? <p className="small" role="status">{msg}</p> : null}
        <div className="danger">
          {confirm ? (
            <>
              <p className="small">
                Wirklich alles löschen? Profil, {data.sessions.length} Trainings und alle Werte sind danach weg{signedIn ? ", auch in deinem Konto auf allen Geräten" : ""}.
              </p>
              <div className="row">
                <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>
                  Abbrechen
                </button>
                <button type="button" className="btn danger-btn" onClick={resetAll}>
                  <Trash2 size={16} aria-hidden="true" /> <span>Endgültig löschen</span>
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="btn ghost" onClick={() => setConfirm(true)}>
              <Trash2 size={16} aria-hidden="true" /> <span>Alle Daten löschen</span>
            </button>
          )}
        </div>
              </div>
      </section>
      <p className="muted small footnote">
        Technik-Namen wie auf deutschen Matten üblich, japanische Begriffe in Kodokan-Schreibweise. Beinhebel und riskante Techniken tragen einen Hinweis: kontrolliert
        ansetzen und das Regelwerk deines Turniers prüfen.
      </p>
    </div>
  );
}
