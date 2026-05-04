# BidNaija Frontend ↔ Backend Audit

**Date:** 2026-05-04
**Backend:** 101 endpoints across 13 controllers
**Frontend:** 22 page routes, ~50 components

---

## Executive Summary

The backend is **fully built** with 101 endpoints. The frontend has **all screens built** but almost none are connected to real APIs — they use hardcoded mock data with `// Integration:` comments. Only `useSession.ts` makes real API calls (sign-in, get-session, sign-out).

**Critical mismatch:** TopUpScreen references Paystack/Flutterwave/Monnify, but backend now uses **Strowallet**.

---

## 1. Shared API Layer — MISSING ❌

There is no shared API client. `useSession.ts` has inline `fetch()` calls with `API_BASE`. Every other screen uses mock data.

**Need to create:**
- `frontend/app/lib/api-client.ts` — centralized fetch wrapper with auth headers, error handling
- `frontend/app/lib/api-types.ts` — TypeScript interfaces matching backend DTOs

---

## 2. User Screens Integration Status

| Screen | File | Status | Backend Endpoints |
|--------|------|--------|-------------------|
| Home | HomeScreen.tsx | ⚠️ Mock + comments | `GET /auctions?status=LIVE`, `GET /wallets/me`, `GET /users/me` |
| Browse | BrowseScreen.tsx | ⚠️ Mock + comments | `GET /auctions?category=&status=&limit=&offset=` |
| Detail | DetailScreen.tsx | ⚠️ Mock + comments | `GET /auctions/:id`, `GET /auctions/:id/bids`, `GET /cars/:id` or `GET /gadgets/:id`, `POST /auctions/:id/bids`, `POST /auctions/:id/cancel` |
| Wallet | WalletScreen.tsx | ⚠️ Mock + comments | `GET /wallets/me`, `GET /wallets/me/ledger` |
| TopUp | TopUpScreen.tsx | ⚠️ **WRONG PROVIDER** | References Paystack/Flutterwave/Monnify. Backend uses **Strowallet**: `POST /wallets/topup/initiate`, `POST /wallets/funding-account` |
| My Bids | MyBidsScreen.tsx | ⚠️ Mock + comments | `GET /users/me/bids?status=active\|scheduled\|won` |
| My Listings | MyListingsScreen.tsx | ⚠️ Mock + comments | `GET /cars/my-listings`, `GET /gadgets/my-listings`, `POST /cars/:id/submit`, `POST /gadgets/:id/submit` |
| Create Listing | CreateListingScreen.tsx | ⚠️ Mock + comments | `POST /cars` or `POST /gadgets`, `POST /cars/:id/submit` |
| Notifications | NotificationsScreen.tsx | ⚠️ Mock + comments | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| Profile | ProfileScreen.tsx | 🔴 Hardcoded names/stats | `GET /users/me`, `PATCH /users/me`, `PATCH /users/me/notification-preferences`, `GET /users/me/stats` |
| Watchlist | WatchlistScreen.tsx | ⚠️ Mock + comments | `GET /users/me/watchlist`, `POST /users/me/watchlist`, `DELETE /users/me/watchlist/:auctionId` |
| Withdrawals | WithdrawalHistoryScreen.tsx | ⚠️ Mock + comments | `GET /wallets/me/withdrawals`, `POST /wallets/withdrawals`, `GET /wallets/withdrawals/:id` |
| Payment Instructions | PaymentInstructionsScreen.tsx | ⚠️ Mock + comments | `GET /auctions/:id/payment-instructions` |
| Won Auctions | — | ❌ No screen | `GET /users/me/won-auctions`, `POST /auctions/:id/confirm-payment`, `GET /auctions/:id/delivery`, `PATCH /auctions/:id/delivery` |
| User Stats | — | ❌ No screen | `GET /users/me/stats` |
| Listing Access | — | ❌ No screen | `GET /users/me/listing-access-applications`, `POST /users/me/listing-access-applications` |
| Access Code Redeem | — | ❌ No screen | `POST /users/me/access-codes/redeem` |

---

## 3. Auth Screens Integration Status

| Screen | File | Status | Backend Endpoints |
|--------|------|--------|-------------------|
| Login | LoginForm.tsx | 🔴 No API calls | `POST /auth/sign-in/email`, `POST /auth/sign-in/phone` |
| Register | RegisterForm.tsx | 🔴 No API calls | `POST /auth/sign-up/email` |
| Forgot Password | ForgotForm.tsx | 🔴 No API calls | `POST /auth/forgot-password` |
| Reset Password | — | ❌ No screen | `POST /auth/reset-password` |
| OTP | OtpForm.tsx | 🔴 No API calls | `POST /auth/send-verification-otp`, `POST /auth/verify-email` |
| NIN Verify | NinVerifyField.tsx | 🔴 Uses `mockVerify()` | `POST /auth/verify-nin` |
| KYC Flow | KycFlow.tsx | 🔴 No API calls | `POST /kyc/bvn/verify`, `POST /kyc/nin/verify`, `POST /kyc/otp/send`, `POST /kyc/subaccount` |

---

## 4. Admin Screens Integration Status

| Screen | File | Status | Backend Endpoints |
|--------|------|--------|-------------------|
| Dashboard | DashboardScreen.tsx | 🔴 Mock `INITIAL_COUNTS` | `GET /admin/dashboard/stats`, `GET /admin/activity-feed` |
| Auctions | AuctionsScreen.tsx | 🔴 Mock data | `GET /admin/auctions`, `POST /admin/auctions/:id/settle-payment`, `POST /admin/auctions/:id/default-payment` |
| Listings | ListingsScreen.tsx | 🔴 Mock `INITIAL_APPROVALS` | `GET /admin/listings/pending`, `POST /admin/listings/:category/:id/approve`, `POST /admin/listings/:category/:id/reject` |
| Access Codes | AccessCodesScreen.tsx | 🔴 Mock data | `GET /admin/access-codes`, `POST /admin/access-codes` |
| Users | UsersScreen.tsx | 🔴 Mock/placeholder | `GET /admin/users`, `POST /admin/users/:id/ban`, `POST /admin/users/:id/unban`, `GET /admin/users/:id/wallet` |
| Mechanics | MechanicsScreen.tsx | 🔴 Mock data | `GET /admin/mechanics`, `POST /admin/mechanics/:id/verify`, `POST /admin/mechanics/:id/revoke` |
| Disputes | DisputesScreen.tsx | 🔴 Mock data | `GET /admin/disputes`, `POST /admin/disputes/:id/investigate`, `POST /admin/disputes/:id/resolve` |
| Payments | PaymentsScreen.tsx | 🔴 Mock data | `GET /admin/ledger`, `GET /admin/wallet-withdrawals/pending`, `POST /admin/wallet-withdrawals/:id/authorize`, `POST /admin/wallet-withdrawals/:id/resend-otp` |
| Notifications | NotificationsScreen.tsx | 🔴 Mock data | `GET /admin/notification-logs` |
| Settings | SettingsScreen.tsx | 🔴 Mock/placeholder | `GET/PATCH /admin/settings/escrow`, `GET/PATCH /admin/settings/toggles`, `GET/PATCH /admin/settings/platform-fees`, `GET/PATCH /admin/settings/bidding`, `GET/PATCH /admin/settings/payment-account` |
| Listing Review | ListingReviewDialog.tsx | 🔴 Mock data | `POST /admin/listing-access-applications/:id/approve`, `POST /admin/listing-access-applications/:id/reject` |
| Queue Widget | Queue.tsx | 🔴 Mock `INITIAL_APPROVALS` | `GET /admin/listings/pending` |

---

## 5. Missing Frontend Screens

These backend endpoints have **no corresponding frontend screen at all:**

### User-facing:
1. **Won Auctions** — view won auctions, confirm payment, track delivery
2. **User Stats** — bidding stats, win rate, activity
3. **Listing Access Applications** — apply for listing permission, view status
4. **Access Code Redemption** — redeem access code
5. **Delivery Tracking** — view/update delivery status for won auctions
6. **Reset Password** — enter new password after forgot-password flow

### Admin-facing:
7. **Withdrawal Authorization** — pending withdrawals, OTP authorization
8. **Settlement** — settle/default payment for ended auctions
9. **Health Monitor** — system health dashboard
10. **Feature Toggles** — enable/disable platform features

---

## 6. Payment Provider Mismatch 🔴

**TopUpScreen.tsx** references:
- Paystack (Card/USSD)
- Flutterwave
- Monnify (Virtual Account)

**Backend now uses:**
- **Strowallet** (`POST /wallets/topup/initiate` with `method: 'strowallet' | 'bank_transfer'`)
- `POST /wallets/funding-account` for virtual accounts (via Strowallet)

**Action:** Rewrite TopUpScreen to use Strowallet instead of Paystack/Flutterwave/Monnify.

---

## 7. Implementation Plan

### Phase 1: Foundation
- [ ] Create `app/lib/api-client.ts` (fetch wrapper with auth, error handling)
- [ ] Create `app/lib/api-types.ts` (TypeScript types matching backend DTOs)

### Phase 2: Auth Integration
- [ ] Wire LoginForm → `POST /auth/sign-in/email`
- [ ] Wire RegisterForm → `POST /auth/sign-up/email`
- [ ] Wire ForgotForm → `POST /auth/forgot-password`
- [ ] Wire OtpForm → `POST /auth/verify-email`
- [ ] Fix NinVerifyField → `POST /auth/verify-nin`
- [ ] Create ResetPassword screen
- [ ] Wire KycFlow → KYC endpoints

### Phase 3: User Dashboard Integration
- [ ] HomeScreen → real API calls
- [ ] BrowseScreen → real API calls
- [ ] DetailScreen → real API + bid placement + cancel
- [ ] WalletScreen → real API calls
- [ ] TopUpScreen → rewrite for Strowallet
- [ ] MyBidsScreen → real API calls
- [ ] MyListingsScreen → real API calls
- [ ] CreateListingScreen → real API calls
- [ ] NotificationsScreen → real API calls
- [ ] ProfileScreen → real API calls + edit profile
- [ ] WatchlistScreen → real API calls
- [ ] WithdrawalHistoryScreen → real API calls
- [ ] PaymentInstructionsScreen → real API calls

### Phase 4: New User Screens
- [ ] WonAuctionsScreen (won auctions + payment + delivery)
- [ ] ListingAccessScreen (apply for listing permission)
- [ ] AccessCodeRedeemScreen

### Phase 5: Admin Integration
- [ ] DashboardScreen → real API calls
- [ ] AuctionsScreen → real API calls + settle/default actions
- [ ] ListingsScreen → real API calls + approve/reject
- [ ] AccessCodesScreen → real API calls + create
- [ ] UsersScreen → real API calls + ban/unban/wallet view
- [ ] MechanicsScreen → real API calls + verify/revoke
- [ ] DisputesScreen → real API calls + investigate/resolve
- [ ] PaymentsScreen → real API calls + withdrawal auth
- [ ] NotificationsScreen → real API calls
- [ ] SettingsScreen → real API calls + edit settings

---

## File of Record
`/home/kcpele/.Hermes/workspace/auction/FRONTEND_BACKEND_AUDIT.md`
