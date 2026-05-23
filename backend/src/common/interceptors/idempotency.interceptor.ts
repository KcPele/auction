import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { defer, from, Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { REDIS_CLIENT } from '../redis/redis.module';

type AuthedRequest = {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  user?: { id?: string };
};

const RUN_PLACEHOLDER = '__inflight__';

/**
 * Replays a previous response when the same client sends the same payment-like
 * POST twice with the same Idempotency-Key. Lookups are scoped per route per
 * user so two different actions can't accidentally collide.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();

    if (req.method !== 'POST') {
      return next.handle();
    }

    const headerValue = req.headers['idempotency-key'];
    const key = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (!key) {
      return next.handle();
    }
    if (key.length < 8 || key.length > 128) {
      throw new BadRequestException(
        'Idempotency-Key must be between 8 and 128 characters',
      );
    }

    const userId = req.user?.id ?? 'anon';
    const route = (req.url ?? '').split('?')[0];
    const storeKey = `idem:${route}:${userId}:${key}`;
    const ttl = this.config.get<number>('IDEMPOTENCY_TTL_SECONDS', 86_400);

    return defer(() => from(this.redis.get(storeKey))).pipe(
      switchMap((existing) => {
        if (existing === RUN_PLACEHOLDER) {
          throw new ConflictException(
            'A previous request with this Idempotency-Key is still being processed. Retry shortly.',
          );
        }
        if (existing) {
          try {
            return of(JSON.parse(existing));
          } catch {
            this.logger.warn(
              `Stored idempotency value at ${storeKey} was not valid JSON; ignoring cached entry.`,
            );
          }
        }

        return from(
          this.redis.set(storeKey, RUN_PLACEHOLDER, 'EX', ttl, 'NX'),
        ).pipe(
          switchMap((reserved) => {
            if (!reserved) {
              throw new ConflictException(
                'A previous request with this Idempotency-Key is still being processed. Retry shortly.',
              );
            }
            return next.handle().pipe(
              tap({
                next: (value) => {
                  this.redis
                    .set(storeKey, JSON.stringify(value), 'EX', ttl)
                    .catch((err) =>
                      this.logger.error(
                        `Failed to persist idempotency response: ${
                          err instanceof Error ? err.message : String(err)
                        }`,
                      ),
                    );
                },
                error: () => {
                  this.redis.del(storeKey).catch(() => undefined);
                },
              }),
            );
          }),
        );
      }),
    );
  }
}
