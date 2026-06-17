import { IsEnum, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BackupCategory } from '../../../database/enums/backup-category.enum';

class RetentionPolicyInputDto {
  @IsEnum(BackupCategory)
  category!: BackupCategory;

  @IsOptional()
  @IsInt()
  @Min(1)
  retentionDays: number | null = null;
}

export class UpdateConnectionRetentionDto {
  @ValidateNested({ each: true })
  @Type(() => RetentionPolicyInputDto)
  policies!: RetentionPolicyInputDto[];
}
