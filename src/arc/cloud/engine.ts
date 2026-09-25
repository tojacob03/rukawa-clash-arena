// Supabase client, sign-in methods and the sync engine. Loaded on demand
// through state.ts, so people without an account never download it.
//
// Sessions use PKCE: after a redirect (Google, Apple, email link) the app
// gets ?code=… in the query string, which does not collide with the hash
// routes. Codes by email or SMS work on any device; links only in the browser
// that asked for them.

import { createClient } from "@supabase/supabase-js";
import type { AuthChangeEvent, Provider, Session, User } from "@supabase/supabase-js";
import { arcStore } from "../store.ts";
import { AUTH_STORAGE_KEY, CLOUD_KEY, CLOUD_URL, cloudState } from "./state.ts";
import type { CloudUser } from "./state.ts";
import { applyRemote, combine, dataFromRows, emptySyncState, firstSync, markPushed, pendingPush, stateFromRows, summary } from "../core/records.ts";
import type { Combine, RemoteRow, SyncState } from "../core/records.ts";

// Read before the client exists: it removes ?code=… from the URL on its own.
const boot = new URLSearchParams(window.location.search);
const fromRedirect = ["code", "error", "error_description", "token_hash"].some((k) => boot.has(k));

export const sb = createClient(CLOUD_URL!, CLOUD_KEY!, {
  auth: {
    storageKey: AUTH_STORAGE_KEY,
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    experimental: { passkey: true },
  },
});

// ── Settings: which sign-in methods the project has switched on ───────────

export interface AuthSettings {
  providers: string[];
  email: boolean;
  phone: boolean;
  anonymous: boolean;
  passkeys: boolean;
  signupDisabled: boolean;
}

/** Order of the provider buttons; others follow alphabetically. */
const PROVIDER_ORDER = ["google", "apple", "discord", "github", "facebook", "azure", "twitter", "twitch", "spotify", "linkedin_oidc", "slack_oidc", "gitlab", "bitbucket", "notion", "zoom", "figma", "kakao", "snapchat", "keycloak", "workos"];

let settingsCache: Promise<AuthSettings> | null = null;
export function authSettings(): Promise<AuthSettings> {
  settingsCache ??= fetch(`${CLOUD_URL}/auth/v1/settings`, { headers: { apikey: CLOUD_KEY! } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`settings ${r.status}`))))
    .then((j: { external?: Record<string, boolean>; disable_signup?: boolean; passkeys_enabled?: boolean }) => {
      const ext = j.external ?? {};
      const providers = Object.keys(ext)
        .filter((k) => ext[k] && !["email", "phone", "anonymous_users", "linkedin", "slack"].includes(k))
        .sort((a, b) => {
          const ia = PROVIDER_ORDER.indexOf(a);
          const ib = PROVIDER_ORDER.indexOf(b);
          return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
        });
      return {
        providers,
        email: ext.email !== false,
        phone: !!ext.phone,
        anonymous: !!ext.anonymous_users,
        passkeys: !!j.passkeys_enabled,
        signupDisabled: !!j.disable_signup,
      };
    });
  settingsCache.catch(() => {
    settingsCache = null;
  });
  return settingsCache;
}

// ── Start and auth events ─────────────────────────────────────────────────

const RETURN_KEY = "waza-arc.return";
const returnUrl = () => `${window.location.origin}${window.location.pathname}`;
function rememberReturn() {
  try {
    window.sessionStorage.setItem(RETURN_KEY, window.location.hash || "#/konto");
  } catch {
    /* storage blocked: we land on the start page */
  }
}

/** After a sign-in redirect: drop the auth parameters and go back to the screen we left from. */
function cleanUrl() {
  if (!fromRedirect) return;
  const u = new URL(window.location.href);
  for (const k of ["code", "error", "error_code", "error_description", "token_hash", "type", "sb"]) u.searchParams.delete(k);
  let hash = u.hash;
  try {
    const back = window.sessionStorage.getItem(RETURN_KEY);
    if (back) {
      if (!hash || hash === "#" || hash === "#/") hash = back;
      window.sessionStorage.removeItem(RETURN_KEY);
    }
  } catch {
    /* ignore */
  }
  const next = `${u.pathname}${u.search}${hash}`;
  const moved = hash !== window.location.hash;
  if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.replaceState(null, "", next);
  // replaceState does not fire hashchange; the router listens for it.
  if (moved) window.dispatchEvent(new HashChangeEvent("hashchange"));
}

let started: Promise<void> | null = null;

export function start(): Promise<void> {
  started ??= (async () => {
    const redirectError = boot.get("error_description") || boot.get("error");
    let first = true;
    await new Promise<void>((resolve) => {
      sb.auth.onAuthStateChange((event, session) => {
        // Never call other auth methods inside this callback: defer.
        window.setTimeout(() => {
          void onAuth(event, session).finally(() => {
            if (first) {
              first = false;
              resolve();
            }
          });
        }, 0);
      });
    });
    cleanUrl();
    if (redirectError) cloudState.set({ notice: message({ message: redirectError }) });
    wireSyncTriggers();
  })();
  return started;
}

export function toCloudUser(u: User): CloudUser {
  const providers = [...new Set((u.identities ?? []).map((i) => i.provider))];
  return {
    id: u.id,
    email: u.email || null,
    phone: u.phone || null,
    anonymous: !!u.is_anonymous,
    providers,
    createdAt: u.created_at ?? null,
  };
}

async function onAuth(event: AuthChangeEvent, session: Session | null) {
  if (!session?.user) {
    stopSync();
    arcStore.switchTo(null);
    cloudState.set({ status: "signedOut", user: null, mfa: false, recovery: false, choice: null });
    return;
  }
  const user = toCloudUser(session.user);
  let mfa = false;
  try {
    const { data } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    mfa = !!data && data.nextLevel === "aal2" && data.currentLevel !== "aal2";
  } catch {
    /* no factors or offline: treat as not required, the server checks again */
  }
  cloudState.set({ status: "signedIn", user, mfa, recovery: event === "PASSWORD_RECOVERY" ? true : cloudState.get().recovery });
  if (!mfa) await beginSync(user.id);
}

async function refreshUser() {
  const { data } = await sb.auth.getUser();
  if (data.user) cloudState.set({ user: toCloudUser(data.user) });
}

// ── Sign-in methods ───────────────────────────────────────────────────────

const fail = (error: unknown) => {
  if (error) throw error;
};

export async function withProvider(provider: string) {
  rememberReturn();
  const { error } = await sb.auth.signInWithOAuth({ provider: provider as Provider, options: { redirectTo: returnUrl() } });
  fail(error);
}

export async function emailCode(email: string, captchaToken?: string) {
  rememberReturn();
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: returnUrl(), captchaToken } });
  fail(error);
}

export async function verifyCode(target: { email: string } | { phone: string }, token: string, type: "email" | "recovery" | "email_change" | "sms" = "email") {
  const { error } =
    "email" in target
      ? await sb.auth.verifyOtp({ email: target.email, token, type: type as "email" | "recovery" | "email_change" })
      : await sb.auth.verifyOtp({ phone: target.phone, token, type: "sms" });
  fail(error);
  if (type === "recovery") cloudState.set({ recovery: true });
  if (type === "email_change") await refreshUser();
}

export async function phoneCode(phone: string, captchaToken?: string) {
  const { error } = await sb.auth.signInWithOtp({ phone, options: { shouldCreateUser: true, captchaToken } });
  fail(error);
}

export async function passwordSignIn(email: string, password: string, captchaToken?: string) {
  const { error } = await sb.auth.signInWithPassword({ email, password, options: { captchaToken } });
  fail(error);
}

/** "signedIn" when the project confirms emails automatically, otherwise "confirm". */
export async function passwordSignUp(email: string, password: string, captchaToken?: string): Promise<"signedIn" | "confirm"> {
  rememberReturn();
  const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: returnUrl(), captchaToken } });
  fail(error);
  return data.session ? "signedIn" : "confirm";
}

export async function resetPassword(email: string, captchaToken?: string) {
  rememberReturn();
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: returnUrl(), captchaToken });
  fail(error);
}

export async function setPassword(password: string) {
  const { error } = await sb.auth.updateUser({ password });
  fail(error);
  cloudState.set({ recovery: false });
}

export const passkeySupported = () => typeof window !== "undefined" && "PublicKeyCredential" in window && window.isSecureContext;

export async function passkeySignIn() {
  const { error } = await sb.auth.signInWithPasskey();
  fail(error);
}

export async function guest(captchaToken?: string) {
  const { error } = await sb.auth.signInAnonymously({ options: { captchaToken } });
  fail(error);
}

/** Second factor after sign-in: code from the authenticator app. */
export async function mfaVerify(code: string) {
  const { data, error } = await sb.auth.mfa.listFactors();
  fail(error);
  const f = data?.totp.find((x) => x.status === "verified");
  if (!f) throw new Error("Kein Authenticator eingerichtet.");
  const r = await sb.auth.mfa.challengeAndVerify({ factorId: f.id, code });
  fail(r.error);
  cloudState.set({ mfa: false });
  const u = cloudState.get().user;
  if (u) await beginSync(u.id);
}

// ── Account management ────────────────────────────────────────────────────

export async function linkProvider(provider: string) {
  rememberReturn();
  const { error } = await sb.auth.linkIdentity({ provider: provider as Provider, options: { redirectTo: returnUrl() } });
  fail(error);
}

export async function unlinkProvider(provider: string) {
  const { data, error } = await sb.auth.getUserIdentities();
  fail(error);
  const idn = data?.identities.find((i) => i.provider === provider);
  if (!idn) return;
  const r = await sb.auth.unlinkIdentity(idn);
  fail(r.error);
  await refreshUser();
}

/** Add or change the email address; a code goes to the new address. */
export async function changeEmail(email: string) {
  rememberReturn();
  const { error } = await sb.auth.updateUser({ email }, { emailRedirectTo: returnUrl() });
  fail(error);
}

export async function listPasskeys() {
  const { data, error } = await sb.auth.passkey.list();
  fail(error);
  return data ?? [];
}

export async function addPasskey() {
  const { error } = await sb.auth.registerPasskey();
  fail(error);
}

export async function renamePasskey(id: string, name: string) {
  const { error } = await sb.auth.passkey.update({ passkeyId: id, friendlyName: name.slice(0, 120) });
  fail(error);
}

export async function removePasskey(id: string) {
  const { error } = await sb.auth.passkey.delete({ passkeyId: id });
  fail(error);
}

export async function totpFactors() {
  const { data, error } = await sb.auth.mfa.listFactors();
  fail(error);
  return data?.totp ?? [];
}

export async function enrollTotp() {
  // Leftover unverified factors block a new enrollment with the same name.
  for (const f of (await sb.auth.mfa.listFactors()).data?.all ?? []) if (f.status === "unverified") await sb.auth.mfa.unenroll({ factorId: f.id });
  const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `Waza Arc ${new Date().toISOString().slice(0, 10)}` });
  fail(error);
  return { id: data!.id, qr: data!.totp.qr_code, secret: data!.totp.secret };
}

export async function confirmTotp(factorId: string, code: string) {
  const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code });
  fail(error);
}

export async function removeFactor(factorId: string) {
  const { error } = await sb.auth.mfa.unenroll({ factorId });
  fail(error);
}

export async function signOut(opts: { everywhere?: boolean; wipe?: boolean } = {}) {
  const uid = syncUser;
  if (uid && !arcStore.get().demo) await syncOnce().catch(() => undefined);
  await dropDevicePush().catch(() => undefined);
  stopSync();
  arcStore.switchTo(null);
  if (opts.wipe && uid) forget(uid);
  await sb.auth.signOut({ scope: opts.everywhere ? "global" : "local" });
}

/** Delete the account on the server and every copy on this device. */
export async function deleteAccount() {
  const { error } = await sb.rpc("arc_delete_account");
  fail(error);
  const uid = syncUser;
  stopSync();
  arcStore.switchTo(null);
  if (uid) forget(uid);
  await sb.auth.signOut({ scope: "local" }).catch(() => undefined);
}

// ── Reminders ─────────────────────────────────────────────────────────────

export interface ReminderConfig {
  /** Public VAPID key for web push, once the reminder function has set itself up. */
  vapid: string | null;
  /** The mail service is configured on the server. */
  email: boolean;
}

export async function reminderConfig(): Promise<ReminderConfig> {
  const { data, error } = await sb.rpc("arc_reminder_config");
  fail(error);
  const d = (data ?? {}) as { vapid?: string | null; email?: boolean };
  return { vapid: d.vapid ?? null, email: !!d.email };
}

export async function pushSubscribe(sub: PushSubscriptionJSON) {
  const { error } = await sb.rpc("arc_push_subscribe", { p_endpoint: sub.endpoint, p_p256dh: sub.keys?.p256dh, p_auth: sub.keys?.auth });
  fail(error);
}

export async function pushUnsubscribe(endpoint: string) {
  const { error } = await sb.rpc("arc_push_unsubscribe", { p_endpoint: endpoint });
  fail(error);
}

/** Sends a test reminder to every channel of this account that is switched on. */
export async function testReminder(): Promise<{ push: number; email: boolean }> {
  const { data, error } = await sb.functions.invoke("arc-reminders", { body: { action: "test" } });
  if (error) {
    const body = (await (error as { context?: Response }).context?.json?.().catch(() => null)) as { error?: string } | null;
    throw Object.assign(new Error(body?.error ?? error.message), { code: body?.error });
  }
  return data as { push: number; email: boolean };
}

// ── Friends, crews, gyms ──────────────────────────────────────────────────
// Answers are checked in core/social.ts before anything is shown.

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await sb.rpc(fn, args);
  fail(error);
  return data as T;
}

export const socialState = () => rpc<unknown>("arc_social_state");
/** Switch on (create) or update the card. A null name keeps the name. Returns the friend code. */
export const socialPublish = (name: string | null, card: unknown, slots: unknown[] | null, shareTimes: boolean | null, create = true) =>
  rpc<string>("arc_social_publish", { p_name: name, p_card: card, p_slots: slots, p_share_times: shareTimes, p_create: create });
export const socialDisable = () => rpc<void>("arc_social_disable");
export const friendAdd = (code: string) => rpc<"requested" | "pending" | "accepted" | "friends">("arc_friend_add", { p_code: code });
export const friendAnswer = (user: string, accept: boolean) => rpc<void>("arc_friend_answer", { p_user: user, p_accept: accept });
export const friendRemove = (user: string) => rpc<void>("arc_friend_remove", { p_user: user });
export const crewCreate = (name: string, flag: unknown) => rpc<string>("arc_crew_create", { p_name: name, p_flag: flag });
export const crewJoin = (code: string) => rpc<string>("arc_crew_join", { p_code: code });
export const crewLeave = () => rpc<void>("arc_crew_leave");
export const crewEdit = (name: string, flag: unknown) => rpc<void>("arc_crew_edit", { p_name: name, p_flag: flag });
export const crewKick = (user: string) => rpc<void>("arc_crew_kick", { p_user: user });
export const gymFind = (query: string) => rpc<unknown>("arc_gym_find", { p_query: query });
export const gymCreate = (name: string, city: string) => rpc<string>("arc_gym_create", { p_name: name, p_city: city });
export const gymJoin = (code: string) => rpc<string>("arc_gym_join", { p_code: code });
export const gymLeave = () => rpc<void>("arc_gym_leave");
export const gymVisible = (visible: boolean) => rpc<void>("arc_gym_visible", { p_visible: visible });

/** This device stops receiving the account's reminders (on sign-out). */
async function dropDevicePush() {
  const reg = await navigator.serviceWorker?.getRegistration("/arc/");
  const sub = await reg?.pushManager?.getSubscription();
  if (!sub) return;
  await pushUnsubscribe(sub.endpoint).catch(() => undefined);
  await sub.unsubscribe().catch(() => undefined);
}

function forget(uid: string) {
  arcStore.drop(uid);
  try {
    window.localStorage.removeItem(stateKey(uid));
  } catch {
    /* ignore */
  }
}

// ── Sync ──────────────────────────────────────────────────────────────────

const PAGE = 1000;
const BATCH = 400;
const stateKey = (uid: string) => `waza-arc.sync:${uid}`;

let syncUser: string | null = null;
let state: SyncState = emptySyncState();
let running: Promise<void> | null = null;
let again = false;
let applying = false;
let timer: number | undefined;
let retries = 0;
/** First sign-in on this device: waiting for the pull or the player's choice. */
let firstRun: { rows: RemoteRow[]; deviceNs: string | null } | null = null;
let firstPending = false;

function loadState(uid: string): SyncState {
  try {
    const raw = window.localStorage.getItem(stateKey(uid));
    const s = raw ? JSON.parse(raw) : null;
    if (s && typeof s.cursor === "number" && s.base && typeof s.base === "object") return s as SyncState;
  } catch {
    /* fall through */
  }
  return emptySyncState();
}

function saveState() {
  if (!syncUser) return;
  try {
    window.localStorage.setItem(stateKey(syncUser), JSON.stringify(state));
  } catch {
    /* storage full: the next sync compares again */
  }
}

async function pullAll(since: number): Promise<RemoteRow[]> {
  const out: RemoteRow[] = [];
  let from = since;
  for (;;) {
    const { data, error } = await sb.rpc("arc_pull", { p_since: from, p_limit: PAGE });
    fail(error);
    const rows = ((data ?? []) as RemoteRow[]).map((r) => ({ ...r, rev: Number(r.rev) }));
    out.push(...rows);
    if (rows.length < PAGE) return out;
    from = rows[rows.length - 1].rev;
  }
}

async function beginSync(uid: string) {
  if (syncUser === uid && !firstPending) {
    schedule(0);
    return;
  }
  const deviceNs = syncUser === uid ? firstRun?.deviceNs ?? null : arcStore.namespace();
  syncUser = uid;
  state = loadState(uid);
  const here = arcStore.peek(uid);
  if (state.cursor > 0 || here.profile || here.sessions.length) {
    firstPending = false;
    arcStore.switchTo(uid);
    schedule(0);
    return;
  }
  // First time for this account on this device.
  firstPending = true;
  cloudState.setSync({ phase: "syncing", error: null });
  let rows: RemoteRow[];
  try {
    rows = await pullAll(0);
  } catch (e) {
    firstRun = { rows: [], deviceNs };
    cloudState.setSync({ phase: navigator.onLine === false ? "offline" : "error", error: message(e) });
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void beginSync(uid), Math.min(60_000, 3000 * 2 ** retries++));
    return;
  }
  retries = 0;
  const remote = dataFromRows(rows);
  const device = arcStore.peek(deviceNs);
  const decision = firstSync(device, remote);
  firstRun = { rows, deviceNs };
  if (decision === "ask") {
    cloudState.set({ choice: { device: summary(device), account: summary(remote) } });
    cloudState.setSync({ phase: "paused" });
    return;
  }
  finishFirst(decision === "adopt" ? { ...device, demo: undefined } : remote, decision === "adopt");
}

function finishFirst(data: ReturnType<typeof dataFromRows>, moveDevice: boolean) {
  if (!syncUser || !firstRun) return;
  const { rows, deviceNs } = firstRun;
  firstRun = null;
  firstPending = false;
  state = stateFromRows(rows);
  saveState();
  applying = true;
  arcStore.switchTo(syncUser);
  arcStore.set(data);
  applying = false;
  // The device's data now lives in the account.
  if (moveDevice && deviceNs !== syncUser) arcStore.drop(deviceNs);
  cloudState.set({ choice: null });
  schedule(0);
}

/** The player's answer when both the device and the account have data. */
export function resolveChoice(how: Combine) {
  if (!firstRun || !syncUser) return;
  const device = arcStore.peek(firstRun.deviceNs);
  const remote = dataFromRows(firstRun.rows);
  finishFirst(combine(device, remote, how), how !== "account");
}

function stopSync() {
  window.clearTimeout(timer);
  syncUser = null;
  firstRun = null;
  firstPending = false;
  state = emptySyncState();
  cloudState.set({ choice: null });
  cloudState.setSync({ phase: "idle", pending: 0, error: null });
}

function schedule(ms: number) {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void syncOnce().catch(() => undefined), ms);
}

export function syncNow() {
  const u = cloudState.get().user;
  if (firstPending && u) void beginSync(u.id);
  else schedule(0);
}

function syncOnce(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  if (!syncUser || firstPending || cloudState.get().mfa || arcStore.namespace() !== syncUser) return Promise.resolve();
  if (arcStore.get().demo) {
    cloudState.setSync({ phase: "paused" });
    return Promise.resolve();
  }
  running = (async () => {
    cloudState.setSync({ phase: "syncing" });
    try {
      const rows = await pullAll(state.cursor);
      if (rows.length) {
        const r = applyRemote(arcStore.get(), state, rows);
        state = r.state;
        if (r.changed) {
          applying = true;
          arcStore.set(r.data);
          applying = false;
        }
        saveState();
      }
      let out = pendingPush(arcStore.get(), state);
      while (out.length) {
        const batch = out.slice(0, BATCH);
        const { error } = await sb.rpc("arc_push", { p_rows: batch });
        fail(error);
        state = markPushed(state, batch);
        saveState();
        out = out.slice(BATCH);
      }
      retries = 0;
      cloudState.setSync({ phase: "idle", last: Date.now(), pending: pendingPush(arcStore.get(), state).length, error: null });
    } catch (e) {
      retries++;
      cloudState.setSync({ phase: navigator.onLine === false ? "offline" : "error", error: message(e), pending: pendingPush(arcStore.get(), state).length });
      schedule(Math.min(60_000, 2000 * 2 ** retries));
    }
  })().finally(() => {
    running = null;
    if (again) {
      again = false;
      schedule(300);
    }
  });
  return running;
}

let wired = false;
function wireSyncTriggers() {
  if (wired) return;
  wired = true;
  arcStore.subscribe(() => {
    if (applying || !syncUser || arcStore.namespace() !== syncUser) return;
    cloudState.setSync({ pending: Math.max(1, cloudState.get().sync.pending) });
    schedule(1500);
  });
  window.addEventListener("online", () => syncNow());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && syncUser) schedule(200);
  });
  window.setInterval(() => {
    if (document.visibilityState === "visible" && syncUser) schedule(0);
  }, 5 * 60_000);
}

// ── Messages ──────────────────────────────────────────────────────────────

const MESSAGES: Record<string, string> = {
  arc_test_limit: "Eine Test-Erinnerung pro Stunde. Versuch es später noch mal.",
  arc_social_off: "Schalt zuerst Crew und Freundeskreis ein.",
  arc_bad_name: "Der Name ist zu kurz oder zu lang.",
  arc_bad_card: "Deine Karte ließ sich nicht speichern.",
  arc_code_unknown: "Zu diesem Code gibt es nichts. Prüf ihn noch einmal.",
  arc_code_self: "Das ist dein eigener Code.",
  arc_friend_limit: "Du hast gerade zu viele offene Anfragen oder schon sehr viele Freundschaften.",
  arc_in_crew: "Du bist schon in einer Crew. Verlass sie zuerst.",
  arc_crew_full: "Diese Crew ist voll: höchstens 12 an Bord.",
  arc_not_captain: "Das darf nur, wer die Crew steuert.",
  arc_gym_limit: "Du hast heute schon drei Gyms angelegt. Morgen geht es weiter.",
  PGRST202: "Crew und Freundeskreis sind auf dem Server noch nicht eingerichtet.",
  arc_push_bad_subscription: "Dieser Browser liefert keine gültige Adresse für Benachrichtigungen.",
  invalid_credentials: "E-Mail oder Passwort stimmt nicht.",
  email_not_confirmed: "Bitte bestätige zuerst deine E-Mail-Adresse.",
  otp_expired: "Der Code ist abgelaufen oder falsch. Fordere einen neuen an.",
  otp_disabled: "Anmelden mit Code ist gerade ausgeschaltet.",
  over_email_send_rate_limit: "Zu viele E-Mails in kurzer Zeit. Warte eine Minute.",
  over_sms_send_rate_limit: "Zu viele SMS in kurzer Zeit. Warte eine Minute.",
  over_request_rate_limit: "Zu viele Versuche. Warte kurz und probier es dann noch einmal.",
  weak_password: "Das Passwort ist zu schwach: mindestens 8 Zeichen, besser mit Zahlen und Sonderzeichen.",
  same_password: "Das neue Passwort muss sich vom alten unterscheiden.",
  user_already_exists: "Zu dieser E-Mail gibt es schon ein Konto. Melde dich an.",
  email_exists: "Diese E-Mail gehört schon zu einem Konto.",
  phone_exists: "Diese Nummer gehört schon zu einem Konto.",
  identity_already_exists: "Dieser Anmeldeweg gehört schon zu einem anderen Konto.",
  email_address_invalid: "Diese E-Mail-Adresse wird nicht angenommen.",
  provider_disabled: "Dieser Anmeldeweg ist gerade nicht eingeschaltet.",
  email_provider_disabled: "Anmelden per E-Mail ist gerade nicht eingeschaltet.",
  phone_provider_disabled: "Anmelden per SMS ist gerade nicht eingeschaltet.",
  anonymous_provider_disabled: "Gastkonten sind gerade nicht eingeschaltet.",
  signup_disabled: "Neue Konten sind gerade nicht möglich.",
  manual_linking_disabled: "Weitere Anmeldewege verbinden ist gerade nicht eingeschaltet.",
  single_identity_not_deletable: "Das ist dein einziger Anmeldeweg. Verbinde erst einen zweiten.",
  captcha_failed: "Die Sicherheitsprüfung hat nicht geklappt. Versuch es noch einmal.",
  mfa_verification_failed: "Der Code aus der Authenticator-App stimmt nicht.",
  mfa_challenge_expired: "Die Anfrage ist abgelaufen. Gib einen neuen Code ein.",
  insufficient_aal: "Dafür brauchst du zuerst den Code aus deiner Authenticator-App.",
  session_not_found: "Deine Sitzung ist abgelaufen. Melde dich neu an.",
  user_banned: "Dieses Konto ist gesperrt.",
  sms_send_failed: "Die SMS konnte nicht verschickt werden.",
  validation_failed: "Die Eingabe passt nicht. Prüf E-Mail oder Nummer.",
  passkey_disabled: "Passkeys sind für dieses Projekt noch nicht eingeschaltet.",
  too_many_passkeys: "Du hast schon die meisten erlaubten Passkeys. Lösch erst einen alten.",
  webauthn_credential_exists: "Dieser Passkey ist schon verbunden.",
  webauthn_credential_not_found: "Zu diesem Passkey gibt es kein Konto. Melde dich anders an und füge ihn im Konto hinzu.",
  webauthn_challenge_expired: "Das hat zu lange gedauert. Probier es noch einmal.",
  webauthn_verification_failed: "Der Passkey konnte nicht geprüft werden.",
  arc_mfa_required: "Dafür brauchst du zuerst den Code aus deiner Authenticator-App.",
  arc_quota_exceeded: "Dein Speicher im Konto ist voll.",
  arc_admin_account: "Admin-Konten des Portfolios lassen sich hier nicht löschen.",
  arc_not_signed_in: "Du bist nicht mehr angemeldet.",
  access_denied: "Die Anmeldung wurde abgebrochen.",
};

export function message(e: unknown): string {
  if (!e) return "Unbekannter Fehler.";
  const err = e as { code?: string; name?: string; message?: string; error_code?: string };
  if (err.name === "NotAllowedError" || err.name === "AbortError") return "Abgebrochen.";
  const code = err.code || err.error_code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  const m = err.message ?? String(e);
  for (const k of Object.keys(MESSAGES)) if (m.includes(k)) return MESSAGES[k];
  if (/fetch|network|Load failed/i.test(m)) return "Keine Verbindung. Deine Daten bleiben auf dem Gerät und werden später gesichert.";
  if (/rate limit/i.test(m)) return MESSAGES.over_request_rate_limit;
  if (/Email not confirmed/i.test(m)) return MESSAGES.email_not_confirmed;
  if (/Invalid login credentials/i.test(m)) return MESSAGES.invalid_credentials;
  if (/Token has expired or is invalid/i.test(m)) return MESSAGES.otp_expired;
  return m;
}
