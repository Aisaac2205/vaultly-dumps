import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, KeycloakUser } from '../../common/decorators/current-user.decorator';
import { setAuditContext } from '../../common/audit/audit-context';
import { ConnectionsService } from '../connections/connections.service';
import { RestoreService } from './restore.service';
import { CreateRestoreDto } from './dto/create-restore.dto';
import { DryRunResult } from './interfaces/dry-run-result.interface';

@Controller('restores')
@UseGuards(JwtAuthGuard)
export class RestoreController {
  constructor(
    private readonly service: RestoreService,
    private readonly connectionsService: ConnectionsService,
  ) {}

  @Post()
  async createRestore(
    @Body() dto: CreateRestoreDto,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ): Promise<{ jobId: string; dryRunResult?: DryRunResult }> {
    const result = await this.service.createRestore(dto, user);
    const connection = await this.connectionsService.findById(dto.targetConnectionId);
    setAuditContext(req, {
      environment: connection.environment,
      resourceId: result.jobId,
      metadata: {
        targetConnectionId: dto.targetConnectionId,
        sourceBackupId: dto.sourceBackupId,
        r2Key: dto.r2Key,
        isDryRun: dto.isDryRun,
      },
    });
    return result;
  }

  @Get()
  listRestores() {
    return this.service.listRestores();
  }

  @Get(':id')
  getRestoreById(@Param('id') id: string) {
    return this.service.getRestoreById(id);
  }
}
