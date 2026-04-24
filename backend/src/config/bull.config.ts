import type { BullRootModuleOptions } from '@nestjs/bullmq';
import type { ConfigService } from '@nestjs/config';

export function buildBullConfig(
  config: ConfigService,
): BullRootModuleOptions {
  const password = config.get<string>('REDIS_PASSWORD');

  return {
    connection: {
      host: config.getOrThrow<string>('REDIS_HOST'),
      port: config.getOrThrow<number>('REDIS_PORT'),
      password: password || undefined,
    },
  };
}
