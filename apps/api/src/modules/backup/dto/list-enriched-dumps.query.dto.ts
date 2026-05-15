import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { BackupCategory } from '../../../database/enums/backup-category.enum';

export class ListEnrichedDumpsQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  connectionSlug!: string;

  @IsEnum(BackupCategory)
  category!: BackupCategory;
}
