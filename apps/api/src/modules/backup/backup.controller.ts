import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { BetterAuthGuard } from '../../auth/auth.guard';
import { RolesGuard, Roles } from '../../auth/roles.guard';
import { CurrentUser, AuthUser } from '../../auth/decorators/current-user.decorator';
import { setAuditContext } from '../../common/audit/audit-context';
import { BackupService } from './backup.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { ListEnrichedDumpsQueryDto } from './dto/list-enriched-dumps.query.dto';
import { CleanupParamsDto } from './dto/cleanup-params.dto';
import { Environment } from '../../database/enums/environment.enum';

@Controller('backups')
@UseGuards(BetterAuthGuard, RolesGuard)
@Roles('admin')
export class BackupController {
  constructor(private readonly service: BackupService) {}

  @Post()
  async createBackup(
    @Body() dto: CreateBackupDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const result = await this.service.createBackup(dto, user);
    setAuditContext(req, {
      environment: Environment.PROD,
      resourceId: result.jobId,
      metadata: { fileKey: result.fileKey, connectionId: dto.connectionId },
    });
    return result;
  }

  // Literal routes must come before parameterized ones (:id)
  @Get('history')
  getHistory() {
    return this.service.getHistory();
  }

  @Get('r2/enriched')
  listEnrichedDumps(@Query() query: ListEnrichedDumpsQueryDto) {
    return this.service.listEnrichedDumps(query.connectionSlug, query.category);
  }

  // Dry run: what a cleanup would remove. Read-only, no audit.
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
        olderThanDays: dto.olderThanDays,
        keepLast: dto.keepLast,
        deleted: result.deleted,
        freedMb: result.freedMb,
        errors: result.errors.length,
      },
    });
    return result;
  }

  @Get('r2')
  listDumpsFromR2() {
    return this.service.listDumpsFromR2();
  }

  @Post('trigger/:connectionId')
  async triggerManual(
    @Param('connectionId') connectionId: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const result = await this.service.triggerManual(connectionId, user);
    setAuditContext(req, {
      environment: Environment.PROD,
      resourceId: result.jobId,
      metadata: { fileKey: result.fileKey, connectionId },
    });
    return result;
  }

  @Post(':id/download-url')
  async getDownloadUrl(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const result = await this.service.getDownloadUrl(id);
    setAuditContext(req, {
      environment: Environment.PROD,
      metadata: { fileKey: result.fileKey },
    });
    return result;
  }

  @Get()
  listBackups() {
    return this.service.listBackups();
  }

  @Get(':id')
  getBackupById(@Param('id') id: string) {
    return this.service.getBackupById(id);
  }
}
