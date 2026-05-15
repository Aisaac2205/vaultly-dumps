import {
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { CronFrequency } from '../../../database/enums/cron-frequency.enum';

export class UpdateScheduleDto {
  @IsString()
  @IsNotEmpty()
  cronExpression!: string;

  @IsEnum(CronFrequency)
  frequency!: CronFrequency;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
