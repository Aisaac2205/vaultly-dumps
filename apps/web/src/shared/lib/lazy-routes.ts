import { lazy } from "react";

/**
 * Centralized lazy import map. Use the same module specifier from the router
 * AND from the sidebar prefetch — Vite dedupes both calls to a single chunk,
 * so hovering the sidebar primes the cache for the actual navigation.
 */
export const lazyRoutes = {
  dashboard: () => import("@/features/dashboard"),
  dumps: () => import("@/features/dumps"),
  restore: () => import("@/features/restore"),
  cronjobs: () => import("@/features/cronjobs"),
  connections: () => import("@/features/connections"),
  audit: () => import("@/features/audit"),
} as const;

export type RouteKey = keyof typeof lazyRoutes;

export const LazyDashboard = lazy(lazyRoutes.dashboard);
export const LazyDumps = lazy(lazyRoutes.dumps);
export const LazyRestore = lazy(lazyRoutes.restore);
export const LazyCronjobs = lazy(lazyRoutes.cronjobs);
export const LazyConnections = lazy(lazyRoutes.connections);
export const LazyAudit = lazy(lazyRoutes.audit);
