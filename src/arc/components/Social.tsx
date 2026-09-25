// Building blocks for crew, friends and gym: other players' heads and rows,
// a code to share, and the gate every social screen goes through (account,
// switched on, loaded).

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Check, Copy, Eye, Flame, Share2 } from "lucide-react";
import type { ArcData, ArcState } from "../core/types.ts";
import { gearItems } from "../core/social.ts";
import type { InviteKind, Peer } from "../core/social.ts";
import { afterSignIn, useCloud } from "../cloud/state.ts";
import { refreshSocial, useSocial } from "../cloud/social.ts";
import type { SocialView } from "../cloud/social.ts";
import { beltLine, enableSocial, inviteLink } from "../socialCard.ts";
import { useAct } from "../useAct.tsx";
import { go } from "../store.ts";
import type { Route } from "../store.ts";
import Avatar from "./Avatar.tsx";

export function PeerHead({ peer, size = 56 }: { peer: Peer; size?: number }) {
  const c = peer.card;
  const gear = useMemo(() => (c ? gearItems(c.gear) : {}), [c]);
  if (!c)
    return (
      <span className="peer-head none" style={{ width: size, height: size }} aria-hidden="true">
        {peer.name.slice(0, 1).toUpperCase()}
      </span>
    );
  return (
    <span className="peer-head" style={{ width: size, height: size }} aria-hidden="true">
      <Avatar look={c.look} mode={c.mode} gear={gear} belt={c.belt} stripes={c.stripes} size={size} crop="head" still />
    </span>
  );
}

export function PeerRow({ peer, sub, tag, side, children }: { peer: Peer; sub?: ReactNode; tag?: ReactNode; side?: ReactNode; children?: ReactNode }) {
  return (
    <li className="peer">
      <PeerHead peer={peer} />
      <div className="peer-main">
        <p className="peer-name">
          <span>{peer.name}</span>
          {tag ? <span className="peer-tag">{tag}</span> : null}
        </p>
        <p className="small muted">{sub ?? beltLine(peer)}</p>
        {side ? <div className="peer-side small">{side}</div> : null}
      </div>
      {children ? <div className="peer-act">{children}</div> : null}
    </li>
  );
}

export function FlameCount({ n }: { n: number }) {
  return (
    <span className={`peer-flame${n ? " lit" : ""}`} title="Wochen in Folge mit erreichtem Wochenziel">
      <Flame size={14} aria-hidden="true" />
      {n}
      <span className="sr-only"> Wochen Flamme</span>
    </span>
  );
}

/** A code with buttons to share the invitation link or copy the code. */
export function CodeBox({ label, kind, code, text, children }: { label: string; kind: InviteKind; code: string; text: string; children?: ReactNode }) {
  const [done, setDone] = useState<"code" | "link" | "fail" | null>(null);
  const link = inviteLink(kind, code);
  const copy = async (what: "code" | "link", v: string) => {
    try {
      await navigator.clipboard.writeText(v);
      setDone(what);
    } catch {
      setDone("fail");
    }
  };
  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Waza Arc", text, url: link });
        return;
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
      }
    }
    await copy("link", link);
  };
  return (
    <div className="code-box">
      <p className="small muted">{label}</p>
      <p className="code-big" translate="no">
        {code}
      </p>
      {children}
      <div className="row wrap">
        <button type="button" className="btn small" onClick={() => void share()}>
          <Share2 size={14} aria-hidden="true" /> <span>Einladung teilen</span>
        </button>
        <button type="button" className="btn small ghost" onClick={() => void copy("code", code)}>
          {done === "code" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} <span>{done === "code" ? "Code kopiert" : "Code kopieren"}</span>
        </button>
      </div>
      <p className="small muted" role="status">
        {done === "link" ? "Link kopiert. Schick ihn weiter, wohin du willst." : done === "fail" ? "Kopieren hat nicht geklappt. Schreib den Code einfach ab." : ""}
      </p>
    </div>
  );
}

/**
 * Everything social needs an account and the switch turned on. Shows the
 * right step until then, afterwards the children with the loaded state.
 */
export function SocialGate({
  data,
  st,
  today,
  back,
  intro,
  children,
}: {
  data: ArcData;
  st: ArcState;
  today: string;
  back: { route: Route; arg?: string };
  intro: string;
  children: (s: SocialView) => ReactNode;
}) {
  const c = useCloud();
  const s = useSocial(true);
  if (!c.configured) return <p className="lede">Crew, Freundeskreis und Gym brauchen die Version mit Konto. Diese läuft ohne Server.</p>;
  if (data.demo)
    return (
      <div className="panel social-step">
        <p className="lede">Im Demo-Dōjō segelst du allein. Leg deinen eigenen Charakter an, dann kannst du eine Crew gründen.</p>
        <button type="button" className="btn small" onClick={() => go("profil")}>
          Demo verlassen
        </button>
      </div>
    );
  if (c.status === "loading" || (c.status === "signedIn" && !c.mfa && (s.status === "idle" || (s.status === "loading" && !s.me))))
    return (
      <p className="muted" role="status">
        Wird geladen …
      </p>
    );
  if (c.status !== "signedIn")
    return (
      <div className="panel social-step">
        <p className="lede">{intro}</p>
        <p className="small muted">Dafür brauchst du ein Konto. Deine Trainings bleiben trotzdem privat: andere sehen nur deine Karte.</p>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            afterSignIn(back.route, back.arg);
            go("konto");
          }}
        >
          Anmelden oder Konto erstellen
        </button>
      </div>
    );
  if (c.mfa) return <p className="lede">Bestätige zuerst den Code aus deiner Authenticator-App.</p>;
  if (!s.me && s.status === "error")
    return (
      <div className="panel social-step">
        <p className="auth-msg err" role="alert">
          {s.error}
        </p>
        <button type="button" className="btn small" onClick={() => void refreshSocial(true)}>
          Noch einmal versuchen
        </button>
      </div>
    );
  if (!s.me) return <EnableSocial data={data} st={st} today={today} intro={intro} />;
  return (
    <>
      {s.status === "error" ? (
        <p className="auth-msg err" role="alert">
          {s.error}
        </p>
      ) : null}
      {children(s)}
    </>
  );
}

function EnableSocial({ data, st, today, intro }: { data: ArcData; st: ArcState; today: string; intro: string }) {
  const [name, setName] = useState((data.profile?.name ?? "").slice(0, 32));
  const [times, setTimes] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const hasPlan = !!data.plan?.slots?.length;
  return (
    <form
      className="panel social-step"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        try {
          await enableSocial(data, st, today, name.trim(), times);
        } catch (x) {
          setErr((x as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="h3">Crew und Freundeskreis einschalten</h2>
      <p className="lede">{intro}</p>
      <div className="shown-to">
        <div>
          <p className="ch-name">
            <Eye size={16} aria-hidden="true" /> Das sehen andere
          </p>
          <p className="small muted">Deinen Namen, Gurt, Level, Power Level, Flamme und Kopfgeld, wie viele Trainings du diese Woche hast, deinen Avatar in deiner Figur, dein Schiff und wo es auf der Seekarte liegt, und in einer Crew, wie viele Seemeilen du dem Crew-Schiff gebracht hast.</p>
        </div>
        <div>
          <p className="ch-name">Das bleibt bei dir</p>
          <p className="small muted">Dein Trainingstagebuch mit Techniken, Rolls und Notizen, deine Größe und dein Gewicht als Zahlen und dein Konto.</p>
        </div>
        <div>
          <p className="ch-name">Wer es sieht</p>
          <p className="small muted">Nur, wen du per Code hinzufügst, deine Crew und, wenn du magst, Leute aus deinem Gym. Eine Suche nach Personen gibt es nicht.</p>
        </div>
      </div>
      <label className="field">
        <span className="fl">Dein Name für die anderen</span>
        <input value={name} maxLength={32} required autoComplete="nickname" onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="check">
        <input type="checkbox" checked={times} onChange={(e) => setTimes(e.target.checked)} /> Trainingszeiten aus dem Wochenplan teilen
      </label>
      <p className="small muted">
        {hasPlan ? "Nur Tag, Uhrzeit und Sportart. So sieht dein Gym, wer heute wann auf der Matte steht." : "Dein Wochenplan ist noch leer. Du kannst das später einschalten."}
      </p>
      <div className="row wrap">
        <button type="submit" className="btn primary" disabled={busy || !name.trim()}>
          Einschalten
        </button>
      </div>
      <p className="small muted">Ausschalten geht jederzeit. Dann ist deine Karte sofort vom Server weg, mit allen Freundschaften und Mitgliedschaften.</p>
      {err ? (
        <p className="auth-msg err" role="alert">
          {err}
        </p>
      ) : null}
    </form>
  );
}

/** Name, shared training times, switch off. */
export function SocialSettings({ s, data, st, today }: { s: SocialView; data: ArcData; st: ArcState; today: string }) {
  const me = s.me!;
  const [name, setName] = useState(me.name);
  const [sure, setSure] = useState(false);
  const [times, setTimes] = useState(me.shareTimes);
  useEffect(() => setTimes(me.shareTimes), [me.shareTimes]);
  const act = useAct();
  const save = (nm: string, times: boolean) => act.run(async () => enableSocial(data, st, today, nm, times, false), "Gespeichert.");
  return (
    <section className="plain-sec social-settings" aria-labelledby="soc-set-h">
      <h2 id="soc-set-h" className="h3">
        Deine Karte
      </h2>
      <form
        className="row wrap social-inline"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && name.trim() !== me.name) void save(name.trim(), me.shareTimes);
        }}
      >
        <label className="field grow">
          <span className="fl">Dein Name für die anderen</span>
          <input value={name} maxLength={32} required onChange={(e) => setName(e.target.value)} />
        </label>
        <button type="submit" className="btn small" disabled={act.busy || !name.trim() || name.trim() === me.name}>
          Speichern
        </button>
      </form>
      <label className="check">
        <input
          type="checkbox"
          checked={times}
          disabled={act.busy}
          onChange={(e) => {
            const v = e.target.checked;
            setTimes(v);
            void save(me.name, v).then((ok) => !ok && setTimes(!v));
          }}
        />{" "}
        Trainingszeiten teilen (Tag, Uhrzeit, Sportart)
      </label>
      {sure ? (
        <div className="row wrap">
          <span className="small">Karte, Freundschaften, Crew und Gym werden gelöscht.</span>
          <button type="button" className="btn small danger-btn" disabled={act.busy} onClick={() => void act.run((m) => m.socialDisable())}>
            Ja, ausschalten
          </button>
          <button type="button" className="btn small ghost" onClick={() => setSure(false)}>
            Abbrechen
          </button>
        </div>
      ) : (
        <button type="button" className="linkish" onClick={() => setSure(true)}>
          Crew und Freundeskreis ausschalten
        </button>
      )}
      {act.msg}
    </section>
  );
}
