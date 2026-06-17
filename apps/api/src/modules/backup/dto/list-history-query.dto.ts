import { IsOptional, IsInt, Min, Max, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus } from '../../../database/enums/job-status.enum';
import { Environment } from '../../../database/enums/environment.enum';

export class ListHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 25;

  @IsOptional()
  @IsString()
  connectionId?: string;

  @IsOptional()
  @IsEnum(Environment)
  environment?: Environment;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
