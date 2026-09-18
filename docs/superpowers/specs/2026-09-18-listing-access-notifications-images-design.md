# Listing Access, Notifications, and Image Delivery Design

## Problem

Effective listing permissions are stored correctly, but the mobile experience derives its UI from several disconnected sources. Direct admin grants are absent from application history, direct grants do not create a notification, the five-item mobile navigation has no selling entry, and the Profile access card always offers Apply and Redeem. Listing grids also download original 0.5–1.1 MB images instead of card-sized variants. Notification emails contain only an unstyled paragraph.

## Desired behaviour

- Effective permissions from `GET /users/me` are the only authority for whether a user can create car or gadget listings.
- Application history remains visible, but the access screen also displays every effective permission, including direct admin grants and redeemed codes.
- Users with both permissions see selling actions instead of Apply/Redeem. Users with zero or one permission retain Apply/Redeem for missing categories.
- Permissioned mobile users get an obvious My listings route without overcrowding the fixed five-tab navigation.
- Direct admin grants create an in-app notification and enter the existing email/WhatsApp delivery pipeline.
- Transactional email has a reusable, responsive, branded shell, safe escaped content, meaningful preview text, and a context-specific CTA.
- Listing-card images are resized through Next Image, lazy-loaded by default, and reserve layout space.

## Architecture

### Listing capabilities

Add a pure `deriveListingCapabilities()` function and a `useListingCapabilities()` hook next to the existing permission provider. It consumes `Me.listingPermissions` and returns category booleans, missing categories, `hasAny`, and `hasAll`. Profile, Listing access, and mobile selling entry points use this one interface.

The Profile access card renders:

- no access: Apply + Redeem;
- one category: My listings + Get more access;
- both categories: My listings + Create listing.

The Account list hides Redeem when all categories are granted and adds My listings whenever at least one permission is granted. The dashboard home receives a compact permission-aware selling action. The bottom navigation remains at five items for touch-target quality.

### Grant notifications and email templates

`AdminListingsService.grantListingPermission()` calls one shared `notifyPermissionGranted()` method after a successful grant. Application approval uses the same method, avoiding copy drift. Re-granting an existing permission is idempotent and must not create a duplicate notification.

Add a pure email template renderer. It accepts a title, message, recipient name, notification type/data, and web-app base URL, escapes all dynamic values, and returns HTML/text/CTA metadata. `NotificationDeliveryService` uses it for every user notification. Auth OTP, email verification, and password-reset emails use the same branded shell through focused helper functions.

CTA routing uses notification type and data when possible, with Notifications as the safe fallback. Current important actions already create notifications for listing review, auctions, outbid/win, payment, wallet, disputes, delivery/settlement, and support; therefore central rendering covers them without duplicating email calls across domain services.

### Images

Add `ListingImage`, a focused wrapper around `next/image`, with `fill`, `sizes`, object-fit styling, lazy loading by default, and an error fallback. Configure strict HTTPS `remotePatterns` for the owned MinIO and legacy Openinary paths. Replace raw listing images in user auction grids and detail thumbnails. Above-the-fold lead imagery may opt into high fetch priority; all grids remain lazy.

### Reversible listing access

Listing access is a reversible entitlement. The admin user directory displays each user's effective car and gadget permissions and lets an administrator revoke either category after explicit confirmation. Revocation prevents new listings in that category but never deletes, hides, or cancels existing listings or auctions.

A successful revocation creates a durable in-app notification and branded email for the affected user. Grant and revoke mutations both refresh the admin user directory so its access state remains authoritative.

### Watchlist reminders

Saving an auction creates a durable confirmation notification explaining that BidNaija will alert the user 15 minutes before bidding opens. Every scheduled auction receives a queue-backed reminder job; when it runs, the service reads the current watchlist and notifies only users who still have the auction saved. Restart recovery re-schedules this job with the rest of the auction lifecycle.

## Testing

- Backend unit tests prove a new direct grant creates exactly one notification, while an existing grant creates none.
- Backend unit tests prove an existing permission can be revoked and notified, while a missing permission returns not found.
- Queue, processor, and service tests prove watchlist confirmations and 15-minute reminders are scheduled and delivered.
- Template unit tests prove branding, escaping, CTA selection, and plain-text fallback.
- Playwright mobile tests mock `/users/me` and prove all three permission states render the correct actions and navigation.
- Playwright/browser inspection proves card images use `/_next/image`, include responsive `srcset`/`sizes`, and do not request originals for every off-screen card.
- Final verification includes backend tests/typecheck/build, frontend lint/build/E2E, and visible admin/user UI navigation at a mobile viewport.

## Out of scope

- The device-specific Chrome contrast issue, per the user's instruction to ignore it.
- Replacing MinIO or migrating stored media.
- Marketing/bulk email.
