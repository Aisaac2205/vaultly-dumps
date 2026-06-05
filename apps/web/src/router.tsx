import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./shared/components/ProtectedRoute";
import { Layout } from "./shared/components/Layout";
import { RouteFallback } from "./shared/components/RouteFallback";
import { useAuth } from "./shared/hooks/useAuth";
import {
  LazyDashboard,
  LazyDumps,
  LazyCleanup,
  LazyRestore,
  LazyCronjobs,
  LazyConnections,
  LazyAudit,
} from "./shared/lib/lazy-routes";

const LazyLoginPage = lazy(() => import("./features/auth/LoginPage"));
const LazyUsers = lazy(() => import("./features/users"));

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
    path: "/login",
    element: (
      <Suspense fallback={null}>
        <LazyLoginPage />
      </Suspense>
    ),
  },
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
      <ProtectedRoute requiredRole="admin">
        <AuthenticatedLayout>
          <LazyDumps />
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/cleanup",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AuthenticatedLayout>
          <LazyCleanup />
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
      <ProtectedRoute requiredRole="admin">
        <AuthenticatedLayout>
          <LazyConnections />
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/users",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AuthenticatedLayout>
          <LazyUsers />
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
