import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

type RawBodyRequest = {
  rawBody?: Buffer | string;
  headers?: Record<string, string | string[] | undefined>;
};

/**
 * HMAC-SHA256 signature guard for the Strowallet webhook.
 *
 * Strowallet's signing scheme is configurable per merchant — we accept the
 * common variants we've seen in the field (`x-strowallet-signature`,
 * `x-webhook-signature`, optionally prefixed with `sha256=`). The shared
 * secret comes from `STROWALLET_WEBHOOK_SECRET`. When the secret is unset
 * (dev / sandbox), the guard logs a warning the first time and lets the
 * request through so the existing dev flow keeps working.
 */
@Injectable()
export class StrowalletWebhookGuard implements CanActivate {
  private readonly logger = new Logger(StrowalletWebhookGuard.name);
  private warnedAboutMissingSecret = false;

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('STROWALLET_WEBHOOK_SECRET');
    const isProduction =
      this.config.get<string>('NODE_ENV') === 'production';

    const req = context.switchToHttp().getRequest<RawBodyRequest>();
    const headers = req.headers ?? {};

    if (!secret) {
      if (isProduction) {
        throw new UnauthorizedException(
          'Webhook signature verification is not configured',
        );
      }
      if (!this.warnedAboutMissingSecret) {
        this.warnedAboutMissingSecret = true;
        this.logger.warn(
          'STROWALLET_WEBHOOK_SECRET not set — webhook signatures are NOT verified. Set it before going to production.',
        );
      }
      return true;
    }

    const rawHeader =
      this.headerValue(headers['x-strowallet-signature']) ??
      this.headerValue(headers['x-webhook-signature']) ??
      this.headerValue(headers['strowallet-signature']);

    if (!rawHeader) {
      throw new UnauthorizedException('Missing webhook signature header');
    }

    const provided = rawHeader.replace(/^sha256=/i, '').trim();
    const body =
      typeof req.rawBody === 'string'
        ? req.rawBody
        : req.rawBody?.toString('utf8') ?? '';
    const expected = createHmac('sha256', secret).update(body).digest('hex');

    if (
      provided.length !== expected.length ||
      !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }

  private headerValue(value: string | string[] | undefined): string | null {
    if (!value) return null;
    return Array.isArray(value) ? (value[0] ?? null) : value;
  }
}
