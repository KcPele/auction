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
  STROWALLET_WEBHOOK_SECRET: z.string().optional(),
  STROWALLET_WEBSITE_URL: z.string().url().optional(),
  STROWALLET_DEVELOPER_CODE: z.string().optional(),
  OPENINARY_URL: z.string().url().optional(),
  OPENINARY_API_KEY: z.string().optional(),
  OPENINARY_FOLDER: z.string().default('auction'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  // Email sender (Better Auth uses this for verification + password reset).
  // Optional in dev — emails fall back to console logs.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z
    .string()
    .email()
    .default('no-reply@bidnaija.local'),
  // OpenRouter — powers the support chat assistant. Admins can override the
  // model from the Settings page; this is just the API key + sane defaults.
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z
    .string()
    .url()
    .default('https://openrouter.ai/api/v1'),
  OPENROUTER_APP_NAME: z.string().default('BidNaija Support'),
  OPENROUTER_APP_URL: z
    .string()
    .url()
    .default('http://localhost:3000'),
  // Idempotency cache TTL for payment-like POSTs (seconds).
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(86_400),
});

export type AppEnv = z.infer<typeof envSchema>;

// In production, fail fast on any secret/key that's missing or still set to a
// dev default. This catches a deployment where someone forgot to set an env
// var before the first user hits a money-moving code path.
const PRODUCTION_REQUIRED: Array<keyof AppEnv> = [
  'BETTER_AUTH_SECRET',
  'STROWALLET_PUBLIC_KEY',
  'STROWALLET_SECRET_KEY',
  'STROWALLET_MERCHANT_ID',
  'STROWALLET_WEBHOOK_URL',
  'STROWALLET_WEBHOOK_SECRET',
  'STROWALLET_WEBSITE_URL',
  'OPENINARY_URL',
  'OPENINARY_API_KEY',
  'RESEND_API_KEY',
  'OPENROUTER_API_KEY',
];

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const env = parsed.data;
  if (env.NODE_ENV === 'production') {
    const missing: string[] = [];
    for (const key of PRODUCTION_REQUIRED) {
      if (!env[key]) {
        missing.push(key);
      }
    }
    if (
      env.BETTER_AUTH_SECRET ===
      'local-better-auth-secret-change-before-production'
    ) {
      missing.push('BETTER_AUTH_SECRET (still set to the dev default)');
    }
    if (missing.length > 0) {
      throw new Error(
        `Missing required production env vars: ${missing.join(', ')}`,
      );
    }
  }

  return env;
}
