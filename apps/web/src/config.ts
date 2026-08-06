export interface AppConfig {
  /**
   * Bare API origin. Better Auth appends its own `/api/auth` base path,
   * so this must NOT carry the global prefix.
   */
  apiUrl: string;
  /**
   * Base URL for domain endpoints, which the API mounts under a global
   * `/api` prefix. Empty `apiUrl` yields a relative `/api`, letting the
   * SPA talk to a same-origin reverse proxy.
   */
  apiBaseUrl: string;
}

const apiUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export const APP_CONFIG: AppConfig = {
  apiUrl,
  apiBaseUrl: `${apiUrl}/api`,
};
