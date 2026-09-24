import type { ArcData, ArcState } from "../core/types.ts";
import { TECH, TECHS } from "../core/techniques.ts";
import { questShape } from "../core/model.ts";
import { LEVELS } from "../core/lore.ts";
import { acceptQuest } from "../actions.ts";
import { go } from "../store.ts";
import { useCompare } from "../useCompare.ts";
import StarMap from "../components/StarMap.tsx";
import TechniqueSheet from "../components/TechniqueSheet.tsx";
import { Star } from "../components/ui.tsx";

export default function MapPage({ data, st, today, arg }: { data: ArcData; st: ArcState; today: string; arg: string | null }) {
  const selected = arg && TECH[arg] ? arg : null;
  const cmp = useCompare(data, today);
  const accepted = data.ui.accepted?.day === today ? data.ui.accepted.node : null;
  const count = (l: number) => TECHS.filter((x) => st.nodes[x.id].level === l).length;
  const select = (id: string) => go("karte", id);

  return (
    <div className="page map-page">
      <div className="map-head">
        <div>
          <p className="eyebrow">Skilltree · Sternkarte</p>
          <h1 className="page-h">
            {st.discovered} von {TECHS.length} Sternen entdeckt
          </h1>
        </div>
        <ul className="map-stats" aria-label="Sterne nach Stufe">
          {[5, 4, 3].map((l) => (
            <li key={l}>
              <Star level={l} size={16} /> {count(l)} {LEVELS[l]}
            </li>
          ))}
          <li>
            <Star level={3} rust size={16} /> {TECHS.filter((x) => st.nodes[x.id].rust).length} Rost
          </li>
        </ul>
      </div>
      <div className={`map-layout${selected ? " has-sel" : ""}`}>
        <StarMap st={st} selected={selected} onSelect={select} />
        <aside className={`sheet${selected ? " open" : ""}`} aria-live="polite">
          {selected ? (
            <TechniqueSheet
              id={selected}
              st={st}
              cmp={cmp}
              acceptedNode={accepted}
              onSelect={select}
              onClose={() => go("karte")}
              onAccept={(id) => acceptQuest(today, questShape(TECH[id], st.nodes[id]))}
            />
          ) : (
            <div className="sheet-body empty">
              <p className="eyebrow">So liest du die Karte</p>
              <ul className="legend">
                <li>
                  <Star level={0} /> Unbekannt, aber schon sichtbar
                </li>
                <li>
                  <Star level={1} /> Gesehen
                </li>
                <li>
                  <Star level={2} /> Gedrillt
                </li>
                <li>
                  <Star level={2} prov /> Vorläufig, aus dem Onboarding
                </li>
                <li>
                  <Star level={3} /> Erprobt
                </li>
                <li>
                  <Star level={4} /> Geschärft
                </li>
                <li>
                  <Star level={5} /> Tokui-Waza
                </li>
                <li>
                  <Star level={3} rust /> Rost: 60 Tage nicht trainiert
                </li>
                <li>
                  <Star level={0} fog /> Nebel: noch unentdeckt
                </li>
              </ul>
              <p className="muted small">
                Die goldene Fläche ist dein Hexagon. Blaue Bögen sind Kombos zwischen Sektoren, sie leuchten, sobald beide Enden Stufe 3 haben. Tippe einen Stern an
                oder zoome in einen Sektor.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
