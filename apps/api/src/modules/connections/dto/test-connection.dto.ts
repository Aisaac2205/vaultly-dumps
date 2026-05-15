import { IsUUID } from 'class-validator';

export class TestConnectionDto {
  @IsUUID(4)
  connectionId!: string;
}
