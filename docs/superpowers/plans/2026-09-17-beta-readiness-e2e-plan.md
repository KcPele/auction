# BidNaija Beta-Readiness End-to-End Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a repeatable, UI-first beta-readiness test that creates the required roles, completes a car auction, leaves a gadget auction live, verifies wallet rules and communication flows, fixes discovered defects, and publishes an evidence-backed status report.

**Architecture:** Add a serial Playwright beta scenario composed from small helpers for identities, UI authentication, evidence, and backend-only verification exceptions. Run the application locally against the configured sandbox database and storage, use UI actions for product behavior, and use focused unit or Playwright regression tests for each defect before continuing the scenario.

**Tech Stack:** Next.js, React, Tailwind CSS, Playwright, NestJS, TypeORM, PostgreSQL, Redis, Better Auth, MinIO-compatible uploads, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-17-beta-readiness-e2e-design.md`

## Global Constraints

- Preserve all pre-existing uncommitted changes and never stage unrelated files.
- Use pnpm for every package command.
- Keep every source file below 500 lines.
- Run ordinary product operations through the UI; backend/database writes are limited to email/KYC verification and admin promotion.
- Use global theme tokens and existing Tailwind utilities; do not add hardcoded colors, fonts, or arbitrary reusable sizes.
- Surface structured backend error messages in the UI.
- Record real listing-image source URLs and licenses.
- Treat referral as persisted attribution only; do not invent rewards or validation.
- Run the integrated browser scenario with one Playwright worker.

---

### Task 1: Runtime Baseline and Evidence Harness

**Files:**
- Create: `frontend/e2e/helpers/beta-identities.ts`
- Create: `frontend/e2e/helpers/beta-evidence.ts`
- Create: `frontend/e2e/artifacts/.gitignore`
- Modify: `frontend/playwright.config.ts`
- Test: `frontend/e2e/beta-readiness.spec.ts`

**Interfaces:**
- Produces: `createBetaIdentities(runId: string): BetaIdentities`
- Produces: `BetaEvidence.record(step: EvidenceStep): Promise<void>`
- Produces: `BetaEvidence.flush(): Promise<void>`
- Consumes: Playwright `Page`, browser response and console events.

- [x] **Step 1: Write the failing harness smoke test**

```ts
test("records browser health evidence", async ({ page }) => {
  const evidence = new BetaEvidence("harness-smoke");
  evidence.observe(page);
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  await evidence.record({ step: "landing", status: "passed", path: page.url() });
  await evidence.flush();
  await expect.poll(() => evidence.outputExists()).toBe(true);
});
```

- [x] **Step 2: Run the smoke test and verify it fails because the helper does not exist**

Run: `cd frontend && pnpm exec playwright test e2e/beta-readiness.spec.ts --grep "records browser health evidence" --workers=1`

Expected: FAIL with an unresolved `BetaEvidence` import.

- [x] **Step 3: Implement deterministic identities and evidence collection**

```ts
export type BetaIdentity = {
  label: string;
  email: string;
  phone: string;
  password: string;
  appRole: "INDIVIDUAL_BIDDER" | "CAR_DEALER" | "MECHANIC";
};

export function createBetaIdentities(runId: string): BetaIdentities {
  const password = "BidNaija!2026QA";
  const make = (label: string, suffix: string, digit: string, appRole: BetaIdentity["appRole"]): BetaIdentity => ({
    label,
    email: `beta.${suffix}.${runId}@bidnaija.local`,
    phone: `+23480${runId.slice(-7)}${digit}`,
    password,
    appRole,
  });
  return {
    admin: make("QA Admin", "admin", "1", "INDIVIDUAL_BIDDER"),
    mechanic: make("QA Mechanic", "mechanic", "2", "MECHANIC"),
    carDealer: make("QA Car Dealer", "car", "3", "CAR_DEALER"),
    gadgetSeller: make("QA Gadget Seller", "gadget", "4", "INDIVIDUAL_BIDDER"),
    bidderA: make("QA Bidder A", "biddera", "5", "INDIVIDUAL_BIDDER"),
    bidderB: make("QA Bidder B", "bidderb", "6", "INDIVIDUAL_BIDDER"),
    codeUser: make("QA Code User", "code", "7", "INDIVIDUAL_BIDDER"),
  };
}
```

- [x] **Step 4: Start backend and frontend on ports 4000 and 3000, then verify health**

Run backend: `cd backend && pnpm start:dev`

Run frontend: `cd frontend && pnpm exec next dev -p 3000`

Verify: `curl -fsS http://localhost:4000/api/v1/health` and `curl -fsS http://localhost:3000`

Expected: both return successful HTTP responses.

- [x] **Step 5: Run migrations and baseline checks**

Run: `cd backend && pnpm migration:run && pnpm test --runInBand && pnpm typecheck && pnpm lint`

Run: `cd frontend && pnpm exec tsc --noEmit && pnpm lint`

Expected: no pending migration failure; 49 backend suites remain green; both apps pass type and lint checks.

- [x] **Step 6: Rerun the harness smoke test**

Expected: PASS and an evidence JSON file under `frontend/e2e/artifacts/`.

- [x] **Step 7: Commit only the harness files if they do not overlap prior dirty work**

```bash
git add frontend/e2e/helpers/beta-identities.ts frontend/e2e/helpers/beta-evidence.ts frontend/e2e/artifacts/.gitignore frontend/e2e/beta-readiness.spec.ts frontend/playwright.config.ts
git commit -m "test(e2e): add beta readiness harness"
```

### Task 2: UI Signup, Verification, Roles, and Referral Attribution

**Files:**
- Create: `frontend/e2e/helpers/beta-auth.ts`
- Create: `backend/src/scripts/prepare-beta-account.ts`
- Modify: `backend/package.json`
- Modify: `frontend/e2e/beta-readiness.spec.ts`
- Test: `backend/src/scripts/prepare-beta-account.spec.ts`

**Interfaces:**
- Produces: `registerThroughUi(page, identity, options): Promise<void>`
- Produces: CLI `pnpm beta:prepare-account -- --email <email> --verify-email --verify-kyc`
- Consumes: `BetaIdentity` and signup form accessible labels.

- [ ] **Step 1: Write failing tests for preparation scope**

```ts
it("only verifies the selected account", async () => {
  await prepareBetaAccount(manager, {
    email: "beta.biddera.20260917@bidnaija.local",
    verifyEmail: true,
    verifyKyc: true,
  });
  expect(manager.query).toHaveBeenCalledWith(expect.stringContaining("WHERE LOWER"), [
    "beta.biddera.20260917@bidnaija.local",
  ]);
});
```

- [ ] **Step 2: Implement the narrowly scoped verification CLI**

The script must require an exact email, update only the linked `users` and `auth_users` rows in one transaction, print the resulting verification state, and refuse zero or multiple matches. Admin promotion remains delegated to `src/scripts/promote-admin.ts`.

- [ ] **Step 3: Add serial UI registration coverage for all identities**

```ts
test.describe.configure({ mode: "serial" });

for (const identity of Object.values(identities)) {
  test(`registers ${identity.label}`, async ({ page }) => {
    await registerThroughUi(page, identity, {
      referralCode: identity === identities.bidderB ? referralMarker : undefined,
    });
    await expect(page).toHaveURL(/\/otp/);
  });
}
```

- [ ] **Step 4: Verify accounts through the approved backend exception**

Run the preparation CLI for all identities; include `--verify-kyc` only for bidders and sellers that need bid/listing access. Promote the dedicated QA Admin with `ADMIN_EMAIL=<email> pnpm admin:promote`.

- [ ] **Step 5: Test login, phone login, role routing, duplicate email, and duplicate phone through UI**

Expected: every backend-provided error appears verbatim; the admin reaches `/admin`; non-admin users reach `/dashboard` and cannot open admin pages.

- [ ] **Step 6: Verify referral persistence without side effects**

Use a read-only TypeORM query to assert the marker on QA Bidder B and assert no wallet, role, or permission side effect.

- [ ] **Step 7: Run focused backend, public E2E, and beta auth tests**

Run: `cd backend && pnpm test --runInBand src/scripts/prepare-beta-account.spec.ts src/modules/auth/auth.service.spec.ts src/modules/auth/auth.controller.spec.ts`

Run: `cd frontend && pnpm exec playwright test e2e/public.spec.ts e2e/beta-readiness.spec.ts --grep "registers|login|referral" --workers=1`

### Task 3: Mechanic Verification, Listing Access, and Access Codes

**Files:**
- Modify: `frontend/e2e/beta-readiness.spec.ts`
- Potential fix target: `frontend/app/components/admin-dashboard/screens/MechanicsScreen.tsx`
- Potential fix target: `frontend/app/components/admin-dashboard/screens/ListingsScreen.tsx`
- Potential fix target: `frontend/app/components/admin-dashboard/screens/AccessCodesScreen.tsx`
- Potential fix target: `frontend/app/components/user-dashboard/screens/ListingAccessScreen.tsx`
- Potential fix target: `frontend/app/components/user-dashboard/screens/RedeemAccessCodeScreen.tsx`

**Interfaces:**
- Produces browser-visible verified mechanic, car permission, gadget permission, and separate redeemed code permission.
- Consumes authenticated storage states for QA Admin, QA Mechanic, QA Car Dealer, QA Gadget Seller, and QA Code User.

- [ ] **Step 1: Write the serial UI test for mechanic verification and access requests**

Use visible admin and user controls only. Assert the verified mechanic appears in the car listing selector after approval.

- [ ] **Step 2: Exercise both access application approvals**

QA Car Dealer requests `CAR`; QA Gadget Seller requests `GADGET`; QA Admin approves each from Listing approvals; both profiles must show the new permission.

- [ ] **Step 3: Exercise access-code creation and redemption**

QA Admin creates a unique `GADGET` code; QA Code User redeems it. Then test an invalid code and a second redemption, asserting exact backend errors.

- [ ] **Step 4: Fix each failing UI or backend path test-first**

For a frontend defect, add the failing Playwright assertion before editing the screen. For an endpoint defect, add the focused NestJS spec before editing the service/controller and update Swagger decorators when response behavior changes.

- [ ] **Step 5: Run focused access and mechanic suites**

Run: `cd backend && pnpm test --runInBand src/modules/admin/admin-listings.service.spec.ts src/modules/admin/admin-mechanics.service.spec.ts src/modules/users/users.controller.spec.ts`

Run: `cd frontend && pnpm exec playwright test e2e/beta-readiness.spec.ts --grep "mechanic|listing access|access code" --workers=1`

### Task 4: Sandbox Funding and Bid-Cap Regression

**Files:**
- Modify: `frontend/e2e/beta-readiness.spec.ts`
- Potential fix target: `backend/src/modules/bids/bids.service.ts`
- Potential fix target: `backend/src/modules/bids/bids.service.spec.ts`
- Potential fix target: `backend/src/modules/wallets/wallets.service.ts`
- Potential fix target: `frontend/app/components/auctions/widgets/BidBar.tsx`
- Potential fix target: `frontend/app/lib/api/client.ts`

**Interfaces:**
- Consumes `auction.holdPercent`, wallet `balanceKobo`, and `heldKobo`.
- Produces exact qualification error plus wallet hold and ledger assertions.

- [ ] **Step 1: Add unit cases for the 10% cap examples**

```ts
it.each([
  { balanceKobo: 5_000_000, bidKobo: 50_000_000, allowed: true },
  { balanceKobo: 5_000_000, bidKobo: 50_000_100, allowed: false },
  { balanceKobo: 10_000_000, bidKobo: 100_000_000, allowed: true },
])("enforces available balance qualification", async ({ balanceKobo, bidKobo, allowed }) => {
  wallet.balanceKobo = balanceKobo;
  const action = service.placeBid("bidder-id", "auction-id", { amountKobo: bidKobo });
  if (allowed) await expect(action).resolves.toBeDefined();
  else await expect(action).rejects.toThrow("Wallet balance does not meet the auction bid requirement");
});
```

- [ ] **Step 2: Fund Bidder A and Bidder B through the Top up UI**

Use sandbox simulation to credit ₦50,000 and ₦100,000. Verify wallet balance, ledger entry, notification, duplicate-click behavior, and loading states.

- [ ] **Step 3: Set the admin minimum hold to 10% in Settings**

Verify the value persists after reload and an approved auction uses at least 10%.

- [ ] **Step 4: Exercise rejected and accepted bids through UI**

Test above-cap, below-base, below-increment, self-bid, valid bid, and valid outbid. Assert the displayed backend message for every rejected bid.

- [ ] **Step 5: Verify holds, releases, and withdrawal protection**

Use UI wallet state and read-only database assertions after UI actions. The first leader’s hold must release when outbid, and withdrawal must not consume active held funds.

- [ ] **Step 6: Run bid, wallet, and beta browser suites**

Run: `cd backend && pnpm test --runInBand src/modules/bids/bids.service.spec.ts src/modules/wallets/wallets.service.spec.ts src/modules/wallets/wallet-withdrawals.service.spec.ts`

### Task 5: Real Media and Car Auction Completion

**Files:**
- Create: `frontend/e2e/fixtures/beta-car-source.json`
- Create: `frontend/e2e/fixtures/beta-car.jpg`
- Modify: `frontend/e2e/beta-readiness.spec.ts`
- Potential fix targets: `frontend/app/components/user-dashboard/screens/CreateListingScreen.tsx`, `frontend/app/components/admin-dashboard/screens/AuctionsScreen.tsx`, `frontend/app/components/admin-dashboard/screens/SettlementScreen.tsx`, `backend/src/modules/auctions/auctions.service.ts`, and `backend/src/modules/auctions/auction-settlement.service.ts`.

**Interfaces:**
- Produces a settled car auction and completed delivery.
- Consumes QA Car Dealer, verified mechanic, Bidder A, Bidder B, and QA Admin sessions.

- [ ] **Step 1: Download a reuse-permitted real car image and record source metadata**

The JSON must contain `sourceUrl`, `downloadUrl`, `author`, `license`, and `retrievedAt`. Validate the image decodes and is large enough for listing display.

- [ ] **Step 2: Create, preview, and submit the car listing through UI**

Use a `QA`-prefixed title, verified mechanic, real image, ₦400,000 base price, ₦25,000 increment, 10% hold, near-future start time, and 120-minute duration.

- [ ] **Step 3: Approve through admin UI and wait for live state**

Assert draft, pending, scheduled, and live transitions. If scheduling fails, capture queue/Redis/backend evidence before fixing.

- [ ] **Step 4: Complete competing bids and verify realtime state**

Bidder A bids ₦500,000; Bidder B bids ₦550,000. Assert bid history, top bid, hold release, outbid notification, and websocket update.

- [ ] **Step 5: Force-close through admin UI**

Assert `AWAITING_PAYMENT`, winning bidder, losing-bid status, released losing holds, payment deadline, and win notifications.

- [ ] **Step 6: Complete payment, settlement, and delivery through UI**

Winner confirms payment; admin settles the exact balance after hold; seller marks shipped/delivered as allowed; winner confirms receipt. Assert settled totals, applied hold, delivery state, and both users’ notifications.

- [ ] **Step 7: Add focused regressions for every discovered lifecycle defect and rerun suites**

Run the relevant auction, settlement, lifecycle processor, notification, and delivery specs plus the car segment of the Playwright scenario.

### Task 6: Dispute, Support Handoff, and Notification Actions

**Files:**
- Modify: `frontend/e2e/beta-readiness.spec.ts`
- Potential fix targets: `frontend/app/components/support/SupportChatScreen.tsx`, `frontend/app/components/support/widgets/Composer.tsx`, and `frontend/app/components/admin-dashboard/screens/SupportScreen.tsx`
- Potential fix targets: `backend/src/modules/users/user-disputes.service.ts`, `backend/src/modules/support/support.service.ts`, and `backend/src/modules/notifications/notifications.service.ts`

**Interfaces:**
- Consumes settled car auction.
- Produces one dispute, one claimed/responded support conversation, and read notification evidence.

- [ ] **Step 1: Open a dispute through UI and assert duplicate rejection**

The dispute must reference the settled car auction. Admin must view and update it from Disputes.

- [ ] **Step 2: Send a support message and request a human**

Assert message persistence, draft restoration on forced failure, waiting-admin state, admin claim/reply, and user receipt.

- [ ] **Step 3: Exercise notification list actions and deep links**

Assert unread count, single read, mark-all-read, and deep links for funding, access approval, outbid, win, settlement, delivery, dispute, and support where implemented.

- [ ] **Step 4: Run focused support, dispute, notification, and browser suites**

Run all corresponding backend specs and the matching Playwright segment.

### Task 7: Gadget Auction Left Open

**Files:**
- Create: `frontend/e2e/fixtures/beta-gadget-source.json`
- Create: `frontend/e2e/fixtures/beta-gadget.jpg`
- Create: `frontend/e2e/fixtures/beta-proof.png`
- Modify: `frontend/e2e/beta-readiness.spec.ts`
- Potential fix targets: `frontend/app/components/user-dashboard/screens/CreateListingScreen.tsx`, `backend/src/modules/gadgets/gadgets.service.ts`, and `backend/src/modules/auctions/auctions.service.ts`.

**Interfaces:**
- Produces an approved, live gadget auction with at least two valid bids and an active winning hold.

- [ ] **Step 1: Download a reuse-permitted real gadget image and record source metadata**

- [ ] **Step 2: Create, submit, and approve the gadget listing through UI**

Include proof document, specifications, condition, image, base price, increment, schedule, and 10% hold.

- [ ] **Step 3: Place valid competing bids and verify realtime state**

Use balances remaining after the car lifecycle. Assert the current winner, active hold, released prior hold, notifications, browse card, and auction detail.

- [ ] **Step 4: Leave the gadget auction live**

Do not force-close, cancel, settle, or manipulate its database status. Record its ID and final state in evidence.

### Task 8: Full Screen Inventory, Performance, and Final Report

**Files:**
- Create: `docs/testing/2026-09-17-beta-readiness-report.md`
- Create: `frontend/e2e/beta-screen-inventory.spec.ts`
- Modify: `frontend/e2e/authenticated.spec.ts`
- Modify: `frontend/e2e/public.spec.ts`
- Potential fix targets: `frontend/app/components/user-dashboard/shell/DashboardShell.tsx`, `frontend/app/components/admin-dashboard/shell/AdminShell.tsx`, and the route component directly implicated by recorded evidence.

**Interfaces:**
- Consumes all QA identities, auction IDs, evidence JSON, traces, backend test results, and timing observations.
- Produces route/action coverage matrix and final readiness classification.

- [ ] **Step 1: Add route and interaction inventory tests**

Visit every public, user, and admin route named in the spec at desktop and mobile widths. Assert main content, no application error, no unexpected horizontal overflow, and operable visible primary controls.

- [ ] **Step 2: Capture warm navigation and API timings**

Record routes over 3 seconds, ordinary local APIs over 1 second, duplicate requests, duplicate mounts, console errors, hydration warnings, failed requests, and websocket duplication.

- [ ] **Step 3: Fix evidence-backed performance and DRY issues test-first**

Do not refactor unrelated code. Add a regression for every optimization that changes behavior.

- [ ] **Step 4: Run the complete verification matrix**

Run:

```bash
cd backend && pnpm migration:run && pnpm test --runInBand && pnpm typecheck && pnpm lint && pnpm build
cd frontend && pnpm exec playwright test --workers=1 && pnpm exec tsc --noEmit && pnpm lint && pnpm build
```

Expected: all required suites pass. Any skipped external-provider test is explicitly documented with reason.

- [ ] **Step 5: Write the evidence-backed status report**

The report must include account roles without passwords, migration status, route/action matrix, auction IDs and final states, wallet math, notification/support/dispute results, real-image attribution, defects fixed, unresolved blockers, timing observations, exact commands/results, and the Mermaid end-to-end diagram.

- [ ] **Step 6: Audit the original objective requirement by requirement**

Mark each requirement proven, contradicted, incomplete, or missing. Do not classify the app as ready while any beta-blocking requirement lacks authoritative evidence.

- [ ] **Step 7: Commit only completed test, fix, fixture, and report files**

Use descriptive conventional commits. Do not include unrelated pre-existing worktree changes or co-author metadata.
