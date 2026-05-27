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
  // Better Auth
  BETTER_AUTH_SECRET: Joi.string().required(),
  BETTER_AUTH_URL: Joi.string().uri().required(),
  BETTER_AUTH_ADMIN_EMAIL: Joi.string().email({ tlds: false }).optional(),
  BETTER_AUTH_ADMIN_PASSWORD: Joi.string().min(8).optional(),
  // Comma-separated list of allowed origins. No wildcard default — if you
  // forget to set it in production you open the API to any browser. Force
  // an explicit value (e.g. "http://localhost:5173,https://app.vaultly.io").
  // AES-256-GCM key for encrypting connection passwords at rest.
  // Must be a 64-character hex string (32 bytes).
  ENCRYPTION_KEY: Joi.string().hex().length(64).required(),
  CORS_ORIGIN: Joi.string().required(),
  // Rate limiting (requests per minute, per IP). Health endpoint is excluded.
  THROTTLE_TTL_MS: Joi.number().integer().min(1000).default(60_000),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(100),
});
