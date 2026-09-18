import { validateEnv } from './env.validation';

describe('validateEnv rate limiting', () => {
  it('uses a browser-workflow-safe default request budget', () => {
    const env = validateEnv({});

    expect(env.RATE_LIMIT_TTL_MS).toBe(60_000);
    expect(env.RATE_LIMIT_REQUESTS).toBe(600);
  });

  it('accepts positive deployment overrides', () => {
    const env = validateEnv({
      RATE_LIMIT_TTL_MS: '30000',
      RATE_LIMIT_REQUESTS: '900',
    });

    expect(env.RATE_LIMIT_TTL_MS).toBe(30_000);
    expect(env.RATE_LIMIT_REQUESTS).toBe(900);
  });
});
