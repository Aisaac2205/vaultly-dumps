import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

/** Removes FAILED backup_jobs rows older than this many days. */
export class DbHygieneQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  olderThanDays!: number;
}
