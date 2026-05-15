import { registerAs } from '@nestjs/config';

export default registerAs('keycloak', () => {
  const url = process.env.KEYCLOAK_URL;
  const realm = process.env.KEYCLOAK_REALM;
  return {
    url,
    realm,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    jwksUri: `${url}/realms/${realm}/protocol/openid-connect/certs`,
  };
});
