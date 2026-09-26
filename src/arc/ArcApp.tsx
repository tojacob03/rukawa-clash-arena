import { useEffect, useState } from "react";
import { Flame, Settings } from "lucide-react";
import { APP_NAME, rankOf } from "./core/lore.ts";
import { nf0, power } from "./format.ts";
import { arcStore, go, useArcData, useArcState, useRoute, useToday } from "./store.ts";
import type { Route } from "./store.ts";
import Start from "./pages/Start.tsx";
import Today from "./pages/Today.tsx";
import Log from "./pages/Log.tsx";
import Turnier from "./pages/Turnier.tsx";
import Nebensport from "./pages/Nebensport.tsx";
import MapPage from "./pages/MapPage.tsx";
import Codex from "./pages/Codex.tsx";
import SeaPage from "./pages/SeaPage.tsx";
import Held from "./pages/Held.tsx";
import Profil from "./pages/Profil.tsx";
import Konto from "./pages/Konto.tsx";
import Plan from "./pages/Plan.tsx";
import Matte from "./pages/Matte.tsx";
import Gym from "./pages/Gym.tsx";
import Einladung from "./pages/Einladung.tsx";
import { CloudBadge, CloudDialogs } from "./components/CloudDialogs.tsx";
import Scouter from "./components/Scouter.tsx";
import Avatar from "./components/Avatar.tsx";
import { useGear } from "./useGear.ts";
import type { ScoutRequest } from "./scan.ts";
import { normalizePlan, occurrences } from "./core/schedule.ts";
import { buildPreview } from "./plan.ts";
import { setBadge } from "./push.ts";
import { useSocialPublish } from "./socialCard.ts";
import { preloadMotion } from "./motion.ts";
import InkVeil from "./components/InkVeil.tsx";
import { isOpen } from "./core/unlocks.ts";
import { jumpTop, startSmooth } from "./smooth.ts";

const TITLES: Record<Route, string> = {
  heute: "Heute",
  log: "Training eintragen",
  karte: "Zweig",
  meer: "Seekarte",
  codex: "Waza-Codex",
  held: "Charakter",
  profil: "Profil",
  konto: "Konto",
  plan: "Wochenplan",
  matte: "Auf der Matte",
  gym: "Gym",
  einladung: "Einladung",
};

export default function ArcApp() {
  const data = useArcData();
  const today = useToday();
  const st = useArcState(data, today);
  const { route, arg } = useRoute();
  const [scan, setScan] = useState<ScoutRequest | null>(null);
  useEffect(() => {
    const open = (e: Event) => setScan((e as CustomEvent<ScoutRequest | undefined>).detail ?? { mode: "du" });
    window.addEventListener("arc:scan", open);
    return () => window.removeEventListener("arc:scan", open);
  }, []);
  const g = useGear(data, st);
  // Friends and the crew see your card; keep it current while that is switched on.
  useSocialPublish(data, st, today);

  useEffect(preloadMotion, []);

  // The header floats over the page until it scrolls, then it gets its own ground.
  useEffect(() => {
    const el = document.documentElement;
    const on = () => el.classList.toggle("scrolled", window.scrollY > 6);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.title = data.profile ? `${TITLES[route]} – ${APP_NAME}` : APP_NAME;
  }, [route, data.profile]);

  // A new page (or the first one after the start screen) opens at its top.
  const entered = !!data.profile;
  useEffect(() => {
    jumpTop();
  }, [route, entered]);

  // Smooth scrolling with a mouse or trackpad (smooth.ts).
  useEffect(() => startSmooth(), []);

  // Reminders from the server name the quest: keep a short preview of the next week in the plan.
  useEffect(() => {
    const plan = normalizePlan(data.plan);
    if (!data.profile || data.demo || !plan || !(plan.push || plan.email) || !plan.slots.some((s) => s.remind)) return;
    const t = window.setTimeout(() => {
      const preview = buildPreview(data, st, plan, Date.now());
      if (JSON.stringify(preview) !== JSON.stringify(plan.preview ?? [])) arcStore.set((d) => (d.plan ? { ...d, plan: { ...d.plan, preview } } : d));
    }, 1500);
    return () => window.clearTimeout(t);
  }, [data, st]);

  // App icon badge: a planned BJJ training today that is not logged yet.
  useEffect(() => {
    const plan = normalizePlan(data.plan);
    if (!plan || data.demo) return setBadge(0);
    const now = Date.now();
    const open = occurrences(plan, now - 18 * 3600_000, now + 18 * 3600_000).some((o) => o.date === today && o.slot.sport === "bjj");
    setBadge(open && !data.sessions.some((s) => s.date === today) ? 1 : 0);
  }, [data, today]);

  if (!data.profile) {
    return (
      <>
        {route === "konto" ? (
          <div className="arc route-konto solo">
            <main id="arc-main" className="main" tabIndex={-1}>
              <button type="button" className="linkish back-link" onClick={() => go("heute")}>
                Zurück zum Start
              </button>
              <Konto data={data} />
            </main>
          </div>
        ) : (
          <Start today={today} />
        )}
        <CloudDialogs />
      </>
    );
  }

  if (route === "matte") {
    return (
      <div className="arc route-matte solo">
        <main id="arc-main" className="main" tabIndex={-1}>
          <Matte data={data} st={st} today={today} />
        </main>
        <CloudDialogs />
      </div>
    );
  }

  const xpPct = (100 * (st.xp - st.lo)) / (st.hi - st.lo);
  const props = { data, st, today };
  const page =
    route === "log" ? (
      arg === "turnier" ? (
        <Turnier key={`t${today}`} {...props} />
      ) : arg === "nebensport" ? (
        <Nebensport key={`n${today}`} {...props} />
      ) : (
        <Log key={today} {...props} />
      )
    ) : route === "karte" ? (
      <MapPage {...props} arg={arg} />
    ) : route === "meer" ? (
      <SeaPage {...props} arg={arg} />
    ) : route === "codex" ? (
      <Codex {...props} />
    ) : route === "held" ? (
      <Held {...props} arg={arg} />
    ) : route === "profil" ? (
      <Profil {...props} />
    ) : route === "konto" ? (
      <Konto data={data} />
    ) : route === "plan" ? (
      <Plan data={data} />
    ) : route === "gym" ? (
      <Gym {...props} />
    ) : route === "einladung" ? (
      <Einladung {...props} arg={arg} />
    ) : (
      <Today {...props} />
    );

  return (
    <div className={`arc route-${route}`}>
      <button type="button" className="skip" onClick={() => document.getElementById("arc-main")?.focus()}>
        Zum Inhalt
      </button>
      {/* Experience runs along the top edge of the screen as a gold seam. */}
      <div className="xp-seam" role="progressbar" aria-label={`XP bis Level ${st.lvl + 1}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(xpPct)}>
        <i style={{ width: `${xpPct.toFixed(1)}%` }} />
      </div>
      <header className="hud">
        <button type="button" className="hud-brand" onClick={() => go("heute")} aria-label={`${APP_NAME}, zur Startseite`}>
          <LogoMark />
        </button>
        <button type="button" className="hud-lv" onClick={() => go("held")} aria-label={`Level ${st.lvl}, ${rankOf(st.lvl)}. Zum Charakterbogen`}>
          <span className="hex-badge small">
            <b>{st.lvl}</b>
          </span>
          <span className="hud-lv-main">
            <span className="hud-rank">{rankOf(st.lvl)}</span>
            <span className="hud-xp">
              {nf0.format(st.xp - st.lo)} / {nf0.format(st.hi - st.lo)} XP
            </span>
          </span>
        </button>
        <div className="hud-stats">
          {isOpen(data, "power") ? (
            <button type="button" className="hud-stat pl" title="Power Level aus deinen Rolls und Turnierkämpfen: 100 Elo-Punkte mehr verdoppeln es. Tippen öffnet den Scouter." onClick={() => setScan({ mode: "du" })}>
              <b>{power(st.ru)}</b>
              <small>Power Level</small>
            </button>
          ) : null}
          <span className={`hud-stat flame${st.weekNow >= st.weekGoal ? " lit" : ""}`} title="Wochen in Folge mit erreichtem Wochenziel">
            <Flame size={16} aria-hidden="true" />
            <b>{st.streak}</b>
            <span className="sr-only"> Wochen Flamme</span>
          </span>
          <CloudBadge />
          <button type="button" className="hud-me" onClick={() => go("profil")} aria-label="Profil und Einstellungen">
            <Settings size={17} />
          </button>
        </div>
      </header>

      <CloudDialogs />
      {scan && data.profile ? (
        <Scouter
          key={`${scan.mode}-${scan.belt ?? ""}-${scan.size ?? ""}`}
          req={scan}
          data={data}
          st={st}
          onClose={() => setScan(null)}
          portrait={<Avatar look={g.character.look} mode={g.character.mode} gear={g.gear} belt={data.profile.belt} stripes={data.profile.stripes} weightKg={data.profile.weightKg} heightCm={data.profile.heightCm} size={180} still />}
        />
      ) : null}
      <main id="arc-main" className="main" tabIndex={-1}>
        {data.demo ? (
          <p className="demo-flag">
            Du schaust dir das Demo-Dōjō mit Beispieldaten an.
            <button type="button" className="linkish" onClick={() => go("profil")}>
              Demo verlassen
            </button>
          </p>
        ) : null}
        {page}
      </main>

      {/* Sections by their kanji; logging a training is pressing the dōjō's seal. */}
      <nav className="nav" aria-label="Hauptnavigation">
        <span className="nav-brand" aria-hidden="true">
          <LogoMark />
        </span>
        <NavItem route="heute" current={route} kanji="今" label="Heute" />
        <NavItem route="karte" current={route === "meer" ? "karte" : route} kanji="図" label="Karte" />
        <button type="button" className={`nav-log${route === "log" ? " on" : ""}`} aria-current={route === "log" ? "page" : undefined} onClick={() => go("log")}>
          <span className="stamp-btn" aria-hidden="true">
            記
          </span>
          <span className="nl">Eintragen</span>
        </button>
        <NavItem route="codex" current={route} kanji="書" label="Codex" />
        <NavItem route="held" current={route} kanji="武" label="Held" />
      </nav>
      <InkVeil route={route} />
    </div>
  );
}

function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 512 512" aria-hidden="true">
      <polygon points="256,86 403,171 403,341 256,426 109,341 109,171" fill="none" stroke="currentColor" strokeWidth="30" strokeLinejoin="round" />
      <path d="M256 160 L282 230 L352 256 L282 282 L256 352 L230 282 L160 256 L230 230 Z" fill="currentColor" />
    </svg>
  );
}

function NavItem({ route, current, kanji, label }: { route: Route; current: Route; kanji: string; label: string }) {
  const on = route === current;
  return (
    <button type="button" className={`nav-item${on ? " on" : ""}`} aria-current={on ? "page" : undefined} onClick={() => go(route)}>
      <span className="nk" aria-hidden="true">
        {kanji}
      </span>
      <span className="nl">{label}</span>
    </button>
  );
}
