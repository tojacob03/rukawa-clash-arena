import { useState } from "react";
import { CircleHelp, X } from "lucide-react";
import type { ArcData, ArcState } from "../core/types.ts";
import { TECH, TECHS } from "../core/techniques.ts";
import { questShape } from "../core/model.ts";
import { acceptQuest } from "../actions.ts";
import { go } from "../store.ts";
import { useCompare } from "../useCompare.ts";
import Branch from "../components/Branch.tsx";
import TechniqueSheet from "../components/TechniqueSheet.tsx";
import { Blossom } from "../components/Blossom.tsx";
import { MapSwitch } from "./SeaPage.tsx";

/** How to read the branch: bud, blossom, gold, wilting. */
const LEGEND: { level: number; rust?: boolean; prov?: boolean; fog?: boolean; text: string }[] = [
  { level: 0, fog: true, text: "Nebel: noch nicht entdeckt" },
  { level: 0, text: "Sichtbar, noch nie gemacht" },
  { level: 1, text: "Geschlossene Knospe: gesehen" },
  { level: 2, text: "Knospe mit Rot: gedrillt" },
  { level: 3, text: "Halb offen: im Roll erprobt" },
  { level: 3, prov: true, text: "Gestrichelt: deine Einschätzung vom Start, noch nicht bestätigt" },
  { level: 4, text: "Rote Blüte: geschärft" },
  { level: 5, text: "Goldblüte mit Naht: Tokui-Waza" },
  { level: 3, rust: true, text: "Welk: 60 Tage nicht trainiert" },
];

export default function MapPage({ data, st, today, arg }: { data: ArcData; st: ArcState; today: string; arg: string | null }) {
  const selected = arg && TECH[arg] ? arg : null;
  const cmp = useCompare(data, today);
  const [legend, setLegend] = useState(false);
  const accepted = data.ui.accepted?.day === today ? data.ui.accepted.node : null;
  const count = (l: number) => TECHS.filter((x) => st.nodes[x.id].level === l && !st.nodes[x.id].rust).length;
  const wilted = TECHS.filter((x) => st.nodes[x.id].rust).length;
  const select = (id: string) => go("karte", id);

  return (
    <div className="page tree-page">
      <header className="tree-head">
        <MapSwitch value="karte" />
        <div className="tree-title">
          <h1 className="page-h">
            <span className="tree-num">{st.discovered}</span> von {TECHS.length} Techniken entdeckt
          </h1>
          <ul className="tree-count" aria-label="Techniken nach Stufe">
            <li>
              <Blossom level={5} size={20} /> {count(5)} Tokui-Waza
            </li>
            <li>
              <Blossom level={4} size={20} /> {count(4)} geschärft
            </li>
            <li>
              <Blossom level={3} size={20} /> {count(3)} erprobt
            </li>
            <li>
              <Blossom level={3} rust size={20} /> {wilted} welk
            </li>
          </ul>
        </div>
        <button type="button" className="linkish legend-btn" aria-expanded={legend} onClick={() => setLegend((v) => !v)}>
          <CircleHelp size={16} aria-hidden="true" /> So liest du den Zweig
        </button>
      </header>
      <div className={`tree-layout${selected ? " has-sel" : ""}`}>
        <Branch st={st} selected={selected} onSelect={select} />
        {legend ? (
          <aside className="tree-legend" aria-label="Legende">
            <button type="button" className="icon-btn legend-x" aria-label="Legende schließen" onClick={() => setLegend(false)}>
              <X size={16} />
            </button>
            <p className="h3">Knospe, Blüte, Gold</p>
            <ul className="legend">
              {LEGEND.map((l) => (
                <li key={l.text}>
                  <Blossom level={l.level} rust={l.rust} prov={l.prov} fog={l.fog} size={26} /> {l.text}
                </li>
              ))}
            </ul>
            <p className="muted small">
              Jeder Sektor wächst als eigener Ast aus dem Stamm, in der Reihenfolge eines Kampfes. Tippst du eine Technik an, zeigen goldene Fäden, worauf sie aufbaut, und rote ihre
              Kombos.
            </p>
          </aside>
        ) : null}
        <aside className={`sheet${selected ? " open" : ""}`} aria-live="polite" hidden={!selected}>
          {selected ? (
            <TechniqueSheet
              id={selected}
              st={st}
              cmp={cmp}
              acceptedNode={accepted}
              onSelect={select}
              onClose={() => go("karte")}
              cls={data.profile?.cls}
              onAccept={(id) => acceptQuest(today, questShape(TECH[id], st.nodes[id], false, data.profile?.cls))}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
