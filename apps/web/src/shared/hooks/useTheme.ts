import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "vaultly:theme";

/* ── module-level state (single source of truth) ── */

const listeners = new Set<() => void>();

let matchMediaQuery: MediaQueryList | null = null;

/** Lazily create the prefers-color-scheme query. Safe to call anywhere. */
function ensureQuery(): MediaQueryList | null {
  if (typeof window === "undefined") return null;
  if (!matchMediaQuery) {
    try {
      matchMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return null; // matchMedia not available (e.g. jsdom without mock)
    }
  }
  return matchMediaQuery;
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // localStorage unavailable (private browsing, SSR)
  }
  return "system";
}

function resolveTheme(t: Theme): ResolvedTheme {
  if (t === "system") {
    const mq = ensureQuery();
    if (mq) return mq.matches ? "dark" : "light";
    return "light";
  }
  return t;
}

function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  if (resolved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

let currentTheme: Theme = "system";
let currentResolved: ResolvedTheme = "light";

// Deferred initialisation: resolve theme and apply on first client access.
let initialised = false;

function ensureInitialised(): void {
  if (initialised || typeof window === "undefined") return;
  currentTheme = getStoredTheme();
  currentResolved = resolveTheme(currentTheme);
  applyTheme(currentResolved);
  initialised = true;
}

/* ── snapshot cache for useSyncExternalStore reference stability ── */

let cached: { theme: Theme; resolvedTheme: ResolvedTheme } | null = null;

function getSnapshot(): { theme: Theme; resolvedTheme: ResolvedTheme } {
  ensureInitialised();
  if (
    cached &&
    cached.theme === currentTheme &&
    cached.resolvedTheme === currentResolved
  ) {
    return cached;
  }
  cached = { theme: currentTheme, resolvedTheme: currentResolved };
  return cached;
}

function getServerSnapshot(): { theme: Theme; resolvedTheme: ResolvedTheme } {
  return { theme: "system", resolvedTheme: "light" };
}

/* ── subscribe ── */

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  const mq = ensureQuery();

  function onSystemChange(e: MediaQueryListEvent) {
    if (currentTheme === "system") {
      currentResolved = e.matches ? "dark" : "light";
    }
    applyTheme(currentResolved);
    onStoreChange();
  }

  function onStorageChange(e: StorageEvent) {
    if (e.key === STORAGE_KEY) {
      currentTheme = getStoredTheme();
      currentResolved = resolveTheme(currentTheme);
      applyTheme(currentResolved);
      onStoreChange();
    }
  }

  mq?.addEventListener("change", onSystemChange);
  window.addEventListener("storage", onStorageChange);

  return () => {
    listeners.delete(onStoreChange);
    mq?.removeEventListener("change", onSystemChange);
    window.removeEventListener("storage", onStorageChange);
  };
}

/* ── actions (module-level — stable references) ── */

function setTheme(theme: Theme): void {
  ensureInitialised();
  currentTheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable
  }
  currentResolved = resolveTheme(theme);
  applyTheme(currentResolved);
  for (const fn of listeners) fn();
}

function toggleTheme(): void {
  ensureInitialised();
  const next: Record<Theme, Theme> = {
    light: "dark",
    dark: "system",
    system: "light",
  };
  setTheme(next[currentTheme]);
}

/* ── public contract ── */

export interface ThemeState {
  /** Explicit preference ("light" | "dark" | "system"). */
  theme: Theme;
  /** Actually-applied theme after resolving "system". */
  resolvedTheme: ResolvedTheme;
  /** Persist a new preference. */
  setTheme: (theme: Theme) => void;
  /** Cycle light → dark → system → light. */
  toggleTheme: () => void;
}

export function useTheme(): ThemeState {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return {
    theme: snapshot.theme,
    resolvedTheme: snapshot.resolvedTheme,
    setTheme,
    toggleTheme,
  };
}

/** Reset module-level state (test-only — not part of the public API). */
export function __internalReset(): void {
  matchMediaQuery = null;
  currentTheme = "system";
  currentResolved = "light";
  initialised = false;
  cached = null;
  listeners.clear();
  if (typeof document !== "undefined") {
    document.documentElement.removeAttribute("data-theme");
  }
}
