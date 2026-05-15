import { IsString, IsNotEmpty, MaxLength, IsEnum, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Environment } from '../../../database/enums/environment.enum';
import { DbTypeEnum } from '../../../database/enums/db-type.enum';

export class CreateConnectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEnum(Environment)
  environment!: Environment;

  @IsOptional()
  @IsEnum(DbTypeEnum)
  dbType: DbTypeEnum = DbTypeEnum.POSTGRES;

  @IsString()
  @IsNotEmpty()
  host!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number;

  @IsString()
  @IsNotEmpty()
  database!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
