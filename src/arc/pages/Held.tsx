import { useState } from "react";
import { Star as StarIcon } from "lucide-react";
import type { ArcData, ArcState } from "../core/types.ts";
import { SECTORS, TECH } from "../core/techniques.ts";
import { CLASS_HINT, SEALS, rankOf } from "../core/lore.ts";
import { compute, dayNum } from "../core/model.ts";
import { ki, nf0, signed } from "../format.ts";
import { go } from "../store.ts";
import { useCompare } from "../useCompare.ts";
import { Hexagon, KiChart } from "../components/Charts.tsx";
import { Belt, SecTitle, Seg } from "../components/ui.tsx";

type View = "zeit" | "gi";

export default function Held({ data, st, today }: { data: ArcData; st: ArcState; today: string }) {
  const [view, setView] = useState<View>("zeit");
  const back = compute(data, isoMinus(today, 56));
  const cmp = useCompare(data, today);
  const p = data.profile;
  const now = SECTORS.map((s) => st.attrs[s.id].val);
  const prev = SECTORS.map((s) => back.attrs[s.id].val);
  const xpPct = (100 * (st.xp - st.lo)) / (st.hi - st.lo);
  const got = st.seals.filter((s) => s.got).length;

  return (
    <div className="page held">
      <section className="hero-card">
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-lv">
          <span className="hex-badge">
            <b>{st.lvl}</b>
            <small>LV</small>
          </span>
        </div>
        <div className="hero-main">
          <p className="eyebrow">{rankOf(st.lvl)}</p>
          <h1 className="hero-name">{p?.name}</h1>
          <p className="hero-title">{st.title}</p>
          <div className="row wrap">
            {p ? <Belt belt={p.belt} stripes={p.stripes} width={110} /> : null}
            <span className="pill tag">Klasse: {st.cls}</span>
          </div>
          <div className="xpline" aria-label={`${nf0.format(st.xp - st.lo)} von ${nf0.format(st.hi - st.lo)} XP bis Level ${st.lvl + 1}`}>
            <div className="xpbar">
              <i style={{ width: `${xpPct.toFixed(1)}%` }} />
            </div>
            <small>
              {nf0.format(st.xp - st.lo)} / {nf0.format(st.hi - st.lo)} XP bis Level {st.lvl + 1}
            </small>
          </div>
        </div>
        <dl className="hero-stats">
          <div>
            <dt>Ki</dt>
            <dd>{ki(st.ru)}</dd>
          </div>
          <div>
            <dt>Trainings</dt>
            <dd>{st.sessions}</dd>
          </div>
          <div>
            <dt>Rolls</dt>
            <dd>{st.rolls}</dd>
          </div>
          <div>
            <dt>Sterne</dt>
            <dd>{st.discovered}</dd>
          </div>
        </dl>
      </section>
      <p className="muted small">{CLASS_HINT[st.cls]}</p>

      <div className="held-grid">
        <section className="panel">
          <div className="row wrap between">
            <h2 className="h3">Hexagon</h2>
            <Seg<View>
              label="Vergleich"
              value={view}
              onChange={setView}
              options={[
                { v: "zeit", label: "vor 8 Wochen" },
                { v: "gi", label: "Gi / No-Gi" },
              ]}
            />
          </div>
          {view === "gi" && !cmp ? (
            <p className="muted small">Der Vergleich erscheint, sobald Gi und No-Gi in den letzten 8 Wochen je mindestens 20 Rolls haben.</p>
          ) : null}
          <Hexagon
            series={
              view === "gi" && cmp
                ? [
                    { vals: SECTORS.map((s) => cmp.gi.attrs[s.id].val), cls: "gi", label: "Gi" },
                    { vals: SECTORS.map((s) => cmp.nogi.attrs[s.id].val), cls: "nogi", label: "No-Gi" },
                    { vals: now, cls: "now", label: "Gesamt" },
                  ]
                : [
                    { vals: prev, cls: "prev", label: "vor 8 Wochen" },
                    { vals: now, cls: "now", label: "jetzt" },
                  ]
            }
            labelIndex={view === "gi" && cmp ? 2 : 1}
          />
          <div className="hex-key">
            {view === "gi" && cmp ? (
              <>
                <span>
                  <i className="k-gi" /> Gi
                </span>
                <span>
                  <i className="k-nogi" /> No-Gi
                </span>
                <span>
                  <i className="k-now" /> Gesamt
                </span>
              </>
            ) : (
              <>
                <span>
                  <i className="k-now" /> jetzt
                </span>
                <span>
                  <i className="k-prev" /> vor 8 Wochen
                </span>
              </>
            )}
            <span>Ringe: Richtwerte pro Gürtel</span>
          </div>
        </section>

        <section className="panel">
          <h2 className="h3">Achsen</h2>
          <div className="tbl">
            <table className="attr">
              <thead>
                <tr>
                  <th>Achse</th>
                  <th>Baum</th>
                  <th>Form</th>
                  <th>Wert</th>
                  <th>Δ 8 Wo.</th>
                </tr>
              </thead>
              <tbody>
                {SECTORS.map((s, i) => {
                  const a = st.attrs[s.id];
                  const d = now[i] - prev[i];
                  return (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{nf0.format(a.baum)}</td>
                      <td>{a.form === null ? "–" : nf0.format(a.form)}</td>
                      <td>
                        <b>{nf0.format(a.val)}</b>
                      </td>
                      <td className={d >= 0.5 ? "pos" : d <= -0.5 ? "neg" : ""}>{signed(d)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted small">Baum: Breite und Tiefe deiner Techniken im Sektor. Form: was du in den letzten 8 Wochen im Roll zeigst.</p>
          <h2 className="h3">Ki</h2>
          <KiChart
            series={st.ruSeries}
            today={st.asOf}
            extra={cmp ? [{ series: cmp.gi.ruSeries, cls: "gi" }, { series: cmp.nogi.ruSeries, cls: "nogi" }] : undefined}
          />
          <p className="muted small">
            Ein Elo-Rating aus allen Roll-Karten, mal 10. Es startet beim Wert deines Gürtels, bleibt privat und ist kein Ranking.
            {cmp ? " Die dünnen Linien zeigen Gi und No-Gi einzeln." : ""}
          </p>
        </section>
      </div>

      <section className="panel">
        <div className="row wrap between">
          <h2 className="h3">Siegel</h2>
          <span className="muted small">
            {got} von {SEALS.length}
          </span>
        </div>
        <ul className="seals">
          {SEALS.map((s, i) => (
            <li key={s.id} className={st.seals[i].got ? "got" : ""}>
              <span className="seal-mark" aria-hidden="true">
                <StarIcon size={18} strokeWidth={2.4} />
              </span>
              <b>{s.name}</b>
              <small>{s.desc}</small>
            </li>
          ))}
        </ul>
      </section>

      {st.tokui.length ? (
        <section className="panel">
          <h2 className="h3">Tokui-Waza</h2>
          <div className="chips">
            {st.tokui.map((id) => (
              <button key={id} type="button" className="chip lit" onClick={() => go("karte", id)}>
                {TECH[id].name}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function isoMinus(iso: string, days: number) {
  return new Date((dayNum(iso) - days) * 864e5).toISOString().slice(0, 10);
}
