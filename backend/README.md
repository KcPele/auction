# Auction Backend

NestJS backend for the cars and gadgets auction platform.

## Stack

- NestJS with Fastify
- PostgreSQL with TypeORM
- Redis and BullMQ
- Socket.IO
- Strowallet, Openinary, and WhatsApp integrations

## Local Setup

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm run start:dev
```

The API starts on `http://localhost:4000/api/v1` by default.
Swagger docs are available at `http://localhost:4000/docs`.

## Strowallet Setup

Use sandbox values while developing:

```env
STROWALLET_BASE_URL=https://strowallet.com
STROWALLET_PUBLIC_KEY=...
STROWALLET_SECRET_KEY=...
STROWALLET_MERCHANT_ID=...
STROWALLET_MODE=sandbox
STROWALLET_WEBHOOK_URL=https://your-api.com/api/v1/payments/strowallet/webhook
STROWALLET_WEBSITE_URL=https://your-frontend.com
STROWALLET_DEVELOPER_CODE=
OPENINARY_URL=https://openinary.example.com
OPENINARY_API_KEY=...
OPENINARY_FOLDER=auction
```

Strowallet is used for virtual funding accounts, bank transfers, bank list,
account-name lookup, BVN verification, NIN verification, OTP SMS, and
subaccount creation.

### Webhook authentication

Strowallet's virtual-account webhook is unsigned — their own reference handler
reads the body and verifies nothing — so the webhook URL itself carries the
shared secret:

```bash
openssl rand -hex 24
```

Put that value in `STROWALLET_WEBHOOK_TOKEN` and append it to
`STROWALLET_WEBHOOK_URL` as the last path segment. The two must agree or the
app refuses to start in production, because a token missing from the URL
rejects every delivery while appearing to be configured.

`webhook_url` is sent to Strowallet when a virtual account is created, so
existing accounts keep whatever URL they were registered with. After changing
the token, re-provision funding accounts (and check Settings → webhooks in the
Strowallet dashboard) or deliveries will keep arriving on the old URL.

### Going live

`STROWALLET_MODE` accepts `sandbox` or `live`. Set it to `live` in production —
the app refuses to boot with `NODE_ENV=production` while it is `sandbox`.

In sandbox mode funding accounts are generated locally, `POST
/wallets/topup/simulate` credits balances without a bank transfer, and payouts
are simulated instead of sent. Flipping to `live` changes all three, so clear
the simulated state first by running migrations: `RetireSandboxWalletState`
releases open bid holds, writes the simulated balances off through the ledger,
fails in-flight sandbox withdrawals, and deletes the locally generated funding
accounts so live virtual accounts can be provisioned. It is deliberately
irreversible.

Set `NEXT_PUBLIC_PAYMENTS_MODE=live` on the frontend too, to hide the simulate
button. That is cosmetic — the endpoint itself is gated server-side.

## Wallet Funding Flow

Frontend flow after login:

1. `GET /api/v1/users/me`
2. `GET /api/v1/wallets/me`
3. `POST /api/v1/wallets/funding-account`
4. Show the returned account number, bank name, and account name on the wallet screen

The funding account endpoint creates a Strowallet virtual account once per user.
Later calls return the saved account. When a user transfers money to the
Strowallet virtual account, Strowallet sends a webhook to:

```txt
POST /api/v1/payments/strowallet/webhook
```

The backend stores the webhook event idempotently and credits the internal
wallet. Strowallet webhook payloads are parsed by `accountReference` or
`accountNumber`, so configure the Strowallet webhook URL above when creating
virtual accounts.

## KYC And Bank Utilities

```txt
POST /api/v1/kyc/bvn/verify
POST /api/v1/kyc/nin/verify
POST /api/v1/kyc/otp/send
POST /api/v1/kyc/subaccount
GET /api/v1/payments/banks
GET /api/v1/payments/banks/account-name?bankCode=057&accountNumber=2085096393
```

BVN and NIN verification use the Strowallet KYC endpoints. OTP SMS uses
Strowallet's OTP endpoint. Bank list and account-name lookup should be used by
the frontend before creating a withdrawal.

## Uploads

Single upload:

```txt
POST /api/v1/uploads
```

Bulk upload:

```txt
POST /api/v1/uploads/bulk
```

Send `multipart/form-data` with `files`, `purpose`, and optional `category`.
Bulk upload accepts up to 10 files. `POST /api/v1/uploads/batch` is kept as a
compatibility alias.

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

The winner can either transfer the full winning amount to the shown bank
account, or transfer part externally and ask admin to use part of their wallet
balance to complete payment. Admin confirms the final split:

```txt
POST /api/v1/admin/auctions/:id/settle-payment
```

Example request:

```json
{
  "externalPaymentKobo": 60000000,
  "walletPaymentKobo": 10000000,
  "note": "Transfer confirmed and wallet balance applied"
}
```

If payment is not confirmed before `paymentDeadlineAt`, the payment-deadline
worker marks the auction as defaulted. Admins can also do this manually:

```txt
POST /api/v1/admin/auctions/:id/default-payment
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

The backend debits the internal wallet first, resolves the destination account
name through Strowallet, then calls the Strowallet bank-transfer endpoint:

```txt
POST https://strowallet.com/api/banks/request/
```

Admins can still inspect pending withdrawals:

```txt
GET /api/v1/admin/wallet-withdrawals/pending
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
