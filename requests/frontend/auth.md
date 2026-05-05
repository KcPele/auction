# Auth — Frontend updates

UI shape changes to bring the auth flow in line with what the backend already exposes. Apply these regardless of which items in `requests/backend/auth.md` get accepted — they are pure shape fixes against the contracts that exist today.

> Backend contracts (today):
> - `POST /auth/sign-up/email` — `{ name, email, password, phone, firstName, lastName, appRole?, nin?, image?, callbackURL?, rememberMe? }` (`name` required)
> - `POST /auth/sign-in/email` — `{ email, password, callbackURL?, rememberMe? }`
> - `POST /auth/sign-out`
> - `GET  /auth/get-session`

Cookies: backend issues a `better-auth.session_token` cookie. Frontend must use `credentials: "include"` on all fetches and stop reading any token from `localStorage`.

---

## 1. Register form (`app/components/auth/RegisterForm.tsx`)

- Build a `name` field on submit: `name = ${firstName} ${lastName}`. Backend rejects requests without it.
- Default `appRole = INDIVIDUAL_BIDDER`. Don't expose role pickers in this surface.
- Phone: enforce E.164 (`+2348012345678`) on submit. Keep the local-format display.
- Password: min 8 (matches backend).
- NIN: keep optional UX; send digits-only string. Verify button stays simulated until backend §4 lands.
- Referral code: until backend §5 lands, **strip on submit** (don't send). Recommend hiding the input behind a feature flag for now.
- Terms checkbox stays client-side.
- Google/Apple buttons + "Or sign up with" divider — already removed.

---

## 2. Login form (`app/components/auth/LoginForm.tsx`)

- **Drop the Email/Phone tabs** unless backend §6 (phone sign-in) is delivered. Today the phone tab swaps the input but the submit hits an email-only endpoint.
- Submit: `{ email, password, rememberMe }`. Map "Keep me signed in" checkbox to `rememberMe`.
- Default-filled email/password values stay for now (still in simulated mode).
- After successful sign-in, route by role: admin → `/admin`, anyone else → `/dashboard`.
- Skip `/otp?ctx=login` unless backend §1 lands.
- Google/Apple buttons + divider — already removed.

---

## 3. OTP form (`app/components/auth/OtpForm.tsx`)

Two paths depending on backend §1:

- **OTP plugin lands** — wire to `POST /auth/phone-number/send-otp` and `POST /auth/phone-number/verify`. Resend hits send-otp again.
- **OTP plugin does not land** — delete the page, the routes that link to it (`/register`, `/login`, `/kyc` back-link), and `useResendTimer` if unused. Stepper goes from 3 steps to 2 (Account → KYC).

Either way: drop the hardcoded `+234 812 ••• 6789`; pull from form context.

---

## 4. Forgot / reset password (`app/components/auth/ForgotForm.tsx`, `ResetPasswordForm.tsx`)

- On submit `Forgot`: `POST /auth/forget-password` with `{ email, redirectTo: '<origin>/reset' }` once backend §3 is exposed.
- `ResetPasswordForm` already exists at `/reset?token=...`; wire it to `POST /auth/reset-password` with `{ newPassword, token }`.

---

## 5. KYC flow (`app/components/auth/kyc/KycFlow.tsx`)

- BVN field — already removed.
- Wire NIN "Verify" button to backend §4 once available. `NinVerifyField` already supports passing a real async verify; until then the mock stays.
- After verify, on Continue:
  - From `?ctx=register` → `PATCH /users/me` with `{ nin }` (or rely on signup payload) → route `/verified`.
  - From `?ctx=account` → same PATCH → route `/dashboard/profile`.

---

## 6. Session bootstrap & route guards

Replace simulated user data with `useSession()` from Better Auth's React client (see `pattern.md`). Hardcoded "Adaeze Okafor" / "@adaeze.o" in screens become real values from `session.user`.

- Wrap `(user)` and `(admin)` route groups with `<RequireAuth>` / `<RequireRole role="admin">`.
- Sign out button in `ProfileScreen.tsx` calls `signOut()` then `router.replace('/login')`.

---

## 7. Username / handle

Backend has no `username` field. Drop the `@handle` chip everywhere (recommended for MVP), or display the email local-part until backend §7 adds a real handle.

---

## 8. Field-level validation parity (zod)

Add `app/components/auth/utils/auth.schemas.ts`:

```ts
export const signUpSchema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  email:     z.string().email(),
  phone:     z.string().regex(/^\+?[0-9]{10,15}$/),
  password:  z.string().min(8),
  nin:       z.string().regex(/^\d{11}$/).optional(),
  appRole:   z.enum(['INDIVIDUAL_BIDDER', 'CAR_DEALER', 'MECHANIC']).default('INDIVIDUAL_BIDDER'),
  rememberMe: z.boolean().optional(),
});

export const signInSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
});
```

Use them via `react-hook-form` + `@hookform/resolvers/zod`.

---

## Summary of FE-only edits we can do *today*

These are safe to implement now even before any backend work — they only re-shape the UI to match contracts that already exist:

- [ ] Register: derive `name`, default `appRole`, normalize phone to E.164, hide referral input.
- [ ] Login: drop phone tab, wire `rememberMe`.
- [ ] Profile / dashboards: replace hardcoded "Adaeze" text with TODO markers + a `useSession()` stub returning a typed `User`.
- [ ] Add zod schemas matching backend DTOs.
- [ ] Add `apiClient` wrapper that always sends `credentials: 'include'` and points at `NEXT_PUBLIC_API_BASE_URL` + `/api/v1`.

Anything tied to OTP / forgot / NIN-verify / referral waits on the backend doc.
