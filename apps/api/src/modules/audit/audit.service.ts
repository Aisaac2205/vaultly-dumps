import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditRepository, AuditFilters } from './audit.repository';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async getLogs(
    query: ListAuditLogsQueryDto,
  ): Promise<PaginatedResponseDto<AuditLogEntity>> {
    const filters: AuditFilters = {
      userId: query.userId,
      username: query.username,
      environment: query.environment,
      resourceType: query.resourceType,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };

    const { data, total } = await this.repository.findAll(filters, {
      page: query.page,
      pageSize: query.pageSize,
    });

    return new PaginatedResponseDto<AuditLogEntity>(
      data,
      total,
      query.page ?? 1,
      query.pageSize ?? 25,
    );
  }

  async getLogById(id: string) {
    const log = await this.repository.findById(id);
    if (!log) {
      throw new NotFoundException(`Audit log con ID "${id}" no encontrado`);
    }
    return log;
  }
}
