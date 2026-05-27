import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { Pool } from 'pg';

export const authPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

export const auth = betterAuth({
  database: authPool,
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : [],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [admin()],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      partitioned: process.env.NODE_ENV === 'production',
    },
  },
});

export type BetterAuthSession = typeof auth.$Infer.Session;
