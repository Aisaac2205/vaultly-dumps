import type Keycloak from "keycloak-js";
import KeycloakClient from "keycloak-js";
import { APP_CONFIG } from "@/config";

const keycloakConfig = {
  url: APP_CONFIG.keycloakUrl,
  realm: APP_CONFIG.keycloakRealm,
  clientId: APP_CONFIG.keycloakClientId,
};

const instance = new KeycloakClient(keycloakConfig);

export { instance as keycloak };
export type { Keycloak };
