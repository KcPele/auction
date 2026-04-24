import { ConfigService } from '@nestjs/config';
import { BullRootModuleOptions } from '@nestjs/bullmq';

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

