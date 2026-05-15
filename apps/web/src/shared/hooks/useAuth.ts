import { useState, useEffect, useCallback } from "react";
import { keycloak } from "../lib/keycloak";

let keycloakInitialized = false;
let refreshIntervalId: number | undefined;

export interface AuthUser {
  sub: string;
  email?: string;
  preferred_username: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  token: string | undefined;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

const listeners = new Set<(state: AuthState) => void>();

let authState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitializing: true,
};

function setAuthState(nextState: AuthState): void {
  authState = nextState;
  for (const listener of listeners) {
    listener(authState);
  }
}

function parseJwt(token: string): Record<string, unknown> {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

function extractUser(parsed: Record<string, unknown>): AuthUser {
  return {
    sub: (parsed.sub as string) ?? "",
    email: (parsed.email as string) ?? "",
    preferred_username: (parsed.preferred_username as string) ?? "",
  };
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>(authState);

  const login = useCallback(async () => {
    // Redirects to Keycloak login page (Authorization Code + PKCE)
    await keycloak.login();
  }, []);

  const logout = useCallback(async () => {
    await keycloak.logout({ redirectUri: window.location.href });
  }, []);

  useEffect(() => {
    listeners.add(setState);

    if (!keycloakInitialized) {
      keycloakInitialized = true;

      keycloak
        .init({
          onLoad: "login-required",
          pkceMethod: "S256",
          redirectUri: window.location.href,
          checkLoginIframe: false,
        })
        .then((authenticated) => {
          if (authenticated) {
            const parsed = keycloak.tokenParsed as Record<string, unknown>;
            setAuthState({
              isAuthenticated: true,
              user: extractUser(parsed ?? {}),
              isInitializing: false,
            });

            if (refreshIntervalId === undefined) {
              refreshIntervalId = window.setInterval(() => {
                keycloak.updateToken(60).catch(() => {
                  console.error("Error refrescando token, re-login");
                  void keycloak.login();
                });
              }, 60000);
            }
          } else {
            setAuthState({
              isAuthenticated: false,
              user: null,
              isInitializing: false,
            });
          }
        })
        .catch((error) => {
          console.error("Keycloak init failed:", error);
          setAuthState({
            isAuthenticated: false,
            user: null,
            isInitializing: false,
          });
        });
    }

    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    user: state.user,
    token: keycloak.token,
    isAuthenticated: state.isAuthenticated,
    isInitializing: state.isInitializing,
    login,
    logout,
  };
}
