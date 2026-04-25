# Auction Backend

NestJS backend for the cars and gadgets auction platform.

## Stack

- NestJS with Fastify
- PostgreSQL with TypeORM
- Redis and BullMQ
- Socket.IO
- Monnify, Openinary, and WhatsApp integrations

## Local Setup

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm run start:dev
```

The API starts on `http://localhost:4000/api/v1` by default.
Swagger docs are available at `http://localhost:4000/docs`.

## Monnify Setup

Use sandbox values while developing:

```env
MONNIFY_BASE_URL=https://sandbox.monnify.com
MONNIFY_API_KEY=MK_TEST_...
MONNIFY_CLIENT_SECRET=...
MONNIFY_CONTRACT_CODE=...
MONNIFY_SOURCE_ACCOUNT_NUMBER=...
```

Where to find the values in Monnify:

- API key and secret: `Developer` -> `API Keys & Contracts`
- Contract code: `Settings` -> `Contract Setup`
- Source account for withdrawals: `Balances` account number

Do not use the `Contract Setup` settlement account as the withdrawal source account. Withdrawals debit the Monnify balance account.

## Wallet Funding Flow

Frontend flow after login:

1. `GET /api/v1/users/me`
2. If `nin` is missing, collect it and call `PATCH /api/v1/users/me`
3. `GET /api/v1/wallets/me`
4. `POST /api/v1/wallets/funding-account`
5. Show the returned account number, bank name, and account name on the wallet screen

The funding account endpoint creates a Monnify reserved account once per user. Later calls return the saved account.

For sandbox testing, Monnify accepts this NIN:

```txt
12345678901
```

When a user transfers money to their Monnify reserved account, Monnify sends a webhook to:

```txt
POST /api/v1/payments/monnify/webhook
```

The backend verifies the webhook signature and credits the internal wallet.

## Bidding Flow

Wallet balance is only a bid qualification check. Placing a bid does not hold,
debit, or release wallet funds.

Example:

```txt
Auction base price: NGN 500,000
Bid requirement percent: 10
Required wallet balance: NGN 50,000
```

If a user has at least `NGN 50,000` in their wallet, they can place any valid
bid amount that meets the auction base price and minimum increment rules. Their
wallet balance stays unchanged after bidding.

At auction close, the winner has 24 hours to pay into the admin-configured
payment account:

```txt
GET /api/v1/auctions/:id/payment-instructions
```

Admins manage the payment account shown to winners:

```txt
GET /api/v1/admin/settings/bidding
PATCH /api/v1/admin/settings/bidding
GET /api/v1/admin/settings/payment-account
PATCH /api/v1/admin/settings/payment-account
```

## Withdrawals

Users withdraw through:

```txt
POST /api/v1/wallets/withdrawals
GET /api/v1/wallets/withdrawals/:id
```

The backend debits the internal wallet first, then calls Monnify:

```txt
POST /api/v2/disbursements/single
```

In sandbox, a successful Monnify response may return `PENDING_AUTHORIZATION`. That means Monnify accepted the transfer and is waiting for its authorization flow.

Admins complete pending Monnify withdrawals with the OTP sent to the merchant email:

```txt
GET /api/v1/admin/wallet-withdrawals/pending
POST /api/v1/admin/wallet-withdrawals/:id/authorize
POST /api/v1/admin/wallet-withdrawals/:id/resend-otp
```

## Checks

Run focused wallet/payment tests:

```bash
pnpm run test -- payments.service.spec.ts payments.controller.spec.ts wallet-funding.service.spec.ts wallet-withdrawals.service.spec.ts wallets.controller.spec.ts
```

Run all backend checks:

```bash
pnpm run test
pnpm run typecheck
pnpm run lint
```
