import { AlertTriangle, Swords, X } from "lucide-react";
import { Blossom } from "./Blossom.tsx";
import type { ArcState, ClassId } from "../core/types.ts";
import { COMBOS, TECH, TECHS, branchName, sectorName } from "../core/techniques.ts";
import { LEVELS, LEVEL_HINT, RINGS } from "../core/lore.ts";
import { questShape } from "../core/model.ts";
import { CLASS } from "../core/classes.ts";
import { nf0, nf1, pct } from "../format.ts";
import { KindBadge, LevelPill } from "./ui.tsx";

interface Props {
  id: string;
  st: ArcState;
  cmp: { gi: ArcState; nogi: ArcState } | null;
  acceptedNode: string | null;
  /** Chosen class, for the quest XP bonus. */
  cls?: ClassId;
  onSelect: (id: string) => void;
  onAccept: (id: string) => void;
  onClose?: () => void;
}

export default function TechniqueSheet({ id, st, cmp, acceptedNode, cls, onSelect, onAccept, onClose }: Props) {
  const x = TECH[id];
  const n = st.nodes[id];
  const ring = RINGS[x.tier];
  if (n.fog) {
    return (
      <div className="sheet-body">
        <SheetHead onClose={onClose} eyebrow={`${sectorName(x)}, Ring ${ring.jp}`} />
        <h3 className="sheet-title">Unentdeckt</h3>
        <p className="muted">Dieser Stern liegt noch im Nebel. Er wird sichtbar, sobald du eine benachbarte Technik gesehen, gedrillt oder versucht hast.</p>
      </div>
    );
  }
  const unlocks = TECHS.filter((y) => y.pre.includes(id)).map((y) => y.id);
  const combos = COMBOS.filter(([a, b]) => a === id || b === id);
  const q = questShape(x, n, false, cls);
  const claimed = n.claim > n.dataLevel;
  const req = claimed ? claimReq(n) : reqFor(n.level + 1, n);
  const clsDef = cls && cls !== "wandler" && CLASS[cls].match(x) ? CLASS[cls] : null;
  const split = cmp && cmp.gi.nodes[id].rawAtt >= 5 && cmp.nogi.nodes[id].rawAtt >= 5 ? { gi: cmp.gi.nodes[id], nogi: cmp.nogi.nodes[id] } : null;

  return (
    <div className="sheet-body">
      <SheetHead onClose={onClose} eyebrow={sectorName(x) === branchName(x) ? sectorName(x) : `${sectorName(x)}: ${branchName(x)}`} ring={`Ring ${ring.jp} (${ring.de})`} />
      <h3 className="sheet-title">{x.name}</h3>
      {x.aka.length ? <p className="aka">Auch bekannt als {x.aka.join(", ")}</p> : null}
      <div className="row wrap">
        <LevelPill level={n.level} rust={n.rust} prov={n.prov} />
        <span className="pills">
          {x.gi ? <span className="pill tag">Gi</span> : null}
          {x.nogi ? <span className="pill tag">No-Gi</span> : <span className="pill tag muted">nur Gi</span>}
          {clsDef ? (
            <span className="pill cls" style={{ ["--cc" as string]: clsDef.color }} title={clsDef.perk}>
              {clsDef.name}
            </span>
          ) : null}
        </span>
      </div>
      <p className="muted small">{LEVEL_HINT[n.level]}</p>
      {x.note ? <p className="note">{x.note}</p> : null}
      {x.caution ? (
        <p className="caution">
          <AlertTriangle size={16} aria-hidden="true" /> Vorsicht beim Ansetzen. Im Training kontrolliert arbeiten und früh lösen.
        </p>
      ) : null}

      <div className="meter">
        <div className="meter-top">
          <span>Meisterung</span>
          <b>{nf0.format(n.M)}</b>
        </div>
        <div className="bar">
          <i style={{ width: `${Math.min(100, n.M).toFixed(1)}%` }} />
        </div>
      </div>

      {claimed ? (
        <div className="next claim">
          <p className="k">
            Selbsteinschätzung: Stufe {n.claim}, {LEVELS[n.claim]}. Bewiesen ist Stufe {n.dataLevel}. Bestätige sie im Roll, dann gibt es die Stufen-XP:
          </p>
          <ul className="req">
            {req.map((r) => (
              <li key={r.t} className={r.ok ? "ok" : ""}>
                {r.t}
              </li>
            ))}
          </ul>
        </div>
      ) : n.level < 5 ? (
        <div className="next">
          <p className="k">
            Für Stufe {n.level + 1}, {LEVELS[n.level + 1]}
          </p>
          <ul className="req">
            {req.map((r) => (
              <li key={r.t} className={r.ok ? "ok" : ""}>
                {r.t}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="tokui-line">Höchste Stufe. Sie bleibt hell, solange du die Technik mindestens alle 60 Tage trainierst.</p>
      )}

      <dl className="kv">
        <div>
          <dt>Live-Versuche</dt>
          <dd>{n.rawAtt}</dd>
        </div>
        <div>
          <dt>Treffer</dt>
          <dd>{n.rawSucc}</dd>
        </div>
        <div>
          <dt>Gewichtete Versuche</dt>
          <dd>{nf1.format(n.nw)}</dd>
        </div>
        <div>
          <dt>Quote, geglättet</dt>
          <dd>{n.nw > 0 ? pct(n.mu) : "–"}</dd>
        </div>
        <div>
          <dt>Untergrenze 80 %</dt>
          <dd>
            {n.nw > 0 ? pct(n.lbw) : "–"}
            <small>Basis {pct(n.b)}</small>
          </dd>
        </div>
        <div>
          <dt>Wissen</dt>
          <dd>{nf0.format(n.K * 100)}</dd>
        </div>
        <div>
          <dt>Zuletzt live</dt>
          <dd>{n.dLast === null ? "nie" : n.dLast === 0 ? "heute" : `vor ${n.dLast} T.`}</dd>
        </div>
        <div>
          <dt>Treffer gegen Stärkere</dt>
          <dd>{n.sStrong}</dd>
        </div>
      </dl>

      {split ? (
        <div className="split">
          <p className="k">Gi und No-Gi im Vergleich</p>
          {(["gi", "nogi"] as const).map((k) => (
            <div key={k} className="split-row">
              <span>{k === "gi" ? "Gi" : "No-Gi"}</span>
              <div className="bar thin">
                <i style={{ width: `${Math.min(100, split[k].mu * 100).toFixed(1)}%` }} />
              </div>
              <b>{pct(split[k].mu)}</b>
              <small>{split[k].rawAtt} Versuche</small>
            </div>
          ))}
        </div>
      ) : null}

      <button type="button" className={`btn ${acceptedNode === id ? "ghost" : "primary"} wide`} onClick={() => onAccept(id)} disabled={acceptedNode === id}>
        <Swords size={16} aria-hidden="true" />
        <span>{acceptedNode === id ? "Ist deine heutige Quest" : "Als heutige Quest nehmen"}</span>
        {acceptedNode === id ? null : <KindBadge kind={q.kind} />}
      </button>

      {x.pre.length ? <Chips label="Voraussetzung" ids={x.pre} st={st} onSelect={onSelect} /> : null}
      {unlocks.length ? <Chips label="Schaltet frei" ids={unlocks} st={st} onSelect={onSelect} /> : null}
      {combos.length ? (
        <div className="rel">
          <p className="k">Kombos</p>
          <div className="chips">
            {combos.map(([a, b, name]) => {
              const other = a === id ? b : a;
              const on = st.nodes[a].level >= 3 && st.nodes[b].level >= 3;
              return st.nodes[other].fog ? (
                <span key={name} className="chip ghost">
                  ???
                </span>
              ) : (
                <button key={name} type="button" className={`chip${on ? " lit" : ""}`} onClick={() => onSelect(other)}>
                  {name}
                  <small>{on ? "aktiv" : "ab Stufe 3"}</small>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SheetHead({ eyebrow, ring, onClose }: { eyebrow: string; ring?: string; onClose?: () => void }) {
  return (
    <div className="sheet-head">
      <div className="row wrap">
        <p className="eyebrow">{eyebrow}</p>
        {ring ? <span className="small muted">{ring}</span> : null}
      </div>
      {onClose ? (
        <button type="button" className="icon-btn" aria-label="Schließen" onClick={onClose}>
          <X size={18} />
        </button>
      ) : null}
    </div>
  );
}

function Chips({ label, ids, st, onSelect }: { label: string; ids: string[]; st: ArcState; onSelect: (id: string) => void }) {
  return (
    <div className="rel">
      <p className="k">{label}</p>
      <div className="chips">
        {ids.map((cid) =>
          st.nodes[cid].fog ? (
            <span key={cid} className="chip ghost">
              ???
            </span>
          ) : (
            <button key={cid} type="button" className="chip" onClick={() => onSelect(cid)}>
              <Blossom level={st.nodes[cid].level} rust={st.nodes[cid].rust} size={14} />
              {TECH[cid].name}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

type Node = ArcState["nodes"][string];

/** What a self-assessed level still needs from the data. */
function claimReq(n: Node) {
  const out: { t: string; ok: boolean }[] = [];
  for (let t = Math.max(3, n.dataLevel + 1); t <= n.claim; t++) out.push(...reqFor(t, n));
  return out;
}

/** Requirements to reach the level `target` from the one below. */
function reqFor(target: number, n: Node): { t: string; ok: boolean }[] {
  switch (target) {
    case 1:
      return [{ t: "Einmal im Kurs sehen, drillen oder versuchen", ok: false }];
    case 2:
      return [{ t: `Gesehen oder gedrillt: ${n.exp} von 3 (oder 5 Live-Versuche)`, ok: n.exp >= 3 }];
    case 3:
      return [{ t: `Live-Versuche: ${n.rawAtt} von 5`, ok: n.rawAtt >= 5 }];
    case 4:
      return [
        { t: `Gewichtete Versuche: ${nf1.format(n.nw)} von 8`, ok: n.nw >= 8 },
        { t: `Untergrenze: ${pct(n.lbw)} von ${pct(n.b)}`, ok: n.lbw >= n.b },
      ];
    case 5:
      return [
        { t: `Gewichtete Versuche: ${nf1.format(n.nw)} von 25`, ok: n.nw >= 25 },
        { t: `Untergrenze: ${pct(n.lbw)} von ${pct(1.5 * n.b)}`, ok: n.lbw >= 1.5 * n.b },
        { t: `Treffer gegen Stärkere: ${n.sStrong} von 3`, ok: n.sStrong >= 3 },
      ];
    default:
      return [];
  }
}
