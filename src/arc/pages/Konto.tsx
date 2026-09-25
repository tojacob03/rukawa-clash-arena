// Account: sign in or create an account, and manage it. Everything that
// talks to Supabase goes through cloud/engine.ts, which loads on first use.

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Cloud, CloudOff, Fingerprint, KeyRound, LogOut, Mail, Pencil, Phone, RefreshCw, ShieldCheck, Smartphone, Trash2, TriangleAlert, UserRound } from "lucide-react";
import type { ArcData } from "../core/types.ts";
import { useCloud, loadCloud, takeAfterSignIn } from "../cloud/state.ts";
import type { CloudState } from "../cloud/state.ts";
import type { AuthSettings } from "../cloud/engine.ts";
import { go } from "../store.ts";
import { exportJson } from "../actions.ts";
import { HeroKoma, SecTitle, Seg } from "../components/ui.tsx";
import ProviderIcon from "../components/ProviderIcon.tsx";
import { providerName } from "../cloud/providers.ts";
import { useCaptcha } from "../components/Captcha.tsx";

type Engine = typeof import("../cloud/engine.ts");

export default function Konto({ data }: { data: ArcData }) {
  const c = useCloud();
  const [eng, setEng] = useState<Engine | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!c.configured) return;
    let dead = false;
    loadCloud()
      .then((m) => !dead && setEng(m))
      .catch((e: Error) => !dead && setLoadErr(e.message));
    return () => {
      dead = true;
    };
  }, [c.configured]);

  // Came here from character creation: once signed in, back to the Dōjō.
  useEffect(() => {
    if (c.status !== "signedIn" || c.mfa) return;
    const next = takeAfterSignIn();
    if (next) go(next.route, next.arg);
  }, [c.status, c.mfa]);

  if (!c.configured) {
    return (
      <div className="page konto">
        <SecTitle kanji="鍵" eyebrow="Konto" title="Konten sind hier noch nicht eingerichtet" />
        <p className="lede">Diese Version läuft ohne Server. Deine Daten bleiben in diesem Browser; mit dem Export im Profil nimmst du sie mit.</p>
      </div>
    );
  }
  if (loadErr) {
    return (
      <div className="page konto">
        <SecTitle kanji="鍵" eyebrow="Konto" title="Konto gerade nicht erreichbar" />
        <p className="lede">{loadErr}</p>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          <RefreshCw size={16} aria-hidden="true" /> <span>Neu laden</span>
        </button>
      </div>
    );
  }
  if (!eng || c.status === "loading" || c.status === "off") {
    return (
      <div className="page konto">
        <SecTitle kanji="鍵" eyebrow="Konto" title="Einen Moment" />
        <p className="lede" role="status">
          Konto wird geladen.
        </p>
      </div>
    );
  }
  return c.status === "signedIn" && c.user ? <Account eng={eng} c={c} data={data} /> : <SignIn eng={eng} notice={c.notice} />;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function useSettings(eng: Engine) {
  const [s, setS] = useState<AuthSettings | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let dead = false;
    eng
      .authSettings()
      .then((x) => !dead && setS(x))
      .catch(() => !dead && setErr(true));
    return () => {
      dead = true;
    };
  }, [eng]);
  return { s, err };
}

/** Run an engine call with busy state and a readable error. */
function useAction(eng: Engine) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<unknown>, done?: string) => {
    setBusy(key);
    setError(null);
    setInfo(null);
    try {
      await fn();
      if (done) setInfo(done);
      return true;
    } catch (e) {
      setError(eng.message(e));
      return false;
    } finally {
      setBusy(null);
    }
  };
  return { busy, error, info, setError, setInfo, run };
}

function Feedback({ error, info }: { error: string | null; info: string | null }) {
  return (
    <>
      {error ? (
        <p className="auth-msg err" role="alert">
          <TriangleAlert size={16} aria-hidden="true" /> {error}
        </p>
      ) : null}
      {info ? (
        <p className="auth-msg ok" role="status">
          {info}
        </p>
      ) : null}
    </>
  );
}

/** One field for a 6 to 10 digit code, filled by the phone's code suggestion where available. */
export function CodeInput({ id, value, onChange, label = "Code" }: { id: string; value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <label className="field">
      <span className="fl">{label}</span>
      <input
        id={id}
        className="code-input"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={10}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        required
      />
    </label>
  );
}

function strength(pw: string): { score: number; label: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const score = Math.min(4, pw.length < 8 ? 0 : s - 1);
  return { score, label: ["zu kurz", "schwach", "okay", "gut", "stark"][score] };
}

function PasswordField({ id, value, onChange, autoComplete, meter }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; meter?: boolean }) {
  const [show, setShow] = useState(false);
  const st = strength(value);
  return (
    <div className="field">
      <label className="fl" htmlFor={id}>
        Passwort
      </label>
      <div className="pw-row">
        <input id={id} type={show ? "text" : "password"} autoComplete={autoComplete} minLength={8} value={value} onChange={(e) => onChange(e.target.value)} required />
        <button type="button" className="btn small ghost" aria-pressed={show} onClick={() => setShow(!show)}>
          {show ? "Verbergen" : "Zeigen"}
        </button>
      </div>
      {meter && value ? (
        <p className={`pw-meter s${st.score}`}>
          <i aria-hidden="true">
            <em style={{ width: `${(st.score / 4) * 100}%` }} />
          </i>
          <span>Passwort: {st.label}</span>
        </p>
      ) : null}
    </div>
  );
}

const shortDay = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" }) : "");

function ago(ms: number | null) {
  if (!ms) return "noch nie";
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 45) return "gerade eben";
  const m = Math.round(s / 60);
  if (m < 60) return `vor ${m} ${m === 1 ? "Minute" : "Minuten"}`;
  const h = Math.round(m / 60);
  if (h < 24) return `vor ${h} ${h === 1 ? "Stunde" : "Stunden"}`;
  return `am ${new Date(ms).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}`;
}

// ── Sign in ───────────────────────────────────────────────────────────────

type Step = "start" | "code" | "password" | "forgot" | "recoveryCode" | "confirm" | "phone" | "phoneCode";

function SignIn({ eng, notice }: { eng: Engine; notice: string | null }) {
  const { s, err } = useSettings(eng);
  const a = useAction(eng);
  const cap = useCaptcha();
  const [step, setStep] = useState<Step>("start");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [phone, setPhone] = useState("+49 ");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const passkeys = !!s?.passkeys && eng.passkeySupported();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const to = (x: Step) => {
    a.setError(null);
    a.setInfo(null);
    setCode("");
    setStep(x);
  };
  const needCaptcha = cap.enabled && !cap.token;
  const withCaptcha = async <T,>(fn: (t?: string) => Promise<T>): Promise<T> => {
    try {
      return await fn(cap.token);
    } finally {
      cap.reset();
    }
  };

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    const ok = await a.run("code", () => withCaptcha((t) => eng.emailCode(email.trim(), t)));
    if (ok) {
      setCooldown(60);
      to("code");
    }
  };
  const phoneNorm = phone.replace(/[^\d+]/g, "");

  let body: ReactNode;
  if (step === "code" || step === "confirm" || step === "recoveryCode") {
    const type = step === "recoveryCode" ? "recovery" : "email";
    body = (
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          await a.run("verify", () => eng.verifyCode({ email: email.trim() }, code, type));
        }}
      >
        <h2 className="h3">{step === "recoveryCode" ? "Passwort zurücksetzen" : step === "confirm" ? "E-Mail bestätigen" : "Code eingeben"}</h2>
        <p className="small">
          Wir haben eine E-Mail an <b>{email.trim()}</b> geschickt. Gib den Code ein, oder tippe in der E-Mail auf den Link. Der Link funktioniert nur in diesem Browser, der Code
          überall.
        </p>
        <CodeInput id="arc-auth-code" value={code} onChange={setCode} />
        <button type="submit" className="btn primary" disabled={code.length < 6 || !!a.busy}>
          <span>{a.busy === "verify" ? "Wird geprüft" : "Bestätigen"}</span>
        </button>
        <div className="row wrap">
          {step === "code" ? (
            <button type="button" className="linkish" disabled={cooldown > 0 || !!a.busy} onClick={() => void sendCode()}>
              {cooldown > 0 ? `Neuen Code in ${cooldown} s` : "Neuen Code schicken"}
            </button>
          ) : null}
          <button type="button" className="linkish" onClick={() => to("start")}>
            Andere E-Mail
          </button>
        </div>
      </form>
    );
  } else if (step === "password") {
    body = (
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (mode === "in") await a.run("pw", () => withCaptcha((t) => eng.passwordSignIn(email.trim(), password, t)));
          else {
            const res: { r: "signedIn" | "confirm" } = { r: "signedIn" };
            const ok = await a.run("pw", async () => {
              res.r = await withCaptcha((t) => eng.passwordSignUp(email.trim(), password, t));
            });
            if (ok && res.r === "confirm") to("confirm");
          }
        }}
      >
        <h2 className="h3">Mit Passwort</h2>
        <Seg
          label="Anmelden oder neues Konto"
          value={mode}
          onChange={(v) => setMode(v)}
          options={[
            { v: "in", label: "Anmelden" },
            { v: "up", label: "Neues Konto" },
          ]}
        />
        <label className="field">
          <span className="fl">E-Mail</span>
          <input id="arc-auth-email-pw" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <PasswordField id="arc-auth-pw" value={password} onChange={setPassword} autoComplete={mode === "in" ? "current-password" : "new-password"} meter={mode === "up"} />
        {cap.node}
        <button type="submit" className="btn primary" disabled={!!a.busy || needCaptcha || password.length < (mode === "up" ? 8 : 1)}>
          <span>{a.busy === "pw" ? "Einen Moment" : mode === "in" ? "Anmelden" : "Konto anlegen"}</span>
        </button>
        <div className="row wrap">
          <button type="button" className="linkish" onClick={() => to("forgot")}>
            Passwort vergessen
          </button>
          <button type="button" className="linkish" onClick={() => to("start")}>
            Andere Wege
          </button>
        </div>
      </form>
    );
  } else if (step === "forgot") {
    body = (
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await a.run("forgot", () => withCaptcha((t) => eng.resetPassword(email.trim(), t)));
          if (ok) to("recoveryCode");
        }}
      >
        <h2 className="h3">Passwort vergessen</h2>
        <p className="small">Wir schicken dir einen Code, mit dem du ein neues Passwort setzt.</p>
        <label className="field">
          <span className="fl">E-Mail</span>
          <input id="arc-auth-email-reset" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {cap.node}
        <button type="submit" className="btn primary" disabled={!!a.busy || needCaptcha}>
          <span>Code schicken</span>
        </button>
        <button type="button" className="linkish" onClick={() => to("password")}>
          Zurück
        </button>
      </form>
    );
  } else if (step === "phone" || step === "phoneCode") {
    body = (
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (step === "phone") {
            const ok = await a.run("sms", () => withCaptcha((t) => eng.phoneCode(phoneNorm, t)));
            if (ok) {
              setCooldown(60);
              to("phoneCode");
            }
          } else await a.run("verify", () => eng.verifyCode({ phone: phoneNorm }, code, "sms"));
        }}
      >
        <h2 className="h3">Mit Handynummer</h2>
        {step === "phone" ? (
          <>
            <label className="field">
              <span className="fl">Nummer mit Ländervorwahl</span>
              <input id="arc-auth-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
            {cap.node}
            <button type="submit" className="btn primary" disabled={!!a.busy || needCaptcha || phoneNorm.length < 8}>
              <span>Code per SMS</span>
            </button>
          </>
        ) : (
          <>
            <p className="small">
              Code an <b>{phoneNorm}</b> geschickt.
            </p>
            <CodeInput id="arc-auth-sms" value={code} onChange={setCode} />
            <button type="submit" className="btn primary" disabled={code.length < 6 || !!a.busy}>
              <span>Bestätigen</span>
            </button>
          </>
        )}
        <button type="button" className="linkish" onClick={() => to("start")}>
          Andere Wege
        </button>
      </form>
    );
  } else {
    body = (
      <div className="auth-start">
        {passkeys ? (
          <div className="auth-block">
            <button type="button" className="btn primary big wide" disabled={!!a.busy} onClick={() => void a.run("passkey", () => eng.passkeySignIn())}>
              <Fingerprint size={20} aria-hidden="true" />
              <span>Mit Passkey anmelden</span>
            </button>
            <p className="small muted">Face ID, Fingerabdruck oder Sicherheitsschlüssel. Einen Passkey fügst du nach der ersten Anmeldung im Konto hinzu.</p>
          </div>
        ) : null}
        {s?.providers.length ? (
          <div className="provider-grid" role="group" aria-label="Anmelden mit">
            {s.providers.map((p) => (
              <button key={p} type="button" className={`btn provider p-${p}`} disabled={!!a.busy} onClick={() => void a.run(p, () => eng.withProvider(p))}>
                <ProviderIcon provider={p} />
                <span>Weiter mit {providerName(p)}</span>
              </button>
            ))}
          </div>
        ) : null}
        {s?.email !== false ? (
          <form className="auth-form" onSubmit={sendCode}>
            {s?.providers.length || passkeys ? <p className="or-rule">oder mit E-Mail</p> : null}
            <label className="field">
              <span className="fl">E-Mail</span>
              <input id="arc-auth-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            {cap.node}
            <button type="submit" className="btn primary" disabled={!!a.busy || needCaptcha || !/.+@.+\..+/.test(email.trim())}>
              <Mail size={16} aria-hidden="true" />
              <span>{a.busy === "code" ? "Wird geschickt" : "Code schicken"}</span>
            </button>
            <p className="small muted">Ohne Passwort: Du bekommst einen Code per E-Mail. Neu hier? Dann legen wir dabei dein Konto an.</p>
            <div className="row wrap">
              <button type="button" className="linkish" onClick={() => to("password")}>
                Lieber mit Passwort
              </button>
              {s?.phone ? (
                <button type="button" className="linkish" onClick={() => to("phone")}>
                  <Phone size={14} aria-hidden="true" /> Mit Handynummer
                </button>
              ) : null}
            </div>
          </form>
        ) : null}
        {s?.anonymous ? (
          <div className="auth-block guest">
            <button type="button" className="btn ghost" disabled={!!a.busy || needCaptcha} onClick={() => void a.run("guest", () => withCaptcha((t) => eng.guest(t)))}>
              <UserRound size={16} aria-hidden="true" />
              <span>Als Gast sichern</span>
            </button>
            <p className="small muted">Sichert sofort, ohne E-Mail. Verbinde später E-Mail oder Google, sonst ist das Gastkonto weg, wenn du dich abmeldest.</p>
          </div>
        ) : null}
        {err ? <p className="auth-msg err">Die Anmeldewege konnten nicht geladen werden. Bist du offline?</p> : null}
      </div>
    );
  }

  return (
    <div className="page konto">
      <SecTitle kanji="鍵" eyebrow="Konto" title="Sichere deinen Fortschritt">
        Ohne Konto bleibt alles in diesem Browser. Mit Konto ist dein Fortschritt gesichert und auf jedem Gerät derselbe, auch wenn du offline loggst.
      </SecTitle>
      <div className="konto-grid">
        <HeroKoma label="Anmelden" className="auth-koma">
          {notice ? <p className="auth-msg err">{notice}</p> : null}
          {body}
          <Feedback error={a.error} info={a.info} />
        </HeroKoma>
        <aside className="panel auth-why">
          <h2 className="h3">Was ein Konto bringt</h2>
          <ul>
            <li>
              <Cloud size={18} aria-hidden="true" /> Dein Fortschritt ist gesichert, auch wenn der Browser aufräumt.
            </li>
            <li>
              <Smartphone size={18} aria-hidden="true" /> Handy und Laptop zeigen denselben Stand.
            </li>
            <li>
              <CloudOff size={18} aria-hidden="true" /> Im Gym-Keller ohne Netz loggen, gesichert wird später.
            </li>
            <li>
              <ShieldCheck size={18} aria-hidden="true" /> Gespeichert in der EU (Frankfurt). Export und Löschen jederzeit, auf Wunsch mit zweitem Faktor.
            </li>
          </ul>
          <p className="small muted">
            Gespeichert werden deine Anmeldedaten (E-Mail, Nummer oder der verbundene Dienst) und deine Waza-Arc-Daten, sonst nichts. Mehr in der{" "}
            <a href="/datenschutz">Datenschutzerklärung</a>.
          </p>
        </aside>
      </div>
    </div>
  );
}

// ── Signed in ─────────────────────────────────────────────────────────────

function SyncLine({ c }: { c: CloudState }) {
  const { phase, last, pending, error } = c.sync;
  const icon =
    phase === "syncing" ? <RefreshCw size={18} aria-hidden="true" /> : phase === "offline" ? <CloudOff size={18} aria-hidden="true" /> : phase === "error" ? <TriangleAlert size={18} aria-hidden="true" /> : <Cloud size={18} aria-hidden="true" />;
  const text =
    phase === "syncing"
      ? "Wird gesichert"
      : phase === "offline"
        ? `Offline. ${pending ? `${pending} Änderungen warten` : "Nichts verloren"}, gesichert wird, sobald Netz da ist.`
        : phase === "error"
          ? `Sichern hat nicht geklappt: ${error ?? "unbekannter Fehler"}`
          : phase === "paused"
            ? c.choice
              ? "Wartet auf deine Entscheidung"
              : "Pausiert, solange das Demo-Dōjō läuft"
            : pending
              ? `${pending} Änderungen warten`
              : `Gesichert ${ago(last)}`;
  return (
    <p className={`sync-line ${phase}`} role="status">
      {icon} <span>{text}</span>
    </p>
  );
}

function Account({ eng, c, data }: { eng: Engine; c: CloudState; data: ArcData }) {
  const { s } = useSettings(eng);
  const u = c.user!;
  const a = useAction(eng);
  const [wipe, setWipe] = useState(true);
  const [confirmDel, setConfirmDel] = useState("");
  const [showDel, setShowDel] = useState(false);
  const title = data.profile?.name ?? u.email ?? (u.anonymous ? "Gastkonto" : "Dein Konto");
  const idLine = u.anonymous ? "Gastkonto ohne E-Mail" : [u.email, u.phone].filter(Boolean).join(", ") || "Konto";
  const others = (s?.providers ?? []).filter((p) => !u.providers.includes(p));

  return (
    <div className="page konto">
      <SecTitle kanji="鍵" eyebrow="Konto" title="Dein Konto" />
      <HeroKoma label="Kontoausweis" className="id-koma">
        <div className="id-card">
          <div className="id-main">
            <p className="id-name">{title}</p>
            <p className="id-sub">{idLine}</p>
            <ul className="id-badges" aria-label="Anmeldewege">
              {u.providers.map((p) => (
                <li key={p}>
                  <ProviderIcon provider={p} size={16} /> {providerName(p)}
                </li>
              ))}
            </ul>
            {u.createdAt ? <p className="small muted">Dabei seit {shortDay(u.createdAt)}</p> : null}
          </div>
          <div className="id-sync">
            <SyncLine c={c} />
            <button type="button" className="btn small" disabled={c.sync.phase === "syncing"} onClick={() => eng.syncNow()}>
              <RefreshCw size={14} aria-hidden="true" /> <span>Jetzt sichern</span>
            </button>
          </div>
        </div>
        {!data.profile && !c.choice ? (
          <div className="id-empty">
            <p>In diesem Konto gibt es noch keinen Charakter.</p>
            <button type="button" className="btn primary" onClick={() => go("heute")}>
              <span>Charakter erstellen</span>
            </button>
          </div>
        ) : null}
      </HeroKoma>
      <Feedback error={a.error} info={a.info} />

      {u.anonymous ? <GuestUpgrade eng={eng} providers={s?.providers ?? []} /> : null}

      <div className="konto-cols">
        {!u.anonymous ? (
          <section className="panel form-panel">
            <h2 className="h3">Anmeldewege</h2>
            <ul className="identity-list">
              {u.providers.map((p) => (
                <li key={p}>
                  <ProviderIcon provider={p} /> <span>{p === "email" ? u.email ?? "E-Mail" : p === "phone" ? u.phone ?? "Telefon" : providerName(p)}</span>
                  {u.providers.length > 1 && p !== "email" && p !== "phone" ? (
                    <button type="button" className="btn small ghost" disabled={!!a.busy} onClick={() => void a.run(`un-${p}`, () => eng.unlinkProvider(p), `${providerName(p)} getrennt.`)}>
                      Trennen
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            {others.length ? (
              <div className="provider-grid small">
                {others.map((p) => (
                  <button key={p} type="button" className={`btn provider p-${p}`} disabled={!!a.busy} onClick={() => void a.run(`link-${p}`, () => eng.linkProvider(p))}>
                    <ProviderIcon provider={p} />
                    <span>{providerName(p)} verbinden</span>
                  </button>
                ))}
              </div>
            ) : null}
            <EmailChange eng={eng} current={u.email} />
          </section>
        ) : null}

        {!u.anonymous && s?.passkeys && eng.passkeySupported() ? <Passkeys eng={eng} /> : null}
        {!u.anonymous ? <TwoFactor eng={eng} /> : null}
        {!u.anonymous && u.email ? <PasswordSet eng={eng} hasPassword={u.providers.includes("email")} /> : null}

        <section className="panel form-panel">
          <h2 className="h3">Abmelden</h2>
          <label className="check">
            <input type="checkbox" checked={wipe} onChange={(e) => setWipe(e.target.checked)} />
            <span>Kopie auf diesem Gerät entfernen</span>
          </label>
          {wipe && c.sync.pending ? <p className="small warn">Achtung: {c.sync.pending} Änderungen sind noch nicht gesichert und gehen mit der Kopie verloren.</p> : null}
          <p className="small muted">Auf einem geteilten Gerät: Kopie entfernen. Deine Daten bleiben im Konto.</p>
          <div className="row wrap">
            <button type="button" className="btn" disabled={!!a.busy} onClick={async () => (await a.run("out", () => eng.signOut({ wipe }))) && go("heute")}>
              <LogOut size={16} aria-hidden="true" /> <span>Abmelden</span>
            </button>
            <button type="button" className="btn ghost" disabled={!!a.busy} onClick={async () => (await a.run("out-all", () => eng.signOut({ wipe, everywhere: true }))) && go("heute")}>
              <span>Auf allen Geräten abmelden</span>
            </button>
          </div>
        </section>

        <section className="panel form-panel danger-panel">
          <h2 className="h3">Konto löschen</h2>
          <p className="small">
            Löscht dein Konto und alle Waza-Arc-Daten auf dem Server und auf diesem Gerät. Das lässt sich nicht rückgängig machen. Vorher sichern?{" "}
            <button type="button" className="linkish" onClick={() => exportJson(data)}>
              Daten exportieren
            </button>
          </p>
          {showDel ? (
            <form
              className="auth-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await a.run("delete", () => eng.deleteAccount())) go("heute");
              }}
            >
              <label className="field">
                <span className="fl">Zur Bestätigung „löschen“ eintippen</span>
                <input id="arc-delete-confirm" value={confirmDel} onChange={(e) => setConfirmDel(e.target.value)} autoComplete="off" />
              </label>
              <div className="row wrap">
                <button type="button" className="btn ghost" onClick={() => setShowDel(false)}>
                  Abbrechen
                </button>
                <button type="submit" className="btn danger-btn" disabled={confirmDel.trim().toLowerCase() !== "löschen" || !!a.busy}>
                  <Trash2 size={16} aria-hidden="true" /> <span>Konto endgültig löschen</span>
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="btn ghost" onClick={() => setShowDel(true)}>
              <Trash2 size={16} aria-hidden="true" /> <span>Konto löschen</span>
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

function GuestUpgrade({ eng, providers }: { eng: Engine; providers: string[] }) {
  return (
    <section className="panel guest-up">
      <h2 className="h3">Gastkonto sichern</h2>
      <p className="small">Verbinde E-Mail oder einen Dienst. Sonst ist dein Fortschritt weg, sobald du dich abmeldest oder den Browser leerst.</p>
      {providers.length ? (
        <div className="provider-grid small">
          {providers.map((p) => (
            <button key={p} type="button" className={`btn provider p-${p}`} onClick={() => void eng.linkProvider(p).catch(() => undefined)}>
              <ProviderIcon provider={p} />
              <span>{providerName(p)} verbinden</span>
            </button>
          ))}
        </div>
      ) : null}
      <EmailChange eng={eng} current={null} guest />
    </section>
  );
}

function EmailChange({ eng, current, guest }: { eng: Engine; current: string | null; guest?: boolean }) {
  const a = useAction(eng);
  const [open, setOpen] = useState(!!guest);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  if (!open) {
    return (
      <button type="button" className="linkish" onClick={() => setOpen(true)}>
        <Pencil size={14} aria-hidden="true" /> {current ? "E-Mail ändern" : "E-Mail hinzufügen"}
      </button>
    );
  }
  return (
    <form
      className="auth-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!sent) {
          const ok = await a.run("mail", () => eng.changeEmail(email.trim()));
          if (ok) setSent(true);
        } else {
          const ok = await a.run("mail-code", () => eng.verifyCode({ email: email.trim() }, code, "email_change"), "E-Mail bestätigt.");
          if (ok) {
            setSent(false);
            setOpen(!!guest);
            setCode("");
          }
        }
      }}
    >
      {!sent ? (
        <label className="field">
          <span className="fl">{current ? "Neue E-Mail" : "E-Mail"}</span>
          <input id={guest ? "arc-guest-email" : "arc-change-email"} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
      ) : (
        <>
          <p className="small">
            Code an <b>{email.trim()}</b> geschickt{current ? ". Je nach Einstellung kommt auch an die alte Adresse eine Bestätigung" : ""}.
          </p>
          <CodeInput id="arc-email-code" value={code} onChange={setCode} />
        </>
      )}
      <div className="row wrap">
        <button type="submit" className="btn primary small" disabled={!!a.busy || (sent ? code.length < 6 : !/.+@.+\..+/.test(email.trim()))}>
          <span>{sent ? "Bestätigen" : "Code schicken"}</span>
        </button>
        {!guest ? (
          <button type="button" className="linkish" onClick={() => setOpen(false)}>
            Abbrechen
          </button>
        ) : null}
      </div>
      <Feedback error={a.error} info={a.info} />
    </form>
  );
}

function Passkeys({ eng }: { eng: Engine }) {
  const a = useAction(eng);
  const [list, setList] = useState<{ id: string; friendly_name?: string; created_at: string; last_used_at?: string }[] | null>(null);
  const [edit, setEdit] = useState<{ id: string; name: string } | null>(null);
  const load = () =>
    eng
      .listPasskeys()
      .then(setList)
      .catch((e) => a.setError(eng.message(e)));
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <section className="panel form-panel">
      <h2 className="h3">Passkeys</h2>
      <p className="small muted">Anmelden mit Face ID, Fingerabdruck oder Sicherheitsschlüssel, ohne Passwort und ohne Code.</p>
      {list?.length ? (
        <ul className="identity-list">
          {list.map((p) =>
            edit?.id === p.id ? (
              <li key={p.id}>
                <form
                  className="row wrap"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (await a.run("rename", () => eng.renamePasskey(p.id, edit.name))) {
                      setEdit(null);
                      void load();
                    }
                  }}
                >
                  <label className="sr-only" htmlFor={`pk-${p.id}`}>
                    Name des Passkeys
                  </label>
                  <input id={`pk-${p.id}`} value={edit.name} maxLength={120} onChange={(e) => setEdit({ id: p.id, name: e.target.value })} />
                  <button type="submit" className="btn small">
                    Speichern
                  </button>
                </form>
              </li>
            ) : (
              <li key={p.id}>
                <KeyRound size={18} aria-hidden="true" />
                <span>
                  {p.friendly_name || "Passkey"}
                  <small className="muted"> seit {shortDay(p.created_at)}{p.last_used_at ? `, zuletzt ${shortDay(p.last_used_at)}` : ""}</small>
                </span>
                <button type="button" className="btn small ghost" onClick={() => setEdit({ id: p.id, name: p.friendly_name ?? "" })}>
                  Umbenennen
                </button>
                <button
                  type="button"
                  className="btn small ghost"
                  onClick={async () => {
                    if (await a.run("pk-del", () => eng.removePasskey(p.id), "Passkey entfernt.")) void load();
                  }}
                >
                  Entfernen
                </button>
              </li>
            ),
          )}
        </ul>
      ) : list ? (
        <p className="small">Noch kein Passkey.</p>
      ) : null}
      <button
        type="button"
        className="btn"
        disabled={!!a.busy}
        onClick={async () => {
          if (await a.run("pk-add", () => eng.addPasskey(), "Passkey hinzugefügt.")) void load();
        }}
      >
        <Fingerprint size={16} aria-hidden="true" /> <span>Passkey hinzufügen</span>
      </button>
      <Feedback error={a.error} info={a.info} />
    </section>
  );
}

function TwoFactor({ eng }: { eng: Engine }) {
  const a = useAction(eng);
  const [factors, setFactors] = useState<{ id: string; status: string; friendly_name?: string }[] | null>(null);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const load = () =>
    eng
      .totpFactors()
      .then(setFactors)
      .catch((e) => a.setError(eng.message(e)));
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const active = factors?.find((f) => f.status === "verified");
  const qrSrc = useMemo(() => (enroll ? (enroll.qr.startsWith("data:") ? enroll.qr : `data:image/svg+xml;utf8,${encodeURIComponent(enroll.qr)}`) : ""), [enroll]);
  return (
    <section className="panel form-panel">
      <h2 className="h3">Zweiter Faktor</h2>
      {active ? (
        <>
          <p className="small">
            <ShieldCheck size={16} aria-hidden="true" /> Authenticator-App ist aktiv. Nach dem Anmelden fragen wir nach ihrem Code.
          </p>
          <button
            type="button"
            className="btn ghost"
            disabled={!!a.busy}
            onClick={async () => {
              if (await a.run("mfa-off", () => eng.removeFactor(active.id), "Zweiter Faktor ausgeschaltet.")) void load();
            }}
          >
            Ausschalten
          </button>
        </>
      ) : enroll ? (
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await a.run("mfa-on", () => eng.confirmTotp(enroll.id, code), "Zweiter Faktor ist eingerichtet.")) {
              setEnroll(null);
              setCode("");
              void load();
            }
          }}
        >
          <p className="small">Scanne den Code mit einer Authenticator-App (zum Beispiel 1Password, Google Authenticator, Aegis) und gib dann den angezeigten Code ein.</p>
          <img className="qr" src={qrSrc} alt="QR-Code für die Authenticator-App" width={180} height={180} />
          <p className="small">
            Oder von Hand: <code className="secret">{enroll.secret}</code>
          </p>
          <CodeInput id="arc-totp-code" value={code} onChange={setCode} label="Code aus der App" />
          <button type="submit" className="btn primary" disabled={code.length < 6 || !!a.busy}>
            <span>Einschalten</span>
          </button>
        </form>
      ) : (
        <>
          <p className="small muted">Schützt dein Konto zusätzlich mit einem Code aus einer Authenticator-App.</p>
          <button
            type="button"
            className="btn"
            disabled={!!a.busy}
            onClick={async () => {
              await a.run("mfa-new", async () => setEnroll(await eng.enrollTotp()));
            }}
          >
            <ShieldCheck size={16} aria-hidden="true" /> <span>Einrichten</span>
          </button>
        </>
      )}
      <Feedback error={a.error} info={a.info} />
    </section>
  );
}

function PasswordSet({ eng, hasPassword }: { eng: Engine; hasPassword: boolean }) {
  const a = useAction(eng);
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  return (
    <section className="panel form-panel">
      <h2 className="h3">Passwort</h2>
      {open ? (
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await a.run("pw", () => eng.setPassword(pw), "Passwort gespeichert.")) {
              setOpen(false);
              setPw("");
            }
          }}
        >
          <PasswordField id="arc-new-pw" value={pw} onChange={setPw} autoComplete="new-password" meter />
          <div className="row wrap">
            <button type="submit" className="btn primary small" disabled={pw.length < 8 || !!a.busy}>
              <span>Speichern</span>
            </button>
            <button type="button" className="linkish" onClick={() => setOpen(false)}>
              Abbrechen
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="small muted">{hasPassword ? "Du kannst dich auch ohne Passwort per Code anmelden." : "Optional: ein Passwort zusätzlich zu Code und verbundenen Diensten."}</p>
          <button type="button" className="btn ghost" onClick={() => setOpen(true)}>
            <span>{hasPassword ? "Passwort ändern" : "Passwort festlegen"}</span>
          </button>
        </>
      )}
      <Feedback error={a.error} info={a.info} />
    </section>
  );
}
