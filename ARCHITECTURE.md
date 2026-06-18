# BidNaija — Architecture & Design Document

> Nigeria's auction floor for cars & gadgets

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Tech Stack](#3-tech-stack)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Database Design](#7-database-design)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Real-Time System](#9-real-time-system)
10. [Payment & Wallet System](#10-payment--wallet-system)
11. [External Integrations](#11-external-integrations)
12. [API Design](#12-api-design)
13. [Security](#13-security)
14. [Deployment & Infrastructure](#14-deployment--infrastructure)
15. [Testing Strategy](#15-testing-strategy)

---

## 1. Executive Summary

**BidNaija** is a full-stack web application that enables Nigerians to participate in online auctions for cars and gadgets. The platform connects sellers (individuals, car dealers, mechanics) with bidders in a transparent, real-time bidding environment backed by a wallet-based payment system.

### Core Value Proposition

- **For Sellers**: List vehicles or gadgets for auction with verified inspections, reach a wide pool of buyers, and receive guaranteed settlement.
- **For Bidders**: Browse verified listings, place bids in real-time, and transact through a secure escrow-backed wallet system.
- **For the Platform**: Revenue through buyer and seller fees (configurable basis points), with full admin oversight on listings, disputes, and settlements.

### Key Features

| Feature | Description |
|---------|-------------|
| Real-time bidding | WebSocket-powered live auction floor with instant bid updates |
| Wallet system | Fund wallet, place holds on bids, withdraw winnings |
| KYC verification | BVN/NIN verification via Strowallet |
| Admin dashboard | Full platform oversight — listings, users, auctions, disputes |
| AI support chat | OpenRouter-powered assistant with admin handoff |
| Access control | Role-based access with CASL permissions |

---

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Landing Page │  │ User Dash    │  │  Admin Dashboard      │  │
│  │  (Public)     │  │ (Bidders)    │  │  (Platform Admins)    │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         │                 │                       │              │
│         └────────┬────────┴───────────────────────┘              │
│                  │                                               │
│          ┌───────▼────────┐     ┌──────────────────┐            │
│          │  Next.js App   │────▶│  Socket.IO Client │            │
│          │  (Port 3000)   │     │  (Direct to 4000) │            │
│          └───────┬────────┘     └────────┬─────────┘            │
└──────────────────┼──────────────────────┼───────────────────────┘
                   │ HTTP (BFF Proxy)     │ WebSocket
                   ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS + Fastify)                    │
│                         Port 4000                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Layer (/api/v1)                     │   │
│  │  ┌────────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌────────┐  │   │
│  │  │ Auth   │ │Auctions│ │ Bids  │ │Wallets │ │ Admin  │  │   │
│  │  └────────┘ └────────┘ └───────┘ └────────┘ └────────┘  │   │
│  │  ┌────────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌────────┐  │   │
│  │  │ Users  │ │ Cars   │ │Gadgets│ │Payments│ │Uploads │  │   │
│  │  └────────┘ └────────┘ └───────┘ └────────┘ └────────┘  │   │
│  │  ┌────────┐ ┌────────┐ ┌───────┐ ┌────────┐            │   │
│  │  │  KYC   │ │Notif.  │ │Support│ │ Public │            │   │
│  │  └────────┘ └────────┘ └───────┘ └────────┘            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   WebSocket Gateways                       │   │
│  │  ┌──────────────────┐  ┌──────────────────────┐           │   │
│  │  │ /auctions NS     │  │ /notifications NS     │           │   │
│  │  │ (bid updates)    │  │ (push notifications)  │           │   │
│  │  └──────────────────┘  └──────────────────────┘           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Background Jobs (BullMQ)                 │   │
│  │  ┌────────────────┐  ┌──────────────────────┐             │   │
│  │  │ Auction        │  │ Payment Deadline      │             │   │
│  │  │ Lifecycle      │  │ Processor             │             │   │
│  │  └────────────────┘  └──────────────────────┘             │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────┬───────────────────┬──────────────────┬───────────────┘
           │                   │                  │
           ▼                   ▼                  ▼
   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
   │ PostgreSQL 16│   │  Redis 7     │   │  External APIs   │
   │ (Primary DB) │   │  (Cache/Queue│   │  ┌────────────┐  │
   │              │   │   Sessions)  │   │  │ Strowallet │  │
   └──────────────┘   └──────────────┘   │  │ (Payments) │  │
                                         │  └────────────┘  │
                                         │  ┌────────────┐  │
                                         │  │ Openinary  │  │
                                         │  │ (Files)    │  │
                                         │  └────────────┘  │
                                         │  ┌────────────┐  │
                                         │  │ Resend     │  │
                                         │  │ (Email)    │  │
                                         │  └────────────┘  │
                                         │  ┌────────────┐  │
                                         │  │ OpenRouter │  │
                                         │  │ (AI Chat)  │  │
                                         │  └────────────┘  │
                                         └──────────────────┘
```

---

## 3. Tech Stack

### Frontend

| Concern | Technology | Rationale |
|---------|-----------|-----------|
| Framework | **Next.js 16** (App Router) | Server-side rendering, file-based routing, built-in API proxy |
| Language | **TypeScript 5** | Type safety across the full stack |
| UI Library | **React 19** | Latest concurrent features |
| Styling | **Tailwind CSS v4** | Utility-first, design tokens via CSS variables |
| Component Library | **shadcn/ui** | Accessible, customizable primitives |
| Icons | **Lucide React** | Consistent icon system |
| Data Fetching | **TanStack React Query 5** | Server state management, caching, optimistic updates |
| Forms | **react-hook-form + zod** | Performant forms with schema validation |
| Client State | **zustand** | Lightweight store for UI state |
| Permissions | **@casl/ability + @casl/react** | Fine-grained RBAC on the client |
| Real-time | **socket.io-client** | WebSocket connection for live bids and notifications |
| Auth Client | **better-auth** (React) | Session management, sign-in/out hooks |

### Backend

| Concern | Technology | Rationale |
|---------|-----------|-----------|
| Framework | **NestJS 11** (Fastify) | Modular, enterprise-grade Node.js framework |
| Language | **TypeScript 5** | Shared language with frontend |
| Database | **PostgreSQL 16** | ACID-compliant relational DB for financial data |
| ORM | **TypeORM 0.3** | Decorator-based entities, migrations, repository pattern |
| Cache/Queue | **Redis 7 + BullMQ** | In-memory cache and reliable job processing |
| WebSockets | **Socket.IO** | Real-time bid broadcasting |
| Auth | **better-auth** | Secure session management with PostgreSQL adapter |
| Validation | **class-validator + zod** | Request validation + env validation |
| API Docs | **@nestjs/swagger** | Auto-generated OpenAPI/Swagger docs |
| Rate Limiting | **@nestjs/throttler** | Global request throttling |
| File Uploads | **@fastify/multipart** | Multipart handling with Openinary cloud storage |
| Security | **@fastify/helmet + cors** | HTTP security headers and CORS |
| Email | **Resend API** | Transactional email delivery |
| Payments | **Strowallet** | Virtual accounts, bank transfers, KYC |
| AI Chat | **OpenRouter** | LLM-powered support with tool calling |

### Infrastructure

| Concern | Technology |
|---------|-----------|
| Containerization | Docker (multi-stage builds) |
| Database | PostgreSQL 16 Alpine |
| Cache | Redis 7 Alpine |
| Orchestration | docker-compose (dev), Dockerfiles for production |
| Package Manager | pnpm 10 |

---

## 4. High-Level Architecture

### Architectural Pattern: **Modular Monolith with BFF Proxy**

The system follows a modular monolith architecture with two deployable units:

1. **Frontend (Next.js)** — Serves the UI and acts as a Backend-for-Frontend (BFF) proxy
2. **Backend (NestJS)** — Houses all business logic, data access, and external integrations

#### Why This Pattern?

| Decision | Rationale |
|----------|-----------|
| BFF Proxy via Next.js rewrites | Keeps cookies first-party (no CORS preflight), simplifies frontend HTTP calls |
| WebSocket bypass | Socket.IO connects directly to backend — avoids proxy overhead for real-time messages |
| Modular monolith over microservices | Reduces operational complexity for a single-team product while maintaining clean module boundaries |
| Separate frontend/backend repos in one directory | Shared TypeScript config, single CI pipeline, easier local development |

### Data Flow

```
Browser ──HTTP──▶ Next.js (port 3000) ──rewrite──▶ NestJS (port 4000) ──▶ PostgreSQL
Browser ──WS────▶ NestJS (port 4000) ──────────────▶ Redis (pub/sub)
```

---

## 5. Frontend Architecture

### Routing Structure

The app uses Next.js App Router with **route groups** for role-based layouts:

```
app/
├── (public)/              # Unauthenticated pages
│   ├── page.tsx           # Landing page
│   ├── login/
│   ├── register/
│   ├── forgot/
│   ├── reset/
│   ├── otp/
│   ├── kyc/
│   └── verified/
│
├── (user)/dashboard/      # Bidder dashboard (RequireRole: INDIVIDUAL_BIDDER | CAR_DEALER | MECHANIC)
│   ├── browse/            # Browse auctions
│   ├── auction/[id]/      # Auction detail + bidding
│   ├── bids/              # My bids
│   ├── wallet/            # Wallet management
│   ├── listings/          # My listings
│   ├── notifications/     # Notifications
│   ├── profile/           # User settings
│   ├── watchlist/         # Saved auctions
│   ├── won/               # Won auctions
│   └── support/           # AI support chat
│
└── (admin)/admin/         # Admin dashboard (RequireRole: ADMIN)
    ├── page.tsx           # KPI dashboard
    ├── listings/          # Listing review
    ├── users/             # User management
    ├── auctions/          # Auction management
    ├── withdrawals/       # Withdrawal authorization
    ├── settings/          # Platform settings
    └── health/            # System health
```

### Component Organization

Components are organized by **feature domain**, not by type:

```
components/
├── landing/           # Hero, Nav, Categories, FAQ, Footer
├── auth/              # LoginForm, RegisterForm, OtpForm
├── auctions/          # BidBar, BidHistoryList, DetailHero
├── user-dashboard/    # Tiles, CountDown, WalletHero, FilterPanel
├── admin-dashboard/   # KPICard, LiveAuctions, ListingReviewDialog
├── wallet/            # WithdrawalForm
├── kyc/               # KYC verification flow
├── notifications/     # Notification components
├── support/           # Support chat screen
└── ui/                # Shared primitives (Modal, NumberInput)
```

Each feature folder follows this internal structure:

```
components/<feature>/
├── screens/           # Full-page screen components
├── widgets/           # Composable UI blocks
├── shell/             # Layout shells (sidebar, topbar)
├── primitives/        # Low-level building blocks
├── hooks/             # Data-fetching and logic hooks
├── types/             # TypeScript types and DTOs
└── utils/             # Helper functions
```

### Separation of Concerns

```
┌─────────────────────────────────────────────┐
│              Component (UI only)             │
│  Renders markup, calls hooks, handles events │
└──────────────────┬──────────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────────┐
│              Hook (Logic)                    │
│  React Query mutations, state, side effects  │
└──────────────────┬──────────────────────────┘
                   │ calls
┌──────────────────▼──────────────────────────┐
│           API Function (HTTP)                │
│  Fetch calls via apiClient, error mapping    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
              Backend API
```

### State Management

| Layer | Tool | Purpose |
|-------|------|---------|
| Server state | TanStack React Query | API data, caching, background refetch |
| Client state | zustand | UI preferences, sidebar state, filters |
| Form state | react-hook-form | Form inputs, validation, submission |
| Permissions | CASL | Role-based UI rendering |

### Design System

- **Dark theme** with warm gold/amber accent palette
- **CSS variables** for all design tokens (colors, radii, fonts)
- **Typography**: Inter (body), Fraunces (display/headings), JetBrains Mono (code)
- **Responsive**: Mobile-first with Tailwind breakpoints
- **Animations**: Lightweight CSS keyframes (pulse, ticker scroll) — no heavy JS animation libraries

---

## 6. Backend Architecture

### Module Structure

The NestJS backend is organized into **17 feature modules**, each following the Controller → Service → Entity pattern:

```
src/
├── main.ts                  # Bootstrap (Fastify, CORS, Helmet, Swagger, ValidationPipe)
├── app.module.ts            # Root module (imports all feature modules + global providers)
├── config/                  # Environment validation, TypeORM config, Bull config
├── common/                  # Shared infrastructure
│   ├── constants/
│   ├── decorators/
│   ├── email/               # EmailService (Resend)
│   ├── enums/               # 20 enum files (UserRole, AuctionStatus, etc.)
│   ├── filters/             # GlobalHttpExceptionFilter
│   ├── guards/              # JwtAuthGuard, RolesGuard
│   ├── interceptors/        # IdempotencyInterceptor (Redis-backed)
│   ├── redis/               # Global ioredis client
│   ├── transformers/
│   ├── types/
│   └── utils/
└── modules/
    ├── admin/               # Dashboard, settings, listing review, withdrawals
    ├── auctions/            # Auction lifecycle, settlement, payment deadlines
    ├── auth/                # Better Auth integration
    ├── bids/                # Bid placement, WebSocket gateway
    ├── cars/                # Car listing CRUD
    ├── gadgets/             # Gadget listing CRUD
    ├── gateway/             # Gateway module (placeholder)
    ├── health/              # Health check endpoint
    ├── jobs/                # BullMQ job processors
    ├── kyc/                 # BVN/NIN verification
    ├── notifications/       # Notification system + WebSocket gateway
    ├── payments/            # Strowallet webhook handling
    ├── public/              # Public-facing endpoints
    ├── support/             # AI-powered support chat
    ├── uploads/             # File upload (Openinary)
    ├── users/               # User CRUD, preferences, permissions
    └── wallets/             # Wallet, funding, withdrawals, ledger
```

### Module Anatomy

Each module follows a consistent internal structure:

```
modules/<feature>/
├── <feature>.module.ts      # Module definition
├── <feature>.controller.ts  # HTTP route handlers
├── <feature>.service.ts     # Business logic
├── <feature>.repository.ts  # TypeORM repository (optional)
├── dto/                     # Request/Response DTOs
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── query-*.dto.ts
├── entities/                # TypeORM entities
└── *.spec.ts                # Unit/integration tests
```

### Global Providers

Registered in `app.module.ts` via `APP_GUARD`, `APP_FILTER`, `APP_INTERCEPTOR`:

| Provider | Scope | Purpose |
|----------|-------|---------|
| `ThrottlerGuard` | Global | Rate limiting — 120 req/min |
| `GlobalHttpExceptionFilter` | Global | Normalized error responses: `{ statusCode, code, message, details, path, timestamp }` |
| `IdempotencyInterceptor` | Global | Redis-backed idempotency for payment POST endpoints |

### Job Processing

Background jobs are processed via **BullMQ** queues:

| Queue | Purpose |
|-------|---------|
| Auction Lifecycle | Transitions auctions through status states (SCHEDULED → LIVE → ENDED) |
| Payment Deadline | Enforces payment windows, triggers default handling |

---

## 7. Database Design

### Entity Relationship Overview

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Users      │       │ Car Listings │       │Gadget Listings│
│              │       │              │       │              │
│ id (UUID)    │◀──┐   │ id           │       │ id           │
│ email        │   │   │ listerId ────┼───┐   │ listerId ────┼───┐
│ firstName    │   │   │ make/model   │   │   │ type/brand   │   │
│ lastName     │   │   │ year         │   │   │ specs (JSON) │   │
│ role         │   │   │ status       │   │   │ status       │   │
│ phone        │   │   │ basePrice    │   │   │ basePrice    │   │
│ nin          │   │   └──────┬───────┘   │   └──────┬───────┘   │
│ isActive     │   │          │           │          │           │
│ isBanned     │   │          ▼           ▼          ▼           │
└──────┬───────┘   │   ┌──────────────────────────────────┐      │
       │           │   │           Auctions                │      │
       │           │   │                                   │      │
       │           │   │ id                                │      │
       │           ├───│ sellerId                          │      │
       │           │   │ listingId ──────── (polymorphic)  │      │
       │           │   │ category (CAR|GADGET)             │      │
       │           │   │ status (10 states)                │      │
       │           │   │ basePriceKobo                     │      │
       │           │   │ currentWinningBidId               │      │
       │           │   │ winnerId ─────────────────────────┼──┐   │
       │           │   │ paymentDeadlineAt                 │  │   │
       │           │   └──────────┬───────────────────────┘  │   │
       │           │              │                          │   │
       │           │              ▼                          │   │
       │           │   ┌──────────────────┐                 │   │
       │           │   │      Bids        │                 │   │
       │           │   │                  │                 │   │
       │           │   │ id               │                 │   │
       │           ├───│ bidderId         │                 │   │
       │           │   │ auctionId        │                 │   │
       │           │   │ amountKobo       │                 │   │
       │           │   │ walletHoldId     │                 │   │
       │           │   │ status           │                 │   │
       │           │   └──────────────────┘                 │   │
       │           │                                        │   │
       │           │   ┌──────────────────┐                 │   │
       │           │   │ AuctionDeliveries│                 │   │
       │           │   │                  │                 │   │
       │           │   │ auctionId        │                 │   │
       │           ├───│ winnerId         │◀────────────────┘   │
       │           │   │ sellerId         │                     │
       │           │   │ status           │                     │
       │           │   │ trackingInfo     │                     │
       │           │   └──────────────────┘                     │
       │           │                                            │
       ▼           │                                            │
┌──────────────────┴────────────────────────────────────────────┘
│                     Wallet System
│
│  ┌──────────────┐  ┌────────────────────┐  ┌──────────────────┐
│  │   Wallets    │  │ WalletLedgerEntries │  │   WalletHolds    │
│  │              │  │                    │  │                  │
│  │ userId (UQ)  │  │ walletId           │  │ walletId         │
│  │ balanceKobo  │  │ type (10 types)    │  │ auctionId        │
│  │ heldKobo     │  │ amountKobo         │  │ bidId            │
│  │ currency     │  │ balanceBefore/After │  │ amountKobo       │
│  └──────────────┘  │ reference          │  │ status           │
│                    └────────────────────┘  └──────────────────┘
│
│  ┌──────────────────┐  ┌──────────────────────┐
│  │WalletWithdrawals │  │WalletFundingAccounts  │
│  │                  │  │                      │
│  │ amountKobo       │  │ accountNumber        │
│  │ status           │  │ accountName          │
│  │ destinationBank  │  │ bankName             │
│  │ providerRef      │  │ providerPayload      │
│  └──────────────────┘  └──────────────────────┘
└─────────────────────────────────────────────────
```

### Auction State Machine

```
                    ┌───────────┐
                    │   DRAFT   │
                    └─────┬─────┘
                          │ submit
                    ┌─────▼──────────────┐
                    │ PENDING_APPROVAL   │
                    └─────┬──────────────┘
                   ╱      │ approve      ╲ reject
          ┌───────╱       │              ╲──────────┐
          │               ▼                          │
    ┌─────▼─────┐   ┌───────────┐            ┌──────▼──────┐
    │ REJECTED  │   │ SCHEDULED │            │  CANCELLED  │
    └───────────┘   └─────┬─────┘            └─────────────┘
                          │ start time reached
                    ┌─────▼─────┐
                    │   LIVE    │ ◀──── RELISTED
                    └─────┬─────┘
                          │ end time reached
                    ┌─────▼──────────────┐
                    │      ENDED         │
                    └─────┬──────────────┘
                          │ settle / default
                 ┌────────┴────────┐
                 ▼                 ▼
        ┌──────────────┐  ┌──────────────┐
        │   SETTLED    │  │  DEFAULTED   │
        └──────────────┘  └──────────────┘
```

### Bid Status Flow

```
ACCEPTED ──▶ WINNING (if new highest bid on previous winner: OUTBID)
   │
   ├── RELEASED (hold released after auction ends, non-winner)
   └── APPLIED (hold applied to payment, winner)
```

### Migration Strategy

- **19 TypeORM migrations** manage schema evolution
- `synchronize: false` in production — only migrations modify schema
- Migrations are version-controlled and run sequentially

---

## 8. Authentication & Authorization

### Authentication: Better Auth

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Browser    │────▶│  Next.js BFF    │────▶│  NestJS Backend  │
│              │     │  (Proxy)        │     │                  │
│ better-auth  │     │  Forwards       │     │  better-auth     │
│ React client │     │  cookies        │     │  (ESM, direct    │
│              │     │  transparently  │     │   PG connection) │
└─────────────┘     └─────────────────┘     └────────┬─────────┘
                                                      │
                                                      ▼
                                              ┌──────────────┐
                                              │  PostgreSQL   │
                                              │  auth_users   │
                                              │  auth_sessions│
                                              │  auth_accounts│
                                              └──────────────┘
```

| Aspect | Implementation |
|--------|---------------|
| Session mechanism | Cookie-based (`better-auth.session_token`) |
| Password hashing | Argon2 |
| Token storage | `auth_sessions` table (managed by Better Auth) |
| Additional fields | `phone`, `firstName`, `lastName`, `appRole`, `nin`, `referralCode` |
| Post-registration hook | Creates app profile in `users` table + default `notification_preferences` |
| Email verification | Via Resend email service |
| Password reset | Via Resend email service |

### Authorization: Two-Layer Model

**Layer 1 — Role-Based (Route Guards)**

| Role | Access |
|------|--------|
| `ADMIN` | `/admin/*` routes |
| `INDIVIDUAL_BIDDER`, `CAR_DEALER`, `MECHANIC` | `/dashboard/*` routes |

**Layer 2 — Permission-Based (CASL)**

```typescript
// Admin abilities
can('manage', 'all')  // Full access

// User abilities
can('read', 'Auction')
can('create', 'Wallet')
can('create', 'Withdrawal')
```

CASL abilities are built per session and used with `<Can>` components for conditional UI rendering.

---

## 9. Real-Time System

### WebSocket Architecture

```
┌──────────┐                    ┌──────────────────────────────┐
│ Browser  │──── Socket.IO ────▶│  NestJS Gateway              │
│          │    (port 4000)     │                              │
│          │                    │  /auctions namespace         │
│          │                    │  ├─ join:auction (room)      │
│          │                    │  ├─ leave:auction (room)     │
│          │                    │  └─ bid:placed (broadcast)   │
│          │                    │                              │
│          │                    │  /notifications namespace    │
│          │                    │  ├─ notification:new         │
│          │                    │  └─ notification:read        │
└──────────┘                    └──────────────────────────────┘
```

### Event Flow: Placing a Bid

```
1. Client calls POST /api/v1/bids (HTTP)
2. Backend validates bid, creates DB record, places wallet hold
3. Backend emits "bid:placed" to auction room (WebSocket)
4. All connected clients in that auction room receive the update
5. Previous high bidder receives "bid:outbid" notification
```

### Namespaces

| Namespace | Purpose | Events |
|-----------|---------|--------|
| `/auctions` | Live auction updates | `bid:placed`, `auction:ended`, `auction:started` |
| `/notifications` | Push notifications | `notification:new`, `notification:read` |

---

## 10. Payment & Wallet System

### Wallet Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        WALLET SYSTEM                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Funding Flow                           │   │
│  │                                                          │   │
│  │  User ──▶ Create Funding Account ──▶ Strowallet          │   │
│  │            (virtual account)         generates account    │   │
│  │                                            │              │   │
│  │              Webhook ◀─────────────────────┘              │   │
│  │                 │                                         │   │
│  │                 ▼                                         │   │
│  │         Credit Wallet Balance                            │   │
│  │         Create Ledger Entry                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Bidding Flow                           │   │
│  │                                                          │   │
│  │  Place Bid ──▶ Create WalletHold ──▶ Deduct from         │   │
│  │               (freeze funds)         available balance    │   │
│  │                                              │            │   │
│  │              Outbid? ──▶ Release hold ────────┘            │   │
│  │              Won?    ──▶ Apply hold to payment            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Withdrawal Flow                          │   │
│  │                                                          │   │
│  │  Request ──▶ Admin Authorizes (OTP) ──▶ Process via      │   │
│  │              Debit wallet               Strowallet        │   │
│  │              Create ledger entry                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Ledger Entry Types

| Type | Direction | Description |
|------|-----------|-------------|
| `WALLET_FUNDING` | Credit | Funds added via bank transfer |
| `BID_HOLD` | Debit (hold) | Funds frozen for active bid |
| `BID_HOLD_RELEASE` | Credit (unhold) | Funds returned when outbid |
| `BID_PAYMENT` | Debit | Winning bid payment |
| `SELLER_CREDIT` | Credit | Seller receives payment minus fees |
| `PLATFORM_FEE` | Credit | Platform fee deducted from transaction |
| `WITHDRAWAL` | Debit | Cash withdrawal to bank account |
| `REFUND` | Credit | Manual refund by admin |
| `ESCROW_CREDIT` | Credit | Funds held in escrow |
| `ESCROW_RELEASE` | Debit | Escrow released to seller |

### Idempotency

All payment-related POST endpoints use an `Idempotency-Key` header backed by Redis, preventing duplicate transactions from retries or network issues.

---

## 11. External Integrations

```
┌─────────────────────────────────────────────────────────────┐
│                    External Services                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Strowallet (Payment Provider)                      │    │
│  │  ├── Virtual account generation (wallet funding)    │    │
│  │  ├── Bank transfers (withdrawals)                   │    │
│  │  ├── BVN/NIN verification (KYC)                     │    │
│  │  ├── OTP SMS delivery                               │    │
│  │  └── Webhook callbacks                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Openinary (File Storage)                           │    │
│  │  ├── Image uploads (listing photos)                 │    │
│  │  ├── Video uploads (listing videos)                 │    │
│  │  └── Document uploads (proof documents)             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Resend (Email Service)                             │    │
│  │  ├── Email verification                             │    │
│  │  ├── Password reset                                 │    │
│  │  └── Transactional notifications                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  OpenRouter (AI Chat)                               │    │
│  │  ├── Support chat assistant                         │    │
│  │  ├── Tool-calling capabilities                      │    │
│  │  └── Configurable model + temperature               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  WhatsApp Business API (Messaging)                  │    │
│  │  ├── Bid notifications                              │    │
│  │  ├── Auction updates                                │    │
│  │  └── Marketing messages                             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. API Design

### Conventions

| Aspect | Convention |
|--------|-----------|
| Base URL | `/api/v1` |
| Auth | Cookie-based sessions (Better Auth) |
| Pagination | `?limit=20&offset=0` query parameters |
| Error format | `{ statusCode, code, message, details, path, timestamp }` |
| Idempency | `Idempotency-Key` header for payment endpoints |
| Docs | Swagger UI at `/docs` |

### Endpoint Summary

| Module | Endpoints | Key Operations |
|--------|-----------|----------------|
| Auth | `/auth/*` | Sign up, sign in, sign out, password reset, email verification |
| Users | `/users/*` | Profile CRUD, notification preferences, listing permissions |
| Cars | `/cars/*` | Car listing CRUD, status management |
| Gadgets | `/gadgets/*` | Gadget listing CRUD, status management |
| Auctions | `/auctions/*` | Auction lifecycle, settlement, payment deadlines |
| Bids | `/bids/*` | Place bid, bid history, bid status |
| Wallets | `/wallets/*` | Balance, funding, withdrawals, ledger |
| Payments | `/payments/*` | Webhooks, bank list, account lookup |
| KYC | `/kyc/*` | BVN/NIN verification |
| Notifications | `/notifications/*` | List, mark read, preferences |
| Uploads | `/uploads/*` | Single, batch, and bulk file uploads |
| Admin | `/admin/*` | Dashboard, settings, listing review, user management |
| Support | `/support/*` | AI chat, conversation management |
| Health | `/health` | System health check |
| Public | `/public/*` | Public auction data (no auth required) |

---

## 13. Security

### Security Measures

| Layer | Measure |
|-------|---------|
| Transport | HTTPS enforced in production |
| Headers | @fastify/helmet (CSP, X-Frame-Options, etc.) |
| CORS | Configured allowed origins |
| Rate Limiting | 120 requests/minute per IP |
| Input Validation | class-validator DTOs + ValidationPipe |
| SQL Injection | TypeORM parameterized queries |
| XSS | React's default escaping + CSP headers |
| Auth Tokens | HttpOnly, Secure, SameSite cookies |
| Password Hashing | Argon2 |
| Webhook Verification | StrowalletWebhookGuard |
| Idempotency | Redis-backed for payment mutations |
| Env Validation | Zod schema validates all env vars at startup |
| File Uploads | 10 file limit, 50MB per file, MIME type checking |

### Error Handling

All errors follow a normalized format:

```json
{
  "statusCode": 400,
  "code": "INSUFFICIENT_BALANCE",
  "message": "Wallet balance too low for this bid",
  "details": { "required": 5000000, "available": 3200000 },
  "path": "/api/v1/bids",
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

---

## 14. Deployment & Infrastructure

### Docker Configuration

**Frontend (Next.js)**
- Multi-stage build: deps → builder → runner
- Node.js 22 Alpine
- Standalone output for minimal image size
- Non-root `nextjs` user
- Port: 3000

**Backend (NestJS)**
- Multi-stage build: deps → build → runner
- Node.js 22 Alpine
- Port: 4000

**Infrastructure (docker-compose)**
- PostgreSQL 16 Alpine with persistent volume
- Redis 7 Alpine with persistent volume
- Health checks for both services

### Environment Configuration

```
Frontend (.env)
├── API_ORIGIN              # Backend URL (server-side only)
├── NEXT_PUBLIC_WS_URL      # WebSocket endpoint (browser)
└── NEXT_PUBLIC_APP_URL     # App URL (metadata/redirects)

Backend (.env)
├── App: HOST, PORT, PREFIX, CORS_ORIGINS
├── Database: HOST, PORT, USER, PASSWORD, NAME, SSL
├── Redis: HOST, PORT, PASSWORD
├── Auth: BETTER_AUTH_URL, BETTER_AUTH_SECRET
├── Strowallet: 7 vars (keys, URLs, mode)
├── Openinary: 3 vars (cloud name, key, secret)
├── WhatsApp: 3 vars (token, phone ID, API version)
├── OpenRouter: API key, model, temperature
├── Email: RESEND_API_KEY, EMAIL_FROM
└── Idempotency: TTL_SECONDS
```

### Production Validation

The backend uses a **Zod schema** to validate all environment variables at startup. In production mode, critical secrets are enforced (no dev defaults allowed).

---

## 15. Testing Strategy

### Backend Testing

| Layer | Tool | Coverage |
|-------|------|----------|
| Unit tests | Jest | Controllers, services, gateways, processors |
| Integration tests | Jest + supertest | HTTP endpoint testing |
| Test count | 26 test files | Covering all major modules |

### Test Organization

```
modules/<feature>/
├── <feature>.controller.spec.ts
├── <feature>.service.spec.ts
└── <feature>.gateway.spec.ts  (if applicable)
```

### Frontend Testing

- **TypeScript** catches type errors at compile time
- **ESLint** enforces code quality
- **Zod** validates all form inputs and API responses at runtime

---

## Appendix A: Project File Map

```
auction/
├── AGENTS.md                    # AI coding conventions
├── CLAUDE.md                    # Claude-specific conventions
├── ARCHITECTURE.md              # This document
├── INTEGRATION-READINESS.md     # Endpoint-to-UI mapping matrix
├── pattern.md                   # Integration patterns guide
├── auction_app_spec.pdf         # Product specification
│
├── frontend/                    # Next.js 16 application
│   ├── app/                     # App Router pages and layouts
│   │   ├── layout.tsx           # Root layout (fonts, providers)
│   │   ├── globals.css          # Design tokens
│   │   ├── lib/                 # Infrastructure (API, auth, query, etc.)
│   │   ├── components/          # Feature-organized components
│   │   ├── (user)/dashboard/    # User dashboard routes
│   │   ├── (admin)/admin/       # Admin dashboard routes
│   │   ├── login/               # Auth routes
│   │   └── register/
│   ├── public/                  # Static assets
│   ├── Dockerfile
│   └── package.json
│
└── backend/                     # NestJS 11 application
    ├── src/
    │   ├── main.ts              # Application bootstrap
    │   ├── app.module.ts        # Root module
    │   ├── config/              # Env validation, DB config
    │   ├── common/              # Shared infrastructure
    │   ├── modules/             # 17 feature modules
    │   └── database/migrations/ # 19 TypeORM migrations
    ├── docker-compose.yml       # PostgreSQL + Redis
    ├── Dockerfile
    └── package.json
```

## Appendix B: Key Metrics

| Metric | Value |
|--------|-------|
| Backend modules | 17 |
| Database entities | 32 |
| Database migrations | 19 |
| API endpoint groups | 14 |
| Backend test files | 26 |
| Frontend feature components | 12+ feature folders |
| Environment variables (backend) | 30+ |
| External integrations | 5 (Strowallet, Openinary, Resend, OpenRouter, WhatsApp) |
