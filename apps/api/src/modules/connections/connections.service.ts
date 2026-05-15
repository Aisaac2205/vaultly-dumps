import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Client } from 'pg';
import { createConnection as createMysqlConnection } from 'mysql2/promise';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { TestRawConnectionDto } from './dto/test-raw-connection.dto';
import { ConnectionsRepository } from './connections.repository';
import { ConnectionTestResult } from './interfaces/connection-test-result.interface';
import { DbTypeEnum } from '../../database/enums/db-type.enum';
import { Environment } from '../../database/enums/environment.enum';
import { resolveUniqueSlug, slugify } from '../../common/utils/slugify';

const CONNECTION_TEST_TIMEOUT_MS = 5_000;

interface ConnectionParams {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dbType: DbTypeEnum;
}

export interface ConnectionDetail {
  name: string;
  dbType: DbTypeEnum;
}

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly repository: ConnectionsRepository,
  ) {}

  async findAll(environment?: string) {
    if (environment === undefined || environment === '') {
      return this.repository.findAll();
    }
    if (!Object.values(Environment).includes(environment as Environment)) {
      throw new BadRequestException(
        `Environment inválido: "${environment}". Valores válidos: ${Object.values(Environment).join(', ')}`,
      );
    }
    return this.repository.findByEnvironment(environment as Environment);
  }

  async findByIds(ids: string[]): Promise<Map<string, string>> {
    const connections = await this.repository.findByIds(ids);
    return new Map(connections.map((c) => [c.id, c.name]));
  }

  async findDetailsByIds(ids: string[]): Promise<Map<string, ConnectionDetail>> {
    const connections = await this.repository.findByIds(ids);
    return new Map(
      connections.map((c) => [c.id, { name: c.name, dbType: c.dbType }]),
    );
  }

  async findById(id: string) {
    const connection = await this.repository.findById(id);
    if (!connection) {
      throw new NotFoundException(`Conexión con ID "${id}" no encontrada`);
    }
    return connection;
  }

  async findBySlug(slug: string) {
    const connection = await this.repository.findBySlug(slug);
    if (!connection) {
      throw new NotFoundException(`Conexión con slug "${slug}" no encontrada`);
    }
    return connection;
  }

  async create(dto: CreateConnectionDto) {
    const slug = await this.generateUniqueSlug(dto.name);
    return this.repository.create({ ...dto, slug });
  }

  // Slug is server-managed and immutable per architecture decision: the
  // first segment of every R2 backup key is the slug, so changing it would
  // orphan historical dumps. Generated once at creation; never recomputed
  // on update even if the name changes.
  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    const reserved = new Set(await this.repository.findAllSlugs());
    return resolveUniqueSlug(base, reserved);
  }

  async update(id: string, dto: UpdateConnectionDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Conexión con ID "${id}" no encontrada`);
    }
    return this.repository.update(id, dto);
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Conexión con ID "${id}" no encontrada`);
    }
    await this.repository.softDelete(id);
  }

  async testByConnectionId(id: string): Promise<ConnectionTestResult> {
    const connection = await this.repository.findById(id);
    if (!connection) {
      return { success: false, error: `Conexión con ID "${id}" no encontrada` };
    }
    return this.testConnection({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: connection.password,
      dbType: connection.dbType,
    });
  }

  async testRaw(dto: TestRawConnectionDto): Promise<ConnectionTestResult> {
    return this.testConnection({
      host: dto.host,
      port: dto.port,
      database: dto.database,
      username: dto.username,
      password: dto.password,
      dbType: dto.dbType,
    });
  }

  async testConnection(params: ConnectionParams): Promise<ConnectionTestResult> {
    if (params.dbType === DbTypeEnum.MYSQL) {
      return this.testMysqlConnection(params);
    }
    return this.testPostgresConnection(params);
  }

  private async testPostgresConnection(params: ConnectionParams): Promise<ConnectionTestResult> {
    const client = new Client({
      host: params.host,
      port: params.port,
      database: params.database,
      user: params.username,
      password: params.password,
      connectionTimeoutMillis: CONNECTION_TEST_TIMEOUT_MS,
    });

    const start = Date.now();

    try {
      await client.connect();
      const latencyMs = Date.now() - start;
      await client.end();
      return { success: true, latencyMs };
    } catch (error) {
      const latencyMs = Date.now() - start;
      await client.end().catch(() => undefined);
      const message =
        error instanceof Error ? error.message : 'Error desconocido al conectar';
      return { success: false, latencyMs, error: message };
    }
  }

  private async testMysqlConnection(params: ConnectionParams): Promise<ConnectionTestResult> {
    const start = Date.now();

    try {
      const conn = await createMysqlConnection({
        host: params.host,
        port: params.port,
        database: params.database,
        user: params.username,
        password: params.password,
        connectTimeout: CONNECTION_TEST_TIMEOUT_MS,
      });
      const latencyMs = Date.now() - start;
      await conn.end();
      return { success: true, latencyMs };
    } catch (error) {
      const latencyMs = Date.now() - start;
      const message =
        error instanceof Error ? error.message : 'Error desconocido al conectar';
      return { success: false, latencyMs, error: message };
    }
  }
}
