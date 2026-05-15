import {
  IsUUID,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateRestoreDto {
  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => !o.r2Key)
  sourceBackupId?: string;

  @IsUUID()
  targetConnectionId!: string;

  @IsBoolean()
  isDryRun!: boolean;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.sourceBackupId)
  r2Key?: string;
}
