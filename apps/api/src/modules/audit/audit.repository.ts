import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { Environment } from '../../database/enums/environment.enum';

export interface AuditFilters {
  userId?: string;
  username?: string;
  environment?: Environment;
  resourceType?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class AuditRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: Repository<AuditLogEntity>,
  ) {}

  /**
   * When pagination is provided, uses findAndCount with skip/take.
   * When omitted, returns all rows (backward compatibility for non-list endpoints).
   */
  async findAll(
    filters?: AuditFilters,
    pagination?: { page?: number; pageSize?: number },
  ): Promise<{ data: AuditLogEntity[]; total: number }> {
    const where = this.buildWhere(filters);

    if (pagination?.page && pagination?.pageSize) {
      const [data, total] = await this.repository.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        take: pagination.pageSize,
        skip: (pagination.page - 1) * pagination.pageSize,
      });
      return { data, total };
    }

    const data = await this.repository.find({ where, order: { createdAt: 'DESC' } });
    return { data, total: data.length };
  }

  findById(id: string): Promise<AuditLogEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  private buildWhere(filters?: AuditFilters): Record<string, unknown> {
    if (!filters) return {};

    const where: Record<string, unknown> = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.username) {
      where.username = filters.username;
    }

    if (filters.environment) {
      where.environment = filters.environment;
    }

    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }

    if (filters.from && filters.to) {
      where.createdAt = Between(filters.from, filters.to);
    } else if (filters.from) {
      where.createdAt = Between(filters.from, new Date());
    } else if (filters.to) {
      where.createdAt = Between(new Date(0), filters.to);
    }

    return where;
  }
}
