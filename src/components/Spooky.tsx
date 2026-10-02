import { setTheme, useTheme } from "../theme";

export function ThemeToggle() {
  const theme = useTheme();
  const on = theme === "halloween";
  return (
    <button
      className="theme-toggle"
      role="switch"
      aria-checked={on}
      onClick={() => setTheme(on ? "default" : "halloween")}
    >
      <span className="theme-toggle-track" aria-hidden>
        <span className="theme-toggle-thumb">🎃</span>
      </span>
      Halloween
    </button>
  );
}

const BAT = "M0 6 C3 2 6 2 8 5 C9 3 10 2 11 2 L12 4 L13 2 C14 2 15 3 16 5 C18 2 21 2 24 6 C21 5 19 6 18 8 C16 7 14 8 12 10 C10 8 8 7 6 8 C5 6 3 5 0 6Z";

/** A few bats that cross the page once when Halloween is switched on. */
export function Bats() {
  return (
    <div className="bats" aria-hidden>
      {[0, 1, 2].map((i) => (
        <svg key={i} className={`bat bat-${i}`} viewBox="0 0 24 11">
          <path d={BAT} />
        </svg>
      ))}
    </div>
  );
}
