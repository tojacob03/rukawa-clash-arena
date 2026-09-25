// Waza Arc reminders. Called every five minutes by the cron job
// (arc.reminders_tick, header x-arc-cron) and by the app for a test message
// (signed-in user). Sends web push to the user's devices and, when a mail
// service is configured, an e-mail, both 30 minutes (or the chosen lead)
// before each planned training.
//
// Secrets: SUPABASE_URL and the service key are set by Supabase. Optional:
// RESEND_API_KEY and ARC_MAIL_FROM (e.g. "Waza Arc <arc@rukawaanalytics.com>")
// for e-mail, ARC_APP_URL (default https://rukawaanalytics.com), ARC_MAIL_API
// for another Resend-compatible endpoint.

import { createClient } from "npm:@supabase/supabase-js@2";
import { dueReminders, normalizePlan, reminderMessage, weekNumber } from "../_shared/schedule.ts";
import type { TrainingPlan } from "../_shared/schedule.ts";
import { generateVapidKeys, sendPush } from "../_shared/webpush.ts";
import type { PushTarget, VapidKeys } from "../_shared/webpush.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function serviceKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default as string;
  } catch {
    return "";
  }
}

const APP_URL = (Deno.env.get("ARC_APP_URL") ?? "https://rukawaanalytics.com").replace(/\/$/, "");
const RESEND = Deno.env.get("RESEND_API_KEY");
const MAIL_API = Deno.env.get("ARC_MAIL_API") ?? "https://api.resend.com/emails";
const FROM = Deno.env.get("ARC_MAIL_FROM");
const MAIL_READY = !!(RESEND && FROM);
const db = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey(), { auth: { persistSession: false, autoRefreshToken: false } });

interface Target {
  user_id: string;
  email: string | null;
  plan: unknown;
  pauses: number[];
  subs: PushTarget[];
}

interface Message {
  title: string;
  body: string;
  url: string;
  tag: string;
}

async function vapid(): Promise<VapidKeys> {
  const { data } = await db.rpc("arc_vapid_keys");
  if (data?.public && data?.private) return { publicKey: data.public, privateKey: data.private };
  const fresh = await generateVapidKeys();
  const { data: stored, error } = await db.rpc("arc_vapid_init", { p_public: fresh.publicKey, p_private: fresh.privateKey });
  if (error || !stored?.public) throw new Error(`VAPID setup failed: ${error?.message ?? "no key"}`);
  return { publicKey: stored.public, privateKey: stored.private };
}

async function pushAll(subs: PushTarget[], msg: Message, keys: VapidKeys) {
  let sent = 0;
  for (const s of subs) {
    try {
      const r = await sendPush(s, msg, keys, `${APP_URL}/arc/`, 45 * 60);
      await db.rpc("arc_push_result", { p_endpoint: s.endpoint, p_ok: r.ok, p_gone: r.gone });
      if (r.ok) sent++;
    } catch {
      await db.rpc("arc_push_result", { p_endpoint: s.endpoint, p_ok: false, p_gone: false });
    }
  }
  return sent;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function mail(to: string, msg: Message) {
  if (!MAIL_READY) return false;
  const link = `${APP_URL}${msg.url}`;
  const settings = `${APP_URL}/arc/#/plan`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#16171c">
<p style="font-size:20px;font-weight:800;margin:0 0 8px">${esc(msg.title)}</p>
<p style="margin:0 0 16px">${esc(msg.body)}</p>
<p style="margin:0 0 24px"><a href="${esc(link)}" style="display:inline-block;padding:10px 16px;background:#2a3a8f;color:#f2f3ee;text-decoration:none;font-weight:700">Waza Arc öffnen</a></p>
<p style="margin:0;font-size:13px;color:#555">Du bekommst diese Mail, weil du im Wochenplan E-Mail-Erinnerungen eingeschaltet hast. Abschalten: <a href="${esc(settings)}">Wochenplan</a>.</p>
</div>`;
  const res = await fetch(MAIL_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject: msg.title,
      html,
      text: `${msg.title}\n\n${msg.body}\n\n${link}\n\nAbschalten im Wochenplan: ${settings}`,
      headers: { "List-Unsubscribe": `<${settings}>` },
    }),
  });
  await res.body?.cancel().catch(() => undefined);
  return res.ok;
}

async function tick() {
  await db.rpc("arc_set_email_ready", { p_ready: MAIL_READY });
  const keys = await vapid();
  const { data, error } = await db.rpc("arc_reminder_targets");
  if (error) throw error;
  const now = Date.now();
  let push = 0;
  let email = 0;
  for (const t of (data ?? []) as Target[]) {
    const plan: TrainingPlan | null = normalizePlan(t.plan);
    if (!plan) continue;
    const paused = new Set((t.pauses ?? []).filter((w) => Number.isInteger(w)));
    for (const o of dueReminders(plan, now)) {
      if (paused.has(weekNumber(o.date))) continue;
      const msg = reminderMessage(plan, o);
      if (plan.push && t.subs.length) {
        const { data: claimed } = await db.rpc("arc_reminder_claim", { p_user: t.user_id, p_slot: o.slot.id, p_day: o.date, p_channel: "push" });
        if (claimed) push += await pushAll(t.subs, msg, keys);
      }
      if (plan.email && t.email && MAIL_READY) {
        const { data: claimed } = await db.rpc("arc_reminder_claim", { p_user: t.user_id, p_slot: o.slot.id, p_day: o.date, p_channel: "email" });
        if (claimed && (await mail(t.email, msg))) email++;
      }
    }
  }
  return { users: (data ?? []).length, push, email };
}

async function test(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const { data: auth } = await db.auth.getUser(token);
  if (!auth?.user) return json({ error: "arc_not_signed_in" }, 401);
  // One test per hour, so nobody burns the mail quota.
  const hour = new Date().toISOString().slice(0, 13);
  const { data: fresh } = await db.rpc("arc_reminder_claim", { p_user: auth.user.id, p_slot: `test-${hour}`, p_day: hour.slice(0, 10), p_channel: "push" });
  if (!fresh) return json({ error: "arc_test_limit" }, 429);
  const { data } = await db.rpc("arc_reminder_targets", { p_user: auth.user.id });
  const t = ((data ?? []) as Target[])[0];
  if (!t) return json({ push: 0, email: false });
  const plan = normalizePlan(t.plan);
  const msg: Message = { title: "Test von Waza Arc", body: "So sieht deine Erinnerung vor dem Training aus.", url: "/arc/#/plan", tag: "arc-test" };
  const push = t.subs.length ? await pushAll(t.subs, msg, await vapid()) : 0;
  const email = !!(plan?.email && t.email) && (await mail(t.email!, msg));
  return json({ push, email });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  try {
    if (body.action === "test") return await test(req);
    const { data: ok } = await db.rpc("arc_cron_check", { p_secret: req.headers.get("x-arc-cron") ?? "" });
    if (!ok) return json({ error: "forbidden" }, 403);
    return json(await tick());
  } catch (e) {
    console.error(e);
    return json({ error: "internal" }, 500);
  }
});
