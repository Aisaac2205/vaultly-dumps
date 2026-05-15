import { Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./shared/components/ProtectedRoute";
import { Layout } from "./shared/components/Layout";
import { RouteFallback } from "./shared/components/RouteFallback";
import { useAuth } from "./shared/hooks/useAuth";
import {
  LazyDashboard,
  LazyDumps,
  LazyRestore,
  LazyCronjobs,
  LazyConnections,
  LazyAudit,
} from "./shared/lib/lazy-routes";

function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <Layout user={user} onLogout={logout}>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </Layout>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <LazyDashboard />
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dumps",
    element: (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <LazyDumps />
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/restore",
    element: (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <LazyRestore />
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/cronjobs",
    element: (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <LazyCronjobs />
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/connections",
    element: (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <LazyConnections />
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/audit",
    element: (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <LazyAudit />
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
]);
