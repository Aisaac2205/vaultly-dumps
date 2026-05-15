import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCronjobDto } from './create-cronjob.dto';

export class UpdateCronjobDto extends PartialType(CreateCronjobDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
