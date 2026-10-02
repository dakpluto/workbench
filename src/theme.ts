import { useSyncExternalStore } from "react";

/**
 * Visual themes. The default is the DAKPluto look; others are just token
 * overrides in styles.css under html[data-theme="…"], plus a little copy.
 * The choice is a per-browser preference, so localStorage is fine here.
 */
export type Theme = "default" | "halloween";

const KEY = "wb-theme";
const listeners = new Set<() => void>();

function read(): Theme {
  try {
    return localStorage.getItem(KEY) === "halloween" ? "halloween" : "default";
  } catch {
    return "default";
  }
}

let current: Theme = read();
document.documentElement.dataset.theme = current;

export function setTheme(theme: Theme) {
  current = theme;
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Private mode or blocked storage: the theme just won't be remembered.
  }
  listeners.forEach((l) => l());
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}

/** Words that change with the theme. */
export function themeCopy(theme: Theme) {
  if (theme === "halloween") {
    const now = new Date();
    let halloween = new Date(now.getFullYear(), 9, 31);
    if (now > new Date(now.getFullYear(), 9, 31, 23, 59)) halloween = new Date(now.getFullYear() + 1, 9, 31);
    const days = Math.ceil((halloween.getTime() - now.getTime()) / 86_400_000);
    return {
      headline: "Come in, if you dare.",
      countdown: days <= 0 ? "It's Halloween" : `${days} night${days === 1 ? "" : "s"} until Halloween`,
      surprise: "Trick or treat",
      surpriseGlyph: "🍬",
    };
  }
  return { headline: "Come in and mess around.", countdown: "", surprise: "Surprise me", surpriseGlyph: "⚄" };
}
