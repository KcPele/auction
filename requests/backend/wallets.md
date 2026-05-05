# Wallets — Backend requests

Two listing endpoints the frontend needs but the backend doesn't expose yet.

> Existing surface (for reference):
> - `GET  /api/v1/wallets/me`
> - `GET  /api/v1/wallets/me/ledger?limit&offset`
> - `POST /api/v1/wallets/funding-account`
> - `POST /api/v1/wallets/withdrawals`
> - `GET  /api/v1/wallets/withdrawals/{id}`
> - `GET  /api/v1/admin/wallet-withdrawals/pending`
> - `POST /api/v1/admin/wallet-withdrawals/{id}/authorize`
> - `POST /api/v1/admin/wallet-withdrawals/{id}/resend-otp`

---

## 1. List the current user's withdrawals

**UI today (`WithdrawalHistoryScreen.tsx`)**
- Shows a table of "your withdrawals" with status filters: All, Pending, Completed, Failed.
- The single-id `GET /wallets/withdrawals/{id}` won't power that list — we need the collection.

**Requested**

```
GET /api/v1/wallets/me/withdrawals?limit&offset&status
```

- Auth required (`better-auth.session_token`).
- Filters: `status` (`PENDING | AUTHORIZED | SUCCESS | FAILED | CANCELLED`).
- Returns the user's withdrawals only.
- Each row should include: `id`, `amountKobo`, `status`, `destinationBank`, `destinationAccountNumber`, `destinationAccountName`, `createdAt`, `completedAt | null`, `failureReason | null`.

If the team prefers, this can be a query parameter on the existing `/wallets/me/ledger` endpoint (`type=WITHDRAWAL`), but a separate route is cleaner because withdrawal status transitions don't map to ledger directions cleanly.

---

## 2. List all admin withdrawals (history)

**UI today (`WithdrawalsScreen.tsx`)**
- Tabs: **Pending** (already wired), **Authorized**, **Failed**.
- Only Pending has a real endpoint.

**Requested**

```
GET /api/v1/admin/wallet-withdrawals?status&from&to&limit&offset
```

- Admin auth required.
- Filters: `status`, `from` / `to` (ISO date), pagination.
- Each row: same shape as user-facing list **plus** `userId`, `userHandle`, `userName`, `monnifyReference | null`.

Without this the admin can't audit historical withdrawals or chase failed ones.

---

## Optional: cancel pending withdrawal

If we want users to be able to cancel a withdrawal that hasn't been authorized:

```
POST /api/v1/wallets/withdrawals/{id}/cancel
```

Would refund the held amount back to wallet balance. Out of scope for MVP; flagged here for visibility.
