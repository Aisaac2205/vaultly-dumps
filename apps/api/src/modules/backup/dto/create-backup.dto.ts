import { IsUUID } from 'class-validator';

export class CreateBackupDto {
  @IsUUID()
  connectionId!: string;
}
