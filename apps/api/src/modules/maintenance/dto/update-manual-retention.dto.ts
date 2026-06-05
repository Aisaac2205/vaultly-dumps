import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

/** Full replace of the global manual-dump retention policy. */
export class UpdateManualRetentionDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  keepLast?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxAgeDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxTotalSizeMb?: number;
}
