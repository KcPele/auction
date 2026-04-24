# Auction Backend Plan

## 1. Goal

Build the backend for a Nigerian cars and gadgets auction platform where verified users can list items, bidders place wallet-backed bids, winners pay through OPay within 24 hours, and users receive WhatsApp notifications around auction events.

Locked stack from the spec:

- NestJS, TypeScript, Node.js 22 LTS, Fastify
- PostgreSQL, Redis, BullMQ
- Socket.IO with Redis Pub/Sub adapter
- OPay, Openinary, WhatsApp Business Cloud API
- Better Auth email/password sessions with admin role authorization
- Docker on Railway first, AWS later if scale requires it

## 2. Backend Principles

- Keep modules small, domain-focused, and DRY.
- Use transactions for bids, wallet holds, releases, settlement, and forfeiture.
- Use row-level locking for wallet and auction rows during bid/payment flows.
- Store all money values in integer minor units, for example kobo.
- Treat the wallet ledger as the audit source of truth.
- Queue notifications and long-running work.
- Verify OPay webhooks before changing payment or wallet state.
- Reuse domain services from HTTP controllers, workers, and WebSocket gateways.

## 3. Modules

### Auth

- Better Auth email/password registration and login
- Better Auth cookie sessions
- Better Auth admin plugin for role-based admin authorization
- App profile sync into the domain `users` table

- `POST /auth/sign-up/email`
- `POST /auth/sign-in/email`
- `POST /auth/sign-out`
- `GET /auth/get-session`

### Users

- Profiles
- Account type and roles
- Notification preferences
- Gadget `readyToBid` toggle
- Optional NIN field for future identity checks
- Listing permissions for cars and gadgets

Initial roles:

- `INDIVIDUAL_BIDDER`
- `CAR_DEALER`
- `MECHANIC`
- `ADMIN`

Listing permissions should stay separate from roles because one user can hold both car and gadget listing access.

- `GET /users/me`
- `PATCH /users/me`
- `PATCH /users/me/notification-preferences`

### Admin

- Issue access codes
- Review listing-access applications submitted inside the app
- Approve listing access
- Approve or reject listings
- Resolve winner defaults
- Decide whether defaulted auctions go to the next bidder or get relisted
- Manage platform settings
- Manage category-based platform fees

- `POST /admin/access-codes`
- `GET /admin/listings/pending`
- `POST /admin/listings/:id/approve`
- `POST /admin/listings/:id/reject`
- `POST /admin/auctions/:id/resolve-default`
- `PATCH /admin/settings/platform-fees`

### Uploads

- Upload images, videos, proof documents, and inspection media to Openinary
- Validate MIME type, extension, and file size
- Store upload metadata for listings

- `POST /uploads`
- `POST /uploads/batch`

### Cars

- Draft car listings for users with car listing access
- Allow approved mechanics to create car listings after inspection
- Store mechanic verification details
- Store vehicle details, faults, and photos
- Submit listings for admin approval

- Make, model, year, colour
- Registration number, mileage, condition
- Known faults
- Mechanic identifier
- Exterior, interior, engine, tyres, and odometer photos

- `POST /cars`
- `GET /cars/:id`
- `PATCH /cars/:id`
- `POST /cars/:id/submit`

### Gadgets

- Draft gadget listings for users with gadget listing access
- Store proof of ownership
- Store specs, usage history, condition, photos, and videos
- Submit listings for admin approval

- Type, brand, model, colour
- Battery health
- RAM, storage, other specs
- Usage history
- Dents or cracks
- Proof of ownership
- Photos and short video

- `POST /gadgets`
- `GET /gadgets/:id`
- `PATCH /gadgets/:id`
- `POST /gadgets/:id/submit`

### Auctions

- Create auctions from approved listings
- Store start time, duration, end time, base price, and hold percentage
- Store minimum bid increment
- Store category-based seller and buyer fee snapshots for settlement
- Enforce hold percentage between 10% and 20%
- Start and close auctions through BullMQ
- Track winner, deadline, settlement, cancellation, and relist state

Statuses:

- `DRAFT`
- `PENDING_APPROVAL`
- `SCHEDULED`
- `LIVE`
- `ENDED`
- `AWAITING_PAYMENT`
- `SETTLED`
- `DEFAULTED`
- `CANCELLED`
- `RELISTED`

- `GET /auctions`
- `GET /auctions/:id`
- `GET /auctions/:id/bids`
- `POST /auctions/:id/cancel`

### Bids

- Accept bids only while auctions are live
- Reject bids below base price
- Enforce minimum bid increment
- Calculate hold amount from auction hold percentage
- Atomically create bid, hold funds, and write ledger entries
- Release previous top bidder hold when outbid
- Broadcast accepted bids through Socket.IO
- Queue outbid notifications

- Car bids must beat the current top bid by at least the minimum increment.
- Gadget bids can be below the current top bid because the system picks the highest bid at close.
- Gadget minimum increment applies only when a bid is trying to beat the current top bid.

- `POST /auctions/:id/bids`

### Wallets

- Track total, held, and available balances
- Maintain auditable ledger entries
- Hold funds on accepted bids
- Release holds on outbid or cancellation
- Apply winner hold to final payment
- Forfeit winner hold on non-payment

Ledger types:

- `TOP_UP_INITIATED`
- `TOP_UP_CONFIRMED`
- `BID_HOLD_CREATED`
- `BID_HOLD_RELEASED`
- `BID_HOLD_APPLIED`
- `BID_HOLD_FORFEITED`
- `FINAL_PAYMENT_CONFIRMED`
- `ADMIN_ADJUSTMENT`

- `GET /wallets/me`
- `GET /wallets/me/ledger`
- `POST /wallets/top-ups`

### Payments

- Create OPay sessions for top-ups
- Create OPay sessions for winner final payments
- Verify OPay webhook signatures
- Process webhooks idempotently
- Confirm wallet top-ups
- Settle auctions after final payment
- Notify winner and lister

- `POST /payments/top-ups`
- `POST /payments/auctions/:auctionId/final-payment`
- `POST /payments/opay/webhook`

### Notifications

- Send WhatsApp messages through Meta
- Keep the notification service channel-based so email through Resend can be added later
- Queue and retry failures
- Send auction announcements, top-up reminders, outbid notices, winner notices, and receipts

Audience rules:

- Car auction notifications go to registered individual users and car dealers.
- Gadget notifications go only to users with `readyToBid` enabled.
- Top-up nudges go only to users whose available balance is below the expected hold from the base price.

### Jobs

Queues:

- `auction-lifecycle`
- `payment-deadlines`
- `notifications`
- `wallet-maintenance`

Jobs:

- Schedule reminders at 24 hours, 6 hours, and 1 hour before auction start
- Start scheduled auctions
- Close ended auctions
- Start 24-hour winner payment deadlines
- Forfeit holds after missed deadlines
- Retry failed notifications

### Gateway

Socket events:

- `auction:join`
- `auction:leave`
- `bid:placed`
- `bid:rejected`
- `auction:statusChanged`
- `auction:closed`

## 4. Database Model

Initial tables:

- `users`
- `refresh_tokens`
- `access_codes`
- `listing_access_applications`
- `user_listing_permissions`
- `notification_preferences`
- `wallets`
- `wallet_ledger_entries`
- `wallet_holds`
- `uploads`
- `car_listings`
- `gadget_listings`
- `auctions`
- `bids`
- `payments`
- `payment_webhook_events`
- `notifications`
- `admin_actions`
- `mechanics`

Important constraints:

- Unique email and phone per user
- Unique registration number per active car listing, unless admin allows relist
- Each auction belongs to exactly one listing
- Each accepted bid references one wallet hold
- OPay webhook event IDs are unique
- Payment processing is idempotent
- Category-based seller and buyer platform fees are reserved in the schema and snapshotted per auction

## 5. Critical Flows

### Place Bid

1. Authenticate user.
2. Lock live auction row.
3. Validate auction status, base price, and bidding rules.
4. Calculate required hold.
5. Lock bidder wallet row.
6. Confirm available balance.
7. Create bid, hold, and ledger entry.
8. Release previous top bidder hold if this bid becomes top bid.
9. Commit transaction.
10. Emit WebSocket update and queue notifications.

### Close Auction

1. Load auction and accepted bids.
2. Pick highest bid.
3. If there are no bids, mark auction ended without winner.
4. If a winner exists, mark auction `AWAITING_PAYMENT`.
5. Keep winner hold locked.
6. Schedule 24-hour payment deadline.
7. Notify winner and lister through WhatsApp.

### Final Payment

1. Winner requests payment session.
2. Backend calculates remaining amount after held funds.
3. OPay confirms settlement through verified webhook.
4. Backend applies winner hold.
5. Backend writes payment and wallet ledger entries.
6. Auction becomes `SETTLED`.
7. Lister and winner are notified through WhatsApp.

### Missed Payment Deadline

1. Deadline job loads unsettled auction.
2. If payment is still missing, winner hold is forfeited.
3. Auction becomes `DEFAULTED`.
4. Admin receives resolution task.
5. Admin chooses next-highest bidder or relist.

## 6. API Standards

- DTOs with class-validator
- Consistent error responses
- Pagination on list endpoints
- Guards for auth, roles, and listing permissions
- OpenAPI docs through NestJS Swagger
- Request IDs in logs

## 7. Security

- Better Auth password hashing and session handling
- OPay signature verification
- Idempotent webhook handling
- Rate limits on auth, bid, and payment endpoints
- File upload validation
- Admin-only guards
- Audit logs for admin actions, bids, wallet entries, and payments
- Server-side calculation for all money amounts

## 8. Testing

Unit tests:

- Better Auth route forwarding and session guard behavior
- Hold amount calculation
- Bid validation
- Wallet ledger movement
- Notification audience selection

Integration tests:

- Sign up, sign in, session lookup, sign out
- Top-up webhook confirmation
- Bid with enough and insufficient balance
- Outbid hold release
- Auction close and winner selection
- Final payment settlement
- Payment deadline forfeiture

Concurrency tests:

- Multiple users bidding at once
- Same user bidding repeatedly
- Webhook replay handling

## 9. Build Milestones

### Milestone 1: Foundation

- [x] Scaffold NestJS with Fastify
- [x] Add config validation
- [x] Add PostgreSQL and migrations
- [x] Add Redis
- [x] Add validation, errors, logging, Swagger
- [x] Add Docker Compose for local PostgreSQL and Redis

### Milestone 2: Auth, Users, Admin

- [x] Better Auth registration and login
- [x] Better Auth session cookies
- [x] Better Auth admin roles and Nest guards
- [x] User profile and notification preferences
- [x] Listing-access applications
- [x] Admin access-code issuance and manual permission grants

### Milestone 3: Uploads and Listings

- [ ] Openinary upload service
- [x] Car listing drafts and submission
- [x] Gadget listing drafts and submission
- [x] Admin approval and rejection

### Milestone 4: Wallet and Top-Ups

- Wallets and ledger
- OPay top-up session creation
- Verified OPay webhook processing
- Wallet top-up confirmation

### Milestone 5: Auctions and Bidding

- Auction creation from approved listings
- Auction lifecycle statuses
- Atomic bid placement
- Outbid hold release
- WebSocket bid updates

### Milestone 6: Jobs and Notifications

- BullMQ queues
- Scheduled auction start and close
- WhatsApp notifications
- Top-up reminders

### Milestone 7: Settlement

- OPay final payment
- Webhook settlement
- 24-hour payment deadline
- Hold forfeiture
- Admin default resolution

### Milestone 8: Hardening

- Rate limiting
- Audit logging
- Concurrency tests
- API documentation
- Dockerfile and Railway configuration

## 10. Product Decisions

- Notifications are WhatsApp-only in v1. Email through Resend is deferred.
- Users can apply for listing access inside the app, and admins can also grant access manually with access codes.
- Listing approval creates the auction schedule. If the start time is in the future, the auction waits until that time before going live.
- If admin approves after the selected start time has passed, a new start time must be set before approval completes so users can be notified and prepare.
- Mechanics have accounts like normal users, can bid, and can receive listing access to create inspected car listings.
- NIN is stored as an optional field in v1. NIN verification and name checks are deferred.
- Auctions support minimum bid increments.
- Platform fees are category-based and split into seller and buyer rates.
- v1 defaults: cars use seller 3% and buyer 0%; gadgets use seller 5% and buyer 0%.
- Admins can later split fees, for example seller 2% and buyer 1%, or move the full fee to buyer 3% and seller 0%.
- Each auction stores the seller and buyer fee rates used at scheduling time so later admin changes do not rewrite old settlements.
- Gadget minimum increment applies only when the bid would become the new highest bid.
- Use the simplest supported OPay session/checkout flow for both top-ups and final payments, then refine after integration testing.

## 11. Remaining Questions

- No major product questions remain for the first backend build.

## 12. Recommended v1 Scope

Build first:

- Auth and user profiles
- In-app listing access applications
- Admin-issued listing permissions and access codes
- Mechanic accounts with optional listing access
- Car and gadget listing submission
- Admin approval
- Wallet top-ups through OPay
- Wallet ledger and holds
- Timed auctions
- Atomic bid placement
- WebSocket bid updates
- BullMQ auction close jobs
- Winner payment deadline
- OPay final payment settlement
- WhatsApp notification queue
- Optional NIN storage without verification

Defer:

- Email through Resend
- Anti-sniping
- Bidder reputation penalties
- BVN, NIN verification, and name checks
- Advanced mechanic directory features
- Complex dispute workflows
