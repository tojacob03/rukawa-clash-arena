import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BookOpen, Flame, Home, Map as MapIcon, Plus, Settings, UserRound } from "lucide-react";
import { APP_NAME, rankOf } from "./core/lore.ts";
import { nf0, power } from "./format.ts";
import { go, useArcData, useArcState, useRoute, useToday } from "./store.ts";
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
import Scouter from "./components/Scouter.tsx";
import Avatar from "./components/Avatar.tsx";
import { useGear } from "./useGear.ts";
import { powerOf, powerTier, selfRows } from "./scan.ts";

const TITLES: Record<Route, string> = {
  heute: "Heute",
  log: "Training eintragen",
  karte: "Sternkarte",
  meer: "Seekarte",
  codex: "Waza-Codex",
  held: "Charakter",
  profil: "Profil",
};

export default function ArcApp() {
  const data = useArcData();
  const today = useToday();
  const st = useArcState(data, today);
  const { route, arg } = useRoute();
  const [scan, setScan] = useState(false);
  useEffect(() => {
    const open = () => setScan(true);
    window.addEventListener("arc:scan", open);
    return () => window.removeEventListener("arc:scan", open);
  }, []);
  const g = useGear(data, st);

  useEffect(() => {
    document.title = data.profile ? `${TITLES[route]} – ${APP_NAME}` : APP_NAME;
  }, [route, data.profile]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  if (!data.profile) return <Start today={today} />;

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
          <span className="logo-word">Waza Arc</span>
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
          <button type="button" className="hud-stat pl" title="Power Level: Elo-Rating aus deinen Rolls, mal 10. Tippen öffnet den Scouter." onClick={() => setScan(true)}>
            <small>Power Level</small>
            <b>{power(st.ru)}</b>
          </button>
          <span className={`hud-stat flame${st.weekNow >= st.weekGoal ? " lit" : ""}`} title="Wochen in Folge mit erreichtem Wochenziel">
            <Flame size={18} aria-hidden="true" />
            <b>{st.streak}</b>
            <span className="sr-only"> Wochen Flamme</span>
          </span>
          <button type="button" className="hud-me" onClick={() => go("profil")} aria-label="Profil und Einstellungen">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {scan && data.profile ? (
        <Scouter
          onClose={() => setScan(false)}
          target={{
            name: data.profile.name,
            power: powerOf(st.ru),
            tier: powerTier(st.ru),
            rows: selfRows(data, st, today),
            portrait: <Avatar look={g.character.look} mode={g.character.mode} gear={g.gear} belt={data.profile.belt} stripes={data.profile.stripes} weightKg={data.profile.weightKg} size={180} still />,
            foot: "Das Power Level ist dein Elo-Rating aus Rolls und Turnierkämpfen, mal zehn.",
          }}
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

      <nav className="nav" aria-label="Hauptnavigation">
        <NavItem route="heute" current={route} icon={<Home size={20} />} label="Heute" />
        <NavItem route="karte" current={route === "meer" ? "karte" : route} icon={<MapIcon size={20} />} label="Karte" />
        <button type="button" className={`nav-log${route === "log" ? " on" : ""}`} aria-current={route === "log" ? "page" : undefined} onClick={() => go("log")}>
          <span className="stamp-btn" aria-hidden="true">
            <Plus size={28} strokeWidth={2.6} />
          </span>
          <span>Eintragen</span>
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
