import { useEffect, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, login } = useAuth();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      void login();
    }
  }, [isAuthenticated, isInitializing, login]);

  if (isInitializing) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
