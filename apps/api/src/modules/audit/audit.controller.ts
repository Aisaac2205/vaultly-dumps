import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { BetterAuthGuard } from '../../auth/auth.guard';
import { AuditService } from './audit.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@Controller('audit')
@UseGuards(BetterAuthGuard)
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  getLogs(@Query() query: ListAuditLogsQueryDto) {
    return this.service.getLogs(query);
  }

  @Get(':id')
  getLogById(@Param('id') id: string) {
    return this.service.getLogById(id);
  }
}
