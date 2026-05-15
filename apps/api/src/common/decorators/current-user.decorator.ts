import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface KeycloakUser {
  sub: string;
  email?: string;
  preferred_username: string;
  realm_access: { roles: string[] };
}

interface AuthenticatedRequest extends Request {
  user?: KeycloakUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): KeycloakUser | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
