import { join } from 'path';
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    autoLoadEntities: true,
    synchronize: false,
    migrationsRun: true,
    migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
    logging: process.env.NODE_ENV === 'development',

    // Boot resilience: si la DB no está lista al arranque (Railway / K8s
    // pueden tardar en proveer la network), reintentar antes de tirar el proceso.
    retryAttempts: 10,
    retryDelay: 3000,

    // Pool de pg subyacente. Sin esto, conexiones idle mueren tras minutos
    // de inactividad HTTP y el primer query del cron horario falla con
    // ECONNRESET / "Connection terminated" → unhandled rejection → crash.
    extra: {
      max: 10,
      min: 2,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    },
  }),
);
