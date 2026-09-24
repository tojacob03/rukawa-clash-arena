import { useRef, useState } from "react";
import { Download, HeartPulse, LogOut, Trash2, Upload } from "lucide-react";
import type { ArcData, ArcState, Belt as BeltId } from "../core/types.ts";
import { APP_NAME } from "../core/lore.ts";
import { BELTS, BELT, shortDate } from "../format.ts";
import { exportJson, importJson, promote, resetAll, togglePause, updateProfile } from "../actions.ts";
import { arcStore } from "../store.ts";
import { Belt, SecTitle, Seg, Stepper } from "../components/ui.tsx";

export default function Profil({ data, st, today }: { data: ArcData; st: ArcState; today: string }) {
  const p = data.profile;
  const [name, setName] = useState(p?.name ?? "");
  const [belt, setBelt] = useState<BeltId>(p?.belt ?? "weiss");
  const [stripes, setStripes] = useState(p?.stripes ?? 0);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
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

      <section className="panel form-panel">
        <label className="field">
          <span className="fl">Name</span>
          <input id="arc-profile-name" value={name} maxLength={32} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && updateProfile({ name: name.trim() })} />
        </label>
        <div className="field">
          <span className="fl">Trainings pro Woche (Ziel)</span>
          <Seg<number> value={p.weeklyGoal} onChange={(v) => updateProfile({ weeklyGoal: v })} label="Wochenziel" options={[1, 2, 3, 4, 5].map((v) => ({ v, label: String(v) }))} />
        </div>
        <div className="field">
          <span className="fl">Heilungsmodus</span>
          <button type="button" className={`chip${st.paused ? " on" : ""}`} aria-pressed={st.paused} onClick={() => togglePause(today)}>
            <HeartPulse size={14} aria-hidden="true" /> {st.paused ? "Diese Woche pausiert" : "Diese Woche pausieren"}
          </button>
          <small className="muted">Eine pausierte Woche bricht deine Flamme nicht. Es wird kein Grund gespeichert.</small>
        </div>
      </section>

      <section className="panel form-panel">
        <h2 className="h3">Gürtelprüfung</h2>
        <p className="muted small">Neuer Streifen oder Gürtel? Trag ihn hier ein. Das Datum wird gespeichert, damit sich später prüfen lässt, ob deine Werte vor einer Prüfung steigen.</p>
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
                <Belt belt={pr.belt} stripes={pr.stripes} width={56} /> {BELT[pr.belt].name}, {pr.stripes} Streifen · {shortDate(pr.date)}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="panel form-panel">
        <h2 className="h3">Daten</h2>
        <p className="muted small">
          {APP_NAME} speichert alles nur in diesem Browser. Mit dem Export sicherst du deine Daten oder nimmst sie auf ein anderes Gerät mit.
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
              <p className="small">Wirklich alles löschen? Profil, {data.sessions.length} Trainings und alle Werte sind danach weg.</p>
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
      </section>
      <p className="muted small footnote">
        Technik-Namen wie auf deutschen Matten üblich, japanische Begriffe in Kodokan-Schreibweise. Beinhebel und riskante Techniken tragen einen Hinweis: kontrolliert
        ansetzen und das Regelwerk deines Turniers prüfen.
      </p>
    </div>
  );
}
