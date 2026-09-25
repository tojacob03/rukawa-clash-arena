// Urushi (black lacquer, the default), Washi (paper) or follow the system.
// The ids stay "nacht" and "papier" so a choice made before the redesign
// still means dark or light.
import { useEffect, useState } from "react";

export type ThemeChoice = "system" | "papier" | "nacht";
const KEY = "waza-arc.theme";

function read(): ThemeChoice {
  try {
    const t = localStorage.getItem(KEY);
    return t === "papier" || t === "system" ? t : "nacht";
  } catch {
    return "nacht";
  }
}

function apply(t: ThemeChoice) {
  const el = document.documentElement;
  if (t === "nacht") delete el.dataset.theme;
  else el.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  const light = t === "papier" || (t === "system" && window.matchMedia?.("(prefers-color-scheme: light)").matches);
  meta?.setAttribute("content", light ? "#EEE6D6" : "#0F0C0A");
}

export function useTheme(): [ThemeChoice, (t: ThemeChoice) => void] {
  const [t, setT] = useState<ThemeChoice>(read);
  useEffect(() => apply(t), [t]);
  const set = (next: ThemeChoice) => {
    try {
      if (next === "nacht") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable: the choice lasts for this visit */
    }
    setT(next);
  };
  return [t, set];
}
