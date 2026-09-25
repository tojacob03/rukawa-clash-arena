// Optional bot protection for sign-ups (Cloudflare Turnstile). Only active
// when VITE_ARC_TURNSTILE_SITEKEY is set and the Supabase project requires a
// CAPTCHA; otherwise nothing loads.

import { useEffect, useRef, useState } from "react";
import { TURNSTILE_SITEKEY } from "../cloud/state.ts";

interface Turnstile {
  render: (el: HTMLElement, o: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
}

let loading: Promise<void> | null = null;
function loadScript() {
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("captcha"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export function useCaptcha() {
  const [token, setToken] = useState<string | undefined>();
  const ref = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);
  useEffect(() => {
    if (!TURNSTILE_SITEKEY || !ref.current) return;
    let dead = false;
    loadScript()
      .then(() => {
        const ts = (window as unknown as { turnstile?: Turnstile }).turnstile;
        if (dead || !ref.current || !ts) return;
        id.current = ts.render(ref.current, {
          sitekey: TURNSTILE_SITEKEY,
          callback: (t: string) => setToken(t),
          "expired-callback": () => setToken(undefined),
          language: "de",
          appearance: "interaction-only",
        });
      })
      .catch(() => undefined);
    return () => {
      dead = true;
      const ts = (window as unknown as { turnstile?: Turnstile }).turnstile;
      if (id.current && ts) ts.remove(id.current);
    };
  }, []);
  return {
    enabled: !!TURNSTILE_SITEKEY,
    token,
    node: TURNSTILE_SITEKEY ? <div ref={ref} className="captcha" /> : null,
    /** Tokens are single use: reset after every request. */
    reset() {
      setToken(undefined);
      const ts = (window as unknown as { turnstile?: Turnstile }).turnstile;
      if (id.current && ts) ts.reset(id.current);
    },
  };
}
