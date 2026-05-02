import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  APP_NAME: z.string().default('auction-backend'),
  APP_HOST: z.string().default('0.0.0.0'),
  APP_PORT: z.coerce.number().int().positive().default(4000),
  APP_GLOBAL_PREFIX: z.string().default('api/v1'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_USER: z.string().default('auction'),
  DATABASE_PASSWORD: z.string().default('auction'),
  DATABASE_NAME: z.string().default('auction'),
  DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:4000'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .default('local-better-auth-secret-change-before-production'),
  STROWALLET_BASE_URL: z.string().url().default('https://strowallet.com'),
  STROWALLET_PUBLIC_KEY: z.string().optional(),
  STROWALLET_SECRET_KEY: z.string().optional(),
  STROWALLET_MERCHANT_ID: z.string().optional(),
  STROWALLET_MODE: z.string().default('sandbox'),
  STROWALLET_WEBHOOK_URL: z.string().url().optional(),
  STROWALLET_WEBSITE_URL: z.string().url().optional(),
  STROWALLET_DEVELOPER_CODE: z.string().optional(),
  OPENINARY_URL: z.string().url().optional(),
  OPENINARY_API_KEY: z.string().optional(),
  OPENINARY_FOLDER: z.string().default('auction'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data;
}
