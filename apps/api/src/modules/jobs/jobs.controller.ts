import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JobsService } from './jobs.service';
import { JobFilters } from './jobs.repository';
import { JobStatus } from '../../database/enums/job-status.enum';
import { Environment } from '../../database/enums/environment.enum';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly service: JobsService) {}

  @Get('backups')
  getBackupJobs(@Query() filters: JobFilters) {
    return this.service.getBackupJobs(this.parseFilters(filters));
  }

  @Get('backups/:id')
  getBackupJobById(@Param('id') id: string) {
    return this.service.getBackupJobById(id);
  }

  @Get('restores')
  getRestoreJobs(@Query() filters: JobFilters) {
    return this.service.getRestoreJobs(this.parseFilters(filters));
  }

  @Get('restores/:id')
  getRestoreJobById(@Param('id') id: string) {
    return this.service.getRestoreJobById(id);
  }

  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('daily-counts')
  getDailyCounts() {
    return this.service.getDailyCounts();
  }

  private parseFilters(raw: JobFilters): JobFilters {
    const filters: JobFilters = {};

    if (raw.status && Object.values(JobStatus).includes(raw.status)) {
      filters.status = raw.status;
    }

    if (raw.environment && Object.values(Environment).includes(raw.environment)) {
      filters.environment = raw.environment;
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
