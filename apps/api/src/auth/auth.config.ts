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
    // 'none' + partitioned only exists to support a browser that talks to
    // the api on a different origin than the web app. The supported
    // deployment path is the nginx reverse proxy (see
    // apps/web/templates/default.conf.template), which puts both behind
    // one origin — 'lax' is the correct, less CSRF-exposed default for
    // that, and localhost dev already qualifies too: SameSite compares
    // registrable domains, not ports, so localhost:5173 and
    // localhost:3000 count as the same site.
    defaultCookieAttributes: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  },
});

export type BetterAuthSession = typeof auth.$Infer.Session;
