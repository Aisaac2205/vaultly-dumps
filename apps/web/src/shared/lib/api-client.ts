import axios from "axios";
import { keycloak } from "./keycloak";
import { APP_CONFIG } from "@/config";

const apiClient = axios.create({
  baseURL: APP_CONFIG.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (keycloak.authenticated && keycloak.token) {
    await keycloak.updateToken(30);
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === "object" && "data" in response.data && "timestamp" in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => Promise.reject(error),
);

export default apiClient;
