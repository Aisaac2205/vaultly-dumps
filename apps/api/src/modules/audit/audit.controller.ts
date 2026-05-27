import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { BetterAuthGuard } from '../../auth/auth.guard';
import { AuditService } from './audit.service';
import { AuditFilters } from './audit.repository';
import { Environment } from '../../database/enums/environment.enum';

@Controller('audit')
@UseGuards(BetterAuthGuard)
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  getLogs(@Query() filters: AuditFilters) {
    return this.service.getLogs(this.parseFilters(filters));
  }

  @Get(':id')
  getLogById(@Param('id') id: string) {
    return this.service.getLogById(id);
  }

  private parseFilters(raw: AuditFilters): AuditFilters {
    const filters: AuditFilters = {};

    if (raw.userId) {
      filters.userId = raw.userId;
    }

    if (raw.username) {
      filters.username = raw.username;
    }

    if (raw.environment && Object.values(Environment).includes(raw.environment)) {
      filters.environment = raw.environment;
    }

    if (raw.resourceType) {
      filters.resourceType = raw.resourceType;
    }

    if (raw.from) {
      filters.from = new Date(raw.from);
    }

    if (raw.to) {
      filters.to = new Date(raw.to);
    }

    return filters;
  }
}
