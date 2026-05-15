export interface AppConfig {
  apiUrl: string;
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
  appBaseUrl: string;
}

export const APP_CONFIG: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL ?? "",
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL ?? "",
  keycloakRealm: import.meta.env.VITE_KEYCLOAK_REALM ?? "",
  keycloakClientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "",
  appBaseUrl: import.meta.env.VITE_APP_BASE_URL ?? "",
};
