import { Module, OnModuleDestroy } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { BetterAuthGuard } from './auth.guard';
import { AdminSeedService } from './seeds/admin.seed';
import { authPool } from './auth.config';

@Module({
  controllers: [AuthController],
  providers: [BetterAuthGuard, AdminSeedService],
  exports: [BetterAuthGuard],
})
export class AuthModule implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await authPool.end();
  }
}
