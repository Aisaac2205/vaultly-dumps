import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  // R2 — required in production, optional in development
  R2_ACCOUNT_ID: Joi.string().allow('').default(''),
  R2_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  R2_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  R2_BUCKET_NAME: Joi.string().allow('').default(''),
  R2_PUBLIC_BASE_URL: Joi.string().uri().allow('').default(''),
  KEYCLOAK_URL: Joi.string().required(),
  KEYCLOAK_REALM: Joi.string().required(),
  KEYCLOAK_CLIENT_ID: Joi.string().required(),
  // Comma-separated list of allowed origins. No wildcard default — if you
  // forget to set it in production you open the API to any browser. Force
  // an explicit value (e.g. "http://localhost:5173,https://app.vaultly.io").
  CORS_ORIGIN: Joi.string().required(),
});
