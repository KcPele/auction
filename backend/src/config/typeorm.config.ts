import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function buildTypeOrmConfig(
  config: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.getOrThrow<string>('DATABASE_HOST'),
    port: config.getOrThrow<number>('DATABASE_PORT'),
    username: config.getOrThrow<string>('DATABASE_USER'),
    password: config.getOrThrow<string>('DATABASE_PASSWORD'),
    database: config.getOrThrow<string>('DATABASE_NAME'),
    ssl: config.getOrThrow<boolean>('DATABASE_SSL')
      ? { rejectUnauthorized: false }
      : false,
    autoLoadEntities: true,
    synchronize: false,
    migrationsRun: false,
    logging: config.get<string>('NODE_ENV') === 'development',
    // Production-ready pool: reconnect on transient DB blips, don't crash the
    // process on idle-socket errors. The previous setup let an `ETIMEDOUT`
    // bubble out as an unhandled `error` event and SIGKILL'd Nest.
    retryAttempts: 10,
    retryDelay: 3000,
    extra: {
      max: 20,
      // node-postgres uses these to evict dead sockets before the OS does.
      keepAlive: true,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    },
  };
}
