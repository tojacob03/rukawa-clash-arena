import { useEffect } from "react";
import type { ReactNode } from "react";
import { BookOpen, Flame, Home, Map as MapIcon, Plus, UserRound } from "lucide-react";
import { APP_NAME, rankOf } from "./core/lore.ts";
import { ki, nf0 } from "./format.ts";
import { go, useArcData, useArcState, useRoute, useToday } from "./store.ts";
import type { Route } from "./store.ts";
import Start from "./pages/Start.tsx";
import Today from "./pages/Today.tsx";
import Log from "./pages/Log.tsx";
import MapPage from "./pages/MapPage.tsx";
import Codex from "./pages/Codex.tsx";
import Held from "./pages/Held.tsx";
import Profil from "./pages/Profil.tsx";

const TITLES: Record<Route, string> = {
  heute: "Heute",
  log: "Training eintragen",
  karte: "Sternkarte",
  codex: "Waza-Codex",
  held: "Charakter",
  profil: "Profil",
};

export default function ArcApp() {
  const data = useArcData();
  const today = useToday();
  const st = useArcState(data, today);
  const { route, arg } = useRoute();

  useEffect(() => {
    document.title = data.profile ? `${TITLES[route]} · ${APP_NAME}` : APP_NAME;
  }, [route, data.profile]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  if (!data.profile) return <Start today={today} />;

  const xpPct = (100 * (st.xp - st.lo)) / (st.hi - st.lo);
  const props = { data, st, today };
  const page =
    route === "log" ? (
      <Log key={today} {...props} />
    ) : route === "karte" ? (
      <MapPage {...props} arg={arg} />
    ) : route === "codex" ? (
      <Codex {...props} />
    ) : route === "held" ? (
      <Held {...props} />
    ) : route === "profil" ? (
      <Profil {...props} />
    ) : (
      <Today {...props} />
    );

  return (
    <div className={`arc route-${route}`}>
      <button type="button" className="skip" onClick={() => document.getElementById("arc-main")?.focus()}>
        Zum Inhalt
      </button>
      <header className="hud">
        <button type="button" className="hud-brand" onClick={() => go("heute")} aria-label={`${APP_NAME}, zur Startseite`}>
          <svg className="logo-mark" viewBox="0 0 512 512" aria-hidden="true">
            <polygon points="256,86 403,171 403,341 256,426 109,341 109,171" fill="none" stroke="currentColor" strokeWidth="30" strokeLinejoin="round" />
            <path d="M256 160 L282 230 L352 256 L282 282 L256 352 L230 282 L160 256 L230 230 Z" fill="currentColor" />
          </svg>
          <span className="logo-word">
            WAZA <b>ARC</b>
          </span>
        </button>
        <button type="button" className="hud-lv" onClick={() => go("held")} aria-label={`Level ${st.lvl}, ${rankOf(st.lvl)}. Zum Charakterbogen`}>
          <span className="hex-badge small">
            <b>{st.lvl}</b>
          </span>
          <span className="hud-lv-main">
            <span className="hud-rank">{rankOf(st.lvl)}</span>
            <span className="xpbar" aria-hidden="true">
              <i style={{ width: `${xpPct.toFixed(1)}%` }} />
            </span>
            <span className="hud-xp">
              {nf0.format(st.xp - st.lo)} / {nf0.format(st.hi - st.lo)} XP
            </span>
          </span>
        </button>
        <div className="hud-stats">
          <span className="hud-stat" title="Ki: Elo-Rating aus deinen Rolls, mal 10">
            <small>Ki</small>
            <b>{ki(st.ru)}</b>
          </span>
          <span className={`hud-stat flame${st.weekNow >= st.weekGoal ? " lit" : ""}`} title="Wochen in Folge mit erreichtem Wochenziel">
            <Flame size={16} aria-hidden="true" />
            <b>{st.streak}</b>
          </span>
          <button type="button" className="hud-me" onClick={() => go("profil")} aria-label="Profil">
            <UserRound size={18} />
          </button>
        </div>
        {data.demo ? (
          <p className="demo-flag">
            Demo-Dōjō mit Beispieldaten ·{" "}
            <button type="button" className="linkish" onClick={() => go("profil")}>
              verlassen
            </button>
          </p>
        ) : null}
      </header>

      <main id="arc-main" className="main" tabIndex={-1}>
        {page}
      </main>

      <nav className="nav" aria-label="Hauptnavigation">
        <NavItem route="heute" current={route} icon={<Home size={20} />} label="Heute" />
        <NavItem route="karte" current={route} icon={<MapIcon size={20} />} label="Karte" />
        <button type="button" className={`nav-log${route === "log" ? " on" : ""}`} onClick={() => go("log")} aria-label="Training eintragen">
          <span>
            <Plus size={26} />
          </span>
        </button>
        <NavItem route="codex" current={route} icon={<BookOpen size={20} />} label="Codex" />
        <NavItem route="held" current={route} icon={<UserRound size={20} />} label="Held" />
      </nav>
    </div>
  );
}

function NavItem({ route, current, icon, label }: { route: Route; current: Route; icon: ReactNode; label: string }) {
  const on = route === current;
  return (
    <button type="button" className={`nav-item${on ? " on" : ""}`} aria-current={on ? "page" : undefined} onClick={() => go(route)}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
