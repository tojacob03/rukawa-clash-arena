// Papier (light), Nacht (indigo night edition) or follow the system.
import { useEffect, useState } from "react";

export type ThemeChoice = "system" | "papier" | "nacht";
const KEY = "waza-arc.theme";

function read(): ThemeChoice {
  try {
    const t = localStorage.getItem(KEY);
    return t === "papier" || t === "nacht" ? t : "system";
  } catch {
    return "system";
  }
}

function apply(t: ThemeChoice) {
  const el = document.documentElement;
  if (t === "system") delete el.dataset.theme;
  else el.dataset.theme = t;
}

export function useTheme(): [ThemeChoice, (t: ThemeChoice) => void] {
  const [t, setT] = useState<ThemeChoice>(read);
  useEffect(() => apply(t), [t]);
  const set = (next: ThemeChoice) => {
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable: the choice lasts for this visit */
    }
    setT(next);
  };
  return [t, set];
}
