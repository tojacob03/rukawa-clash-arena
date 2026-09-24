import { useEffect, useMemo, useState } from "react";
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
import { SecTitle, Star } from "../components/ui.tsx";

type LevelFilter = "alle" | "entdeckt" | "erprobt" | "rost" | "offen";
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ");

export default function Codex({ data, st, today }: { data: ArcData; st: ArcState; today: string }) {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState<SectorId | "fund" | "alle">("alle");
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
      if (sector !== "alle" && x.sector !== sector) return false;
      if (nogiOnly && !x.nogi) return false;
      if (lf === "entdeckt" && n.level < 1) return false;
      if (lf === "erprobt" && n.level < 3) return false;
      if (lf === "rost" && !n.rust) return false;
      if (lf === "offen" && n.level >= 1) return false;
      if (nq && !norm([x.name, ...x.aka].join(" ")).includes(nq)) return false;
      return true;
    });
  }, [q, sector, lf, nogiOnly, st]);

  const groups = [{ id: "fund", name: "Fundament", kanji: "基" }, ...SECTORS.map((s) => ({ id: s.id, name: s.name, kanji: s.kanji }))]
    .map((g) => ({ ...g, items: list.filter((x) => x.sector === g.id) }))
    .filter((g) => g.items.length);

  return (
    <div className="page codex">
      <SecTitle kanji="書" eyebrow="Waza-Codex" title={`${TECHS.length} Techniken`}>
        Alle Moves der Sternkarte zum Nachschlagen. Gesucht wird auch in anderen Namen, z. B. „Scarf Hold“ oder „Juji-gatame“.
      </SecTitle>
      <div className="codex-bar">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input id="arc-codex-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Technik suchen" aria-label="Technik suchen" />
        </label>
        <div className="chips">
          {(["alle", "fund", ...SECTORS.map((s) => s.id)] as const).map((id) => (
            <button key={id} type="button" className={`chip${sector === id ? " on" : ""}`} aria-pressed={sector === id} onClick={() => setSector(id)}>
              {id === "alle" ? "Alle" : id === "fund" ? "Fundament" : SECTORS.find((s) => s.id === id)?.name}
            </button>
          ))}
        </div>
        <div className="chips">
          {(
            [
              ["alle", "Alle Stufen"],
              ["entdeckt", "Entdeckt"],
              ["erprobt", "Ab Erprobt"],
              ["rost", "Rost"],
              ["offen", "Noch offen"],
            ] as [LevelFilter, string][]
          ).map(([id, label]) => (
            <button key={id} type="button" className={`chip${lf === id ? " on" : ""}`} aria-pressed={lf === id} onClick={() => setLf(id)}>
              {label}
            </button>
          ))}
          <button type="button" className={`chip${nogiOnly ? " on" : ""}`} aria-pressed={nogiOnly} onClick={() => setNogiOnly(!nogiOnly)}>
            Nur No-Gi-taugliche
          </button>
        </div>
      </div>
      <p className="muted small">{list.length} Treffer</p>
      {groups.map((g) => (
        <section key={g.id} className="codex-group">
          <h2 className="codex-h">{g.name}</h2>
          <ul className="codex-list">
            {g.items.map((x) => {
              const n = st.nodes[x.id];
              return (
                <li key={x.id}>
                  <button type="button" className="crow" onClick={() => setOpen(x.id)}>
                    <Star level={n.level} rust={n.rust} prov={n.prov} fog={n.fog} size={22} />
                    <span className="crow-main">
                      <b>{x.name}</b>
                      <small>
                        {RINGS[x.tier].jp}
                        {x.aka.length ? ` · ${x.aka.slice(0, 2).join(" · ")}` : ""}
                        {!x.nogi ? " · nur Gi" : ""}
                      </small>
                    </span>
                    <span className="crow-lv">
                      <small>{LEVELS[n.level]}</small>
                      <span className="bar thin">
                        <i style={{ width: `${Math.min(100, n.M).toFixed(0)}%` }} />
                      </span>
                      <small>{nf0.format(n.M)}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
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
              onAccept={(id) => acceptQuest(today, questShape(TECH[id], st.nodes[id]))}
            />
            <button type="button" className="btn ghost wide" onClick={() => go("karte", open)}>
              <MapIcon size={16} aria-hidden="true" /> <span>Auf der Sternkarte zeigen</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
