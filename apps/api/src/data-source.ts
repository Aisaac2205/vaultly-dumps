import 'reflect-metadata';
import { join } from 'path';
import { DataSource } from 'typeorm';

// DataSource standalone para el CLI de TypeORM (migration:generate, migration:run, etc.).
//
// ¿Por qué existe este archivo SI YA tenemos `database.config.ts`?
// - `database.config.ts` configura el TypeOrmModule de NestJS — vive dentro del
//   runtime de la app, usa @nestjs/config para leer env vars, y solo se activa
//   cuando la app arranca con `nest start`.
// - El CLI de TypeORM (`typeorm migration:generate ...`) corre FUERA de NestJS,
//   sin DI, sin ConfigModule. Necesita un export de tipo `DataSource` desde un
//   archivo TS/JS plano. Eso es lo que provee este archivo.
//
// Las dos configs deben mantenerse consistentes en `type`, `url` y `migrations`.
// `synchronize` y `migrationsRun` NO van acá: son responsabilidades del runtime,
// no del CLI.
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'database/migrations/*{.ts,.js}')],
});
