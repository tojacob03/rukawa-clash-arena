import { Building2, CalendarClock, Flame, HeartPulse, Plus, RefreshCw, ScanEye, Timer, Users } from "lucide-react";
import type { ArcData, ArcState, Attire, QuestOffer } from "../core/types.ts";
import { TECH, sectorName } from "../core/techniques.ts";
import { ARCS, LEVELS, QUEST, ROMAN, STUCK } from "../core/lore.ts";
import { pickCards } from "../core/model.ts";
import { longDate, shortDate } from "../format.ts";
import { acceptQuest, markReroll, matStart, setTodayAttire, togglePause } from "../actions.ts";
import { DAY_NAMES, addDays, nextTraining, weekdayOf } from "../core/schedule.ts";
import type { Occurrence } from "../core/schedule.ts";
import { getPlan, plannedAttire } from "../plan.ts";
import { go } from "../store.ts";
import { questTask } from "../questText.ts";
import { KindBadge, SecTitle, Seg, Star } from "../components/ui.tsx";
import { openScouter } from "../scan.ts";
import { useSocial } from "../cloud/social.ts";
import { crewWeek, gymDay } from "../core/social.ts";

const REASON: Record<QuestOffer["reason"], (st: ArcState, q: QuestOffer) => string> = {
  prog: (st, q) => `Kurz vor Stufe ${st.nodes[q.node].level + 1}, ${LEVELS[st.nodes[q.node].level + 1] ?? ""}`,
  unc: () => "Noch zu wenig Daten für eine sichere Quote",
  rust: (st, q) => `Rostet seit ${st.nodes[q.node].dAny} Tagen`,
  weak: (_st, q) => (TECH[q.node].sector === "fund" ? "Fundament festigen" : `Deine schwächste Achse: ${sectorName(TECH[q.node])}`),
  taught: () => "Diese Woche im Kurs gezeigt",
  explore: () => "Ein neuer Stern am Rand deiner Karte",
  prove: (st, q) => `Beweise deine Einschätzung: Stufe ${st.nodes[q.node].claim}, ${LEVELS[st.nodes[q.node].claim]}`,
};

export default function Today({ data, st, today }: { data: ArcData; st: ArcState; today: string }) {
  const lastAttire = [...data.sessions].sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.attire ?? "gi";
  const attire: Attire = data.ui.todayAttire?.day === today ? data.ui.todayAttire.attire : plannedAttire(data, today) ?? lastAttire;
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
      <div className="today-top">
        <section className="arc-banner" aria-label="Aktueller Arc">
          <p className="eyebrow">{longDate(today)}</p>
          <h1 className="arc-title">
            <span className="arc-no">Arc {ROMAN[st.arc.index % ROMAN.length]}</span>
            {arcName}
          </h1>
          <div className="arc-weeks" aria-label={`Woche ${st.arc.week} von 8`}>
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} className={i < st.arc.week ? "on" : ""} />
            ))}
            <span>Woche {st.arc.week} von 8</span>
          </div>
        </section>

        <section className="panel flame-card" aria-label="Wochenziel">
          <div className={`flame-ico${st.weekNow >= st.weekGoal ? " lit" : ""}`} aria-hidden="true">
            <Flame size={28} />
          </div>
          <div className="flame-main">
            <p className="flame-num">
              {st.streak} <small>{st.streak === 1 ? "Woche" : "Wochen"} Flamme</small>
            </p>
            <div className="pips" aria-label={`${st.weekNow} von ${st.weekGoal} BJJ-Trainings diese Woche`}>
              {Array.from({ length: Math.max(st.weekGoal, st.weekNow) }, (_, i) => (
                <i key={i} className={i < st.weekNow ? "on" : ""} />
              ))}
              <span>
                {st.weekNow} von {st.weekGoal} BJJ-Trainings
              </span>
            </div>
            {st.body.week || data.profile?.sports?.length ? (
              <div className="pips" aria-label={`${st.body.week} Einheiten Nebensport diese Woche`}>
                {Array.from({ length: Math.max(1, st.body.week) }, (_, i) => (
                  <i key={i} className={`side${i < st.body.week ? " on" : ""}`} />
                ))}
                <span>
                  {st.body.week} Nebensport, zählt nicht fürs Ziel
                </span>
              </div>
            ) : null}
          </div>
          <button type="button" className={`chip${st.paused ? " on" : ""}`} aria-pressed={st.paused} onClick={() => togglePause(today)} title="Verletzt oder krank: Die Woche zählt dann nicht gegen deine Flamme.">
            <HeartPulse size={15} aria-hidden="true" /> {st.paused ? "Heilungsmodus an" : "Heilungsmodus"}
          </button>
        </section>
      </div>

      <NextTraining data={data} today={today} />
      <SocialStrip today={today} />

      <SecTitle kanji="今日" eyebrow="Tagesquest" title="Zieh deine Karte">
        Eine Karte nimmst du mit auf die Matte. Im Training zählst du nur sie mit, das macht die Quest zur Messung.
      </SecTitle>

      <div className="row wrap between">
        <div className="row wrap">
          <span className="fl">Heute trainiere ich</span>
          <Seg value={attire} onChange={(v) => setTodayAttire(today, v)} label="Gi oder No-Gi" options={[{ v: "gi", label: "Gi" }, { v: "nogi", label: "No-Gi" }]} />
        </div>
        <button type="button" className="btn small" disabled={rerolled} onClick={() => markReroll(today)}>
          <RefreshCw size={15} aria-hidden="true" /> <span>{rerolled ? "Heute schon neu gezogen" : "Neu ziehen, einmal am Tag"}</span>
        </button>
      </div>

      {extra ? (
        <div className="quests single">
          <QuestCard q={{ ...extra, P: 0, reason: "prog" }} st={st} today={today} accepted done={done} own />
        </div>
      ) : null}
      <div className="quests">
        {cards.map((q) => (
          <QuestCard key={q.node} q={q} st={st} today={today} accepted={accepted?.node === q.node} done={done && accepted?.node === q.node} />
        ))}
      </div>

      <Boss st={st} />

      <section className="plain-sec log-cta">
        <div>
          <p className="cta-line">{todays.length ? `Heute schon ${todays.length}× eingetragen.` : "Noch nichts eingetragen heute."}</p>
          {last ? (
            <p className="muted small">
              Zuletzt am {shortDate(last.date)} im {last.attire === "gi" ? "Gi" : "No-Gi"} mit {last.rolls.length} Rolls
              {last.quest ? `, Quest ${TECH[last.quest.node]?.name ?? ""}` : ""}.
            </p>
          ) : null}
        </div>
        <button type="button" className="btn primary big" onClick={() => go("log")}>
          <Plus size={20} aria-hidden="true" />
          <span>Training eintragen</span>
        </button>
      </section>
    </div>
  );
}

function QuestCard({ q, st, today, accepted, done, own }: { q: QuestOffer; st: ArcState; today: string; accepted: boolean; done: boolean; own?: boolean }) {
  const x = TECH[q.node];
  const n = st.nodes[q.node];
  return (
    <article className={`qcard r-${q.kind}${accepted ? " taken" : ""}${done ? " done" : ""}`}>
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
        {accepted && !done ? (
          <button
            type="button"
            className="btn small"
            onClick={() => {
              matStart(today, q);
              go("matte");
            }}
          >
            <Timer size={15} aria-hidden="true" /> <span>Auf die Matte</span>
          </button>
        ) : accepted ? (
          <span className="taken-label">Erfüllt</span>
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

const dayWord = (date: string, today: string) => (date === today ? "Heute" : date === addDays(today, 1) ? "Morgen" : `Am ${DAY_NAMES[weekdayOf(date)]}`);

/** Crew, gym and friendship requests in one line each, only when there is something to see. */
function SocialStrip({ today }: { today: string }) {
  const s = useSocial();
  if (!s.me) return null;
  const rows = [];
  if (s.incoming.length)
    rows.push(
      <li key="req">
        <Users size={18} aria-hidden="true" />
        <p>{s.incoming.length === 1 ? `${s.incoming[0].name} möchte in deinen Freundeskreis.` : `${s.incoming.length} Anfragen für deinen Freundeskreis.`}</p>
        <button type="button" className="linkish" onClick={() => go("meer", "crew")}>
          Ansehen
        </button>
      </li>,
    );
  if (s.crew) {
    const w = crewWeek(s.crew.members, today);
    rows.push(
      <li key="crew">
        <Users size={18} aria-hidden="true" />
        <p>
          <b>{s.crew.name}</b>: {w.done} von {w.goal} Trainings diese Woche
        </p>
        <button type="button" className="linkish" onClick={() => go("meer", "crew")}>
          Zur Crew
        </button>
      </li>,
    );
  }
  const day = s.gym?.visible ? gymDay(s.gym.members, today, s.me.id) : [];
  if (s.gym && day.length) {
    const first = day[0];
    const more = day.length - 1;
    rows.push(
      <li key="gym">
        <Building2 size={18} aria-hidden="true" />
        <p>
          Heute in {s.gym.name}: <b>{first.start}</b> mit {first.names.join(", ")}
          {more ? ` und ${more} weitere ${more === 1 ? "Zeit" : "Zeiten"}` : ""}
        </p>
        <button type="button" className="linkish" onClick={() => go("gym")}>
          Zum Gym
        </button>
      </li>,
    );
  }
  if (!rows.length) return null;
  return (
    <ul className="social-strip" aria-label="Crew und Gym">
      {rows}
    </ul>
  );
}

/** The next planned training, with the way onto the mat when it is close. */
function NextTraining({ data, today }: { data: ArcData; today: string }) {
  const plan = getPlan(data);
  const now = Date.now();
  const o: Occurrence | null = plan.slots.length ? nextTraining(plan, now) : null;
  if (!plan.slots.length) {
    return (
      <section className="plan-strip" aria-label="Wochenplan">
        <CalendarClock size={20} aria-hidden="true" />
        <p>Trag ein, wann du trainierst. Dann erinnert dich Waza Arc vor jedem Training an deine Quest.</p>
        <button type="button" className="btn small" onClick={() => go("plan")}>
          Wochenplan anlegen
        </button>
      </section>
    );
  }
  const soon = !!o && o.slot.sport === "bjj" && o.start - now < 90 * 60_000;
  return (
    <section className="plan-strip" aria-label="Nächstes Training">
      <CalendarClock size={20} aria-hidden="true" />
      <p>
        {o ? (
          <>
            {o.start <= now ? "Läuft gerade" : `${dayWord(o.date, today)} um ${o.slot.start}`}: <b>{o.slot.label}</b>
            {o.slot.place ? `, ${o.slot.place}` : ""}
          </>
        ) : (
          "In den nächsten sieben Tagen steht kein Training im Plan."
        )}
      </p>
      <div className="row wrap">
        {soon ? (
          <button type="button" className="btn small" onClick={() => go("matte")}>
            <Timer size={15} aria-hidden="true" /> <span>Auf die Matte</span>
          </button>
        ) : null}
        <button type="button" className="linkish" onClick={() => go("plan")}>
          Wochenplan
        </button>
      </div>
    </section>
  );
}

function Boss({ st }: { st: ArcState }) {
  const b = st.boss;
  if (!b) {
    return (
      <section className="panel boss calm" aria-label="Wochenboss">
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
    <section className="panel boss" aria-label="Wochenboss">
      <div className="boss-id">
        <p className="eyebrow">Wochenboss</p>
        <h3 className="boss-name">{info.boss}</h3>
        <p className="boss-pos">{info.name}</p>
      </div>
      <div className="boss-hp">
        <div className="hp-top">
          <span>Lebenspunkte</span>
          <span>
            {b.hp} von {max}
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
        <button type="button" className="btn small scan" onClick={() => openScouter({ mode: "boss" })}>
          <ScanEye size={14} aria-hidden="true" /> <span>Boss scannen</span>
        </button>
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
