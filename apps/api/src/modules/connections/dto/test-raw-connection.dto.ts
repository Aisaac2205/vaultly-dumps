import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DbTypeEnum } from '../../../database/enums/db-type.enum';

export class TestRawConnectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  host!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  port!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  database!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsEnum(DbTypeEnum)
  dbType!: DbTypeEnum;
}
