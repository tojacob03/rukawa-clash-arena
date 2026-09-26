// Your gym: who else trains there and who is on the mat today. Separate from
// the pirate crew: the gym is the place, the crew are the people you sail with.
// Joining needs the gym's code, so nobody can look into a gym from outside.

import { useEffect, useState } from "react";
import { CalendarClock, LogOut, MapPin, Plus, Search } from "lucide-react";
import type { ArcData, ArcState } from "../core/types.ts";
import { cleanCode, gymDay, readGymHits } from "../core/social.ts";
import type { GymHit } from "../core/social.ts";
import { SPORT } from "../core/sports.ts";
import { addDays } from "../core/schedule.ts";
import { loadCloud } from "../cloud/state.ts";
import type { SocialView } from "../cloud/social.ts";
import { go } from "../store.ts";
import { CodeBox, PeerRow, SocialGate } from "../components/Social.tsx";
import { useAct } from "../useAct.tsx";
import { HeroKoma, SecTitle } from "../components/ui.tsx";
import { SocialTabs } from "./Freunde.tsx";
import GymDoor from "../components/GymDoor.tsx";

export default function Gym({ data, st, today }: { data: ArcData; st: ArcState; today: string }) {
  return (
    <div className="page gym-page">
      <SecTitle h1 kanji="道" eyebrow="Gym" title="Dein Gym">
        Sieh, wer aus deinem Gym auch mit Waza Arc trainiert und wer heute auf der Matte steht. Das ist unabhängig von deiner Crew.
      </SecTitle>
      <SocialTabs current="gym" />
      <SocialGate data={data} st={st} today={today} back={{ route: "gym" }} intro="Tritt deinem Gym bei und sieh, wer von dort heute trainiert.">
        {(s) => (s.gym ? <GymHome s={s} today={today} /> : <FindGym />)}
      </SocialGate>
    </div>
  );
}

const sportName = (id: string) => (id === "bjj" ? "BJJ" : Object.prototype.hasOwnProperty.call(SPORT, id) ? SPORT[id as keyof typeof SPORT].name : id);

function GymHome({ s, today }: { s: SocialView; today: string }) {
  const gym = s.gym!;
  const me = s.me!;
  const act = useAct();
  const [leave, setLeave] = useState(false);
  // The box follows the tap at once and goes back if the server says no.
  const [visible, setVisible] = useState(gym.visible);
  useEffect(() => setVisible(gym.visible), [gym.visible]);
  const others = gym.members.filter((m) => m.id !== me.id);
  const days = [
    { label: "Heute", list: gymDay(gym.members, today, me.id) },
    { label: "Morgen", list: gymDay(gym.members, addDays(today, 1), me.id) },
  ];
  const sharing = gym.members.some((m) => m.id !== me.id && m.slots?.length);

  return (
    <>
      <HeroKoma label={`Gym ${gym.name}`} className="gym-koma">
        <div className="gym-hero">
          <GymDoor name={gym.name} />
          <div>
            <h2 className="crew-name">{gym.name}</h2>
            <p className="muted">
              {gym.city ? (
                <>
                  <MapPin size={14} aria-hidden="true" /> {gym.city},{" "}
                </>
              ) : null}
              {gym.count === 1 ? "bisher nur du mit Waza Arc" : `${gym.count} Leute mit Waza Arc`}
            </p>
          </div>
        </div>
      </HeroKoma>

      {gym.visible ? (
        <section className="plain-sec" aria-labelledby="gym-days-h">
          <h2 id="gym-days-h" className="h3">
            <CalendarClock size={16} aria-hidden="true" /> Wer trainiert wann
          </h2>
          {sharing ? (
            <div className="gym-days">
              {days.map((d) => (
                <div key={d.label}>
                  <p className="ch-name">{d.label}</p>
                  {d.list.length ? (
                    <ul className="plain-list gym-slots">
                      {d.list.map((x) => (
                        <li key={`${x.start}/${x.sport}`}>
                          <b>{x.start}</b> {sportName(x.sport)}: {x.names.join(", ")}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="small muted">Niemand eingetragen.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Noch teilt hier niemand Trainingszeiten. Das geht unter Freunde bei deiner Karte, aus deinem Wochenplan.</p>
          )}
          {!me.shareTimes ? (
            <p className="small muted">
              Deine eigenen Zeiten teilst du gerade nicht.{" "}
              <button type="button" className="linkish" onClick={() => go("freunde", "crew")}>
                Einstellungen deiner Karte
              </button>
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="plain-sec" aria-labelledby="gym-list-h">
        <h2 id="gym-list-h" className="h3">
          Aus deinem Gym
        </h2>
        {!gym.visible ? (
          <p className="muted">Du bist unsichtbar. Dann siehst du auch die anderen nicht: sichtbar wird nur, wer selbst sichtbar ist.</p>
        ) : others.length ? (
          <ul className="peers">
            {others.map((m) => (
              <PeerRow key={m.id} peer={m} />
            ))}
          </ul>
        ) : (
          <p className="muted">{gym.count > 1 ? "Die anderen haben sich unsichtbar gestellt." : "Noch niemand außer dir. Häng den Code im Gym aus oder schick ihn herum."}</p>
        )}
        <label className="check">
          <input
            type="checkbox"
            checked={visible}
            disabled={act.busy}
            onChange={(e) => {
              const v = e.target.checked;
              setVisible(v);
              void act.run((m) => m.gymVisible(v)).then((ok) => !ok && setVisible(!v));
            }}
          />{" "}
          In meinem Gym sichtbar sein
        </label>
        <p className="small muted">Sichtbar heißt: Leute aus deinem Gym sehen deinen Namen, Gurt, Level und Avatar, und deine Trainingszeiten, falls du sie teilst.</p>
      </section>

      <CodeBox label="Gym-Code: Häng ihn am Brett aus oder schick ihn in die Gruppe deines Gyms." kind="g" code={gym.code} text={`Unser Gym ${gym.name} bei Waza Arc.`} />

      <section className="plain-sec" aria-label="Gym verlassen">
        {leave ? (
          <div className="row wrap confirm-row">
            <span className="small">Du verschwindest aus der Liste. Mit dem Code kommst du jederzeit zurück.</span>
            <button type="button" className="btn small danger-btn" disabled={act.busy} onClick={() => void act.run((m) => m.gymLeave())}>
              Gym verlassen
            </button>
            <button type="button" className="btn small ghost" onClick={() => setLeave(false)}>
              Abbrechen
            </button>
          </div>
        ) : (
          <button type="button" className="linkish" onClick={() => setLeave(true)}>
            <LogOut size={14} aria-hidden="true" /> Gym verlassen oder wechseln
          </button>
        )}
        {act.msg}
      </section>
    </>
  );
}

function FindGym() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<GymHit[] | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [create, setCreate] = useState(false);
  const act = useAct();
  const clean = cleanCode(code);

  // Search as you type, a moment after the last key.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits(null);
      return;
    }
    let dead = false;
    const t = window.setTimeout(() => {
      loadCloud()
        .then((m) => m.gymFind(term))
        .then((r) => !dead && setHits(readGymHits(r)))
        .catch(() => !dead && setHits([]));
    }, 300);
    return () => {
      dead = true;
      window.clearTimeout(t);
    };
  }, [q]);

  return (
    <>
      <form
        className="panel gym-join"
        onSubmit={(e) => {
          e.preventDefault();
          if (clean) void act.run((m) => m.gymJoin(clean));
        }}
      >
        <h2 className="h3">Mit dem Gym-Code beitreten</h2>
        <p className="small muted">Den Code hat, wer im Gym schon dabei ist, oder er hängt am Brett.</p>
        <div className="row wrap social-inline">
          <label className="field">
            <span className="fl">Gym-Code</span>
            <input className="code-field" value={code} maxLength={11} required placeholder="ABCD-EFGH" autoCapitalize="characters" autoComplete="off" spellCheck={false} onChange={(e) => setCode(e.target.value)} />
          </label>
          <button type="submit" className="btn" disabled={act.busy || !clean}>
            Beitreten
          </button>
        </div>
      </form>

      <section className="plain-sec" aria-labelledby="gym-find-h">
        <h2 id="gym-find-h" className="h3">
          <Search size={16} aria-hidden="true" /> Gibt es dein Gym schon?
        </h2>
        <label className="field">
          <span className="fl">Name oder Stadt</span>
          <input type="search" value={q} maxLength={60} placeholder="z. B. Kyoto Grappling oder Köln" onChange={(e) => setQ(e.target.value)} />
        </label>
        {hits ? (
          hits.length ? (
            <>
              <ul className="plain-list gym-hits" aria-live="polite">
                {hits.map((g) => (
                  <li key={g.id}>
                    <b>{g.name}</b>
                    {g.city ? `, ${g.city}` : ""} <span className="muted small">({g.count === 1 ? "1 Person" : `${g.count} Leute`})</span>
                  </li>
                ))}
              </ul>
              <p className="small muted">Ist deins dabei? Frag dort nach dem Code. Ohne Code sieht niemand von außen, wer in einem Gym ist.</p>
            </>
          ) : (
            <p className="small muted" aria-live="polite">
              Nichts gefunden.
            </p>
          )
        ) : null}
      </section>

      <section className="plain-sec" aria-labelledby="gym-new-h">
        <h2 id="gym-new-h" className="h3">
          <Plus size={16} aria-hidden="true" /> Gym anlegen
        </h2>
        {create ? (
          <form
            className="gym-new"
            onSubmit={(e) => {
              e.preventDefault();
              void act.run((m) => m.gymCreate(name.trim(), city.trim()));
            }}
          >
            <div className="row wrap social-inline">
              <label className="field grow">
                <span className="fl">Name des Gyms</span>
                <input value={name} minLength={2} maxLength={60} required onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="field grow">
                <span className="fl">Stadt</span>
                <input value={city} maxLength={40} autoComplete="address-level2" onChange={(e) => setCity(e.target.value)} />
              </label>
            </div>
            <button type="submit" className="btn" disabled={act.busy || name.trim().length < 2}>
              Anlegen und beitreten
            </button>
          </form>
        ) : (
          <>
            <p className="muted">Nicht dabei? Leg es an. Danach bekommst du den Code zum Weitergeben.</p>
            <button type="button" className="btn small" onClick={() => setCreate(true)}>
              Gym anlegen
            </button>
          </>
        )}
      </section>
      {act.msg}
    </>
  );
}
