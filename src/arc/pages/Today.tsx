import { Flame, HeartPulse, Plus, RefreshCw } from "lucide-react";
import type { ArcData, ArcState, Attire, QuestOffer } from "../core/types.ts";
import { TECH, sectorName } from "../core/techniques.ts";
import { ARCS, LEVELS, QUEST, ROMAN, STUCK } from "../core/lore.ts";
import { pickCards } from "../core/model.ts";
import { longDate, shortDate } from "../format.ts";
import { acceptQuest, markReroll, setTodayAttire, togglePause } from "../actions.ts";
import { go } from "../store.ts";
import { questTask } from "../questText.ts";
import { KindBadge, SecTitle, Seg, Star } from "../components/ui.tsx";

const REASON: Record<QuestOffer["reason"], (st: ArcState, q: QuestOffer) => string> = {
  prog: (st, q) => `Kurz vor Stufe ${st.nodes[q.node].level + 1} · ${LEVELS[st.nodes[q.node].level + 1] ?? ""}`,
  unc: () => "Noch zu wenig Daten für eine sichere Quote",
  rust: (st, q) => `Rostet seit ${st.nodes[q.node].dAny} Tagen`,
  weak: (_st, q) => (TECH[q.node].sector === "fund" ? "Fundament festigen" : `Deine schwächste Achse: ${sectorName(TECH[q.node])}`),
  taught: () => "Diese Woche im Kurs gezeigt",
  explore: () => "Ein neuer Stern am Rand deiner Karte",
};

export default function Today({ data, st, today }: { data: ArcData; st: ArcState; today: string }) {
  const lastAttire = [...data.sessions].sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.attire ?? "gi";
  const attire: Attire = data.ui.todayAttire?.day === today ? data.ui.todayAttire.attire : lastAttire;
  const first = pickCards(st.offers, { attire });
  const rerolled = data.ui.rerollDay === today;
  const cards = rerolled ? pickCards(st.offers, { attire, exclude: new Set(first.map((c) => c.node)) }) : first;
  const accepted = data.ui.accepted?.day === today ? data.ui.accepted : null;
  const todays = data.sessions.filter((s) => s.date === today);
  const done = accepted ? todays.some((s) => s.quest?.node === accepted.node) : false;
  const extra = accepted && !cards.some((c) => c.node === accepted.node) ? accepted : null;
  const last = [...data.sessions].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))[0];
  const arcName = ARCS[st.arc.index % ARCS.length];

  return (
    <div className="page today">
      <section className="arc-banner" aria-label="Aktueller Arc">
        <div>
          <p className="eyebrow">{longDate(today)}</p>
          <h1 className="arc-title">
            <span className="arc-no">Arc {ROMAN[st.arc.index % ROMAN.length]}</span> {arcName}
          </h1>
        </div>
        <div className="arc-weeks" aria-label={`Woche ${st.arc.week} von 8`}>
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} className={i < st.arc.week ? "on" : ""} />
          ))}
          <span>Woche {st.arc.week}/8</span>
        </div>
      </section>

      <section className="flame-card">
        <div className={`flame-ico${st.weekNow >= st.weekGoal ? " lit" : ""}`} aria-hidden="true">
          <Flame size={30} />
        </div>
        <div className="flame-main">
          <p className="flame-num">
            {st.streak} <small>{st.streak === 1 ? "Woche" : "Wochen"} Flamme</small>
          </p>
          <div className="pips" aria-label={`${st.weekNow} von ${st.weekGoal} Trainings diese Woche`}>
            {Array.from({ length: Math.max(st.weekGoal, st.weekNow) }, (_, i) => (
              <i key={i} className={i < st.weekNow ? "on" : ""} />
            ))}
            <span>
              {st.weekNow}/{st.weekGoal} diese Woche
            </span>
          </div>
        </div>
        <button type="button" className={`chip${st.paused ? " on" : ""}`} aria-pressed={st.paused} onClick={() => togglePause(today)} title="Verletzt oder krank: Die Woche zählt dann nicht gegen deine Flamme.">
          <HeartPulse size={14} aria-hidden="true" /> {st.paused ? "Heilungsmodus an" : "Heilungsmodus"}
        </button>
      </section>

      <SecTitle kanji="今日" eyebrow="Tagesquest" title="Zieh deine Karte">
        Eine Karte nimmst du mit auf die Matte. Im Training zählst du nur sie mit, das macht die Quest zur Messung.
      </SecTitle>

      <div className="row wrap between">
        <div className="row">
          <span className="fl">Heute trainiere ich</span>
          <Seg<Attire> value={attire} onChange={(v) => setTodayAttire(today, v)} label="Gi oder No-Gi" options={[{ v: "gi", label: "Gi" }, { v: "nogi", label: "No-Gi" }]} />
        </div>
        <button type="button" className="btn ghost small" disabled={rerolled} onClick={() => markReroll(today)}>
          <RefreshCw size={14} aria-hidden="true" /> <span>{rerolled ? "Heute neu gezogen" : "Neu ziehen · 1× pro Tag"}</span>
        </button>
      </div>

      {extra ? (
        <div className="quests single">
          <QuestCard q={{ ...extra, P: 0, reason: "prog" }} st={st} today={today} accepted done={done} i={0} own />
        </div>
      ) : null}
      <div className="quests" key={`${attire}-${rerolled}`}>
        {cards.map((q, i) => (
          <QuestCard key={q.node} q={q} st={st} today={today} accepted={accepted?.node === q.node} done={done && accepted?.node === q.node} i={i} />
        ))}
      </div>

      <Boss st={st} />

      <section className="log-cta">
        <div>
          <p className="eyebrow">Nach dem Training</p>
          <p className="cta-line">{todays.length ? `Heute schon ${todays.length}× eingetragen.` : "Noch nichts eingetragen heute."}</p>
          {last ? (
            <p className="muted small">
              Zuletzt: {shortDate(last.date)}, {last.attire === "gi" ? "Gi" : "No-Gi"}, {last.rolls.length} Rolls
              {last.quest ? `, Quest ${TECH[last.quest.node]?.name ?? ""}` : ""}
            </p>
          ) : null}
        </div>
        <button type="button" className="btn primary big" onClick={() => go("log")}>
          <Plus size={18} aria-hidden="true" />
          <span>Training eintragen</span>
        </button>
      </section>
    </div>
  );
}

function QuestCard({ q, st, today, accepted, done, i, own }: { q: QuestOffer; st: ArcState; today: string; accepted: boolean; done: boolean; i: number; own?: boolean }) {
  const x = TECH[q.node];
  const n = st.nodes[q.node];
  return (
    <article className={`qcard r-${q.kind}${accepted ? " taken" : ""}${done ? " done" : ""} deal`} style={{ animationDelay: `${i * 110}ms` }}>
      <span className="qcard-kanji" aria-hidden="true">
        {QUEST[q.kind].kanji}
      </span>
      <div className="qcard-top">
        <KindBadge kind={q.kind} />
        <span className="qsec">
          <Star level={n.level} rust={n.rust} prov={n.prov} size={14} /> {sectorName(x)}
        </span>
      </div>
      <h3>{x.name}</h3>
      <p className="qtask">{questTask(q)}</p>
      <p className="why">{own ? "Von dir auf der Karte gewählt" : REASON[q.reason](st, q)}</p>
      <div className="qcard-foot">
        <span className="xp">+{q.xp} XP</span>
        {accepted ? (
          <span className="taken-label">{done ? "Erfüllt" : "Angenommen"}</span>
        ) : (
          <button type="button" className="btn primary small" onClick={() => acceptQuest(today, q)}>
            <span>Annehmen</span>
          </button>
        )}
      </div>
      <button type="button" className="linkish" onClick={() => go("karte", q.node)}>
        Stern auf der Karte zeigen
      </button>
      {done ? (
        <span className="stamp" aria-label="Erfüllt">
          達成
        </span>
      ) : null}
    </article>
  );
}

function Boss({ st }: { st: ArcState }) {
  const b = st.boss;
  if (!b) {
    return (
      <section className="boss calm">
        <div>
          <p className="eyebrow">Wochenboss</p>
          <h3 className="boss-name">Ruhe im Dōjō</h3>
        </div>
        <p className="muted">In den letzten 14 Tagen hast du nirgends festgehangen. Trag bei der Notiz ein, wo du feststeckst, dann erscheint hier ein Boss.</p>
      </section>
    );
  }
  const info = STUCK[b.key];
  const max = Math.max(b.hp, b.prev, 4);
  return (
    <section className="boss">
      <div className="boss-lines" aria-hidden="true" />
      <div className="boss-id">
        <p className="eyebrow">Wochenboss</p>
        <h3 className="boss-name">{info.boss}</h3>
        <p className="boss-pos">{info.name}</p>
      </div>
      <div className="boss-hp">
        <div className="hp-top">
          <span>Lebenspunkte</span>
          <span>
            {b.hp} / {max}
          </span>
        </div>
        <div className="hp" aria-hidden="true">
          {Array.from({ length: max }, (_, i) => (
            <i key={i} className={i < b.hp ? "on" : ""} />
          ))}
        </div>
        <p className="small">
          {b.hp}× hier festgehangen in 14 Tagen, davor {b.prev}×. Besiegt, wenn es in den nächsten 14 Tagen höchstens {Math.floor(b.hp / 2)}× passiert.
        </p>
        <div className="chips">
          {info.nodes.map((id) => (
            <button key={id} type="button" className="chip" onClick={() => go("karte", id)}>
              <Star level={st.nodes[id].level} rust={st.nodes[id].rust} size={14} />
              {TECH[id].name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
