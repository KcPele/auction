# Backend — Security & hardening backlog

Items found during the integration-readiness audit. Some are quick wins. Two are **must-fix before production** but don't block frontend integration today.

---

## Already fixed in this pass

- `ThrottlerGuard` registered globally via `APP_GUARD`. Throttling is now enforced (was configured but never applied).
- Global `GlobalHttpExceptionFilter` registered via `APP_FILTER` — all errors now return a normalized `{ statusCode, code, message, details, path, timestamp }` shape so the frontend can rely on it.
- `process.env.STROWALLET_*` direct read in `admin-dashboard.service.ts` replaced with `ConfigService` so env validation actually applies.

---

## Must fix before production

### 1. Strowallet webhook is not authenticated

**File:** `src/modules/payments/payments.controller.ts` → `handleStrowalletWebhook`

The controller accepts any POST to `/payments/strowallet/webhook` and runs business logic against it. Anyone with the URL can credit a user's wallet, mark a withdrawal as successful, or replay arbitrary state changes.

**Required**

- Decide on a verification scheme with Strowallet (HMAC over raw body, signed JWT in a header, IP allowlist, etc.).
- Add a `StrowalletWebhookGuard` that:
  - Reads `request.rawBody` (already captured via `rawBody: true` in `main.ts`).
  - Computes the expected signature using a secret (`STROWALLET_WEBHOOK_SECRET`) and compares it timing-safely with `crypto.timingSafeEqual`.
  - Throws `UnauthorizedException` on mismatch.
- Add `STROWALLET_WEBHOOK_SECRET` to the env schema in `src/config/env.validation.ts`.
- Until the scheme is confirmed: at minimum, restrict to known Strowallet IPs at the load balancer / fastify level.

The inbox idempotency pattern is already in place, which is great — it just needs an auth boundary in front.

### 2. Better Auth secret has a development default

**File:** `src/config/env.validation.ts`

```ts
BETTER_AUTH_SECRET: z
  .string()
  .min(32)
  .default('local-better-auth-secret-change-before-production'),
```

A default that says "change before production" only works if someone notices. Make it required when `NODE_ENV === 'production'`:

```ts
BETTER_AUTH_SECRET: z.string().min(32),
```

…and let the existing validation throw on boot if it's missing.

### 3. Strowallet credentials are optional in the schema

Same file. `STROWALLET_PUBLIC_KEY`, `STROWALLET_SECRET_KEY`, `STROWALLET_MERCHANT_ID` are all `.optional()`. The app boots with payment-related features silently broken. Either:

- Mark them `.required()` for `NODE_ENV === 'production'`, or
- Add a startup self-check that fails the bootstrap if any provider env is missing while the service is enabled.

---

## Should fix before integration ships

### 4. No idempotency on payment-like POSTs

The frontend will be sending an `Idempotency-Key` header on `POST /wallets/withdrawals`, `POST /auctions/{auctionId}/bids`, `POST /auctions/{id}/settle-payment`. The backend currently ignores it.

**Recommended**

- Add a small `IdempotencyInterceptor` that:
  - Reads `Idempotency-Key` from the request.
  - On the first request, runs the handler and stores `{ key, userId, route, requestHash, responseStatus, responseBody, createdAt }` in a new `idempotency_records` table with a 24-hour TTL.
  - On a second request with the same key + user, returns the stored response without re-running the handler.
- Apply it to the three routes above with a decorator (`@Idempotent({ ttl: '24h' })`).

### 5. `process.env` direct reads inside services

Already fixed in `admin-dashboard.service.ts`. Run a quick `grep -rn "process\.env" src/` and route the rest (if any appear later) through `ConfigService`. The only remaining one is `database/typeorm-cli.config.ts`, which is intentional (CLI runs outside the Nest container).

### 6. `rawBody: true` is set globally

**File:** `src/main.ts`

`NestFactory.create(AppModule, new FastifyAdapter(...), { rawBody: true })` captures raw bodies for every request, not just webhooks. That's a small memory tax on every request. Consider scoping it via a custom `bodyParser` pre-handler that only buffers raw on `/payments/*/webhook` paths.

### 7. CORS origin parsing

**File:** `src/main.ts`

```ts
origin: config.getOrThrow<string>('CORS_ORIGINS').split(','),
```

Origins from env aren't trimmed; `"https://a.com, https://b.com"` becomes `["https://a.com", " https://b.com"]` and the second entry never matches. Trim:

```ts
origin: config
  .getOrThrow<string>('CORS_ORIGINS')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean),
```

### 8. Logger noise in production

`new FastifyAdapter({ logger: true })` enables Fastify's default JSON logger which prints every request. Wire it through Nest's `LoggerService` and turn it down to `info` in production via `LOG_LEVEL` env.

---

## Nice to have

### 9. Health endpoint

`GET /health` exists but doesn't ping the database, Redis, or Strowallet. Use `@nestjs/terminus` to expose:

- `GET /health/live` — liveness probe (always 200 if process is up).
- `GET /health/ready` — readiness probe (200 only when DB + Redis + provider config are reachable).

Helps for k8s / Render / Fly deployments.

### 10. Standardized validation messages

`ValidationPipe` already has `whitelist: true` and `forbidNonWhitelisted: true` (good). Consider `transformOptions: { enableImplicitConversion: true }` so query strings parse into typed DTO fields without manual `+limit`. The current admin controller does `+limit, +offset` by hand in three places — move that to the DTO using `@Type(() => Number)`.

### 11. Swagger response examples

Most endpoints declare `ApiOkResponse({ description: '...' })` but no `type`. The frontend can consume the OpenAPI spec for type generation if response types are declared. Add one example/type per response — the integrator can then `pnpm openapi-typescript` to generate types for free.

### 12. Test coverage gaps

Coverage is solid (120 tests, 26 suites). Missing:

- Webhook idempotency (the same-event-twice path is implicitly tested but not asserted as a unit test).
- The new global exception filter — assert that a thrown `BadRequestException` returns the documented body shape.
- ThrottlerGuard happy path / hit-limit case.

Add three small integration tests when convenient.

### 13. Module organization

`AdminModule` controller is large (~340 lines, 40 endpoints). Acceptable for now but consider splitting the controller into `AdminListingsController`, `AdminWithdrawalsController`, etc. — the services are already split correctly. This is purely a maintenance ask, not a correctness one.

---

## Summary for the integrator

The backend is **integration-ready**. None of the items above block frontend work.

If a fix from this list is on the team's plate, do it in this order:

1. (Production gate) Webhook signature verification.
2. (Production gate) `BETTER_AUTH_SECRET` and Strowallet creds become required in production.
3. (Reliability) Idempotency interceptor.
4. (Polish) Trim CORS origins, scope rawBody to webhook routes, terminus health check.
