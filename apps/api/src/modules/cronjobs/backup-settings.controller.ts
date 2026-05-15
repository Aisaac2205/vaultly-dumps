import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CronjobsService } from './cronjobs.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Controller('backups/settings')
@UseGuards(JwtAuthGuard)
export class BackupSettingsController {
  constructor(private readonly service: CronjobsService) {}

  @Put(':connectionId')
  upsertSchedule(
    @Param('connectionId') connectionId: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.service.upsertSchedule(
      connectionId,
      dto.cronExpression,
      dto.name ?? 'Backup automático',
      dto.frequency,
    );
  }
}
