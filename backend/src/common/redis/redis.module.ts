import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * Shared ioredis client. Used for idempotency caching and any other
 * lightweight key/value needs outside BullMQ's job queue.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const password = config.get<string>('REDIS_PASSWORD');
        return new Redis({
          host: config.getOrThrow<string>('REDIS_HOST'),
          port: config.getOrThrow<number>('REDIS_PORT'),
          ...(password ? { password } : {}),
          lazyConnect: false,
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
          keyPrefix: 'auction:',
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
