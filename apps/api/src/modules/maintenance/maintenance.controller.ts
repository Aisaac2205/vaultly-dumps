import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { BetterAuthGuard } from '../../auth/auth.guard';
import { RolesGuard, Roles } from '../../auth/roles.guard';
import { setAuditContext } from '../../common/audit/audit-context';
import { Environment } from '../../database/enums/environment.enum';
import { MaintenanceService } from './maintenance.service';
import { CleanupParamsDto } from './dto/cleanup-params.dto';

@Controller('maintenance')
@UseGuards(BetterAuthGuard, RolesGuard)
@Roles('admin')
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  // Dry run: what an ad-hoc cleanup would remove. Read-only, no audit.
  @Get('cleanup/preview')
  previewCleanup(@Query() query: CleanupParamsDto) {
    return this.service.previewCleanup(query);
  }

  @Post('cleanup')
  async runCleanup(@Body() dto: CleanupParamsDto, @Req() req: Request) {
    const result = await this.service.runCleanup(dto);
    setAuditContext(req, {
      environment: Environment.PROD,
      metadata: {
        connectionSlug: dto.connectionSlug,
        category: dto.category,
        keepLast: dto.keepLast,
        maxAgeDays: dto.maxAgeDays,
        maxTotalSizeMb: dto.maxTotalSizeMb,
        deleted: result.deleted,
        freedMb: result.freedMb,
        errors: result.errors.length,
      },
    });
    return result;
  }
}
