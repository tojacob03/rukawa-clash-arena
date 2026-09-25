import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Lock, Plus, ScanEye, Star as StarIcon, Trophy } from "lucide-react";
import type { ArcData, ArcState, Attire, Look, Slot } from "../core/types.ts";
import type { ItemDef, Owned } from "../core/items.ts";
import { ITEMS, RARITY, SLOTS, dynamicItems, perkText, unlockText } from "../core/items.ts";
import { CLASS } from "../core/classes.ts";
import { COUNTRY } from "../core/countries.ts";
import { SECTORS, TECH } from "../core/techniques.ts";
import { SEALS, rankOf } from "../core/lore.ts";
import { PROLOG_LEVEL, compute, dayNum } from "../core/model.ts";
import { BELT, nf0, power, shortDate, signed } from "../format.ts";
import { deleteCompetition, equip, markSeen, setLook, setMode, updateProfile } from "../actions.ts";
import { METHOD_NAME } from "../compText.ts";
import { go } from "../store.ts";
import { useCompare } from "../useCompare.ts";
import { useGear } from "../useGear.ts";
import { ageDivision } from "../character.ts";
import { CLASS_ICON } from "../classIcons.ts";
import Avatar from "../components/Avatar.tsx";
import ItemIcon from "../components/ItemIcon.tsx";
import { FlagIcon } from "../components/Flag.tsx";
import { ClassPicker, CountryPicker, LookEditor, SeaPicker, SportsPicker } from "../components/CharacterForms.tsx";
import { DEFAULT_SEA } from "../core/sea.ts";
import { Hexagon, PowerChart } from "../components/Charts.tsx";
import { Belt, HeroKoma, Seg } from "../components/ui.tsx";
import { BODY, SPORT, SPORTS } from "../core/sports.ts";
import { SPORT_ICON } from "../sportIcons.ts";
import type { SportId } from "../core/types.ts";
import { openScouter } from "../scan.ts";

type Tab = "uebersicht" | "aussehen" | "ausruestung" | "turniere" | "steckbrief";
const TABS: { id: Tab; label: string }[] = [
  { id: "uebersicht", label: "Übersicht" },
  { id: "aussehen", label: "Aussehen" },
  { id: "ausruestung", label: "Ausrüstung" },
  { id: "turniere", label: "Turniere" },
  { id: "steckbrief", label: "Steckbrief" },
];

interface Props {
  data: ArcData;
  st: ArcState;
  today: string;
  arg: string | null;
}

export default function Held({ data, st, today, arg }: Props) {
  const tab: Tab = TABS.some((t) => t.id === arg) ? (arg as Tab) : "uebersicht";
  const g = useGear(data, st);
  const p = data.profile;
  if (!p) return null;
  const avatar = (size: number, still?: boolean) => (
    <Avatar look={g.character.look} mode={g.character.mode} gear={g.gear} belt={p.belt} stripes={p.stripes} weightKg={p.weightKg} size={size} still={still} label={`${p.name}, dein Charakter`} />
  );

  return (
    <div className="page held">
      <nav className="tabs" aria-label="Charakter">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? "on" : ""} aria-current={tab === t.id ? "page" : undefined} onClick={() => go("held", t.id === "uebersicht" ? undefined : t.id)}>
            {t.label}
            {t.id === "ausruestung" && g.unseen.length ? <span className="badge-new">{g.unseen.length}</span> : null}
          </button>
        ))}
      </nav>
      {tab === "aussehen" ? (
        <LookTab look={g.character.look} mode={g.character.mode} avatar={avatar} />
      ) : tab === "ausruestung" ? (
        <GearTab data={data} st={st} owned={g.owned} gear={g.gear} mode={g.character.mode} unseen={g.unseen} avatar={avatar} />
      ) : tab === "turniere" ? (
        <CompTab data={data} st={st} />
      ) : tab === "steckbrief" ? (
        <ProfileTab data={data} st={st} />
      ) : (
        <Overview data={data} st={st} today={today} avatar={avatar} />
      )}
    </div>
  );
}

type AvatarFn = (size: number, still?: boolean) => ReactElement;

/* ── Übersicht ─────────────────────────────────────────────────────────── */

type View = "zeit" | "gi";

function Overview({ data, st, today, avatar }: { data: ArcData; st: ArcState; today: string; avatar: AvatarFn }) {
  const [view, setView] = useState<View>("zeit");
  const back = compute(data, isoMinus(today, 56));
  const cmp = useCompare(data, today);
  const p = data.profile!;
  const now = SECTORS.map((s) => st.attrs[s.id].val);
  const prev = SECTORS.map((s) => back.attrs[s.id].val);
  const xpPct = (100 * (st.xp - st.lo)) / (st.hi - st.lo);
  const got = st.seals.filter((s) => s.got).length;
  const chosen = p.cls ? CLASS[p.cls] : null;
  const detected = CLASS[st.clsDetected];
  const div = ageDivision(p.birthYear, Number(today.slice(0, 4)));
  const years = p.trainingSince ? yearsSince(p.trainingSince, today) : null;
  const claimed = SECTORS.some((s) => st.attrs[s.id].claimed);
  const ChosenIcon = chosen ? CLASS_ICON[chosen.id] : null;

  return (
    <>
      <HeroKoma className="stage-card" label="Charakter">
        <div className="stage">{avatar(230, true)}</div>
        <div className="hero-main">
          <div className="row wrap">
            <span className="hex-badge" aria-hidden="true">
              <b>{st.lvl}</b>
            </span>
            <p className="eyebrow">
              Level {st.lvl}, {rankOf(st.lvl)}
            </p>
          </div>
          <h1 className="hero-name">{p.name}</h1>
          {st.title ? <p className="hero-title">{st.title}</p> : null}
          <div className="row wrap">
            <Belt belt={p.belt} stripes={p.stripes} width={120} />
            {p.countries?.map((c) => (
              <span key={c} title={COUNTRY[c]?.name}>
                <FlagIcon code={c} width={30} />
              </span>
            ))}
          </div>
          <div className="xpline">
            <div className="xpbar" role="img" aria-label={`${nf0.format(st.xp - st.lo)} von ${nf0.format(st.hi - st.lo)} XP bis Level ${st.lvl + 1}`}>
              <i style={{ width: `${xpPct.toFixed(1)}%` }} />
            </div>
            <small>
              {nf0.format(st.xp - st.lo)} von {nf0.format(st.hi - st.lo)} XP bis Level {st.lvl + 1}
            </small>
          </div>
          <dl className="bio">
            <div>
              <dt>Klasse</dt>
              <dd>
                {chosen && ChosenIcon ? (
                  <span className="cls-tag" style={{ ["--cc" as string]: chosen.color }}>
                    <ChosenIcon size={15} aria-hidden="true" /> {chosen.name}
                  </span>
                ) : (
                  <button type="button" className="linkish" onClick={() => go("held", "steckbrief")}>
                    Klasse wählen
                  </button>
                )}
              </dd>
            </div>
            <div>
              <dt>Laut Daten</dt>
              <dd>{detected.name}</dd>
            </div>
            {div ? (
              <div>
                <dt>Division</dt>
                <dd>
                  {div.name} <small>({div.age} Jahre)</small>
                </dd>
              </div>
            ) : null}
            {p.weightKg ? (
              <div>
                <dt>Gewicht</dt>
                <dd>{nf0.format(p.weightKg)} kg</dd>
              </div>
            ) : null}
            {years !== null ? (
              <div>
                <dt>Auf der Matte</dt>
                <dd>{years < 1 ? "unter 1 Jahr" : `${nf0.format(years)} ${years < 2 ? "Jahr" : "Jahre"}`}</dd>
              </div>
            ) : null}
          </dl>
          <div className="row wrap">
            <button type="button" className="btn small scan" onClick={() => openScouter({ mode: "du" })}>
              <ScanEye size={16} aria-hidden="true" /> <span>Scouter aufsetzen</span>
            </button>
            <button type="button" className="btn small" onClick={() => go("held", "aussehen")}>
              Aussehen ändern
            </button>
          </div>
        </div>
      </HeroKoma>
      <dl className="hero-stats">
        <div>
          <dt>Power Level</dt>
          <dd>{power(st.ru)}</dd>
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
      <p className="bubble">
        {chosen && chosen.id !== detected.id
          ? `Gewählt hast du ${chosen.name}. Deine stärksten Techniken sprechen gerade für ${detected.name}: ${detected.style}.`
          : chosen
            ? `${chosen.name}: Deine Daten bestätigen deine Wahl. ${chosen.perk}.`
            : `Deine Daten sprechen für ${detected.name}: ${detected.style}.`}
        {st.prologXp > 0 ? ` Prolog: ${nf0.format(st.prologXp)} XP aus der Zeit vor der App (${BELT[p.startBelt].name}gurt, ${p.startStripes ?? 0} Streifen, ab Level ${PROLOG_LEVEL[p.startBelt] + (p.startStripes ?? 0)}).` : ""}
      </p>

      <div className="held-grid">
        <section className="panel">
          <div className="row wrap between">
            <h2 className="h3">Hexagon</h2>
            <Seg
              label="Vergleich"
              value={view}
              onChange={(v) => setView(v)}
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
          {claimed ? <p className="muted small">Enthält Selbsteinschätzungen vom Start. Sie zählen vorläufig, bis deine Rolls sie bestätigen.</p> : null}
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
                      <td>
                        {s.name}
                        {a.claimed ? <sup title="enthält Selbsteinschätzung"> *</sup> : null}
                      </td>
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
          <p className="muted small">
            Baum: Breite und Tiefe deiner Techniken im Sektor. Form: was du in den letzten 8 Wochen im Roll zeigst.{claimed ? " *: enthält Selbsteinschätzung." : ""}
          </p>
          <h2 className="h3">Power Level</h2>
          <PowerChart
            series={st.ruSeries}
            today={st.asOf}
            extra={cmp ? [{ series: cmp.gi.ruSeries, cls: "gi" }, { series: cmp.nogi.ruSeries, cls: "nogi" }] : undefined}
          />
          <p className="muted small">
            Ein Elo-Rating aus allen Roll-Karten und Turnierkämpfen, mal 10. Es startet beim Wert deines Gürtels und deiner Streifen, bleibt privat und ist kein Ranking.
            {cmp ? " Die dünnen Linien zeigen Gi und No-Gi einzeln." : ""}
          </p>
        </section>
      </div>

      <BodyPanel data={data} st={st} />

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
    </>
  );
}

/* ── Körperwerte ───────────────────────────────────────────────────────── */

const BODY_ICON = { kraft: SPORT_ICON.kraft, ausdauer: SPORT_ICON.ausdauer, beweglichkeit: SPORT_ICON.mobility };

function BodyPanel({ data, st }: { data: ArcData; st: ArcState }) {
  const sports = data.profile?.sports ?? [];
  return (
    <section className="panel" aria-label="Körperwerte">
      <div className="row wrap between">
        <h2 className="h3">Körperwerte</h2>
        <button type="button" className="btn small" onClick={() => go("log", "nebensport")}>
          <Plus size={16} aria-hidden="true" /> <span>Nebensport eintragen</span>
        </button>
      </div>
      <div className="body-stats">
        {BODY.map((b) => {
          const Icon = BODY_ICON[b.id];
          return (
            <div key={b.id} className="body-row">
              <Icon size={20} aria-hidden="true" />
              <span>{b.name}</span>
              <div className="bar" role="img" aria-label={`${b.name} ${st.body[b.id]} von 100`}>
                <i style={{ width: `${st.body[b.id]}%` }} />
              </div>
              <b>{st.body[b.id]}</b>
            </div>
          );
        })}
      </div>
      <p className="small muted">
        {st.body.total
          ? `Aus ${st.body.total} ${st.body.total === 1 ? "Einheit" : "Einheiten"} Nebensport, gewichtet über die letzten acht Wochen. Sie zählen nicht fürs BJJ-Wochenziel und nicht fürs Hexagon.`
          : "Noch kein Nebensport eingetragen. Kraft, Ausdauer, Ringen, Judo und Co. bauen hier deine Körperwerte auf."}
        {sports.length ? ` Deine Sportarten: ${sports.map((x) => SPORT[x.id].name + (x.since ? ` seit ${x.since}` : "")).join(", ")}.` : ""}
      </p>
    </section>
  );
}

/* ── Aussehen ──────────────────────────────────────────────────────────── */

function LookTab({ look, mode, avatar }: { look: Look; mode: Attire; avatar: AvatarFn }) {
  return (
    <div className="studio">
      <div className="studio-stage">{avatar(260)}</div>
      <section className="panel">
        <h2 className="h3">Aussehen</h2>
        <LookEditor look={look} onChange={setLook} mode={mode} onMode={setMode} />
        <p className="muted small">Kleidung, Aufnäher und Auren wechselst du unter Ausrüstung. Dein Gewicht aus dem Steckbrief bestimmt die Statur.</p>
      </section>
    </div>
  );
}

/* ── Ausrüstung ────────────────────────────────────────────────────────── */

function GearTab({
  data,
  st,
  owned,
  gear,
  mode,
  unseen,
  avatar,
}: {
  data: ArcData;
  st: ArcState;
  owned: Map<string, Owned>;
  gear: Partial<Record<Slot, ItemDef>>;
  mode: Attire;
  unseen: string[];
  avatar: AvatarFn;
}) {
  const [slot, setSlot] = useState<Slot>("gi");
  // Keep the NEU badges for this visit, but count them as seen right away.
  const [fresh] = useState(() => new Set(unseen));
  useEffect(() => {
    if (unseen.length) markSeen(unseen);
  }, [unseen]);

  const p = data.profile!;
  const def = SLOTS.find((s) => s.id === slot)!;
  const every = [...ITEMS, ...dynamicItems(data, st)];
  const all = every.filter((x) => x.slot === def.accepts);
  const newSlots = new Set(every.filter((x) => fresh.has(x.id) && owned.has(x.id)).map((x) => x.slot));
  const order = ["legendary", "epic", "rare", "common"];
  const have = all.filter((x) => owned.has(x.id)).sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));
  const locked = all.filter((x) => !owned.has(x.id));
  const worn = gear[slot];
  const optional = slot !== "gi" && slot !== "top" && slot !== "bottom";
  const hiddenInMode = (mode === "gi" && (slot === "top" || slot === "bottom")) || (mode === "nogi" && slot === "gi");
  const total = every.length;

  return (
    <div className="studio">
      <div className="studio-stage">
        {avatar(260)}
        <Seg value={mode} onChange={setMode} label="Vorschau" options={[{ v: "gi", label: "Gi" }, { v: "nogi", label: "No-Gi" }]} />
        <p className="muted small">
          {owned.size} von {total} Items gesammelt
        </p>
      </div>
      <div className="gear-side">
        <section className="panel">
          <h2 className="h3">Ausgerüstet</h2>
          <div className="slots" role="tablist" aria-label="Plätze">
            {SLOTS.map((s) => {
              const it = gear[s.id];
              const isNew = newSlots.has(s.accepts) && !(s.accepts === "patch" && s.id !== "patch1");
              return (
                <button key={s.id} type="button" role="tab" aria-selected={slot === s.id} className={`slot${slot === s.id ? " on" : ""}`} onClick={() => setSlot(s.id)}>
                  <span className="slot-ico" style={it ? { ["--rc" as string]: RARITY[it.rarity].color } : undefined}>
                    {it ? <ItemIcon item={it} belt={p.belt} size={36} /> : <span className="slot-empty" aria-hidden="true" />}
                  </span>
                  <span className="slot-txt">
                    <small>{s.name}</small>
                    <b>{it?.name ?? "leer"}</b>
                  </span>
                  {isNew ? <span className="badge-new">Neu</span> : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel" role="tabpanel" aria-label={def.name}>
          <div className="row wrap between">
            <h2 className="h3">{def.name}</h2>
            {optional && worn ? (
              <button type="button" className="btn ghost small" onClick={() => equip(slot, null)}>
                Ablegen
              </button>
            ) : null}
          </div>
          {hiddenInMode ? <p className="muted small">Die Vorschau zeigt gerade {mode === "gi" ? "Gi" : "No-Gi"}. Stell oben um, um das hier zu sehen.</p> : null}
          <div className="items">
            {have.map((x) => {
              const on = worn?.id === x.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  className={`item r-${x.rarity}${on ? " on" : ""}`}
                  style={{ ["--rc" as string]: RARITY[x.rarity].color }}
                  aria-pressed={on}
                  onClick={() => equip(slot, on && optional ? null : x.id)}
                >
                  {on ? <span className="worn">Ausgerüstet</span> : null}
                  {fresh.has(x.id) ? <span className="badge-new">Neu</span> : null}
                  <ItemIcon item={x} belt={p.belt} size={56} />
                  <b>{x.name}</b>
                  <small className="rar">
                    <i aria-hidden="true" />
                    {RARITY[x.rarity].name}
                  </small>
                  {x.perk ? <small className="perk">{perkText(x.perk)}</small> : null}
                  <small className="desc">{x.desc}</small>
                  <small className="via">{owned.get(x.id)?.via}</small>
                </button>
              );
            })}
            {locked.map((x) => (
              <div key={x.id} className={`item locked r-${x.rarity}`} style={{ ["--rc" as string]: RARITY[x.rarity].color }}>
                <span className="lock" aria-hidden="true">
                  <Lock size={20} />
                </span>
                <b>{x.src.t === "drop" ? "Unbekannter Fund" : x.name}</b>
                <small className="rar">
                  <i aria-hidden="true" />
                  {RARITY[x.rarity].name}
                </small>
                {x.perk ? <small className="perk">{perkText(x.perk)}</small> : null}
                <small className="via">{unlockText(x.src, p.homeSea)}</small>
              </div>
            ))}
          </div>
          {slot === "talisman" ? (
            <p className="muted small">Talismane geben nur XP für Einsatz, nie Meisterung. Der Bonus wird beim Speichern eines Trainings festgeschrieben.</p>
          ) : null}
          {def.accepts === "patch" && !p.countries?.length ? (
            <p className="muted small">
              Flaggen-Aufnäher bekommst du für jedes Land im{" "}
              <button type="button" className="linkish" onClick={() => go("held", "steckbrief")}>
                Steckbrief
              </button>
              .
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

/* ── Turniere ──────────────────────────────────────────────────────────── */

function CompTab({ data, st }: { data: ArcData; st: ArcState }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const list = [...(data.competitions ?? [])].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
  const c = st.comps;
  const fights = c.w + c.l + c.d;
  return (
    <div className="steckbrief">
      <section className="panel">
        <div className="row wrap between">
          <h2 className="h3">Kampfrekord</h2>
          <button type="button" className="btn primary small" onClick={() => go("log", "turnier")}>
            <Trophy size={15} aria-hidden="true" /> <span>Turnier eintragen</span>
          </button>
        </div>
        <dl className="hero-stats comp-stats">
          <div>
            <dt>Turniere</dt>
            <dd>{c.events}</dd>
          </div>
          <div>
            <dt>Bilanz</dt>
            <dd>
              {c.w}-{c.l}
              {c.d ? `-${c.d}` : ""}
            </dd>
          </div>
          <div>
            <dt>Per Aufgabe</dt>
            <dd>{c.subs}</dd>
          </div>
          <div>
            <dt>Siegquote</dt>
            <dd>{fights ? `${nf0.format((100 * c.w) / fights)} %` : "–"}</dd>
          </div>
        </dl>
        <div className="medals" aria-label="Medaillen">
          {[1, 2, 3].map((p) => (
            <span key={p} className="medal-count">
              <span className={`medal m${p}`}>{p}</span> × {c.medals[p - 1]}
            </span>
          ))}
        </div>
        <p className="muted small">
          Jeder Kampf zählt für dein Power Level doppelt so stark wie ein Roll. Aufgabe-Siege mit Technik zählen als harter Beleg für diese Technik (wie zwei Treffer gegen einen
          Stärkeren). Turniere zählen fürs Wochenziel.
        </p>
      </section>
      {list.length ? (
        <ul className="comp-list">
          {list.map((x) => {
            const w = x.matches.filter((m) => m.result === "win").length;
            const l = x.matches.filter((m) => m.result === "loss").length;
            return (
              <li key={x.id} className="panel comp">
                <div className="comp-head">
                  {x.place ? <span className={`medal m${x.place}`}>{x.place}</span> : <span className="medal none">–</span>}
                  <div className="grow">
                    <b>{x.name}</b>
                    <small className="comp-meta">
                      Am {shortDate(x.date)} {x.date.slice(0, 4)} im {x.attire === "gi" ? "Gi" : "No-Gi"}
                      {x.org ? `, ${x.org}` : ""}
                      {x.weight ? `, Klasse ${x.weight}` : ""}
                    </small>
                  </div>
                  <span className="comp-rec">
                    {w}-{l}
                  </span>
                </div>
                <div className="chips">
                  {x.matches.map((m, i) => (
                    <span key={i} className={`chip res-${m.result}`}>
                      {m.result === "win" ? "Sieg" : m.result === "loss" ? "Niederlage" : "Unentschieden"} durch {METHOD_NAME[m.method]}
                      {m.tech && TECH[m.tech] ? ` (${TECH[m.tech].name})` : ""}
                      {m.oppBelt ? <small>{BELT[m.oppBelt].name}</small> : null}
                    </span>
                  ))}
                </div>
                <div className="row">
                  {confirm === x.id ? (
                    <>
                      <button type="button" className="btn ghost small" onClick={() => setConfirm(null)}>
                        Abbrechen
                      </button>
                      <button type="button" className="btn small danger-btn" onClick={() => deleteCompetition(x.id)}>
                        Löschen
                      </button>
                    </>
                  ) : (
                    <button type="button" className="linkish" onClick={() => setConfirm(x.id)}>
                      Eintrag löschen
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">Noch kein Turnier eingetragen. Das erste bringt das Siegel „Arena“ und einen Aufnäher.</p>
      )}
    </div>
  );
}

/* ── Steckbrief ────────────────────────────────────────────────────────── */

function ProfileTab({ data, st }: { data: ArcData; st: ArcState }) {
  const p = data.profile!;
  const [name, setName] = useState(p.name);
  const year = new Date().getFullYear();
  return (
    <div className="steckbrief">
      <section className="panel form-panel">
        <h2 className="h3">Steckbrief</h2>
        <label className="field">
          <span className="fl">Name oder Spitzname</span>
          <input id="arc-held-name" value={name} maxLength={32} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && updateProfile({ name: name.trim() })} />
        </label>
        <div className="row wrap">
          <NumberField id="arc-held-year" label="Geburtsjahr" value={p.birthYear} min={year - 90} max={year - 4} onCommit={(v) => updateProfile({ birthYear: v === undefined ? undefined : Math.round(v) })} />
          <NumberField id="arc-held-weight" label="Gewicht (kg)" value={p.weightKg} min={30} max={200} onCommit={(v) => updateProfile({ weightKg: v })} />
          <label className="field">
            <span className="fl">Trainiert seit</span>
            <input id="arc-held-since" type="month" value={p.trainingSince ?? ""} max={new Date().toISOString().slice(0, 7)} onChange={(e) => updateProfile({ trainingSince: e.target.value || undefined })} />
          </label>
        </div>
        <p className="muted small">Das Geburtsjahr ergibt deine Altersklasse nach IBJJF, das Gewicht die Statur deines Charakters. Beides bleibt in diesem Browser.</p>
      </section>
      <section className="panel form-panel">
        <h2 className="h3">Länder</h2>
        <p className="muted small">Wo du herkommst, wo du lebst oder trainierst. Jedes Land wird ein Aufnäher für Gi und Rashguard.</p>
        <CountryPicker value={p.countries ?? []} onChange={(countries) => updateProfile({ countries })} />
      </section>
      <section className="panel form-panel">
        <h2 className="h3">Weitere Sportarten</h2>
        <p className="muted small">Was du neben BJJ machst. Diese Sportarten stehen beim Eintragen von Nebensport oben.</p>
        <SportsPicker value={p.sports ?? []} onChange={(sports) => updateProfile({ sports })} />
      </section>
      <section className="panel form-panel">
        <h2 className="h3">Heimatmeer</h2>
        <p className="muted small">Wo deine Reise auf der Seekarte beginnt. Als Weißgurt segelst du hier von Insel zu Insel, mit dem Blaugurt geht es durchs Tor in die Große Strömung.</p>
        <SeaPicker value={p.homeSea ?? DEFAULT_SEA} onChange={(homeSea) => updateProfile({ homeSea })} />
      </section>
      <section className="panel form-panel">
        <h2 className="h3">Klasse</h2>
        <p className="muted small">Dein Spielstil. Die gewählte Klasse gibt Quest-XP-Bonus auf ihre Techniken. Die Markierung zeigt, wofür deine Daten gerade sprechen.</p>
        <ClassPicker value={p.cls} detected={st.clsDetected} onChange={(cls) => updateProfile({ cls })} />
      </section>
    </div>
  );
}

function NumberField({ id, label, value, min, max, onCommit }: { id: string; label: string; value?: number; min: number; max: number; onCommit: (v: number | undefined) => void }) {
  const [v, setV] = useState(value ? String(value) : "");
  const commit = () => {
    const n = Number(v.replace(",", "."));
    if (!v.trim()) onCommit(undefined);
    else if (Number.isFinite(n) && n >= min && n <= max) onCommit(Math.round(n * 10) / 10);
    else setV(value ? String(value) : "");
  };
  return (
    <label className="field">
      <span className="fl">{label}</span>
      <input id={id} inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} />
    </label>
  );
}

function isoMinus(iso: string, days: number) {
  return new Date((dayNum(iso) - days) * 864e5).toISOString().slice(0, 10);
}

function yearsSince(ym: string, today: string) {
  const [y, m] = ym.split("-").map(Number);
  const [ty, tm] = today.split("-").map(Number);
  return Math.max(0, (ty - y) + (tm - m) / 12);
}
