# Auth — Backend requests

Things the auth UI expects that the backend does **not** currently expose. Each item is independent.

> Existing surface (Better Auth, mounted at `/api/v1/auth/*`):
> - `POST /auth/sign-up/email` — `SignUpEmailDto { name, email, password, phone, firstName, lastName, appRole?, nin?, image?, callbackURL?, rememberMe? }`
> - `POST /auth/sign-in/email`
> - `POST /auth/sign-out`
> - `GET  /auth/get-session`
> - Better Auth catch-all is mounted on `/auth/*`, so any plugin enabled in `auth.service.ts` is reachable.

---

## 1. Phone / OTP verification

**UI today (`OtpForm.tsx`)** — after register or login, user enters a 6-digit code claimed to be sent via SMS and WhatsApp.

**Backend gap** — Better Auth `phone-number` plugin is not enabled. SMS / WhatsApp delivery not wired.

**Requested**
- Enable Better Auth `phone-number` plugin and document the endpoints in Swagger:
  - `POST /auth/phone-number/send-otp` — body `{ phoneNumber }`
  - `POST /auth/phone-number/verify` — body `{ phoneNumber, code }`
- Deliver via WhatsApp Business API; SMS as fallback.
- Persist `phoneVerified` flag and surface it on the session.

If not implemented: drop the `/otp` step on the frontend (see frontend doc).

---

## 2. Email verification

**Backend gap** — `emailAndPassword.requireEmailVerification` not set; `sendVerificationEmail` not wired to a sender.

**Requested**
- Wire `sendVerificationEmail` in `auth.service.ts` using the existing Resend integration.
- Surface verification status on `GET /auth/get-session` and `GET /users/me`.

---

## 3. Password reset

**UI today (`ForgotForm.tsx`, `ResetPasswordForm.tsx`)** — email reset flow with token-bearing reset page.

**Backend gap** — Better Auth's reset-password endpoints exist by default but aren't wired with a real email sender.

**Requested**
- Confirm/expose:
  - `POST /auth/forget-password` — body `{ email, redirectTo? }`
  - `POST /auth/reset-password` — body `{ newPassword, token }`
- Wire `sendResetPassword` to Resend with a templated link to `<frontend-origin>/reset?token=...`.

---

## 4. NIN verification (NIMC lookup)

**UI today (`NinVerifyField.tsx`)** — inline "Verify" button with mock 900ms async verify.

**Backend gap** — `SignUpEmailDto.nin` is accepted as a string and stored as-is. No NIMC verification, no `ninVerified` flag.

**Requested**
- `POST /api/v1/users/me/nin/verify` (auth required) — body `{ nin }`. Calls NIMC (or chosen identity provider). Returns `{ verified, name?, dob? }` and persists `ninVerified` + verified-at.
- Surface `ninVerified` on `GET /users/me`.

---

## 5. Referral code at signup (optional)

**UI today (`RegisterForm.tsx`)** — optional "Referral code" input.

**Backend gap** — `SignUpEmailDto` has no `referralCode` field; no referral table.

**Requested (optional, MVP-skippable)**
- Add `referralCode?: string` to `SignUpEmailDto`.
- On accepted code, link inviter; on first auction win, credit ₦5,000 to inviter's wallet.

If not implemented: hide the field (see frontend doc).

---

## 6. Phone-based sign-in (optional)

**UI today (`LoginForm.tsx`)** — Email/Phone tabs (phone tab currently inert).

**Backend gap** — `POST /auth/sign-in/email` only accepts `email`.

**Requested (optional)**
- Enable Better Auth `phone-number` plugin with `signIn: true`, exposing `POST /auth/sign-in/phone-number`, **or** accept a `phoneOrEmail` field on the existing DTO.

If not implemented: drop the phone tab on the frontend (see frontend doc).

---

## 7. Profile fields shown by UI but not stored

`ProfileScreen.tsx` and dashboards display:
- `image` — already supported as optional in `SignUpEmailDto`.
- `createdAt` — exists in `auth_users`, just expose on `/users/me`.
- `@handle` — **not stored**. Either generate a slug server-side from `firstName.lastName`, or drop the chip everywhere (frontend doc choice).

---

## Priority for MVP

1. **Email verification + password reset** — security baseline.
2. **Phone OTP** — required if `/otp` step stays.
3. **NIN verify** — required to gate bidding (per `bidRequirementPercent` rule).
4. Everything else (referral, phone sign-in) is optional and can be cut on the frontend instead.
