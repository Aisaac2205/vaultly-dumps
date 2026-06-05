import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { BackupCategory } from '../../../database/enums/backup-category.enum';

/**
 * Ad-hoc cleanup params for preview (query) and execution (body).
 * At least one retention criterion must be set — enforced in the service so the
 * message is domain-specific. `@Type(() => Number)` coerces query strings;
 * harmless for JSON bodies.
 */
export class CleanupParamsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  connectionSlug!: string;

  @IsEnum(BackupCategory)
  category!: BackupCategory;

  /** Keep the newest N dumps; never deletes below 1. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  keepLast?: number;

  /** Delete dumps older than this many days. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAgeDays?: number;

  /** Keep total size under this many MB; deletes oldest past the cap. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxTotalSizeMb?: number;
}
