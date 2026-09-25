import { useState } from "react";
import { socialAct } from "./cloud/social.ts";

type Engine = typeof import("./cloud/engine.ts");

/** Runs a server change and shows its outcome. `run` resolves to whether it worked. */
export function useAct() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function run(fn: (m: Engine) => Promise<unknown>, done?: string | ((r: unknown) => string)) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await socialAct(fn);
      if (done) setMsg({ ok: true, text: typeof done === "function" ? done(r) : done });
      return true;
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
      return false;
    } finally {
      setBusy(false);
    }
  }
  const view = msg ? (
    <p className={`auth-msg ${msg.ok ? "ok" : "err"}`} role={msg.ok ? "status" : "alert"}>
      {msg.text}
    </p>
  ) : null;
  return { busy, run, msg: view, clear: () => setMsg(null) };
}
