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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, KeycloakUser } from '../../common/decorators/current-user.decorator';
import { setAuditContext } from '../../common/audit/audit-context';
import { BackupService } from './backup.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { ListEnrichedDumpsQueryDto } from './dto/list-enriched-dumps.query.dto';
import { Environment } from '../../database/enums/environment.enum';

@Controller('backups')
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private readonly service: BackupService) {}

  @Post()
  async createBackup(
    @Body() dto: CreateBackupDto,
    @CurrentUser() user: KeycloakUser,
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

  @Get('r2')
  listDumpsFromR2() {
    return this.service.listDumpsFromR2();
  }

  @Post('trigger/:connectionId')
  async triggerManual(
    @Param('connectionId') connectionId: string,
    @CurrentUser() user: KeycloakUser,
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
