import { createContext, use, useState, useEffect, useCallback, type ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type SidebarState = "expanded" | "collapsed";

interface SidebarContextValue {
  state: SidebarState;
  toggle: () => void;
  setState: (s: SidebarState) => void;
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                    */
/* -------------------------------------------------------------------------- */

const SidebarStateContext = createContext<SidebarContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/*  localStorage helpers                                                       */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "vaultly:sidebar-state";

function readStoredState(): SidebarState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "expanded" || stored === "collapsed") return stored;
  } catch {
    /* localStorage unavailable (SSR / test) */
  }
  return "expanded";
}

/* -------------------------------------------------------------------------- */
/*  Provider                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Provides collapse state to the entire layout shell.
 * Persists preference to localStorage under `vaultly:sidebar-state`.
 *
 * Renders nothing but a context provider — no DOM output.
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SidebarState>(readStoredState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, state);
    } catch {
      /* localStorage unavailable */
    }
  }, [state]);

  const toggle = useCallback(() => {
    setState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
  }, []);

  return (
    <SidebarStateContext value={{ state, toggle, setState }}>
      {children}
    </SidebarStateContext>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Access collapse state and toggle action.
 *
 * When called outside a `<SidebarProvider>`, returns a safe default:
 * `{ state: "expanded", toggle: noop, setState: noop }` so compound
 * sidebar sub-components can render normally without a provider.
 */
export function useSidebar(): SidebarContextValue {
  const ctx = use(SidebarStateContext);

  if (ctx) return ctx;

  // Safe default for compound sub-components used outside a provider
  // (e.g. mobile sheet rendered before SidebarProvider, or standalone tests)
  return {
    state: "expanded",
    toggle: () => {},
    setState: () => {},
  };
}
