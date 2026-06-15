import { IsOptional, IsInt, Min, Max, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { Environment } from '../../../database/enums/environment.enum';

/**
 * Consolidated query DTO for GET /audit.
 * Merges pagination fields with existing AuditFilters into a single validated class.
 */
export class ListAuditLogsQueryDto {
  // --- Pagination ---
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

  // --- Filters ---
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEnum(Environment)
  environment?: Environment;

  @IsOptional()
  @IsString()
  resourceType?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
