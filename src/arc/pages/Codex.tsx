import { useEffect, useMemo, useState } from "react";
import { Blossom } from "../components/Blossom.tsx";
import { Map as MapIcon, Search } from "lucide-react";
import type { ArcData, ArcState, SectorId } from "../core/types.ts";
import { SECTORS, TECH, TECHS } from "../core/techniques.ts";
import { LEVELS, RINGS } from "../core/lore.ts";
import { questShape } from "../core/model.ts";
import { nf0 } from "../format.ts";
import { acceptQuest } from "../actions.ts";
import { go } from "../store.ts";
import { useCompare } from "../useCompare.ts";
import TechniqueSheet from "../components/TechniqueSheet.tsx";
import { SecTitle, Seg } from "../components/ui.tsx";
import { MapSwitch } from "./SeaPage.tsx";

type LevelFilter = "alle" | "entdeckt" | "erprobt" | "rost" | "offen";
const LEVEL_FILTERS: { v: LevelFilter; label: string }[] = [
  { v: "alle", label: "Alle" },
  { v: "entdeckt", label: "Entdeckt" },
  { v: "erprobt", label: "Ab erprobt" },
  { v: "rost", label: "Welk" },
  { v: "offen", label: "Noch offen" },
];
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ");

export default function Codex({ data, st, today }: { data: ArcData; st: ArcState; today: string }) {
  const [q, setQ] = useState("");
  const [lf, setLf] = useState<LevelFilter>("alle");
  const [nogiOnly, setNogiOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const cmp = useCompare(data, today);
  const accepted = data.ui.accepted?.day === today ? data.ui.accepted.node : null;

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  const list = useMemo(() => {
    const nq = norm(q).trim();
    return TECHS.filter((x) => {
      const n = st.nodes[x.id];
      if (nogiOnly && !x.nogi) return false;
      if (lf === "entdeckt" && n.level < 1) return false;
      if (lf === "erprobt" && n.level < 3) return false;
      if (lf === "rost" && !n.rust) return false;
      if (lf === "offen" && n.level >= 1) return false;
      if (nq && !norm([x.name, ...x.aka].join(" ")).includes(nq)) return false;
      return true;
    });
  }, [q, lf, nogiOnly, st]);

  const all = [{ id: "fund" as SectorId | "fund", name: "Fundament", kanji: "基" }, ...SECTORS.map((s) => ({ id: s.id as SectorId | "fund", name: s.name, kanji: s.kanji }))].map((g) => ({
    ...g,
    items: list.filter((x) => x.sector === g.id),
  }));
  const groups = all.filter((g) => g.items.length);
  const jump = (id: string) => document.getElementById(`codex-${id}`)?.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });

  return (
    <div className="page codex">
      <MapSwitch value="codex" />
      <SecTitle h1 kanji="書" eyebrow="Waza-Codex" title={`${TECHS.length} Techniken`}>
        Alle Techniken deines Zweigs zum Nachschlagen. Gesucht wird auch in anderen Namen, z. B. „Scarf Hold“ oder „Juji-gatame“.
      </SecTitle>
      <div className="codex-book">
        {/* The thumb index of a dictionary: one kanji per chapter, with the number of entries found. */}
        <nav className="codex-index" aria-label="Kapitel">
          {all.map((g) => (
            <button key={g.id} type="button" className="ci" disabled={!g.items.length} onClick={() => jump(g.id)}>
              <span className="ci-k" aria-hidden="true">
                {g.kanji}
              </span>
              <span className="ci-n">{g.name}</span>
              <span className="ci-c">{g.items.length}</span>
            </button>
          ))}
        </nav>
        <div className="codex-main">
          <div className="codex-bar">
            <label className="search">
              <Search size={26} aria-hidden="true" />
              <input id="arc-codex-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Technik suchen" aria-label="Technik suchen" />
            </label>
            <div className="codex-filters">
              <Seg label="Stufe" value={lf} onChange={(v) => setLf(v as LevelFilter)} options={LEVEL_FILTERS} />
              <label className="check">
                <input type="checkbox" checked={nogiOnly} onChange={(e) => setNogiOnly(e.target.checked)} /> Nur No-Gi-taugliche
              </label>
              <p className="codex-count">{list.length} Treffer</p>
            </div>
          </div>
          {groups.map((g) => (
            <section key={g.id} id={`codex-${g.id}`} className="codex-group">
              <h2 className="codex-h">
                <span className="ch-k" aria-hidden="true">
                  {g.kanji}
                </span>
                {g.name}
              </h2>
              <ul className="codex-list">
                {g.items.map((x) => {
                  const n = st.nodes[x.id];
                  return (
                    <li key={x.id}>
                      <button type="button" className="crow" onClick={() => setOpen(x.id)}>
                        <Blossom level={n.level} rust={n.rust} prov={n.prov} fog={n.fog} size={26} />
                        <span className="crow-main">
                          <b>{x.name}</b>
                          <small>
                            Ring {RINGS[x.tier].jp}
                            {!x.nogi ? ", nur Gi" : ""}
                            {x.aka.length ? `. Auch: ${x.aka.slice(0, 2).join(", ")}` : ""}
                          </small>
                        </span>
                        <span className="crow-lv">
                          <small>{LEVELS[n.level]}</small>
                          <b>{nf0.format(n.M)}</b>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {!groups.length ? <p className="muted">Keine Technik passt zu Suche und Filter.</p> : null}
        </div>
      </div>
      {open ? (
        <div className="modal" role="dialog" aria-modal="true" aria-label={TECH[open].name} onClick={() => setOpen(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <TechniqueSheet
              id={open}
              st={st}
              cmp={cmp}
              acceptedNode={accepted}
              onSelect={setOpen}
              onClose={() => setOpen(null)}
              cls={data.profile?.cls}
              onAccept={(id) => acceptQuest(today, questShape(TECH[id], st.nodes[id], false, data.profile?.cls))}
            />
            <button type="button" className="btn ghost wide" onClick={() => go("karte", open)}>
              <MapIcon size={16} aria-hidden="true" /> <span>Auf dem Zweig zeigen</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
