import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Environment } from '../../database/enums/environment.enum';

interface EnvironmentPayload {
  environment?: string;
}

export const GetEnvironment = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Environment => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const body = request.body as EnvironmentPayload;
    const params = request.params as EnvironmentPayload;
    const env = body.environment ?? params.environment;

    if (!env || !Object.values(Environment).includes(env as Environment)) {
      throw new BadRequestException(`Invalid environment: ${String(env)}`);
    }

    return env as Environment;
  },
);
