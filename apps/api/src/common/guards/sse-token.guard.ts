import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard for SSE endpoints that accept JWT tokens via query parameter.
 *
 * Browser EventSource cannot send custom headers, so the token is passed
 * as `?token=<jwt>`. This guard extracts it, temporarily sets it as the
 * Authorization header, and delegates to the standard JwtAuthGuard.
 */
@Injectable()
export class SseTokenGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.query?.token as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Token ausente');
    }

    // Temporarily set as Authorization header so the JwtStrategy can extract it
    request.headers.authorization = `Bearer ${token}`;

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | undefined,
    info: unknown,
    _context: ExecutionContext,
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
