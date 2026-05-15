import { DataSource } from 'typeorm';
import { ConnectionEntity } from '../../database/entities/connection.entity';
import { Environment } from '../../database/enums/environment.enum';
import { DbTypeEnum } from '../../database/enums/db-type.enum';

interface SeedConnection {
  name: string;
  environment: Environment;
  host: string | undefined;
  port: number;
  database: string | undefined;
  username: string | undefined;
  password: string | undefined;
  dbType: DbTypeEnum;
  isActive: boolean;
}

async function seedConnections(dataSource: DataSource): Promise<void> {
  const connections: SeedConnection[] = [
    {
      name: 'Keycloak Production',
      environment: Environment.PROD,
      host: process.env.KC_DB_HOST,
      port: 5432,
      database: process.env.KC_DB_NAME,
      username: process.env.KC_DB_USER,
      password: process.env.KC_DB_PASSWORD,
      dbType: DbTypeEnum.POSTGRES,
      isActive: true,
    },
    {
      name: 'GLPI Production',
      environment: Environment.PROD,
      host: process.env.GLPI_DB_HOST,
      port: 3306,
      database: process.env.GLPI_DB_NAME,
      username: process.env.GLPI_DB_USER,
      password: process.env.GLPI_DB_PASSWORD,
      dbType: DbTypeEnum.MYSQL,
      isActive: true,
    },
    {
      name: 'SQUASH Production',
      environment: Environment.PROD,
      host: process.env.SQUASH_DB_HOST,
      port: 5432,
      database: process.env.SQUASH_DB_NAME,
      username: process.env.SQUASH_DB_USER,
      password: process.env.SQUASH_DB_PASSWORD,
      dbType: DbTypeEnum.POSTGRES,
      isActive: true,
    },
  ];

  const repository = dataSource.getRepository(ConnectionEntity);

  for (const conn of connections) {
    if (!conn.host || !conn.database || !conn.username || !conn.password) {
      console.log(`[SKIP] ${conn.name}: missing environment variables`);
      continue;
    }

    const existing = await repository.findOne({ where: { name: conn.name } });

    if (existing) {
      console.log(`[SKIP] ${conn.name}: already exists`);
      continue;
    }

    const entity = repository.create({
      name: conn.name,
      environment: conn.environment,
      host: conn.host,
      port: conn.port,
      database: conn.database,
      username: conn.username,
      password: conn.password,
      dbType: conn.dbType,
      isActive: conn.isActive,
    });

    await repository.save(entity);
    console.log(`[INSERT] ${conn.name} (${conn.dbType} @ ${conn.host}:${conn.port}/${conn.database})`);
  }
}

async function bootstrap(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    database: process.env.DB_NAME ?? 'vaultly_control',
    username: process.env.DB_USER ?? 'vaultly_control',
    password: process.env.DB_PASSWORD ?? 'vaultly_control',
    entities: [ConnectionEntity],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('[DB] Connected to database');
    await seedConnections(dataSource);
    console.log('[SEED] Done');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Failed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

void bootstrap();
