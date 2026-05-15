/**
 * Centralized runtime configuration.
 *
 * Resolution order:
 *   1. window.APP_CONFIG  — runtime (Docker/GitOps: injected by entrypoint.sh)
 *   2. import.meta.env    — build-time (local development via .env)
 *
 * Rule: never read import.meta.env.VITE_* directly. Always use APP_CONFIG.
 */

export interface AppConfig {
  apiUrl: string;
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
  appBaseUrl: string;
}

declare global {
  interface Window {
    APP_CONFIG?: Partial<AppConfig>;
  }
}

const defaults: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL ?? "",
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL ?? "",
  keycloakRealm: import.meta.env.VITE_KEYCLOAK_REALM ?? "",
  keycloakClientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "",
  appBaseUrl: import.meta.env.VITE_APP_BASE_URL ?? "",
};

export const APP_CONFIG: AppConfig = {
  apiUrl: window.APP_CONFIG?.apiUrl || defaults.apiUrl,
  keycloakUrl: window.APP_CONFIG?.keycloakUrl || defaults.keycloakUrl,
  keycloakRealm: window.APP_CONFIG?.keycloakRealm || defaults.keycloakRealm,
  keycloakClientId: window.APP_CONFIG?.keycloakClientId || defaults.keycloakClientId,
  appBaseUrl: window.APP_CONFIG?.appBaseUrl || defaults.appBaseUrl,
};
