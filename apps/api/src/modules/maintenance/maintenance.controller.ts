import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { BetterAuthGuard } from '../../auth/auth.guard';
import { RolesGuard, Roles } from '../../auth/roles.guard';
import { setAuditContext } from '../../common/audit/audit-context';
import { Environment } from '../../database/enums/environment.enum';
import { MaintenanceService } from './maintenance.service';
import { CleanupParamsDto } from './dto/cleanup-params.dto';
import { UpdateManualRetentionDto } from './dto/update-manual-retention.dto';
import { DbHygieneQueryDto } from './dto/db-hygiene.query.dto';

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

  // --- Storage overview (read-only) ---

  @Get('storage/overview')
  getStorageOverview() {
    return this.service.getStorageOverview();
  }

  // --- DB hygiene: prune old FAILED job rows ---

  @Get('db/preview')
  previewDbHygiene(@Query() query: DbHygieneQueryDto) {
    return this.service.previewDbHygiene(query.olderThanDays);
  }

  @Post('db/cleanup')
  async runDbHygiene(@Body() dto: DbHygieneQueryDto, @Req() req: Request) {
    const result = await this.service.runDbHygiene(dto.olderThanDays);
    setAuditContext(req, {
      environment: Environment.PROD,
      metadata: { olderThanDays: dto.olderThanDays, deleted: result.deleted },
    });
    return result;
  }

  // --- Global manual-dump retention policy ---

  @Get('retention/manual')
  getManualRetention() {
    return this.service.getManualRetention();
  }

  @Put('retention/manual')
  async updateManualRetention(
    @Body() dto: UpdateManualRetentionDto,
    @Req() req: Request,
  ) {
    const result = await this.service.updateManualRetention(dto);
    setAuditContext(req, {
      environment: Environment.PROD,
      metadata: {
        enabled: result.enabled,
        keepLast: result.keepLast,
        maxAgeDays: result.maxAgeDays,
        maxTotalSizeMb: result.maxTotalSizeMb,
      },
    });
    return result;
  }
}
