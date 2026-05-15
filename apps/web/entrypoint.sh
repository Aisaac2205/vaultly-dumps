#!/bin/sh
# Entrypoint: inject runtime config from container env vars into config.js
# This allows GitOps to pass variables without baking them into the build.

cat > /usr/share/nginx/html/config.js <<EOF
window.APP_CONFIG = {
  apiUrl: "${VITE_API_URL}",
  keycloakUrl: "${VITE_KEYCLOAK_URL}",
  keycloakRealm: "${VITE_KEYCLOAK_REALM}",
  keycloakClientId: "${VITE_KEYCLOAK_CLIENT_ID}",
  appBaseUrl: "${VITE_APP_BASE_URL}",
};
EOF
