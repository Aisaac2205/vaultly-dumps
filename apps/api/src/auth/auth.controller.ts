import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.config';

@Controller()
export class AuthController {
  private readonly handler = toNodeHandler(auth);

  @All('api/auth/*')
  handleAuth(@Req() req: Request, @Res() res: Response): void {
    void this.handler(req, res);
  }
}
