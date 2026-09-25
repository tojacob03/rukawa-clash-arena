// The weekly plan: when you train, what, where, and how Waza Arc reminds
// you before each training (push, e-mail or your own calendar).

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Bell, BellOff, CalendarPlus, Mail, Pencil, Plus, Send, Smartphone, Trash2 } from "lucide-react";
import type { ArcData, SportId } from "../core/types.ts";
import { DAY_NAMES, DAY_SHORT, LEADS, fmtHm, parseHm, toIcs } from "../core/schedule.ts";
import type { PlanSlot, TrainingPlan, Weekday } from "../core/schedule.ts";
import { SPORTS } from "../core/sports.ts";
import { setPlan } from "../actions.ts";
import { downloadIcs, getPlan, localTz, slotLabel, sportName } from "../plan.ts";
import { afterSignIn, loadCloud, useCloud } from "../cloud/state.ts";
import type { ReminderConfig } from "../cloud/engine.ts";
import { disablePush, enablePush, pushState, useInstallPrompt } from "../push.ts";
import type { PushState } from "../push.ts";
import { go } from "../store.ts";
import { SecTitle, Seg } from "../components/ui.tsx";

interface Draft {
  id?: string;
  days: Weekday[];
  start: string;
  minutes: number;
  sport: string;
  attire: "gi" | "nogi" | "beides";
  title: string;
  place: string;
  remind: boolean;
}

const DURATIONS = [45, 60, 75, 90, 120];
const newId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const blank = (): Draft => ({ days: [], start: "19:00", minutes: 90, sport: "bjj", attire: "gi", title: "", place: "", remind: true });
const fromSlot = (s: PlanSlot): Draft => ({ id: s.id, days: [s.day], start: s.start, minutes: s.minutes, sport: s.sport, attire: s.attire ?? "beides", title: s.title ?? "", place: s.place ?? "", remind: s.remind });

function range(s: PlanSlot) {
  const a = parseHm(s.start) ?? 0;
  return `${fmtHm(a)} bis ${fmtHm(a + s.minutes)}`;
}

export default function Plan({ data }: { data: ArcData }) {
  const plan = getPlan(data);
  const [draft, setDraft] = useState<Draft | null>(null);
  const save = (p: TrainingPlan) => setPlan({ ...p, tz: localTz() });
  const byDay = DAY_NAMES.map((_, d) => plan.slots.filter((s) => s.day === d).sort((a, b) => a.start.localeCompare(b.start)));

  return (
    <div className="page plan-page">
      <SecTitle kanji="週" eyebrow="Wochenplan" title="Wann trainierst du?">
        Trag ein, wann du normalerweise trainierst, auch Judo, Ringen oder Kraft. Vor jedem Training erinnert dich Waza Arc an deine Quest, und dein Kalender kennt die Zeiten auch.
      </SecTitle>

      <section className="week" aria-label="Deine Woche">
        {byDay.map((slots, d) => (
          <div key={d} className={`week-day${slots.length ? "" : " free"}`}>
            <h3>
              <span className="wd-short" aria-hidden="true">
                {DAY_SHORT[d]}
              </span>
              <span className="wd-long">{DAY_NAMES[d]}</span>
            </h3>
            {slots.length ? (
              <ul>
                {slots.map((s) => (
                  <li key={s.id} className={`slot${s.sport === "bjj" ? " bjj" : ""}`}>
                    <p className="slot-time">{range(s)}</p>
                    <p className="slot-name">
                      {s.label}
                      {s.remind ? <Bell size={14} aria-label="mit Erinnerung" /> : null}
                    </p>
                    {s.place ? <p className="slot-place">{s.place}</p> : null}
                    <div className="slot-acts">
                      <button type="button" className="icon-btn" aria-label={`${s.label} am ${DAY_NAMES[d]} bearbeiten`} onClick={() => setDraft(fromSlot(s))}>
                        <Pencil size={16} />
                      </button>
                      <button type="button" className="icon-btn" aria-label={`${s.label} am ${DAY_NAMES[d]} löschen`} onClick={() => save({ ...plan, slots: plan.slots.filter((x) => x.id !== s.id) })}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">frei</p>
            )}
          </div>
        ))}
      </section>

      {draft ? (
        <SlotForm
          draft={draft}
          sports={data.profile?.sports?.map((s) => s.id) ?? []}
          onCancel={() => setDraft(null)}
          onSave={(d) => {
            const base: Omit<PlanSlot, "id" | "day"> = {
              start: d.start,
              minutes: d.minutes,
              sport: d.sport,
              attire: d.sport === "bjj" && d.attire !== "beides" ? d.attire : undefined,
              title: d.title.trim() || undefined,
              place: d.place.trim() || undefined,
              label: "",
              remind: d.remind,
            };
            const made = d.days.map((day, i) => {
              const s: PlanSlot = { ...base, id: i === 0 && d.id ? d.id : newId(), day };
              return { ...s, label: slotLabel(s) };
            });
            save({ ...plan, slots: [...plan.slots.filter((x) => x.id !== d.id), ...made] });
            setDraft(null);
          }}
        />
      ) : (
        <button type="button" className="btn primary big add-slot" onClick={() => setDraft(blank())}>
          <Plus size={20} aria-hidden="true" /> <span>Training hinzufügen</span>
        </button>
      )}

      <Reminders plan={plan} save={save} />
    </div>
  );
}

function SlotForm({ draft, sports, onCancel, onSave }: { draft: Draft; sports: SportId[]; onCancel: () => void; onSave: (d: Draft) => void }) {
  const [d, setD] = useState<Draft>(draft);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const ok = d.days.length > 0 && parseHm(d.start) !== null;
  // Your side sports first, then the rest.
  const order = ["bjj", ...sports, ...SPORTS.map((s) => s.id).filter((id) => !sports.includes(id))];
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (ok) onSave(d);
  };
  return (
    <form className="panel slot-form" onSubmit={submit} aria-label={d.id ? "Training bearbeiten" : "Training hinzufügen"}>
      <h2 className="h3">{d.id ? "Training bearbeiten" : "Neues Training"}</h2>
      <fieldset className="field">
        <legend className="fl">{d.id ? "Tag" : "Tage (mehrere möglich)"}</legend>
        <div className="chips">
          {DAY_SHORT.map((n, i) => {
            const on = d.days.includes(i as Weekday);
            return (
              <button
                key={n}
                type="button"
                className="chip day-chip"
                aria-pressed={on}
                aria-label={DAY_NAMES[i]}
                onClick={() => set({ days: d.id ? [i as Weekday] : on ? d.days.filter((x) => x !== i) : [...d.days, i as Weekday].sort() })}
              >
                {n}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="row wrap">
        <label className="field">
          <span className="fl">Beginn</span>
          <input id="arc-slot-start" type="time" step={300} value={d.start} onChange={(e) => set({ start: e.target.value })} required />
        </label>
        <div className="field">
          <span className="fl">Dauer in Minuten</span>
          <Seg value={d.minutes} onChange={(v) => set({ minutes: v })} label="Dauer" options={DURATIONS.map((v) => ({ v, label: String(v) }))} />
        </div>
      </div>
      <fieldset className="field">
        <legend className="fl">Sportart</legend>
        <div className="chips">
          {order.map((id) => (
            <button key={id} type="button" className="chip" aria-pressed={d.sport === id} onClick={() => set({ sport: id })}>
              {sportName(id)}
            </button>
          ))}
        </div>
      </fieldset>
      {d.sport === "bjj" ? (
        <div className="field">
          <span className="fl">Gi oder No-Gi</span>
          <Seg
            value={d.attire}
            onChange={(v) => set({ attire: v })}
            label="Gi oder No-Gi"
            options={[
              { v: "gi", label: "Gi" },
              { v: "nogi", label: "No-Gi" },
              { v: "beides", label: "Mal so, mal so" },
            ]}
          />
        </div>
      ) : null}
      <div className="row wrap">
        <label className="field grow">
          <span className="fl">Name (optional)</span>
          <input id="arc-slot-title" value={d.title} maxLength={40} placeholder="z. B. Fundamentals oder Open Mat" onChange={(e) => set({ title: e.target.value })} />
        </label>
        <label className="field grow">
          <span className="fl">Ort (optional)</span>
          <input id="arc-slot-place" value={d.place} maxLength={60} placeholder="z. B. dein Gym" onChange={(e) => set({ place: e.target.value })} />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={d.remind} onChange={(e) => set({ remind: e.target.checked })} /> Vor diesem Training erinnern
      </label>
      <div className="row wrap end">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className="btn primary" disabled={!ok}>
          {d.id ? "Speichern" : d.days.length > 1 ? `${d.days.length} Trainings anlegen` : "Anlegen"}
        </button>
      </div>
    </form>
  );
}

function Reminders({ plan, save }: { plan: TrainingPlan; save: (p: TrainingPlan) => void }) {
  const c = useCloud();
  const signedIn = c.status === "signedIn" && !!c.user;
  const [cfg, setCfg] = useState<ReminderConfig | null>(null);
  const [push, setPush] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const inst = useInstallPrompt();

  useEffect(() => {
    let dead = false;
    void pushState().then((s) => !dead && setPush(s));
    if (signedIn)
      loadCloud()
        .then((m) => m.reminderConfig())
        .then((x) => !dead && setCfg(x))
        .catch(() => !dead && setCfg({ vapid: null, email: false }));
    return () => {
      dead = true;
    };
  }, [signedIn]);

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: done });
    } catch (e) {
      const m = await loadCloud().catch(() => null);
      setMsg({ ok: false, text: m ? m.message(e) : String((e as Error)?.message ?? e) });
    } finally {
      setBusy(false);
      setPush(await pushState());
    }
  };
  const signIn = () => {
    afterSignIn("plan");
    go("konto");
  };
  const none = !plan.slots.some((s) => s.remind);

  let pushRow;
  if (push === "unsupported") pushRow = <p className="small muted">Dieser Browser kann keine Benachrichtigungen empfangen.</p>;
  else if (push === "install")
    pushRow = <p className="small">Auf dem iPhone kommen Benachrichtigungen nur in der installierten App: im Teilen-Menü „Zum Home-Bildschirm“, dann die App von dort öffnen.</p>;
  else if (!c.configured) pushRow = <p className="small muted">Braucht die Version mit Konto.</p>;
  else if (!signedIn)
    pushRow = (
      <button type="button" className="btn small" onClick={signIn}>
        Anmelden, um Erinnerungen zu bekommen
      </button>
    );
  else if (cfg && !cfg.vapid) pushRow = <p className="small muted">Der Server für Erinnerungen ist noch nicht eingerichtet.</p>;
  else if (push === "denied") pushRow = <p className="small">Benachrichtigungen sind für diese Seite blockiert. Gib sie in den Einstellungen des Browsers frei.</p>;
  else if (push === "on")
    pushRow = (
      <div className="row wrap">
        <span className="small ok-line">
          <Bell size={14} aria-hidden="true" /> An auf diesem Gerät
        </span>
        <button type="button" className="btn small ghost" disabled={busy} onClick={() => run(async () => disablePush(async (ep) => (await loadCloud()).pushUnsubscribe(ep)), "Auf diesem Gerät ausgeschaltet.")}>
          <BellOff size={14} aria-hidden="true" /> <span>Ausschalten</span>
        </button>
      </div>
    );
  else
    pushRow = (
      <button
        type="button"
        className="btn small"
        disabled={busy || !cfg?.vapid}
        onClick={() =>
          run(async () => {
            const m = await loadCloud();
            await enablePush(cfg!.vapid!, (sub) => m.pushSubscribe(sub));
            if (!plan.push) save({ ...plan, push: true });
          }, "Eingeschaltet. Die nächste Erinnerung kommt vor deinem nächsten Training.")
        }
      >
        <Bell size={14} aria-hidden="true" /> <span>Auf diesem Gerät einschalten</span>
      </button>
    );

  const email = c.user?.email ?? null;
  let mailRow;
  if (!c.configured) mailRow = <p className="small muted">Braucht die Version mit Konto.</p>;
  else if (!signedIn)
    mailRow = (
      <button type="button" className="btn small" onClick={signIn}>
        Anmelden
      </button>
    );
  else if (!email)
    mailRow = (
      <p className="small">
        Dein Konto hat noch keine E-Mail-Adresse.{" "}
        <button type="button" className="linkish" onClick={() => go("konto")}>
          Im Konto hinzufügen
        </button>
      </p>
    );
  else
    mailRow = (
      <>
        <label className="check">
          <input type="checkbox" checked={plan.email} disabled={!!cfg && !cfg.email && !plan.email} onChange={(e) => save({ ...plan, email: e.target.checked })} /> E-Mail an {email}
        </label>
        {cfg && !cfg.email ? <p className="small muted">Der Mail-Versand ist noch nicht eingerichtet. Bis dahin kommen nur Benachrichtigungen.</p> : null}
      </>
    );

  return (
    <section className="plain-sec reminders" aria-labelledby="rem-h">
      <h2 id="rem-h" className="h3">
        Erinnerungen
      </h2>
      <div className="field">
        <span className="fl">Wie lange vorher</span>
        <Seg value={plan.lead} onChange={(v) => save({ ...plan, lead: v })} label="Minuten vor dem Training" options={LEADS.map((v) => ({ v, label: `${v} Min.` }))} />
      </div>
      {none ? <p className="small muted">Leg zuerst ein Training mit Erinnerung an.</p> : null}
      <ul className="channels">
        <li>
          <Smartphone size={20} aria-hidden="true" />
          <div>
            <p className="ch-name">Benachrichtigung</p>
            <p className="small muted">Kommt aufs Handy, auch wenn die App zu ist. Mit deinen drei Karten des Tages oder der angenommenen Quest.</p>
            {pushRow}
          </div>
        </li>
        <li>
          <Mail size={20} aria-hidden="true" />
          <div>
            <p className="ch-name">E-Mail</p>
            <p className="small muted">Für alle, die lieber ins Postfach schauen.</p>
            {mailRow}
          </div>
        </li>
        <li>
          <CalendarPlus size={20} aria-hidden="true" />
          <div>
            <p className="ch-name">Kalender</p>
            <p className="small muted">
              Für Google, Apple oder Outlook. Dein Kalender erinnert dich dann selbst, auch ohne Konto. Nach Änderungen am Plan die Datei neu laden.
            </p>
            <button
              type="button"
              className="btn small"
              disabled={!plan.slots.length}
              onClick={() => downloadIcs(toIcs(plan, Date.now(), `${window.location.origin}/arc/`))}
            >
              <CalendarPlus size={14} aria-hidden="true" /> <span>Kalender-Datei laden</span>
            </button>
          </div>
        </li>
      </ul>
      {signedIn && (push === "on" || plan.email) ? (
        <button type="button" className="btn small ghost" disabled={busy} onClick={() => run(async () => (await loadCloud()).testReminder(), "Test-Erinnerung verschickt.")}>
          <Send size={14} aria-hidden="true" /> <span>Test-Erinnerung schicken</span>
        </button>
      ) : null}
      {msg ? (
        <p className={`auth-msg ${msg.ok ? "ok" : "err"}`} role={msg.ok ? "status" : "alert"}>
          {msg.text}
        </p>
      ) : null}
      {inst.can ? (
        <p className="small">
          Als App auf dem Homescreen startet Waza Arc schneller und auch ohne Netz.{" "}
          <button type="button" className="linkish strong" onClick={() => void inst.install()}>
            App installieren
          </button>
        </p>
      ) : null}
    </section>
  );
}
