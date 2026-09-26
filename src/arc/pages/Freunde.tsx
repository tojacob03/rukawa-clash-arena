// Friends, crew and gym in one place, reachable from the main navigation
// (友). Adding a friend is one button at the top: share your invitation link
// or type in someone's code. Tapping a friend opens their card.

import { useEffect, useMemo, useState } from "react";
import { Building2, ScanEye, UserPlus, Users, X } from "lucide-react";
import type { ArcData, ArcState } from "../core/types.ts";
import { cleanCode, gearItems, weekOf } from "../core/social.ts";
import type { Peer } from "../core/social.ts";
import { CLASS } from "../core/classes.ts";
import { BELT, nf0 } from "../format.ts";
import { go } from "../store.ts";
import { refreshSocial } from "../cloud/social.ts";
import type { SocialView } from "../cloud/social.ts";
import { CodeBox, FlameCount, PeerHead, SocialGate, SocialSettings } from "../components/Social.tsx";
import { beltLine } from "../socialCard.ts";
import { useAct } from "../useAct.tsx";
import { openScouter } from "../scan.ts";
import Avatar from "../components/Avatar.tsx";
import { SecTitle } from "../components/ui.tsx";
import CrewPanel from "./Crew.tsx";

type Tab = "freunde" | "crew";

/** Friends, crew and gym side by side, like the social tab of a game. */
export function SocialTabs({ current, requests }: { current: Tab | "gym"; requests?: number }) {
  const tabs: { id: Tab | "gym"; label: string; go: () => void }[] = [
    { id: "freunde", label: "Freunde", go: () => go("freunde") },
    { id: "crew", label: "Crew", go: () => go("freunde", "crew") },
    { id: "gym", label: "Gym", go: () => go("gym") },
  ];
  return (
    <nav className="tabs" aria-label="Freunde, Crew und Gym">
      {tabs.map((t) => (
        <button key={t.id} type="button" className={current === t.id ? "on" : ""} aria-current={current === t.id ? "page" : undefined} onClick={t.go}>
          {t.label}
          {t.id === "freunde" && requests ? <span className="badge-new">{requests}</span> : null}
        </button>
      ))}
    </nav>
  );
}

export default function Freunde({ data, st, today, arg }: { data: ArcData; st: ArcState; today: string; arg: string | null }) {
  const tab: Tab = arg === "crew" ? "crew" : "freunde";
  // Opening the page asks for the latest requests, not the ones from two minutes ago.
  useEffect(() => {
    void refreshSocial(true);
  }, [tab]);
  return (
    <div className="page freunde">
      <SecTitle h1 kanji="友" eyebrow="Freunde" title={tab === "crew" ? "Deine Crew" : "Mit wem du trainierst"} />
      <SocialGate
        data={data}
        st={st}
        today={today}
        back={{ route: "freunde", arg: tab === "crew" ? "crew" : undefined }}
        intro="Füg die Leute hinzu, mit denen du trainierst: ihr seht eure Figuren, wer diese Woche schon auf der Matte war, und eure Schiffe auf der Seekarte."
      >
        {(s) => (
          <>
            <SocialTabs current={tab} requests={s.incoming.length} />
            {tab === "crew" ? <CrewPanel s={s} data={data} today={today} /> : <FriendsHome s={s} today={today} />}
            <SocialSettings s={s} data={data} st={st} today={today} />
          </>
        )}
      </SocialGate>
    </div>
  );
}

function FriendsHome({ s, today }: { s: SocialView; today: string }) {
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<Peer | null>(null);
  const act = useAct();
  // Most active this week first, then the longest flame.
  const friends = useMemo(
    () => [...s.friends].sort((a, b) => (b.card ? weekOf(b.card, today) : -1) - (a.card ? weekOf(a.card, today) : -1) || (b.card?.flame ?? 0) - (a.card?.flame ?? 0) || a.name.localeCompare(b.name, "de")),
    [s.friends, today],
  );
  return (
    <section className="friends-home" aria-labelledby="friends-h">
      <div className="friends-bar">
        <h2 id="friends-h" className="h3">
          {friends.length ? `${friends.length} ${friends.length === 1 ? "Freund" : "Freunde"}` : "Freunde"}
        </h2>
        <button type="button" className="btn primary" onClick={() => setAdding(true)}>
          <UserPlus size={18} aria-hidden="true" /> <span>Freund hinzufügen</span>
        </button>
      </div>

      {s.incoming.length ? (
        <div className="friend-requests">
          <h3 className="h3">{s.incoming.length === 1 ? "Eine Anfrage an dich" : `${s.incoming.length} Anfragen an dich`}</h3>
          <ul className="peers">
            {s.incoming.map((p) => (
              <li key={p.id} className="peer">
                <PeerHead peer={p} />
                <div className="peer-main">
                  <p className="peer-name">{p.name}</p>
                  <p className="small muted">{beltLine(p)}</p>
                </div>
                <div className="peer-act">
                  <button type="button" className="btn small primary" disabled={act.busy} onClick={() => void act.run((m) => m.friendAnswer(p.id, true), `Du und ${p.name} seid jetzt befreundet.`)}>
                    Annehmen
                  </button>
                  <button type="button" className="btn small ghost" disabled={act.busy} onClick={() => void act.run((m) => m.friendAnswer(p.id, false))}>
                    Ablehnen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {act.msg}

      {friends.length ? (
        <ul className="friend-list">
          {friends.map((f) => {
            const c = f.card;
            const wk = c ? weekOf(c, today) : 0;
            return (
              <li key={f.id}>
                <button type="button" className="friend" onClick={() => setOpen(f)}>
                  <PeerHead peer={f} size={52} />
                  <span className="friend-main">
                    <b>{f.name}</b>
                    <small>{beltLine(f)}</small>
                  </span>
                  {c ? (
                    <span className="friend-side">
                      <span className="friend-pl">
                        {nf0.format(c.pl)}
                        <small>Power Level</small>
                      </span>
                      <span className={`friend-week${wk >= c.goal ? " done" : ""}`}>
                        {wk}/{c.goal}
                        <small>diese Woche</small>
                      </span>
                      <FlameCount n={c.flame} />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="friends-empty">
          <p className="lede">Noch niemand in deinem Freundeskreis.</p>
          <p className="muted">Schick deine Einladung an die Leute aus deinem Gym. Wer sie öffnet, landet direkt bei dir.</p>
          <CodeBox label="Dein Code" kind="f" code={s.me!.code} text="Lass uns bei Waza Arc zusammen trainieren." />
        </div>
      )}

      {s.outgoing.length ? (
        <div className="friend-pending">
          <h3 className="h3">Wartet auf Antwort</h3>
          <ul className="plain-list">
            {s.outgoing.map((o) => (
              <li key={o.id} className="row wrap between">
                <span>{o.name}</span>
                <button type="button" className="btn small ghost" disabled={act.busy} onClick={() => void act.run((m) => m.friendRemove(o.id))}>
                  Zurückziehen
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="small muted friends-foot">
        <Users size={14} aria-hidden="true" /> In einer Crew segelt ihr zu zwölft ein Schiff.{" "}
        <button type="button" className="linkish" onClick={() => go("freunde", "crew")}>
          Zur Crew
        </button>{" "}
        <Building2 size={14} aria-hidden="true" /> Wer in deinem Gym trainiert, siehst du im{" "}
        <button type="button" className="linkish" onClick={() => go("gym")}>
          Gym
        </button>
        .
      </p>

      {adding ? <AddFriend s={s} onClose={() => setAdding(false)} /> : null}
      {open ? <FriendCard f={open} today={today} onClose={() => setOpen(null)} /> : null}
    </section>
  );
}

/** Close on Escape, like every dialog in the app. */
function useEscape(onClose: () => void) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
}

const RESULT: Record<string, string> = {
  requested: "Anfrage verschickt. Sobald sie angenommen ist, seht ihr euch gegenseitig.",
  pending: "Die Anfrage läuft schon.",
  accepted: "Ihr seid jetzt befreundet.",
  friends: "Ihr seid schon befreundet.",
};

function AddFriend({ s, onClose }: { s: SocialView; onClose: () => void }) {
  const [code, setCode] = useState("");
  const act = useAct();
  const clean = cleanCode(code);
  useEscape(onClose);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-friend-h" onClick={onClose}>
      <div className="modal-card add-friend" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2 id="add-friend-h" className="h2">
            Freund hinzufügen
          </h2>
          <button type="button" className="icon-btn" aria-label="Schließen" onClick={onClose} autoFocus>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <section aria-labelledby="af-send">
          <h3 id="af-send" className="h3">
            Einladung schicken
          </h3>
          <p className="small muted">Per Link, zum Beispiel in die Gruppe deines Gyms. Wer ihn öffnet, schickt dir eine Anfrage.</p>
          <CodeBox label="Dein Code" kind="f" code={s.me!.code} text="Lass uns bei Waza Arc zusammen trainieren." />
        </section>
        <section aria-labelledby="af-enter">
          <h3 id="af-enter" className="h3">
            Code eingeben
          </h3>
          <form
            className="row wrap social-inline"
            onSubmit={(e) => {
              e.preventDefault();
              if (clean) void act.run((m) => m.friendAdd(clean), (r) => (Object.prototype.hasOwnProperty.call(RESULT, String(r)) ? RESULT[String(r)] : "Erledigt.")).then((ok) => ok && setCode(""));
            }}
          >
            <label className="field grow">
              <span className="fl">Code von jemandem</span>
              <input className="code-field" value={code} maxLength={11} placeholder="ABCD-EFGH" autoCapitalize="characters" autoComplete="off" spellCheck={false} onChange={(e) => setCode(e.target.value)} />
            </label>
            <button type="submit" className="btn primary" disabled={act.busy || !clean}>
              Anfrage schicken
            </button>
          </form>
          {act.msg}
        </section>
      </div>
    </div>
  );
}

/** A friend's card: the figure large, the numbers beside it. */
function FriendCard({ f, today, onClose }: { f: Peer; today: string; onClose: () => void }) {
  const [sure, setSure] = useState(false);
  const act = useAct();
  const c = f.card;
  const gear = useMemo(() => (c ? gearItems(c.gear) : {}), [c]);
  useEscape(onClose);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={`Karte von ${f.name}`} onClick={onClose}>
      <div className="modal-card friend-card" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2 className="h2">{f.name}</h2>
          <button type="button" className="icon-btn" aria-label="Schließen" onClick={onClose} autoFocus>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {c ? (
          <div className="fc-body">
            <div className="fc-figure">
              <Avatar look={c.look} mode={c.mode} gear={gear} belt={c.belt} stripes={c.stripes} body={c.body} size={180} still label={`${f.name}, Figur`} />
            </div>
            <dl className="fc-stats">
              <div>
                <dt>Gürtel</dt>
                <dd>
                  {BELT[c.belt].name}
                  {c.stripes ? `, ${c.stripes}. Streifen` : ""}
                </dd>
              </div>
              <div>
                <dt>Level</dt>
                <dd>{c.lvl}</dd>
              </div>
              <div>
                <dt>Power Level</dt>
                <dd>{nf0.format(c.pl)}</dd>
              </div>
              <div>
                <dt>Diese Woche</dt>
                <dd>
                  {weekOf(c, today)} von {c.goal}
                </dd>
              </div>
              <div>
                <dt>Flamme</dt>
                <dd>{c.flame} Wochen</dd>
              </div>
              {c.cls && CLASS[c.cls] ? (
                <div>
                  <dt>Klasse</dt>
                  <dd>{CLASS[c.cls].name}</dd>
                </div>
              ) : null}
              <div>
                <dt>Kopfgeld</dt>
                <dd>{nf0.format(c.bounty)}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="muted">{f.name} hat noch keine Karte geteilt.</p>
        )}
        <div className="row wrap fc-acts">
          {c ? (
            <button
              type="button"
              className="btn scan"
              onClick={() => {
                onClose();
                openScouter({ mode: "partner", belt: c.belt, label: f.name });
              }}
            >
              <ScanEye size={16} aria-hidden="true" /> <span>Mit dem Scouter vergleichen</span>
            </button>
          ) : null}
          {sure ? (
            <>
              <button type="button" className="btn small danger-btn" disabled={act.busy} onClick={() => void act.run((m) => m.friendRemove(f.id)).then((ok) => ok && onClose())}>
                Wirklich entfernen
              </button>
              <button type="button" className="btn small ghost" onClick={() => setSure(false)}>
                Abbrechen
              </button>
            </>
          ) : (
            <button type="button" className="btn small ghost" onClick={() => setSure(true)}>
              Aus dem Freundeskreis entfernen
            </button>
          )}
        </div>
        {act.msg}
      </div>
    </div>
  );
}
