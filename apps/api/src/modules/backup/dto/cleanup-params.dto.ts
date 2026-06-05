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
 * Shared params for cleanup preview (query) and execution (body).
 * At least one retention criterion (olderThanDays | keepLast) must be set —
 * enforced in the service so the message is domain-specific.
 *
 * `@Type(() => Number)` coerces query-string values; harmless for JSON bodies.
 */
export class CleanupParamsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  connectionSlug!: string;

  @IsEnum(BackupCategory)
  category!: BackupCategory;

  /** Delete dumps older than this many days. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  olderThanDays?: number;

  /** Keep the newest N dumps; delete the rest. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  keepLast?: number;
}
