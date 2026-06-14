import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

/** Contract for the theme subsystem. Dark-mode wiring is deferred (locked decision C1). */
export interface ThemeState {
  /** Current resolved theme. Always `"light"` until dark mode is wired. */
  theme: Theme;
  /** No-op toggle. Callers can attach it to a button now; behavior ships later. */
  toggleTheme: () => void;
}

const NOOP_SUBSCRIBE = () => () => {};

function getSnapshot(): Theme {
  return "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

/**
 * Hook contract for theme toggling.
 *
 * Consumers render a toggle button that calls `toggleTheme()`. Today it is a
 * no-op. When dark mode ships, the implementation inside this hook will
 * write `data-theme` on `<html>` and persist the preference — no consumer
 * API changes required.
 */
export function useTheme(): ThemeState {
  const theme = useSyncExternalStore(NOOP_SUBSCRIBE, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    // no-op: dark-mode wiring deferred per locked decision C1
  }, []);

  return { theme, toggleTheme };
}
