import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | undefined,
    info: unknown,
    _context: ExecutionContext,
    _status?: number,
  ): TUser {
    if (err || !user) {
      const message =
        info instanceof Error
          ? info.message
          : 'Token de acceso ausente o inválido';

      throw new UnauthorizedException(message);
    }

    return user;
  }
}
