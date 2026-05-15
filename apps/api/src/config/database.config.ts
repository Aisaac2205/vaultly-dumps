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
  }),
);
