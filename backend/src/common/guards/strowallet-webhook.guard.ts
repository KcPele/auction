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
  params?: Record<string, string | undefined>;
};

/**
 * Authenticates the Strowallet webhook.
 *
 * Strowallet's virtual-account webhook posts plain JSON with no signature of
 * any kind — their own reference handler reads the body and checks nothing —
 * so a signature-only guard rejects every real delivery. The shared secret we
 * can rely on is the webhook URL itself, which we hand them per account:
 * `STROWALLET_WEBHOOK_TOKEN` is the last path segment and is compared here.
 *
 * An HMAC header is still accepted (`x-strowallet-signature`,
 * `x-webhook-signature`, optionally `sha256=`-prefixed) against
 * `STROWALLET_WEBHOOK_SECRET`, so the stricter path starts working on its own
 * if Strowallet ever signs these. Either proof is enough.
 *
 * With neither configured the guard allows the request outside production,
 * logging a warning once, so local development keeps working.
 */
@Injectable()
export class StrowalletWebhookGuard implements CanActivate {
  private readonly logger = new Logger(StrowalletWebhookGuard.name);
  private warnedAboutMissingSecret = false;

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('STROWALLET_WEBHOOK_SECRET');
    const token = this.config.get<string>('STROWALLET_WEBHOOK_TOKEN');
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';

    const req = context.switchToHttp().getRequest<RawBodyRequest>();
    const headers = req.headers ?? {};

    if (!secret && !token) {
      if (isProduction) {
        throw new UnauthorizedException(
          'Webhook authentication is not configured',
        );
      }
      if (!this.warnedAboutMissingSecret) {
        this.warnedAboutMissingSecret = true;
        this.logger.warn(
          'Neither STROWALLET_WEBHOOK_TOKEN nor STROWALLET_WEBHOOK_SECRET is set — webhooks are NOT authenticated. Set one before going to production.',
        );
      }
      return true;
    }

    if (token && this.matches(req.params?.token, token)) {
      return true;
    }

    const rawHeader =
      this.headerValue(headers['x-strowallet-signature']) ??
      this.headerValue(headers['x-webhook-signature']) ??
      this.headerValue(headers['strowallet-signature']);

    if (secret && rawHeader) {
      const body =
        typeof req.rawBody === 'string'
          ? req.rawBody
          : req.rawBody?.toString('utf8') ?? '';
      const expected = createHmac('sha256', secret).update(body).digest('hex');

      if (this.matches(rawHeader.replace(/^sha256=/i, '').trim(), expected)) {
        return true;
      }

      throw new UnauthorizedException('Invalid webhook signature');
    }

    throw new UnauthorizedException('Unauthorized webhook call');
  }

  /** Length-checked first, since timingSafeEqual throws on a length mismatch. */
  private matches(provided: string | undefined, expected: string) {
    if (!provided || provided.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  }

  private headerValue(value: string | string[] | undefined): string | null {
    if (!value) return null;
    return Array.isArray(value) ? (value[0] ?? null) : value;
  }
}
