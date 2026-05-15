import {
  Controller,
  NotFoundException,
  Param,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SseTokenGuard } from '../../common/guards/sse-token.guard';
import { SseService, SseEvent } from '../../shared/sse/sse.service';
import { RestoreService } from './restore.service';

interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Controller('restores')
export class RestoreSseController {
  constructor(
    private readonly sseService: SseService,
    private readonly restoreService: RestoreService,
  ) {}

  @Sse(':id/stream')
  @UseGuards(SseTokenGuard)
  async streamRestore(@Param('id') id: string): Promise<Observable<MessageEvent>> {
    const job = await this.restoreService.getRestoreById(id);
    if (!job) {
      throw new NotFoundException(
        `Restore job con ID "${id}" no encontrado`,
      );
    }

    return this.sseService.register(id).pipe(
      map((event: SseEvent): MessageEvent => ({ data: event })),
    );
  }
}
