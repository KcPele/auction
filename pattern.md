# Integration Pattern

This project should use **Ports and Adapters** for all third-party integrations.
The business modules should depend on our own interfaces, not directly on
Strowallet, Openinary, WhatsApp, or any future provider SDK.

## Goal

Make provider changes cheap and safe.

If we later move from Strowallet to another payment provider, the wallet,
payments, KYC, and auction logic should not need a rewrite. We should only add
or swap provider adapters.

## Pattern

Use this dependency direction:

```txt
Business Service -> Port Interface -> Provider Adapter -> Provider Client
```

Example:

```txt
WalletFundingService -> WalletFundingPort -> StrowalletWalletAdapter -> StrowalletClient
```

Avoid this:

```txt
WalletFundingService -> StrowalletProvider
```

The second approach leaks provider details into business logic.

## Recommended Folder Structure

```txt
backend/src/modules/integrations/
  strowallet/
    strowallet.client.ts
    strowallet.types.ts
    strowallet-wallet.adapter.ts
    strowallet-transfer.adapter.ts
    strowallet-kyc.adapter.ts
    strowallet-otp.adapter.ts

backend/src/modules/wallets/
  ports/
    wallet-funding.port.ts
    bank-transfer.port.ts
  wallet-funding.service.ts
  wallet-withdrawals.service.ts

backend/src/modules/kyc/
  ports/
    identity-verification.port.ts
    otp-sender.port.ts
  kyc.service.ts

backend/src/modules/uploads/
  ports/
    file-storage.port.ts
  providers/
    openinary-storage.adapter.ts
```

## Integration Roles

### Client

The client handles low-level HTTP details:

- base URL
- API keys
- request format
- response parsing
- provider error mapping
- timeouts

Example:

```txt
StrowalletClient
```

### Adapter

The adapter translates provider-specific behavior into our internal contract.

Example:

```txt
StrowalletWalletAdapter implements WalletFundingPort
```

It should return normalized app data, not raw provider response shapes.

### Port

The port is our application-owned interface.

Example:

```ts
export interface WalletFundingPort {
  createFundingAccount(input: CreateFundingAccountInput): Promise<FundingAccountResult>;
}
```

The service depends on this interface, not on the provider.

## Rules

1. Business services must not import provider clients directly.
2. Provider response shapes must be normalized inside adapters.
3. Provider errors must be converted into app-level errors.
4. Webhooks must be stored before processing.
5. Webhook processing must be idempotent.
6. Provider env vars must be validated in config.
7. Provider names should not spread through domain logic.
8. Tests for business services should mock ports, not provider clients.
9. Tests for adapters should cover provider request/response mapping.
10. Raw provider payloads may be stored for audit/debugging, but should not drive business logic directly.

## Webhook Pattern

Use an inbox-style flow:

```txt
Receive webhook
Store raw event with provider + eventId
If already processed, return success
Normalize event
Run business action
Mark event processed
```

This protects us from duplicate webhook delivery.

## Provider Selection

Use dependency injection to bind a port to an adapter:

```txt
WalletFundingPort -> StrowalletWalletAdapter
BankTransferPort -> StrowalletTransferAdapter
IdentityVerificationPort -> StrowalletKycAdapter
OtpSenderPort -> StrowalletOtpAdapter
```

Later, we can switch to:

```txt
WalletFundingPort -> AnotherProviderWalletAdapter
```

without changing `WalletFundingService`.

## Current Provider Mapping

```txt
Strowallet
  wallet funding accounts
  bank list
  account-name lookup
  withdrawals / bank transfers
  BVN verification
  NIN verification
  OTP SMS
  subaccount creation

Openinary
  single file upload
  bulk file upload

WhatsApp provider
  user notifications
  auction reminders
  winner payment reminders
```

## Error Handling

Adapters should throw clear app errors:

```txt
Provider unavailable
Invalid provider credentials
Provider rejected request
Provider returned malformed response
Provider timeout
```

Do not expose confusing raw provider errors directly to frontend users.

## Testing

Business service tests:

```txt
mock WalletFundingPort
mock BankTransferPort
mock IdentityVerificationPort
```

Adapter tests:

```txt
mock provider HTTP response
assert request payload
assert normalized result
assert provider errors map correctly
```

Webhook tests:

```txt
accept valid webhook
ignore duplicate event
credit wallet once
reject malformed payload
process withdrawal status updates
```

## Standard For New Integrations

Before adding any new provider:

1. Define the port first.
2. Add the provider client.
3. Add one adapter per business capability.
4. Normalize provider responses.
5. Add focused tests.
6. Update Swagger docs if endpoints change.
7. Update `.env.example` and README.

This keeps integrations replaceable, testable, and professional.
