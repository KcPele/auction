import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { StrowalletWebhookGuard } from './strowallet-webhook.guard';

const TOKEN = 'a'.repeat(32);
const SECRET = 'shared-secret';

function contextFor(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}

function guardWith(values: Record<string, string | undefined>) {
  return new StrowalletWebhookGuard({
    get: jest.fn((key: string) => values[key]),
  } as never);
}

describe('StrowalletWebhookGuard', () => {
  it('accepts the token carried in the webhook URL', () => {
    const guard = guardWith({ STROWALLET_WEBHOOK_TOKEN: TOKEN });

    expect(guard.canActivate(contextFor({ params: { token: TOKEN } }))).toBe(
      true,
    );
  });

  it('rejects a wrong token', () => {
    const guard = guardWith({ STROWALLET_WEBHOOK_TOKEN: TOKEN });

    expect(() =>
      guard.canActivate(contextFor({ params: { token: 'b'.repeat(32) } })),
    ).toThrow(UnauthorizedException);
  });

  it('rejects a call with no token at all', () => {
    const guard = guardWith({ STROWALLET_WEBHOOK_TOKEN: TOKEN });

    expect(() => guard.canActivate(contextFor({ params: {} }))).toThrow(
      UnauthorizedException,
    );
  });

  it('still accepts a valid HMAC signature when one is sent', () => {
    const body = '{"sessionId":"s"}';
    const signature = createHmac('sha256', SECRET).update(body).digest('hex');
    const guard = guardWith({ STROWALLET_WEBHOOK_SECRET: SECRET });

    expect(
      guard.canActivate(
        contextFor({
          rawBody: body,
          headers: { 'x-strowallet-signature': `sha256=${signature}` },
        }),
      ),
    ).toBe(true);
  });

  it('rejects a bad signature', () => {
    const guard = guardWith({ STROWALLET_WEBHOOK_SECRET: SECRET });

    expect(() =>
      guard.canActivate(
        contextFor({
          rawBody: '{}',
          headers: { 'x-strowallet-signature': 'deadbeef' },
        }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('refuses unauthenticated calls in production when nothing is configured', () => {
    const guard = guardWith({ NODE_ENV: 'production' });

    expect(() => guard.canActivate(contextFor({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('allows unauthenticated calls outside production when nothing is configured', () => {
    const guard = guardWith({ NODE_ENV: 'development' });

    expect(guard.canActivate(contextFor({}))).toBe(true);
  });
});
