# Listing Access, Notifications, and Image Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make granted listing access fully usable on mobile, notify users for direct grants with professional transactional email, and deliver responsive optimized listing imagery.

**Architecture:** Centralize effective listing capabilities around `/users/me`, route all grant notifications through the existing notification pipeline, render email through one safe branded template system, and wrap remote listing media with Next Image. Preserve application history as history rather than treating it as permission authority.

**Tech Stack:** NestJS 11, TypeORM, Jest, Next.js 16 App Router, React 19, TanStack Query, Playwright, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-09-18-listing-access-notifications-images-design.md`

## Global Constraints

- Use `pnpm` only.
- Do not hardcode UI colors; use existing global theme tokens.
- Keep components focused and below 500 lines.
- Use effective permissions from `/users/me` as the authorization UI source.
- Keep mobile layouts responsive with accessible touch targets.
- Do not alter the device-specific contrast styling in this project.

---

### Task 1: Notify direct listing grants

**Files:**
- Modify: `backend/src/modules/admin/admin-listings.service.spec.ts`
- Modify: `backend/src/modules/admin/admin-listings.service.ts`

**Interfaces:**
- Consumes: `NotificationsService.create(CreateNotificationDto)`
- Produces: one `SYSTEM` notification with `{ category }` data for a newly created manual grant; no duplicate for an existing grant.

- [ ] Add a Jest test that grants a missing permission and expects `notificationsService.create` with recipient, category, title, and message.
- [ ] Run `pnpm test -- admin-listings.service.spec.ts --runInBand` and verify the new test fails because manual grants do not notify.
- [ ] Make `grantPermission()` return `{ permission, created }` internally and call a shared `notifyPermissionGranted()` only when `created` is true.
- [ ] Reuse the notification helper from application approval while retaining application metadata.
- [ ] Add and run the idempotency test proving a repeated grant does not notify twice.

### Task 2: Render professional transactional emails

**Files:**
- Create: `backend/src/common/email/transactional-email.template.ts`
- Create: `backend/src/common/email/transactional-email.template.spec.ts`
- Modify: `backend/src/modules/notifications/notification-delivery.service.ts`
- Modify: `backend/src/modules/notifications/notification-delivery.service.spec.ts`
- Modify: `backend/src/modules/auth/auth.service.ts`
- Modify: `backend/src/config/env.validation.ts`
- Modify: `backend/.env.example`

**Interfaces:**
- Produces: `renderTransactionalEmail(input): { subject: string; html: string; text: string }`.
- Input includes `kind`, `title`, `message`, optional `recipientName`, optional `actionUrl`, and optional `actionLabel`.

- [ ] Write template tests for escaped dynamic text, responsive BidNaija branding, and an accessible CTA plus plain-text URL.
- [ ] Run the template test and verify RED because the renderer does not exist.
- [ ] Implement the pure template renderer and verify GREEN.
- [ ] Write a delivery-service test expecting a listing-access notification email to include the branded shell and `/dashboard/listings` CTA.
- [ ] Run the delivery test and verify RED against the current one-paragraph HTML.
- [ ] Add `WEB_APP_URL` validation/default and route notification types/data to safe internal action URLs.
- [ ] Update auth OTP, verification, and password-reset messages to use the same renderer.
- [ ] Run focused auth, email, and notification tests.

### Task 3: Centralize listing capabilities and mobile selling actions

**Files:**
- Create: `frontend/app/lib/permissions/listing-capabilities.ts`
- Create: `frontend/app/lib/permissions/use-listing-capabilities.ts`
- Modify: `frontend/app/components/user-dashboard/screens/ProfileScreen.tsx`
- Modify: `frontend/app/components/user-dashboard/screens/ListingAccessScreen.tsx`
- Modify: `frontend/app/components/user-dashboard/screens/HomeScreen.tsx`
- Modify: `frontend/e2e/beta-access.spec.ts`

**Interfaces:**
- Produces: `deriveListingCapabilities(permissions)` returning `hasCar`, `hasGadget`, `hasAny`, `hasAll`, `grantedCategories`, and `missingCategories`.
- Produces: `useListingCapabilities()` returning the same shape plus loading state.

- [ ] Add mobile Playwright cases for zero, one, and two effective permissions using route fixtures.
- [ ] Assert direct Car grant is shown even when no Car application exists; verify the test fails against the current application-only display.
- [ ] Assert dual permission hides Apply/Redeem and shows My listings/Create listing; verify RED.
- [ ] Implement the pure capability module and hook, then update Profile and Listing access rendering.
- [ ] Add a permission-aware selling card to Home and My listings to Profile's Account section.
- [ ] Run the focused Playwright spec and verify GREEN at desktop and mobile viewports.

### Task 4: Optimize listing images

**Files:**
- Create: `frontend/app/components/user-dashboard/primitives/ListingImage.tsx`
- Modify: `frontend/next.config.ts`
- Modify: `frontend/app/components/user-dashboard/screens/BrowseScreen.tsx`
- Modify: `frontend/app/components/user-dashboard/screens/HomeScreen.tsx`
- Modify: `frontend/app/components/user-dashboard/screens/MyBidsScreen.tsx`
- Modify: `frontend/app/components/user-dashboard/screens/WatchlistScreen.tsx`
- Modify: `frontend/app/components/user-dashboard/screens/ListingDetailScreen.tsx`
- Modify: `frontend/app/components/auctions/widgets/DetailHero.tsx`
- Modify: `frontend/e2e/beta-access.spec.ts`

**Interfaces:**
- Produces: `ListingImage({ src, alt, sizes, priority?, className? })` with fill layout, error fallback, and responsive Next Image output.

- [ ] Add a browser assertion that remote card images resolve through `/_next/image` and expose responsive sizes; verify RED with raw `<img>`.
- [ ] Configure strict remote patterns for the owned MinIO and Openinary hosts.
- [ ] Implement `ListingImage` and replace raw user-facing listing images.
- [ ] Verify the focused browser assertion and inspect that off-screen images remain lazy.
- [ ] Run a production build to exercise the Next Image configuration.

### Task 5: End-to-end verification

**Files:**
- Modify if needed: `frontend/e2e/beta-access.spec.ts`
- Update: `docs/testing/2026-09-18-beta-readiness-report.md`

**Interfaces:**
- Validates all interfaces produced by Tasks 1–4 through API and visible UI behavior.

- [ ] Start backend and frontend development servers on ports 4000 and 3000.
- [ ] Through the visible UI, sign in as admin, grant a fresh test user a category, and verify the user receives an in-app notification.
- [ ] Through a mobile viewport, sign in as that user and verify permission status, My listings navigation, listing creation entry, and dual-access action hiding.
- [ ] Measure optimized image requests and compare transfer size/timing with the recorded 0.5–1.1 MB originals.
- [ ] Run `pnpm test -- --runInBand`, `pnpm typecheck`, and `pnpm build` in `backend`.
- [ ] Run `pnpm lint`, `pnpm build`, and the relevant Playwright suites in `frontend`.
- [ ] Review the final diff against the spec and record exact results in the beta-readiness report.

### Task 6: Revoke listing access

**Files:**
- Modify: `backend/src/modules/admin/admin-listings.service.spec.ts`
- Modify: `backend/src/modules/admin/admin-listings.service.ts`
- Modify: `backend/src/modules/admin/admin.controller.spec.ts`
- Modify: `backend/src/modules/admin/admin.controller.ts`
- Modify: `backend/src/modules/admin/admin-users.service.ts`
- Modify: `frontend/app/components/admin-dashboard/widgets/UserDialogs.tsx`
- Modify: `frontend/app/components/admin-dashboard/screens/UsersScreen.tsx`
- Modify: `frontend/app/components/admin/api/listings.api.ts`
- Modify: `frontend/app/components/admin/hooks/use-admin-listings.ts`
- Modify: `frontend/app/components/admin/types/users.types.ts`

**Interfaces:**
- Produces: `DELETE /admin/listing-permissions/:userId/:category`.
- Admin user records include an effective `listingPermissions` category array.

- [ ] Write service and controller tests for successful and missing-permission revocation, then verify RED.
- [ ] Remove the selected permission without modifying existing listings or auctions.
- [ ] Notify the affected user in-app and through the branded delivery pipeline.
- [ ] Batch-load effective permissions into the admin user directory without N+1 queries.
- [ ] Replace the grant-only dialog with a two-category access manager and explicit revoke confirmation.
- [ ] Verify revoke and grant restoration through the running app with disposable test data.

### Task 7: Watchlist reminders and data cleanup

- [x] Create an in-app/email confirmation when an auction is saved.
- [x] Schedule a queue-backed reminder 15 minutes before every scheduled auction.
- [x] Notify the current watchlist when the reminder job runs.
- [x] Add scheduler, processor, service, and watchlist notification tests.
- [x] Remove all mechanic, QA, E2E, and Beta users plus their dependent dummy auctions and listings.
- [x] Verify only the four non-test user accounts remain.
