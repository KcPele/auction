# Integration Readiness — endpoint × UI matrix

This is the audit a new developer should read **first**. It maps every backend endpoint in the OpenAPI spec to the frontend surface that consumes it. If a row says "ready", the UI is in place (with simulated data) and only needs hooks wired per `pattern.md`. If a row says "backend gap", the frontend wants something the backend doesn't expose — see `requests/backend/<domain>.md`.

For wire conventions and the integration pattern itself, see [`pattern.md`](pattern.md).

Legend:

- ✅ ready — UI exists, simulated, hook-ready
- 🟡 partial — UI exists but is incomplete or hardcoded
- 🔧 backend gap — UI needs an endpoint that doesn't exist yet
- ➖ N/A — server-only or webhook (no UI)

---

## Auth

| Endpoint | Status | Frontend surface | Notes |
|---|---|---|---|
| `POST /auth/sign-up/email` | ✅ | `RegisterForm.tsx` | `name` must be derived from `firstName + lastName` at submit (see `requests/frontend/auth.md`). |
| `POST /auth/sign-in/email` | ✅ | `LoginForm.tsx` | Drop the email/phone tabs unless backend §6 (phone sign-in) lands. |
| `POST /auth/sign-out` | ✅ | `ProfileScreen.tsx` (sign out button) | |
| `GET /auth/get-session` | ✅ | `hooks/useSession.ts`, `SessionGuard.tsx` | Replace with Better Auth React client per `pattern.md`. |
| Phone OTP / forgot-password / NIN verify | 🔧 | `OtpForm.tsx`, `ForgotForm.tsx`, `NinVerifyField.tsx` | All listed in `requests/backend/auth.md`. |

---

## Users

| Endpoint | Status | Frontend surface | Notes |
|---|---|---|---|
| `GET /users/me` | ✅ | `ProfileScreen.tsx` | Will replace hardcoded "Adaeze Okafor" placeholder with the real user. |
| `PATCH /users/me` | ✅ | `ProfileScreen.tsx` → "Personal details" inline form | Updates `firstName`, `lastName`, `phone`, `nin`. |
| `PATCH /users/me/notification-preferences` | ✅ | `ProfileScreen.tsx` → toggles | Body: `{ whatsappEnabled, readyToBid }`. |
| `POST /users/me/listing-access-applications` | ✅ | `ListingAccessScreen.tsx` (`/dashboard/listing-access`) | |
| `POST /users/me/access-codes/redeem` | ✅ | `RedeemAccessCodeScreen.tsx` (`/dashboard/redeem`) | |

---

## Auctions (public + bidder)

| Endpoint | Status | Frontend surface | Notes |
|---|---|---|---|
| `GET /auctions` | ✅ | `BrowseScreen.tsx` (`/dashboard/browse`) | Supports `category`, `status`, `limit`, `offset` query params. |
| `GET /auctions/{id}` | ✅ | `DetailScreen.tsx` (`/dashboard/auction/{id}`) | |
| `GET /auctions/{id}/bids` | ✅ | `DetailScreen.tsx` "Bid history" section | |
| `GET /auctions/{id}/payment-instructions` | ✅ | `PaymentInstructionsScreen.tsx` (`/dashboard/auction/{id}/payment`) | |
| `POST /auctions/{id}/cancel` | ✅ | `LiveAuctions.tsx` (admin) → "Cancel auction" button + reason modal | Admin-only per backend guard. |
| `POST /auctions/{auctionId}/bids` | ✅ | `DetailScreen.tsx` Place-bid bar | Convert naira → kobo at submit. |

---

## Wallets

| Endpoint | Status | Frontend surface | Notes |
|---|---|---|---|
| `GET /wallets/me` | ✅ | `WalletScreen.tsx` (`/dashboard/wallet`) | |
| `GET /wallets/me/ledger` | ✅ | `WalletScreen.tsx` ledger | Paginated. |
| `POST /wallets/funding-account` | ✅ | `TopUpScreen.tsx` (`/dashboard/wallet/topup`) | Returns Monnify funding account; UI displays the account number and bank name. |
| `POST /wallets/withdrawals` | ✅ | `WithdrawalHistoryScreen.tsx` (`/dashboard/wallet/withdrawals`) → "New withdrawal" form | |
| `GET /wallets/withdrawals/{id}` | ✅ | `WithdrawalHistoryScreen.tsx` row click / detail | |
| **List user's own withdrawals** | 🔧 | Same screen — currently shows simulated array. | **Backend gap:** see `requests/backend/wallets.md`. |

---

## Notifications

| Endpoint | Status | Frontend surface | Notes |
|---|---|---|---|
| `GET /notifications` | ✅ | `NotificationsScreen.tsx` (`/dashboard/notifications`) | Supports `limit`, `offset`, `unreadOnly`. |
| `PATCH /notifications/read-all` | ✅ | `NotificationsScreen.tsx` "Mark all read" button | |
| `PATCH /notifications/{id}/read` | ✅ | `NotificationsScreen.tsx` row click / mark-read action | Optimistic update per pattern. |

---

## Listings (cars and gadgets)

| Endpoint | Status | Frontend surface | Notes |
|---|---|---|---|
| `POST /cars` | ✅ | `CreateListingScreen.tsx` → category=car flow | |
| `GET /cars/my-listings` | ✅ | `MyListingsScreen.tsx` (`/dashboard/listings`) | |
| `GET /cars/{id}` | ✅ | `ListingDetailScreen.tsx` (`/dashboard/listings/{id}?category=car`) | |
| `PATCH /cars/{id}` | ✅ | `EditListingScreen.tsx` (`/dashboard/listings/{id}/edit?category=car`) | |
| `POST /cars/{id}/submit` | ✅ | `MyListingsScreen.tsx` "Submit for review" + `EditListingScreen.tsx` "Save & resubmit" | |
| `POST /gadgets` | ✅ | `CreateListingScreen.tsx` → category=gadget flow | |
| `GET /gadgets/my-listings` | ✅ | `MyListingsScreen.tsx` | Same screen, merged with cars. |
| `GET /gadgets/{id}` | ✅ | `ListingDetailScreen.tsx` (`?category=gadget`) | |
| `PATCH /gadgets/{id}` | ✅ | `EditListingScreen.tsx` (`?category=gadget`) | |
| `POST /gadgets/{id}/submit` | ✅ | Same controls as cars. | |

---

## Uploads

| Endpoint | Status | Frontend surface | Notes |
|---|---|---|---|
| `POST /uploads` | ✅ | `CreateListingScreen.tsx` (single-file slot) | `purpose: LISTING_PHOTO | LISTING_VIDEO | PROOF_DOCUMENT | INSPECTION_MEDIA`. |
| `POST /uploads/batch` | ✅ | `CreateListingScreen.tsx` (multi-file picker) | Up to 10 files. |
| `POST /uploads/bulk` | ✅ | `CreateListingScreen.tsx` (bulk picker — same UX as `/batch`) | |

---

## Admin — applications, listings

| Endpoint | Status | Frontend surface | Notes |
|---|---|---|---|
| `GET /admin/listing-access-applications/pending` | ✅ | `ListingsScreen.tsx` "Access applications" card | |
| `POST /admin/listing-access-applications/{id}/approve` | ✅ | Same screen, "Approve" button | Body: `{ reviewNote }`. |
| `POST /admin/listing-access-applications/{id}/reject` | ✅ | Same screen, "Reject" button | |
| `GET /admin/listings/pending` | ✅ | `Queue.tsx` widget (used in `DashboardScreen.tsx` and `ListingsScreen.tsx`) | |
| `POST /admin/listings/{category}/{id}/approve` | ✅ | `ListingReviewDialog.tsx` "Approve" footer button | |
| `POST /admin/listings/{category}/{id}/reject` | ✅ | `ListingReviewDialog.tsx` "Deny" footer button | |
| `POST /admin/access-codes` | ✅ | `AccessCodesScreen.tsx` "Create access code" form | |
| `POST /admin/listing-permissions` | ✅ | `UsersScreen.tsx` "Grant access" action → category modal | |

---

## Admin — settings

| Endpoint | Status | Frontend surface | Notes |
|---|---|---|---|
| `GET /admin/settings/platform-fees` | ✅ | `SettingsScreen.tsx` "Platform fees" section | |
| `PATCH /admin/settings/platform-fees` | ✅ | Same | Backend uses `bps`; UI shows `%`. Convert at the edge (`bps = pct * 100`). |
| `GET /admin/settings/bidding` | ✅ | `SettingsScreen.tsx` "Bidding" section | |
| `PATCH /admin/settings/bidding` | ✅ | Same | `bidRequirementPercent`. |
| `GET /admin/settings/payment-account` | ✅ | `SettingsScreen.tsx` "Winner payment account" section | |
| `PATCH /admin/settings/payment-account` | ✅ | Same | `bankName`, `accountNumber`, `accountName`. |

---

## Admin — wallet withdrawals

| Endpoint | Status | Frontend surface | Notes |
|---|---|---|---|
| `GET /admin/wallet-withdrawals/pending` | ✅ | `WithdrawalsScreen.tsx` (`/admin/withdrawals`) | |
| `POST /admin/wallet-withdrawals/{id}/authorize` | ✅ | Same screen, OTP entry per row | |
| `POST /admin/wallet-withdrawals/{id}/resend-otp` | ✅ | Same screen, "Resend OTP" button | |
| **List all withdrawals (history)** | 🔧 | Same screen has tabs Pending / Authorized / Failed but only Pending is real. | **Backend gap:** see `requests/backend/wallets.md`. |

---

## Admin — auction settlement

| Endpoint | Status | Frontend surface | Notes |
|---|---|---|---|
| `POST /admin/auctions/{id}/settle-payment` | ✅ | `SettlementScreen.tsx` (`/admin/settlements`) "Settle" action | Body has both `externalPaymentKobo` and `walletPaymentKobo`. |
| `POST /admin/auctions/{id}/default-payment` | ✅ | Same screen, "Mark defaulted" action | |

---

## Health, payments

| Endpoint | Status | Frontend surface | Notes |
|---|---|---|---|
| `GET /health` | ✅ | `HealthScreen.tsx` (`/admin/health`) | |
| `POST /payments/monnify/webhook` | ➖ | server-only | No UI consumes this. |

---

## Backend gaps tracked in `requests/backend/`

A summary of the open requests so they're searchable from one place:

- `requests/backend/auth.md` — phone OTP, email verification, forgot-password wiring, NIN verify endpoint, referral code at signup, phone sign-in, profile fields the UI shows but the auth schema doesn't store.
- `requests/backend/wallets.md` — list user withdrawals, list all admin withdrawals.
- `requests/backend/security-and-hardening.md` — webhook signature verification, env-default tightening, idempotency interceptor, and other hardening tasks found in the backend audit. Three items already fixed in this pass (global throttler, global exception filter, `process.env` leak).

If a frontend feature needs something not in the table above, add an entry in the matching `requests/backend/<domain>.md` and a row here.

---

## Endpoints called by more than one screen

These are the ones the integrator should set up **first**, because they unblock multiple screens.

1. `GET /auth/get-session` — every authenticated screen depends on it.
2. `GET /users/me` — profile, dashboard greetings, role-based UI gates, KYC chips.
3. `GET /wallets/me` — visible in topbar (balance), wallet screen, bid hold checks.
4. `GET /notifications` — bell badge, dashboard, dedicated screen.
5. `GET /auctions` — landing page strip, browse, dashboard "Live now".

Wire those five and 70% of the visible UI lights up. Move the remaining endpoints in the order listed in `pattern.md` → "Migrating simulated screens to live data".

---

## Hand-off checklist

Before this codebase is "ready for the integrator", every box below should be ticked.

**UI surface**
- [x] Every backend endpoint has a screen, widget, or hook that consumes it (this document is the proof).
- [x] Every interactive admin endpoint has a button/form that produces the right payload shape.
- [x] No alert(...) calls left in the user-facing flows that hide a real action (admin `console.log` placeholders are OK; integrator replaces with mutations).
- [x] Mock data shapes match the OpenAPI DTOs field-for-field where possible (kobo for money, ISO strings for dates).

**Patterns + docs**
- [x] `pattern.md` describes the HTTP, query, mutation, auth, realtime, and forms patterns.
- [x] `pattern.md` lists the canonical libraries and a one-shot install command.
- [x] `requests/backend/*.md` lists every backend gap with a clear description.
- [x] `requests/frontend/*.md` lists every UI shape change required to match the existing contracts.
- [x] This file (`INTEGRATION-READINESS.md`) maps every endpoint to a UI surface.

**Repository hygiene**
- [x] No file over 500 lines.
- [x] No `any` introduced by recent integration prep.
- [x] Default route guards in place (`SessionGuard`, admin layout).
- [x] Edit/View routes exist for `/dashboard/listings/{id}` and `/dashboard/listings/{id}/edit`.

When the integrator picks this up, they:

1. Read `pattern.md` end to end.
2. Run the install command in `pattern.md` → "One-time install".
3. Add `lib/api/`, `lib/auth/`, `lib/query/`, `lib/format/` per the folder layout.
4. Migrate features in the order listed in `pattern.md` → "Migrating simulated screens to live data".
5. For each feature, use this document to find the screen + endpoint pairing, then build the slice (types → api → keys → hooks → wire).
