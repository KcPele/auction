import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { IncomingMessage } from 'http';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<
      {
        raw: IncomingMessage;
        user?: Awaited<ReturnType<AuthService['getAuthenticatedUser']>>;
      }
    >();

    request.user = await this.authService.getAuthenticatedUser(
      request.raw.headers,
    );

    return true;
  }
}
