import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { lazyRoutes, type RouteKey } from "./shared/lib/lazy-routes";

const PRELOAD_KEYS: readonly RouteKey[] = [
  "dumps",
  "cronjobs",
  "restore",
  "connections",
] as const;

function schedulePreload(cb: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(cb, { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }
  const t = window.setTimeout(cb, 2000);
  return () => window.clearTimeout(t);
}

export function App() {
  useEffect(() => {
    const cancel = schedulePreload(() => {
      for (const key of PRELOAD_KEYS) {
        void lazyRoutes[key]();
      }
    });
    return cancel;
  }, []);

  return <RouterProvider router={router} />;
}
