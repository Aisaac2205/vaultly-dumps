import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  const login = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  const logout = useCallback(async () => {
    await authClient.signOut();
    navigate("/login");
  }, [navigate]);

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user.role as string) ?? "user",
      }
    : null;

  return {
    user,
    isAuthenticated: !!session?.user,
    isInitializing: isPending,
    login,
    logout,
  };
}
