import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { auth, authPool } from '../auth.config';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  async onApplicationBootstrap(): Promise<void> {
    const email = process.env.BETTER_AUTH_ADMIN_EMAIL;
    const password = process.env.BETTER_AUTH_ADMIN_PASSWORD;

    if (!email || !password) {
      this.logger.warn(
        'BETTER_AUTH_ADMIN_EMAIL or BETTER_AUTH_ADMIN_PASSWORD not set — skipping admin seed',
      );
      return;
    }

    try {
      // Check if admin user already exists
      const { rows } = await authPool.query(
        'SELECT "id", "role" FROM "user" WHERE "email" = $1',
        [email],
      );

      if (rows.length > 0) {
        if (rows[0].role === 'admin') {
          this.logger.log('Admin user already exists — skipping seed');
          return;
        }
        // User exists but isn't admin — promote
        await authPool.query(
          'UPDATE "user" SET "role" = $1 WHERE "id" = $2',
          ['admin', rows[0].id],
        );
        this.logger.log('Existing user promoted to admin');
        return;
      }

      // Create user via public signup (no admin session needed)
      const result = await auth.api.signUpEmail({
        body: { email, password, name: 'Admin' },
      });

      // Set role directly in DB — auth.api.setRole requires an admin
      // session which doesn't exist yet (chicken-and-egg).
      await authPool.query(
        'UPDATE "user" SET "role" = $1 WHERE "id" = $2',
        ['admin', result.user.id],
      );

      this.logger.log('Default admin user created');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);

      if (message.includes('already') || message.includes('unique')) {
        this.logger.log('Admin user already exists — skipping seed');
        return;
      }

      this.logger.error(`Failed to seed admin user: ${message}`);
    }
  }
}
