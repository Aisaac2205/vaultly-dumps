import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { CronFrequency } from '../../../database/enums/cron-frequency.enum';

export class CreateCronjobDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  connectionId!: string;

  @IsString()
  @IsNotEmpty()
  cronExpression!: string;

  @IsEnum(CronFrequency)
  frequency!: CronFrequency;

  // --- Retention policy (optional) ---
  @IsOptional()
  @IsBoolean()
  retentionEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  retentionKeepLast?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  retentionMaxAgeDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  retentionMaxSizeMb?: number;
}
