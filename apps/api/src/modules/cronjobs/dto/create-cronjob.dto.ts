import { IsString, IsNotEmpty, MaxLength, IsEnum } from 'class-validator';
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
}
