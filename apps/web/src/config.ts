export interface AppConfig {
  apiUrl: string;
}

export const APP_CONFIG: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL ?? "",
};
