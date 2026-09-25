// Dialogs the account can need on any screen: two saves found at the first
// sign-in, the second factor after signing in, and a new password after a
// reset link. Plus the small sync badge in the header.

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Cloud, CloudOff, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { loadCloud, useCloud } from "../cloud/state.ts";
import type { SaveSummary } from "../cloud/state.ts";
import { go } from "../store.ts";
import { CodeInput } from "../pages/Konto.tsx";

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose?: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const first = box.current?.querySelector<HTMLElement>("input, button");
    first?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
      if (e.key !== "Tab" || !box.current) return;
      const els = [...box.current.querySelectorAll<HTMLElement>("input, button, a[href]")].filter((x) => !x.hasAttribute("disabled"));
      if (!els.length) return;
      const i = els.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        els[els.length - 1].focus();
      } else if (!e.shiftKey && i === els.length - 1) {
        e.preventDefault();
        els[0].focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      before?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="dialog-back">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="arc-dialog-title" ref={box}>
        <h2 id="arc-dialog-title" className="h3">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

const day = (iso: string | null) => (iso ? new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" }) : "nichts eingetragen");

function SaveCard({ label, s }: { label: string; s: SaveSummary }) {
  return (
    <div className="save-card">
      <p className="save-k">{label}</p>
      <p className="save-name">{s.name ?? "Ohne Charakter"}</p>
      <p className="small">
        {s.sessions} Trainings, zuletzt {day(s.last)}
      </p>
    </div>
  );
}

export function CloudDialogs() {
  const c = useCloud();
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (c.status !== "signedIn") return null;

  const act = async (fn: (m: Awaited<ReturnType<typeof loadCloud>>) => Promise<unknown> | void) => {
    setBusy(true);
    setErr(null);
    try {
      const m = await loadCloud();
      await fn(m);
    } catch (e) {
      const m = await loadCloud().catch(() => null);
      setErr(m ? m.message(e) : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (c.choice) {
    return (
      <Dialog title="Zwei Speicherstände gefunden">
        <p className="small">Auf diesem Gerät und in deinem Konto liegen Daten. Wie soll es weitergehen?</p>
        <div className="save-pair">
          <SaveCard label="Auf diesem Gerät" s={c.choice.device} />
          <SaveCard label="Im Konto" s={c.choice.account} />
        </div>
        <div className="choice-list">
          <button type="button" className="btn primary" disabled={busy} onClick={() => void act((m) => m.resolveChoice("merge"))}>
            <span>Zusammenführen</span>
          </button>
          <p className="small muted">Trainings, Turniere und Nebensport von beiden. Profil und Charakter aus dem Konto.</p>
          <button type="button" className="btn" disabled={busy} onClick={() => void act((m) => m.resolveChoice("account"))}>
            <span>Nur den Stand aus dem Konto</span>
          </button>
          <p className="small muted">Die Daten auf diesem Gerät bleiben im Gerät-Speicher liegen und tauchen nach dem Abmelden wieder auf.</p>
          <button type="button" className="btn ghost" disabled={busy} onClick={() => void act((m) => m.resolveChoice("device"))}>
            <span>Nur den Stand von diesem Gerät</span>
          </button>
          <p className="small muted">Ersetzt den Stand im Konto. Die Trainings, die nur im Konto liegen, werden gelöscht.</p>
        </div>
        {err ? <p className="auth-msg err">{err}</p> : null}
      </Dialog>
    );
  }

  if (c.mfa) {
    return (
      <Dialog title="Zweiter Faktor">
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            void act((m) => m.mfaVerify(code));
          }}
        >
          <p className="small">
            <ShieldCheck size={16} aria-hidden="true" /> Gib den Code aus deiner Authenticator-App ein.
          </p>
          <CodeInput id="arc-mfa-code" value={code} onChange={setCode} />
          <button type="submit" className="btn primary" disabled={busy || code.length < 6}>
            <span>Bestätigen</span>
          </button>
          <button type="button" className="linkish" disabled={busy} onClick={() => void act((m) => m.signOut())}>
            Abmelden
          </button>
          {err ? <p className="auth-msg err">{err}</p> : null}
        </form>
      </Dialog>
    );
  }

  if (c.recovery) {
    return (
      <Dialog title="Neues Passwort">
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            void act((m) => m.setPassword(pw));
          }}
        >
          <label className="field">
            <span className="fl">Neues Passwort, mindestens 8 Zeichen</span>
            <input id="arc-recovery-pw" type="password" autoComplete="new-password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} required />
          </label>
          <button type="submit" className="btn primary" disabled={busy || pw.length < 8}>
            <span>Speichern</span>
          </button>
          {err ? <p className="auth-msg err">{err}</p> : null}
        </form>
      </Dialog>
    );
  }
  return null;
}

/** Header badge: account and sync state, opens the account page. */
export function CloudBadge() {
  const c = useCloud();
  if (c.status !== "signedIn") return null;
  const { phase, pending } = c.sync;
  const icon =
    phase === "syncing" ? <RefreshCw size={18} /> : phase === "offline" ? <CloudOff size={18} /> : phase === "error" || c.mfa ? <TriangleAlert size={18} /> : <Cloud size={18} />;
  const label =
    c.mfa
      ? "Konto: zweiter Faktor fehlt"
      : phase === "syncing"
        ? "Konto: wird gesichert"
        : phase === "offline"
          ? "Konto: offline, wird später gesichert"
          : phase === "error"
            ? "Konto: Sichern hat nicht geklappt"
            : pending
              ? `Konto: ${pending} Änderungen warten`
              : "Konto: gesichert";
  return (
    <button type="button" className={`hud-cloud ${c.mfa ? "error" : phase}`} onClick={() => go("konto")} aria-label={label} title={label}>
      {icon}
    </button>
  );
}
