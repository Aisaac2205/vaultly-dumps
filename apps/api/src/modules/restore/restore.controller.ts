import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, KeycloakUser } from '../../common/decorators/current-user.decorator';
import { RestoreService } from './restore.service';
import { CreateRestoreDto } from './dto/create-restore.dto';
import { DryRunResult } from './interfaces/dry-run-result.interface';

@Controller('restores')
@UseGuards(JwtAuthGuard)
export class RestoreController {
  constructor(private readonly service: RestoreService) {}

  @Post()
  createRestore(
    @Body() dto: CreateRestoreDto,
    @CurrentUser() user: KeycloakUser,
  ): Promise<{ jobId: string; dryRunResult?: DryRunResult }> {
    return this.service.createRestore(dto, user);
  }

  @Get()
  listRestores() {
    return this.service.listRestores();
  }

  @Get(':id')
  getRestoreById(@Param('id') id: string) {
    return this.service.getRestoreById(id);
  }
}
