// Your pirate crew (up to 12 who sail together), on the friends page.

import { useState } from "react";
import { Flag as FlagIcon, LogOut, UserPlus, Users } from "lucide-react";
import type { ArcData } from "../core/types.ts";
import { cleanCode, crewWeek, weekOf } from "../core/social.ts";
import type { Peer } from "../core/social.ts";
import { getCharacter } from "../character.ts";
import { nf0 } from "../format.ts";
import type { SocialView } from "../cloud/social.ts";
import { CodeBox, FlameCount, PeerRow } from "../components/Social.tsx";
import { useAct } from "../useAct.tsx";
import CrewFlag, { WavingFlag } from "../components/CrewFlag.tsx";
import { HeroKoma } from "../components/ui.tsx";

/** The crew part of the friends page: your crew, or how to found or join one. */
export default function CrewPanel({ s, data, today }: { s: SocialView; data: ArcData; today: string }) {
  return s.crew ? <CrewHome s={s} data={data} today={today} /> : <NoCrew data={data} />;
}

function NoCrew({ data }: { data: ArcData }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const act = useAct();
  const flag = getCharacter(data).flag;
  const clean = cleanCode(code);
  return (
    <section className="crew-start" aria-labelledby="crew-start-h">
      <h2 id="crew-start-h" className="h3">
        Heuer an
      </h2>
      <p className="muted">Eine Crew sind bis zu zwölf Leute, die zusammen segeln: ihr seht eure Schiffe auf der Seekarte und schafft euer Wochenziel gemeinsam.</p>
      <div className="crew-choices">
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            void act.run((m) => m.crewCreate(name.trim(), flag ?? {}));
          }}
        >
          <h3 className="h3">
            <FlagIcon size={16} aria-hidden="true" /> Eigene Crew gründen
          </h3>
          <div className="row">
            <CrewFlag design={flag} width={72} />
            <p className="small muted">Deine Flagge wird die Flagge der Crew. Du steuerst, bis du sie abgibst.</p>
          </div>
          <label className="field">
            <span className="fl">Name der Crew</span>
            <input value={name} minLength={2} maxLength={40} required placeholder="z. B. Die Mattenratten" onChange={(e) => setName(e.target.value)} />
          </label>
          <button type="submit" className="btn" disabled={act.busy || name.trim().length < 2}>
            Crew gründen
          </button>
        </form>
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            if (clean) void act.run((m) => m.crewJoin(clean));
          }}
        >
          <h3 className="h3">
            <UserPlus size={16} aria-hidden="true" /> Einer Crew beitreten
          </h3>
          <p className="small muted">Den Code bekommst du von jemandem aus der Crew, oft direkt als Link.</p>
          <label className="field">
            <span className="fl">Crew-Code</span>
            <input className="code-field" value={code} maxLength={11} required placeholder="ABCD-EFGH" autoCapitalize="characters" autoComplete="off" spellCheck={false} onChange={(e) => setCode(e.target.value)} />
          </label>
          <button type="submit" className="btn" disabled={act.busy || !clean}>
            Beitreten
          </button>
        </form>
      </div>
      {act.msg}
    </section>
  );
}

function CrewHome({ s, data, today }: { s: SocialView; data: ArcData; today: string }) {
  const crew = s.crew!;
  const me = s.me!;
  const act = useAct();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(crew.name);
  const [kick, setKick] = useState<Peer | null>(null);
  const [leave, setLeave] = useState(false);
  const wk = crewWeek(crew.members, today);
  const loot = crew.members.reduce((a, m) => a + (m.card?.bounty ?? 0), 0);
  const pct = wk.goal ? Math.round((100 * wk.done) / wk.goal) : 0;
  const myFlag = getCharacter(data).flag;
  const others = crew.members.length - 1;

  return (
    <>
      <HeroKoma label={`Crew ${crew.name}`} className="crew-koma">
        <div className="crew-hero">
          <WavingFlag design={crew.flag} wind={wk.goal ? wk.done / wk.goal : 0} width={150} label={`Flagge der ${crew.name}`} />
          <div className="crew-hero-main">
            <h2 className="crew-name">{crew.name}</h2>
            <p className="muted">
              {crew.members.length} an Bord, zusammen {nf0.format(loot)} Gold Kopfgeld
            </p>
            <div className="crew-week" aria-label={`Crew-Woche: ${wk.done} von ${wk.goal} Trainings`}>
              <p>
                <b>Crew-Woche:</b> {wk.done} von {wk.goal} Trainings
              </p>
              <span className="xpbar crew-bar" aria-hidden="true">
                <i style={{ width: `${pct}%` }} />
              </span>
              <p className="small muted">{wk.met === wk.of ? "Alle haben ihr Wochenziel. Stark." : `${wk.met} von ${wk.of} haben ihr Wochenziel schon.`}</p>
            </div>
          </div>
        </div>
      </HeroKoma>

      <section className="plain-sec" aria-labelledby="crew-list-h">
        <h2 id="crew-list-h" className="h3">
          <Users size={16} aria-hidden="true" /> An Bord
        </h2>
        <ul className="peers">
          {crew.members.map((m) => {
            const w = weekOf(m.card, today);
            return (
              <PeerRow
                key={m.id}
                peer={m}
                tag={m.captain ? "am Steuer" : m.id === me.id ? "du" : undefined}
                side={
                  m.card ? (
                    <>
                      <span className={w >= m.card.goal ? "week-done" : ""}>
                        {w} von {m.card.goal} diese Woche
                      </span>
                      <FlameCount n={m.card.flame} />
                    </>
                  ) : null
                }
              >
                {crew.captain && m.id !== me.id ? (
                  <button type="button" className="btn small ghost" onClick={() => setKick(m)}>
                    Von Bord schicken
                  </button>
                ) : null}
              </PeerRow>
            );
          })}
        </ul>
        {kick ? (
          <div className="row wrap confirm-row">
            <span className="small">{kick.name} von Bord schicken? Mit dem Code kann die Person wieder beitreten.</span>
            <button
              type="button"
              className="btn small danger-btn"
              disabled={act.busy}
              onClick={() => {
                const id = kick.id;
                setKick(null);
                void act.run((m) => m.crewKick(id));
              }}
            >
              Ja
            </button>
            <button type="button" className="btn small ghost" onClick={() => setKick(null)}>
              Abbrechen
            </button>
          </div>
        ) : null}
      </section>

      <CodeBox label="Crew-Code: Wer ihn hat, kann an Bord kommen, höchstens zwölf." kind="c" code={crew.code} text={`Komm in meine Crew „${crew.name}“ bei Waza Arc.`} />

      <section className="plain-sec crew-admin" aria-label="Crew verwalten">
        {crew.captain ? (
          edit ? (
            <form
              className="row wrap social-inline"
              onSubmit={(e) => {
                e.preventDefault();
                void act.run((m) => m.crewEdit(name.trim(), crew.flag)).then((ok) => ok && setEdit(false));
              }}
            >
              <label className="field grow">
                <span className="fl">Name der Crew</span>
                <input value={name} minLength={2} maxLength={40} required onChange={(e) => setName(e.target.value)} />
              </label>
              <button type="submit" className="btn small" disabled={act.busy || name.trim().length < 2}>
                Speichern
              </button>
              <button type="button" className="btn small ghost" onClick={() => setEdit(false)}>
                Abbrechen
              </button>
            </form>
          ) : (
            <div className="row wrap">
              <button type="button" className="btn small" onClick={() => setEdit(true)}>
                Umbenennen
              </button>
              <button type="button" className="btn small" disabled={act.busy} onClick={() => void act.run((m) => m.crewEdit(crew.name, myFlag ?? {}), "Die Crew fährt jetzt unter deiner Flagge.")}>
                <FlagIcon size={14} aria-hidden="true" /> <span>Meine Flagge hissen</span>
              </button>
            </div>
          )
        ) : null}
        {leave ? (
          <div className="row wrap confirm-row">
            <span className="small">{crew.captain && others ? "Das Steuer geht an die Person, die am längsten an Bord ist." : others ? "Du kannst mit dem Code wieder beitreten." : "Du bist allein an Bord: die Crew wird aufgelöst."}</span>
            <button type="button" className="btn small danger-btn" disabled={act.busy} onClick={() => void act.run((m) => m.crewLeave())}>
              Crew verlassen
            </button>
            <button type="button" className="btn small ghost" onClick={() => setLeave(false)}>
              Abbrechen
            </button>
          </div>
        ) : (
          <button type="button" className="linkish" onClick={() => setLeave(true)}>
            <LogOut size={14} aria-hidden="true" /> Crew verlassen
          </button>
        )}
        {act.msg}
      </section>
    </>
  );
}
