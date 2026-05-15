import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, KeycloakUser } from '../../common/decorators/current-user.decorator';
import { BackupService } from './backup.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { ListEnrichedDumpsQueryDto } from './dto/list-enriched-dumps.query.dto';

@Controller('backups')
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private readonly service: BackupService) {}

  @Post()
  createBackup(
    @Body() dto: CreateBackupDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.service.createBackup(dto, user);
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
  triggerManual(
    @Param('connectionId') connectionId: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.service.triggerManual(connectionId, user);
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
