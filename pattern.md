# Integration Patterns

> The opinionated guide for wiring the **NestJS backend** to the **Next.js frontend** for this auction platform.
> Read this before writing integration code. Every rule here exists because skipping it has cost real time on real teams.

This document has two halves:

1. **Frontend integration** — how UI consumes the API. This is the longer half. Read it first if you're wiring screens.
2. **Backend integration** — how the backend talks to providers (Monnify, identity verification, WhatsApp, S3, etc.). Read it if you're adding a provider.

Both halves share the same principle: **business code depends on contracts we own, not on shapes that come from the wire.**

---

## Table of contents

1. [Principles](#principles)
2. [Tech contract](#tech-contract)
3. [Folder layout](#folder-layout)
4. [HTTP layer](#http-layer)
5. [API proxy (Next.js BFF rewrite)](#api-proxy-nextjs-bff-rewrite)
6. [Money, time, ids](#money-time-ids)
7. [Type contracts and DTO mapping](#type-contracts-and-dto-mapping)
8. [React Query setup](#react-query-setup)
9. [Query keys](#query-keys)
10. [Query hooks](#query-hooks)
11. [Mutation hooks](#mutation-hooks)
12. [Pagination and infinite queries](#pagination-and-infinite-queries)
13. [Forms with React Hook Form + Zod](#forms-with-react-hook-form--zod)
14. [Auth and session bootstrap](#auth-and-session-bootstrap)
15. [Permissions with CASL](#permissions-with-casl)
16. [Real-time updates](#real-time-updates)
17. [File uploads](#file-uploads)
18. [Error handling](#error-handling)
19. [Loading, empty, and error states](#loading-empty-and-error-states)
20. [Server vs client components](#server-vs-client-components)
21. [Testing](#testing)
22. [Definition of done per endpoint](#definition-of-done-per-endpoint)
23. [End-to-end example: Wallet](#end-to-end-example-wallet)
24. [Migrating simulated screens to live data](#migrating-simulated-screens-to-live-data)
25. [Backend integration: ports and adapters](#backend-integration-ports-and-adapters)
26. [Anti-patterns](#anti-patterns)
27. [PR review checklist](#pr-review-checklist)
28. [References](#references)

---

## Principles

Five rules that override everything else. If a rule below contradicts these, the principle wins.

1. **Components render. Hooks fetch.** Components do not import `fetch`, `axios`, or any API client.
2. **The wire is not the model.** Backend response shapes never reach components. Hooks return UI-ready view models.
3. **Server state lives in React Query. Client state lives in Zustand.** Never put server state in Context.
4. **Every endpoint has a query-key factory, a typed API function, a hook, and a Zod response schema.** No exceptions.
5. **Money is `kobo`. Always.** The wire never carries naira. The UI converts at the edge.

---

## Tech contract

| Concern | Library | Notes |
|---|---|---|
| Framework | `next@16` (App Router, Turbopack) | Server Components by default. Read `node_modules/next/dist/docs/` before touching new APIs. |
| Data fetching | `@tanstack/react-query` + `@tanstack/react-query-devtools` | Mandatory for server state. |
| HTTP | native `fetch` via a thin `apiClient` wrapper | No `axios`. If the team wants a tiny well-tested wrapper instead of rolling our own, `ofetch` is the swap-in choice — it gives JSON parsing, query string handling, and typed errors out of the box. Pick one and stay with it; do not mix. |
| Auth | `better-auth` + `better-auth/client/react` | Cookie-based session (`better-auth.session_token`). The React client gives us `useSession`, `signIn`, `signOut` — use it instead of rolling a custom session hook. |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` | One pattern for every form. |
| Validation | `zod` | Used for both forms and runtime API response parsing. Already installed. |
| Client state | `zustand` | UI-only. Modal open, filter chips shared across screens, etc. |
| Permissions | `@casl/ability` + `@casl/react` | Single `Ability` instance per session. |
| Realtime | `socket.io-client` (when wired) | One shared connection per session. |
| Errors | `react-error-boundary` | Use `<ErrorBoundary>` and `useErrorBoundary` from this package instead of hand-rolling a class component. |
| Dates | `date-fns` + `date-fns-tz` | Use these for formatting and time-zone aware math (`Africa/Lagos`). `Intl` is OK for one-off formatting; use the libs anywhere math, parsing, or "in 2 hours" relative output is involved. |
| Money | native `Intl.NumberFormat` | The values are integer kobo. Don't pull in `dinero.js` for this scope. |
| IDs | `crypto.randomUUID()` (native) | For idempotency keys. |
| Branded types (optional) | `ts-brand` | Only if the team wants compile-time safety on `AuctionId`, `UserId`, etc. Otherwise the manual brand pattern below is enough. |
| Styling | Tailwind v4 + shadcn primitives | Tokens live in `app/globals.css`. |
| Toasts | `sonner` | One `<Toaster />` per layout. |
| Tests | `vitest` + `@testing-library/react` + `@testing-library/user-event` + `msw` | MSW is the source of truth for handlers in tests. |
| Package manager | `pnpm` | Lockfile is committed. |

**Rules about libraries**

- If a library exists for a concern above, use it. Do not roll your own.
- If a library exists for a concern **not** above, propose it in PR and add it to this table — don't sneak it in.
- If you find yourself writing more than ~30 lines of utility code that "feels generic", stop and look for a library first.
- The hand-rolled code that **is** in this document (`apiClient`, `formatNGN`, query-key factories) is intentional: it's small, project-specific, and replacing it with a library would buy more dependency surface than value.

### One-time install

Paste this into the frontend root:

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools \
        better-auth \
        react-hook-form @hookform/resolvers \
        @casl/ability @casl/react \
        zustand \
        sonner \
        socket.io-client \
        react-error-boundary \
        date-fns date-fns-tz

pnpm add -D msw @testing-library/react @testing-library/user-event \
            @testing-library/jest-dom vitest jsdom
```

`zod` is already installed.

---

## Folder layout

The frontend already follows a feature-folder pattern (`app/components/<feature>/...`). Extend it like this:

```
frontend/
├── app/
│   ├── components/
│   │   └── <feature>/                  # one folder per feature: wallet, auctions, kyc, …
│   │       ├── api/                    # HTTP functions (one file per resource)
│   │       │   └── wallet.api.ts
│   │       ├── hooks/                  # React Query hooks + query keys
│   │       │   ├── use-wallet.ts
│   │       │   ├── use-wallet-ledger.ts
│   │       │   ├── use-create-withdrawal.ts
│   │       │   └── wallet-keys.ts
│   │       ├── types/                  # types and Zod schemas for this feature
│   │       │   └── wallet.types.ts
│   │       ├── utils/                  # pure helpers (kobo→naira, formatters)
│   │       │   └── wallet.format.ts
│   │       ├── WalletScreen.tsx        # composition only
│   │       └── widgets/                # presentational pieces
│   │           ├── BalanceCard.tsx
│   │           └── LedgerRow.tsx
│   │
│   └── lib/                            # cross-feature only
│       ├── api/
│       │   ├── client.ts               # the apiClient
│       │   ├── error.ts                # ApiError class
│       │   └── env.ts                  # API base URL
│       ├── auth/
│       │   ├── session.ts              # useSession, sessionKeys
│       │   └── guards.tsx              # <RequireAuth>, <RequireRole>
│       ├── query/
│       │   ├── client.ts               # the QueryClient + defaults
│       │   └── provider.tsx
│       ├── realtime/
│       │   └── socket.ts               # one shared socket
│       ├── permissions/
│       │   └── ability.ts              # CASL abilities
│       ├── format/                     # money, dates, phone — used everywhere
│       │   ├── money.ts
│       │   └── date.ts
│       └── testing/
│           └── render.tsx              # custom render for RTL
```

Rules:

- A feature **never** imports another feature's hooks. If two features need the same hook, lift it to `lib/`.
- Cross-cutting code lives only in `lib/` (auth, query, format, realtime, permissions).
- Components live in their feature folder. Shared primitives (Modal, NumberInput) live in `components/ui/`.
- A file should do **one** thing. If `wallet.api.ts` grows past ~150 lines, split by resource.

---

## HTTP layer

One `apiClient` for the whole app. It owns: base URL, cookies, auth handling, error mapping, content-type defaults, JSON parsing.

### `lib/api/env.ts`

```ts
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export const API_PREFIX = "/api/v1";

export const apiUrl = (path: string) =>
  `${API_BASE}${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
```

### `lib/api/error.ts`

```ts
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isValidation() {
    return this.status === 400 || this.status === 422;
  }
  get isServer() {
    return this.status >= 500;
  }
}
```

### `lib/api/client.ts`

```ts
import { ApiError } from "./error";
import { apiUrl } from "./env";

type Options = Omit<RequestInit, "body"> & {
  body?: unknown;            // pass an object, we'll serialize
  query?: Record<string, string | number | boolean | undefined>;
};

export async function apiClient<T>(path: string, opts: Options = {}): Promise<T> {
  const url = withQuery(apiUrl(path), opts.query);

  const headers = new Headers(opts.headers);
  if (opts.body && !(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const res = await fetch(url, {
    ...opts,
    credentials: "include",                          // Better Auth session cookie
    headers,
    body:
      opts.body instanceof FormData
        ? opts.body
        : opts.body
          ? JSON.stringify(opts.body)
          : undefined,
  });

  const text = await res.text();
  const json = text ? safeParse(text) : null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      typeof json === "object" && json && "code" in json ? String(json.code) : "unknown",
      typeof json === "object" && json && "message" in json
        ? String(json.message)
        : res.statusText,
      json,
    );
  }
  return json as T;
}

function withQuery(url: string, query?: Options["query"]) {
  if (!query) return url;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) sp.append(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${url}?${qs}` : url;
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
```

That's the entire HTTP layer. **Nothing else** in the app calls `fetch` directly.

### Auth interceptor

Centralize 401 handling at the React Query level (see [Auth and session bootstrap](#auth-and-session-bootstrap)) — not inside `apiClient`. The client only throws; the cache decides whether to redirect.

---

## API proxy (Next.js BFF rewrite)

The frontend talks to the backend through a same-origin Next.js **rewrite**. Browsers see `/api/v1/...`; Next forwards those requests to the backend. The backend URL is never embedded in the bundle.

### Why we do this

- **First-party cookies.** The session cookie's domain equals the page origin, so it stays in the "first party" bucket as Safari ITP and Chrome's third-party cookie phase-out keep tightening cross-site rules.
- **No CORS preflight per call.** Same-origin requests skip OPTIONS — visible latency win on every interactive screen.
- **Simpler CSP.** `connect-src 'self'` covers everything; no separate API host to allow.
- **Server Components.** RSC code can call relative `/api/v1/...` without a server-side fetch helper.
- **One env var instead of two.** Browser bundles never see `NEXT_PUBLIC_API_BASE_URL` because the URL doesn't appear in client code.

### What does **not** go through the proxy

- **WebSockets** (Socket.IO) — proxying ws over Next rewrites is brittle. Use the backend's URL directly or a separate subdomain like `ws.bidnaija.com`. See [Real-time updates](#real-time-updates).
- **Provider webhooks** (Strowallet, etc.) — those are inbound to the backend. Not a frontend concern.

### `next.config.ts`

```ts
import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";
const API_PREFIX = "/api/v1";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: `${API_PREFIX}/:path*`,
        destination: `${API_ORIGIN}${API_PREFIX}/:path*`,
      },
    ];
  },
};

export default nextConfig;
```

`API_ORIGIN` is a **server-only** env var (no `NEXT_PUBLIC_` prefix). Set it to the backend's internal URL in deployment (`https://api.bidnaija.com` or the in-cluster address).

### `lib/api/env.ts` (revised)

The proxy lets the browser use relative URLs. Server Components still need an absolute URL when they fetch directly (rewrites only run on inbound HTTP, not on server-side fetch). One helper, two contexts:

```ts
const API_PREFIX = "/api/v1";

const isServer = typeof window === "undefined";

const SERVER_BASE =
  process.env.API_ORIGIN ?? "http://localhost:4000";   // server-only, never NEXT_PUBLIC

export const apiUrl = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return isServer ? `${SERVER_BASE}${API_PREFIX}${p}` : `${API_PREFIX}${p}`;
};
```

The `apiClient` from [HTTP layer](#http-layer) keeps working unchanged — it just produces a relative URL in the browser and an absolute one on the server.

### Backend changes

- Set `CORS_ORIGINS` to the **frontend** origin (e.g. `https://app.bidnaija.com`). The proxy hops are server-to-server so they don't need CORS, but Better Auth still validates `trustedOrigins` against the request's `Origin` header.
- Keep `credentials: true` in the Fastify CORS plugin (already done) — needed for browser → backend fallbacks (e.g. webhooks, direct backend dashboards).

### Why "hide the backend URL" is not the real reason

It's a side effect, not security. Anyone can read the network tab and see the proxy hop. The wins above are concrete; the "hiding" framing is mostly cosmetic. If a teammate asks "is this for security?", the answer is **no, it's for cookies + latency + CSP simplicity**.

### Optional: server-side caching at the proxy

Once the proxy is in place, you can add ISR-like caching for read-only endpoints by writing route handlers (`app/api/.../route.ts`) instead of pure rewrites. Useful for `GET /auctions` on a high-traffic landing page. Not required for MVP.

---

## Money, time, ids

### Money is kobo

The backend talks in **kobo** everywhere. Naira is a presentation concern. There are exactly two functions allowed to cross the boundary:

```ts
// lib/format/money.ts
export const koboToNaira = (kobo: number): number => kobo / 100;
export const nairaToKobo = (naira: number): number => Math.round(naira * 100);

const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export const formatNGN = (kobo: number): string => NGN.format(koboToNaira(kobo));
```

Rules:

- Wire types end with `Kobo` (`amountKobo`, `basePriceKobo`).
- View-model types use `naira` (`amountNaira`) **or** keep kobo with the suffix; never strip the unit.
- A component that receives a "money number" without a unit suffix is a bug.
- Bid input collects naira from the user, converts at submit time:
  ```ts
  await placeBid({ amountKobo: nairaToKobo(form.amountNaira) });
  ```

### Time

- The wire is ISO-8601 strings, always UTC (`2026-05-01T12:00:00.000Z`).
- The UI uses `Intl.DateTimeFormat` with a fixed locale (`en-NG`) and `Africa/Lagos` time zone for display.
- Never compare strings; parse with `new Date(...)` immediately.
- Server-rendered timestamps and client-rendered timestamps will mismatch. Use `suppressHydrationWarning` only on the timestamp text node, not on its parent.

```ts
// lib/format/date.ts
const DATE = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});
export const formatDate = (iso: string) => DATE.format(new Date(iso));
```

### Ids

- All resource ids are opaque strings (UUIDs from Better Auth, business ids elsewhere).
- Use **branded types** for safety:

```ts
// types/auction.types.ts
export type AuctionId = string & { readonly __brand: "AuctionId" };
export const AuctionId = (s: string): AuctionId => s as AuctionId;
```

Branded types are optional but encouraged for the high-traffic ids: `AuctionId`, `UserId`, `WalletEntryId`.

---

## Type contracts and DTO mapping

There are two type layers. Keep them separate.

### 1. Wire types (`*Dto`)

These mirror the OpenAPI schema 1:1. They live in `types/<feature>.types.ts` and are `Dto`-suffixed.

```ts
// types/wallet.types.ts
export type WalletDto = {
  balanceKobo: number;
  pendingHoldKobo: number;
  currency: "NGN";
  updatedAt: string;
};
```

### 2. View models

These are what components consume. They live in the same file, **without** the `Dto` suffix.

```ts
export type Wallet = {
  balance: number;       // naira
  hold: number;          // naira
  updatedAt: Date;
};
```

### The mapper

Always one function per resource. Lives in `api/<feature>.api.ts` next to the HTTP call. Mappers can call `lib/format/...`.

```ts
// api/wallet.api.ts
import { apiClient } from "@/app/lib/api/client";
import { koboToNaira } from "@/app/lib/format/money";
import type { Wallet, WalletDto } from "../types/wallet.types";

const toWallet = (dto: WalletDto): Wallet => ({
  balance: koboToNaira(dto.balanceKobo),
  hold: koboToNaira(dto.pendingHoldKobo),
  updatedAt: new Date(dto.updatedAt),
});

export const getWallet = async (): Promise<Wallet> => {
  const dto = await apiClient<WalletDto>("/wallets/me");
  return toWallet(dto);
};
```

### Why this matters

- The day the backend renames `pendingHoldKobo` → `heldKobo`, you change one mapper. No screen breaks.
- Components stop carrying `kobo` math.
- `Date` objects in components mean comparisons and formatting are obvious.

### Optional: runtime validation

For high-stakes endpoints (payments, settlements), validate the wire response with Zod inside the mapper:

```ts
const WalletDtoSchema = z.object({
  balanceKobo: z.number().int().nonnegative(),
  pendingHoldKobo: z.number().int().nonnegative(),
  currency: z.literal("NGN"),
  updatedAt: z.string().datetime(),
});

export const getWallet = async (): Promise<Wallet> => {
  const raw = await apiClient<unknown>("/wallets/me");
  const dto = WalletDtoSchema.parse(raw); // throws ZodError on contract drift
  return toWallet(dto);
};
```

Don't do this for every endpoint — it's overhead. Do it for: money, settlements, withdrawals, anything settling between two parties.

---

## React Query setup

### `lib/query/client.ts`

```ts
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/error";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,                // most lists tolerate 30s of staleness
        gcTime: 5 * 60_000,               // keep cache 5 min after last subscriber
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status < 500) return false;
          return failureCount < 2;        // retry only network/5xx errors
        },
        refetchOnWindowFocus: false,      // turn back on per-feature if needed
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,                     // mutations are user-initiated; never auto-retry
      },
    },
  });
}
```

### `lib/query/provider.tsx`

```tsx
"use client";
import { QueryClientProvider, isServer } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { makeQueryClient } from "./client";

let browserClient: ReturnType<typeof makeQueryClient> | undefined;

function getQueryClient() {
  if (isServer) return makeQueryClient(); // fresh per request on server
  return (browserClient ??= makeQueryClient());
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = getQueryClient();
  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

Mount `<QueryProvider>` once in `app/layout.tsx`. Below `<html>`, above all routes.

---

## Query keys

Every feature owns a key factory. Generic → specific. Keys are arrays. Variables that affect the query are in the key.

```ts
// hooks/wallet-keys.ts
export const walletKeys = {
  all: ["wallets"] as const,
  me: () => [...walletKeys.all, "me"] as const,
  ledger: () => [...walletKeys.all, "ledger"] as const,
  ledgerPage: (params: { limit: number; offset: number }) =>
    [...walletKeys.ledger(), params] as const,
};
```

Rules:

- Never inline a string array in `useQuery`. Always reference the factory.
- Never share a key between a regular query and an infinite query — they shape data differently.
- The key for a paginated query includes the page params; the key for an infinite query does not.

---

## Query hooks

Hooks are thin. They wire the API function to a key, expose `enabled`, and select if the component needs a slice.

```ts
// hooks/use-wallet.ts
import { useQuery } from "@tanstack/react-query";
import { getWallet } from "../api/wallet.api";
import { walletKeys } from "./wallet-keys";

export function useWallet() {
  return useQuery({
    queryKey: walletKeys.me(),
    queryFn: getWallet,
  });
}
```

### Param-bound queries

```ts
export function useAuctionDetail(id: AuctionId) {
  return useQuery({
    queryKey: auctionKeys.detail(id),
    queryFn: () => getAuctionDetail(id),
    enabled: Boolean(id),               // never fire with empty id
  });
}
```

### Selecting a slice

If a component only needs `wallet.balance`, give it `select` so it doesn't re-render on `updatedAt` ticks:

```ts
export function useWalletBalance() {
  return useQuery({
    queryKey: walletKeys.me(),
    queryFn: getWallet,
    select: (w) => w.balance,
  });
}
```

### Suspense queries (Next 16 server components)

For data fetched in a server component, prefer `prefetchQuery` + `dehydrate` and let the client hook attach without an extra round trip:

```tsx
// page.tsx (server component)
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { makeQueryClient } from "@/app/lib/query/client";
import { walletKeys } from "@/app/components/wallet/hooks/wallet-keys";
import { getWallet } from "@/app/components/wallet/api/wallet.api";

export default async function WalletPage() {
  const queryClient = makeQueryClient();
  await queryClient.prefetchQuery({
    queryKey: walletKeys.me(),
    queryFn: getWallet,
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WalletScreen />
    </HydrationBoundary>
  );
}
```

The client hook is unchanged. The first paint has data; no spinner.

---

## Mutation hooks

A mutation hook is a `useMutation` with three things wired correctly:

1. The right `mutationFn`.
2. The right cache invalidation on success.
3. Optimistic update with rollback when the user expects instant feedback (bidding, toggling, marking-read).

### Basic mutation

```ts
// hooks/use-create-withdrawal.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWithdrawal } from "../api/wallet.api";
import { walletKeys } from "./wallet-keys";

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWithdrawal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.me() });
      qc.invalidateQueries({ queryKey: walletKeys.ledger() });
    },
  });
}
```

### Optimistic update + rollback

For mark-as-read, like, follow, bid, etc.:

```ts
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: notificationKeys.list() });
      const prev = qc.getQueryData<Notification[]>(notificationKeys.list());
      qc.setQueryData<Notification[]>(notificationKeys.list(), (list) =>
        list?.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n)),
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(notificationKeys.list(), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.list() }),
  });
}
```

### Toasts on error

Wrap the mutation hook **once** at the screen level:

```tsx
const { mutate: placeBid, isPending } = usePlaceBid(auctionId);

<Button
  disabled={isPending}
  onClick={() =>
    placeBid({ amountNaira: form.amountNaira }, {
      onError: (err) => {
        if (err instanceof ApiError && err.isValidation) {
          toast.error(err.message);
        } else {
          toast.error("Could not place bid. Try again.");
        }
      },
      onSuccess: () => toast.success("Bid placed"),
    })
  }
/>
```

Don't put the toast call inside the hook itself — keep hooks side-effect-free, let screens decide UX.

### Idempotency

For payment-like mutations (`createWithdrawal`, `placeBid`, `redeemAccessCode`), generate a client-side idempotency key and pass it as a header:

```ts
const key = crypto.randomUUID();
await apiClient("/wallets/withdrawals", {
  method: "POST",
  body: input,
  headers: { "Idempotency-Key": key },
});
```

Backend stores the key for 24h and replays the same response. Coordinate the header name with backend (`Idempotency-Key` is the conventional choice).

---

## Pagination and infinite queries

The API uses `limit` and `offset`.

### Page-based (table with "Page 1 of 5")

```ts
export function useLedgerPage({ limit = 20, offset = 0 }) {
  return useQuery({
    queryKey: walletKeys.ledgerPage({ limit, offset }),
    queryFn: () => getLedgerPage({ limit, offset }),
    placeholderData: (prev) => prev,    // keep last page visible while next loads
  });
}
```

### Infinite scroll (notifications, ledger feed)

```ts
export function useLedgerInfinite(limit = 20) {
  return useInfiniteQuery({
    queryKey: [...walletKeys.ledger(), "infinite", limit] as const,
    queryFn: ({ pageParam }) => getLedgerPage({ limit, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _all, lastParam) =>
      lastPage.length < limit ? undefined : lastParam + limit,
  });
}
```

Note: the infinite key is **distinct** from the page-based key.

---

## Forms with React Hook Form + Zod

One pattern for every form. Components don't validate — schemas do. Server errors map back to fields.

### Schema first

```ts
// utils/withdrawal.schema.ts
import { z } from "zod";

export const withdrawalSchema = z.object({
  amountNaira: z.number().positive().max(5_000_000),
  destinationBankCode: z.string().min(3),
  destinationAccountNumber: z.string().regex(/^\d{10}$/, "10 digits"),
  destinationAccountName: z.string().min(2),
  narration: z.string().max(80).optional(),
});

export type WithdrawalForm = z.infer<typeof withdrawalSchema>;
```

### Form component

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { withdrawalSchema, type WithdrawalForm } from "./utils/withdrawal.schema";
import { useCreateWithdrawal } from "./hooks/use-create-withdrawal";
import { nairaToKobo } from "@/app/lib/format/money";

export function WithdrawalForm() {
  const { register, handleSubmit, setError, formState } = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
  });
  const { mutate, isPending } = useCreateWithdrawal();

  const onSubmit = handleSubmit((data) =>
    mutate(
      { ...data, amountKobo: nairaToKobo(data.amountNaira) },
      {
        onError: (err) => {
          if (err instanceof ApiError && err.isValidation && err.details) {
            // Backend returns { field: string, message: string }[] — adapt to your shape
            for (const issue of err.details as { field: string; message: string }[]) {
              setError(issue.field as keyof WithdrawalForm, { message: issue.message });
            }
          }
        },
      },
    ),
  );

  return <form onSubmit={onSubmit}>{/* fields */}</form>;
}
```

Rules:

- Schema lives in `utils/`. Reuse it on the server (Nest pipes can also accept a Zod schema via `nestjs-zod`).
- Never re-declare validation logic in JSX. The schema is the only source of truth.
- Server errors map to fields. If the backend returns a generic message, surface it via toast — never a silent failure.

---

## Auth and session bootstrap

Better Auth issues a session cookie. The frontend never reads the token; it just sends `credentials: "include"` and asks `GET /auth/get-session` to know who's signed in.

### Session hook — use Better Auth's React client

Better Auth ships a React client; it already handles caching, revalidation, and tab sync. **Use it, do not roll your own.**

```ts
// lib/auth/client.ts
import { createAuthClient } from "better-auth/client/react";
import { API_BASE, API_PREFIX } from "../api/env";

export const authClient = createAuthClient({
  baseURL: `${API_BASE}${API_PREFIX}`,
});

export const { useSession, signIn, signOut } = authClient;
```

Components consume it directly:

```tsx
const { data, isPending } = useSession();
if (isPending) return null;
if (!data) return <RedirectToLogin />;
return <div>Hello, {data.user.name}</div>;
```

If a screen needs the session inside a React Query callback (e.g. for `enabled`), pull it through `useSession()` first and pass the value into the dependency.

### Route guards

```tsx
// lib/auth/guards.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./client";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !data) router.replace("/login");
  }, [data, isPending, router]);

  if (isPending || !data) return null;       // or a skeleton
  return <>{children}</>;
}

export function RequireRole({
  role,
  children,
}: {
  role: "admin" | "user";
  children: React.ReactNode;
}) {
  const { data } = useSession();
  if (!data || data.user.role !== role) return null;
  return <>{children}</>;
}
```

Wrap `(user)` and `(admin)` route groups in their respective layouts.

### Sign out

Use Better Auth's `signOut` directly, then clear the React Query cache.

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "@/app/lib/auth/client";

export function useSignOutFlow() {
  const qc = useQueryClient();
  const router = useRouter();
  return async () => {
    await signOut();
    qc.clear();
    router.replace("/login");
  };
}
```

### Global 401 handling

A 401 from any query means the cookie expired. Hook this once in the QueryProvider:

```ts
queryClient.getQueryCache().subscribe((event) => {
  if (
    event.type === "updated" &&
    event.action.type === "error" &&
    event.action.error instanceof ApiError &&
    event.action.error.status === 401
  ) {
    queryClient.clear();
    if (typeof window !== "undefined") window.location.assign("/login");
  }
});
```

Don't redirect from inside `apiClient`. The cache is the only place that knows whether a 401 is fatal vs expected (e.g. a probe).

---

## Permissions with CASL

CASL gives you both backend RBAC and a frontend `<Can>` component. We use it on the frontend only here.

### Define abilities once per session

```ts
// lib/permissions/ability.ts
import { AbilityBuilder, createMongoAbility, type MongoAbility } from "@casl/ability";

export type Actions = "manage" | "create" | "read" | "update" | "delete" | "approve" | "settle";
export type Subjects =
  | "Auction"
  | "Listing"
  | "AccessCode"
  | "Wallet"
  | "Withdrawal"
  | "User"
  | "Settings"
  | "all";

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export function buildAbilityFor(role: "admin" | "user"): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (role === "admin") {
    can("manage", "all");
  } else {
    can("read", "Auction");
    can("create", "Wallet");
    can("create", "Withdrawal");
  }
  return build();
}
```

### Provider

```tsx
// lib/permissions/provider.tsx
"use client";
import { createContext, useContext, useMemo } from "react";
import { useSession } from "../auth/session";
import { buildAbilityFor, type AppAbility } from "./ability";

const AbilityContext = createContext<AppAbility | null>(null);

export function AbilityProvider({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
  const ability = useMemo(() => buildAbilityFor(data?.user.role ?? "user"), [data?.user.role]);
  return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
}

export const useAbility = () => {
  const v = useContext(AbilityContext);
  if (!v) throw new Error("AbilityProvider missing");
  return v;
};
```

### Usage

```tsx
import { Can } from "@casl/react";
import { useAbility } from "@/app/lib/permissions/provider";

const ability = useAbility();
<Can I="approve" a="Listing" ability={ability}>
  <Button>Approve</Button>
</Can>
```

Components that gate on permission **never** check role strings directly. Always go through the ability.

---

## Real-time updates

Auctions are realtime. Bids land via Socket.IO. The frontend pattern:

1. One shared socket **per namespace** per session, lazily created on first use.
2. Each feature subscribes to its events and writes payloads into the React Query cache via `setQueryData`.
3. Components read from the cache — they don't see the socket.

### Wire conventions (must match backend)

The backend exposes two Socket.IO namespaces with cookie-based auth (Better Auth session is read from the handshake headers — no manual token plumbing on the client):

| Namespace | Server file | Joinable rooms | Events emitted |
|---|---|---|---|
| `/auctions` | `bids/bids.gateway.ts` | `auction:{id}` (join via `auction.join`), `user:{userId}` | `auction.ready`, `auction.joined`, `auction.left`, `auction.error`, `bid.placed`, `auction.topBidChanged`, `auction.statusChanged`, `auction.closed`, `bid.outbid` (user room only) |
| `/notifications` | `notifications/notifications.gateway.ts` | `user:{userId}`, `admin` | `notification.ready`, `notification.created`, `notification.error` |

Auth: cookie-based. Open the socket directly against the backend origin so the browser sends `better-auth.session_token` on the WS handshake.

### Why the socket bypasses the Next.js rewrite

The HTTP rewrite from [API proxy](#api-proxy-nextjs-bff-rewrite) is for short-lived JSON. WebSockets are long-lived and Next's rewrite layer buffers, breaks sticky sessions on multi-instance deploys, and silently drops the upgrade in some hosting setups. Connect the socket to the backend origin (or a dedicated `ws.` subdomain) using `NEXT_PUBLIC_WS_URL`. Keep CORS open for that origin in `BackendModule` (`cors: { origin: true, credentials: true }` is already set on both gateways).

### `lib/realtime/socket.ts`

One shared socket per namespace. Lazy + cached so multiple hooks share the connection.

```ts
"use client";
import { io, type Socket } from "socket.io-client";

const WS_URL =
  (typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_WS_URL ?? "")) ||
  "http://localhost:4000";

const sockets = new Map<string, Socket>();

function getSocket(namespace: string): Socket {
  if (typeof window === "undefined") {
    throw new Error("getSocket must be called in the browser");
  }
  const existing = sockets.get(namespace);
  if (existing) return existing;

  const socket = io(`${WS_URL}/${namespace}`, {
    withCredentials: true,         // Better Auth cookie on handshake
    transports: ["websocket"],
    autoConnect: false,            // hooks call .connect() when they need it
  });
  sockets.set(namespace, socket);
  return socket;
}

export const auctionsSocket = (): Socket => getSocket("auctions");
export const notificationsSocket = (): Socket => getSocket("notifications");
```

### Subscribe + cache write

```ts
// hooks/use-auction-bids-stream.ts
"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { auctionsSocket } from "@/app/lib/realtime/socket";
import { koboToNaira } from "@/app/lib/format/money";
import { auctionKeys } from "./auction-keys";
import type { Bid } from "../types/auction.types";

export function useAuctionBidsStream(auctionId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!auctionId) return;
    const socket = auctionsSocket();
    if (!socket.connected) socket.connect();
    socket.emit("auction.join", { auctionId });

    const onBidPlaced = (e: {
      bid: { id: string; bidderId: string; amountKobo: number; createdAt: string; status: Bid["status"] };
      isTopBid: boolean;
    }) => {
      const newBid: Bid = {
        id: e.bid.id,
        userId: e.bid.bidderId,
        handle: "@anonymous", // refetch reconciles with server-masked handle
        amount: koboToNaira(e.bid.amountKobo),
        placedAt: new Date(e.bid.createdAt),
        isLeading: e.isTopBid,
        status: e.bid.status,
      };
      qc.setQueryData<Bid[]>(auctionKeys.bids(auctionId), (prev) => {
        if (!prev) return [newBid];
        if (prev.some((b) => b.id === newBid.id)) return prev;
        const next = e.isTopBid
          ? prev.map((b) => ({ ...b, isLeading: false }))
          : prev;
        return [newBid, ...next];
      });
    };

    socket.on("bid.placed", onBidPlaced);

    return () => {
      socket.emit("auction.leave", { auctionId });
      socket.off("bid.placed", onBidPlaced);
    };
  }, [auctionId, qc]);
}
```

Use it once in the screen:

```tsx
useAuctionBidsStream(id);
const { data: bids } = useAuctionBids(id);
```

The component continues to read from `useAuctionBids`. The socket is just another writer to the same cache slot.

### Rules

- **Never** subscribe inside a component render — always inside `useEffect`. The hook owns the lifecycle.
- **No `refetchInterval` AND a stream on the same key.** Pick one. The stream is canonical; polling is the fallback.
- **Idempotent cache writes.** Server may resend an event on reconnect. Skip if the bid id is already in the list.
- **Leave the room on unmount.** Otherwise you accumulate listeners and the user keeps getting events for auctions they're not viewing.
- **Use the user room (`user:{id}`)** for personal events (`bid.outbid`, `notification.created`). The server joins it automatically on connection.

### Fallback (only if a backend gateway is missing)

If a particular event isn't on the gateway yet, `refetchInterval` is acceptable as a stopgap — but it must be marked `// TODO(realtime)` and replaced once the event lands. Don't ship polling on data that already has a socket event.

---

## File uploads

Two endpoints exist: `/uploads` and `/uploads/batch`. Use `FormData`. The `apiClient` already detects it.

### Upload hook

```ts
export function useUploadListingPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (files: File[]) => {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      fd.append("purpose", "LISTING_PHOTO");
      fd.append("category", "CAR");
      return apiClient<{ url: string; id: string }[]>("/uploads/batch", {
        method: "POST",
        body: fd,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: carKeys.mine() }),
  });
}
```

### Progress

If you need progress, swap `fetch` for `XMLHttpRequest` inside a single, well-named `apiUpload` helper colocated with the file upload feature. Don't pollute `apiClient` with progress callbacks.

### Optimistic preview

Before the upload resolves, render local previews via `URL.createObjectURL`. Replace the preview with the server URL in `onSuccess`.

---

## Error handling

Three layers, top to bottom:

1. **`ApiError` class** — every non-2xx becomes one. (Already covered.)
2. **Toasts** — user-facing, non-blocking. Mutations only.
3. **Error boundary** — for thrown render-time errors and queries that mark the whole feature as broken.

### Error boundary

Use `react-error-boundary` — it gives you `<ErrorBoundary>`, a `useErrorBoundary` hook, and `onReset` wiring out of the box. Don't hand-roll a class component.

```tsx
// lib/error/feature-boundary.tsx
"use client";
import { ErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";

export function FeatureBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: (err: Error, reset: () => void) => ReactNode;
}) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => fallback(error, resetErrorBoundary)}
      onError={(err) => {
        // Hook your error reporter here (Sentry, etc.)
        console.error("[feature-boundary]", err);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

Wrap each feature screen, not the whole app. A broken Wallet shouldn't take down the dashboard. Pair the boundary with React Query's `QueryErrorResetBoundary` if you want "Retry" to reset failed queries:

```tsx
import { QueryErrorResetBoundary } from "@tanstack/react-query";

<QueryErrorResetBoundary>
  {({ reset }) => (
    <FeatureBoundary
      fallback={(err, retry) => (
        <Failed message={err.message} onRetry={() => { reset(); retry(); }} />
      )}
    >
      <WalletScreen />
    </FeatureBoundary>
  )}
</QueryErrorResetBoundary>
```

### What to display

- **Validation (400/422):** field-level error from the form, no toast.
- **Auth (401):** redirect to login (handled globally).
- **Forbidden (403):** "You don't have access to this." Stay on page.
- **Not found (404):** show empty state, not an error.
- **Server (5xx):** "Something went wrong. We're looking into it." + a retry button. Log the error.
- **Network:** same as 5xx.

---

## Loading, empty, and error states

Every screen has all three. Pick from a small set of components in `components/ui/states/`:

- `<Skeleton>` — inline placeholder, animated.
- `<Empty title sub icon />` — empty state with action.
- `<Failed onRetry />` — error state with retry.

Pattern:

```tsx
const { data, isLoading, isError, refetch } = useWallet();

if (isLoading) return <WalletSkeleton />;
if (isError) return <Failed onRetry={refetch} />;
if (!data) return <Empty title="No wallet yet" />;
return <BalanceCard wallet={data} />;
```

Skeletons should match the layout they replace, not be generic gray boxes.

---

## Server vs client components

Next 16 defaults to Server Components. Decision tree:

- **Server component** when: the screen has no interactivity, the data fetch can be done at request time, the page is the entry point.
- **Client component (`"use client"`)** when: the screen owns interactive state, uses hooks, subscribes to a socket, or uses React Query directly.

Pattern: a server `page.tsx` does `prefetchQuery` + `dehydrate`, then renders a client `<XScreen>` that owns interactivity. (See [Suspense queries](#query-hooks).)

Don't ship `"use client"` on the page itself unless you need to. Push the boundary as deep as possible.

---

## Testing

| Layer | Tool | Mocks |
|---|---|---|
| API functions | Vitest | MSW — request/response shape |
| Hooks | Vitest + `@testing-library/react` | wrap with `QueryClientProvider`; mock the API function |
| Components | Vitest + RTL | mock the hook |
| Forms | RTL + user-event | run the schema with valid/invalid input |

### MSW handlers

Colocate handlers with the feature, not in a global `mocks/` folder.

```ts
// __tests__/wallet.handlers.ts
import { http, HttpResponse } from "msw";
import { apiUrl } from "@/app/lib/api/env";

export const walletHandlers = [
  http.get(apiUrl("/wallets/me"), () =>
    HttpResponse.json({ balanceKobo: 184_200_000, pendingHoldKobo: 0, currency: "NGN", updatedAt: new Date().toISOString() }),
  ),
];
```

### Custom RTL render

```tsx
// lib/testing/render.tsx
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}
```

---

## Definition of done per endpoint

Before you mark an endpoint "integrated", confirm all of these:

- [ ] `<feature>.types.ts` has `*Dto` types matching the OpenAPI schema.
- [ ] `<feature>.types.ts` has view-model types and a `to<View>(dto)` mapper.
- [ ] `<feature>.api.ts` has a thin function that calls `apiClient` and returns the view model.
- [ ] `<feature>-keys.ts` has the key factory entry.
- [ ] `use-<thing>.ts` hook is in `hooks/` and exports a typed React Query hook.
- [ ] If it's a mutation: invalidates the right keys, has rollback if the UI is optimistic, surfaces server errors to the form/toast.
- [ ] Money is in kobo on the wire and naira in the view model.
- [ ] Loading, empty, and error states render correctly (test all three by toggling MSW).
- [ ] Component does not import `apiClient` or `fetch`.
- [ ] No `any` in the new code.
- [ ] Zod schema for forms uses the same field names as the DTO.
- [ ] If the endpoint is paginated, the key includes the page params.
- [ ] If the endpoint is realtime, a stream hook updates the cache via `setQueryData`.

If you're missing more than two boxes, the integration isn't done.

---

## End-to-end example: Wallet

Full vertical slice, from wire to screen. Use this as the reference when wiring any new feature.

### 1. Types — `app/components/wallet/types/wallet.types.ts`

```ts
export type WalletDto = {
  balanceKobo: number;
  pendingHoldKobo: number;
  currency: "NGN";
  updatedAt: string;
};

export type LedgerEntryDto = {
  id: string;
  occurredAt: string;
  description: string;
  reference: string | null;
  amountKobo: number;
  direction: "DEBIT" | "CREDIT";
};

export type Wallet = {
  balance: number;
  hold: number;
  updatedAt: Date;
};

export type LedgerEntry = {
  id: string;
  occurredAt: Date;
  description: string;
  reference: string | null;
  amount: number;
  direction: "debit" | "credit";
};
```

### 2. API — `app/components/wallet/api/wallet.api.ts`

```ts
import { apiClient } from "@/app/lib/api/client";
import { koboToNaira, nairaToKobo } from "@/app/lib/format/money";
import type {
  LedgerEntry,
  LedgerEntryDto,
  Wallet,
  WalletDto,
} from "../types/wallet.types";

const toWallet = (dto: WalletDto): Wallet => ({
  balance: koboToNaira(dto.balanceKobo),
  hold: koboToNaira(dto.pendingHoldKobo),
  updatedAt: new Date(dto.updatedAt),
});

const toLedgerEntry = (dto: LedgerEntryDto): LedgerEntry => ({
  id: dto.id,
  occurredAt: new Date(dto.occurredAt),
  description: dto.description,
  reference: dto.reference,
  amount: koboToNaira(dto.amountKobo),
  direction: dto.direction === "DEBIT" ? "debit" : "credit",
});

export const getWallet = async (): Promise<Wallet> => {
  const dto = await apiClient<WalletDto>("/wallets/me");
  return toWallet(dto);
};

export const getLedger = async (params: {
  limit: number;
  offset: number;
}): Promise<LedgerEntry[]> => {
  const dtos = await apiClient<LedgerEntryDto[]>("/wallets/me/ledger", { query: params });
  return dtos.map(toLedgerEntry);
};

export const createWithdrawal = (input: {
  amountNaira: number;
  destinationBankCode: string;
  destinationBankName: string;
  destinationAccountNumber: string;
  destinationAccountName: string;
  narration?: string;
}) =>
  apiClient<{ id: string; status: "PENDING" }>("/wallets/withdrawals", {
    method: "POST",
    body: { ...input, amountKobo: nairaToKobo(input.amountNaira) },
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
```

### 3. Keys — `app/components/wallet/hooks/wallet-keys.ts`

```ts
export const walletKeys = {
  all: ["wallets"] as const,
  me: () => [...walletKeys.all, "me"] as const,
  ledger: () => [...walletKeys.all, "ledger"] as const,
  ledgerPage: (p: { limit: number; offset: number }) =>
    [...walletKeys.ledger(), p] as const,
};
```

### 4. Hooks — `app/components/wallet/hooks/use-wallet.ts`

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWithdrawal, getLedger, getWallet } from "../api/wallet.api";
import { walletKeys } from "./wallet-keys";

export function useWallet() {
  return useQuery({ queryKey: walletKeys.me(), queryFn: getWallet });
}

export function useLedger(params = { limit: 20, offset: 0 }) {
  return useQuery({
    queryKey: walletKeys.ledgerPage(params),
    queryFn: () => getLedger(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWithdrawal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.me() });
      qc.invalidateQueries({ queryKey: walletKeys.ledger() });
    },
  });
}
```

### 5. Schema — `app/components/wallet/utils/withdrawal.schema.ts`

```ts
import { z } from "zod";

export const withdrawalSchema = z.object({
  amountNaira: z.number().positive().max(5_000_000),
  destinationBankCode: z.string().min(3),
  destinationBankName: z.string().min(2),
  destinationAccountNumber: z.string().regex(/^\d{10}$/, "Must be 10 digits"),
  destinationAccountName: z.string().min(2),
  narration: z.string().max(80).optional(),
});

export type WithdrawalForm = z.infer<typeof withdrawalSchema>;
```

### 6. Screen — `app/components/wallet/WalletScreen.tsx`

```tsx
"use client";
import { useWallet, useLedger } from "./hooks/use-wallet";
import { BalanceCard } from "./widgets/BalanceCard";
import { LedgerTable } from "./widgets/LedgerTable";
import { Failed } from "@/app/components/ui/states/Failed";
import { WalletSkeleton } from "./widgets/WalletSkeleton";

export function WalletScreen() {
  const wallet = useWallet();
  const ledger = useLedger();

  if (wallet.isLoading) return <WalletSkeleton />;
  if (wallet.isError) return <Failed onRetry={wallet.refetch} />;
  if (!wallet.data) return null;

  return (
    <>
      <BalanceCard wallet={wallet.data} />
      <LedgerTable
        entries={ledger.data ?? []}
        loading={ledger.isFetching}
      />
    </>
  );
}
```

That's the full slice. **Components have no idea where data comes from.**

---

## Migrating simulated screens to live data

The current frontend renders dummy data inline. Plan to switch each screen over one at a time:

1. Pick a feature.
2. Add `types/`, `api/`, `hooks/` files per the folder layout.
3. Replace the inline dummy data in the screen with the new hook (`useWallet()`, `useNotifications()`, etc.).
4. Verify against the running backend (loading, success, error, empty states).
5. Delete the inline dummy data.
6. Move on to the next feature.

Don't try to migrate everything at once. One slice at a time keeps the UI runnable end-to-end while the work is in flight.

The order to migrate (lowest risk → highest):

1. Better Auth client + `useSession()` + route guards. Everything else depends on this.
2. Read-only feature: notifications list. Easy invalidations.
3. Read-only feature: wallet + ledger. Money handling on a single screen.
4. Mutations: mark notification read. Optimistic update warm-up.
5. Mutations: create withdrawal. Idempotency + form errors.
6. Auctions list and detail.
7. Place bid (mutation + realtime).
8. Admin queues (listings, access codes, mechanics).
9. Settings (form + PATCH).
10. Uploads (multipart).

---

## Backend integration: ports and adapters

The backend uses ports + adapters for **external providers only**. Services depend on the port; an adapter binds the port to a provider.

### Direction

```
BusinessService → PortInterface → ProviderAdapter → ProviderClient
```

Example:

```
WalletFundingService → WalletFundingPort → MonnifyWalletAdapter → MonnifyClient
```

### Folder layout

```
backend/src/modules/integrations/
  monnify/
    monnify.client.ts                    # HTTP, auth, retries, timeouts
    monnify.types.ts
    monnify-wallet.adapter.ts            # implements WalletFundingPort
    monnify-transfer.adapter.ts          # implements BankTransferPort
  identity/
    nimc.client.ts
    nimc-identity.adapter.ts             # implements IdentityVerificationPort
  whatsapp/
    whatsapp.client.ts
    whatsapp.adapter.ts                  # implements MessagingPort

backend/src/modules/wallets/
  ports/
    wallet-funding.port.ts
    bank-transfer.port.ts
  wallet-funding.service.ts
  wallet-withdrawals.service.ts
```

### Roles

- **Client** — HTTP details only. Base URL, auth, timeouts, retries, error mapping.
- **Adapter** — translates provider responses into our shape. Returns app types, throws app errors.
- **Port** — the interface our service consumes. Lives in the consumer module.

### Rules

1. Business services do not import provider clients.
2. Adapters normalize provider responses; never leak raw shapes.
3. Adapters convert provider errors into app-level errors (`ProviderUnavailable`, `InvalidCredentials`, `ProviderRejected`, etc.).
4. Provider env vars are validated in `@nestjs/config` schemas at boot. Fail fast if missing.
5. Webhooks use the inbox pattern (next section).
6. Tests for services mock ports. Tests for adapters mock the HTTP client.
7. The provider name lives in **two places**: the adapter and DI binding. Nowhere else.

### Webhook inbox pattern

```
1. Receive webhook
2. Verify signature
3. Insert into webhook_events table (provider, eventId UNIQUE)
   — if duplicate, return 200 immediately
4. Normalize event
5. Run business action inside a transaction
6. Mark event processed = true
```

This makes processing idempotent and lets you replay events safely.

### Provider binding

Bind the port to an adapter in the module:

```ts
@Module({
  providers: [
    WalletFundingService,
    { provide: WalletFundingPort, useClass: MonnifyWalletAdapter },
  ],
})
export class WalletsModule {}
```

To swap providers later, change the `useClass` line. Service code is untouched.

---

## Anti-patterns

These are the patterns that look fine in a single file and become unbearable in a quarter.

### 1. Calling `fetch` from a component

```tsx
// ❌
const [wallet, setWallet] = useState(null);
useEffect(() => {
  fetch("/api/v1/wallets/me", { credentials: "include" })
    .then((r) => r.json())
    .then(setWallet);
}, []);
```

Instead: `useWallet()`. The reasons are loading state, error state, retries, dedup, cache, invalidation, refetch on focus, devtools — everything you'd otherwise reinvent badly.

### 2. Putting server state in Context

```tsx
// ❌
const WalletContext = createContext<Wallet | null>(null);
```

Server state is React Query's job. Context for server data leads to "why is the wallet stale on this page?" bugs forever.

### 3. Stringly-typed query keys

```ts
// ❌
useQuery({ queryKey: ["wallet"], ... })
useQuery({ queryKey: ["wallet"], ... })   // somewhere else, with different params
```

Use the factory. Always.

### 4. Money math in components

```tsx
// ❌
<div>{(wallet.balanceKobo / 100).toLocaleString("en-NG")}</div>
```

The component shouldn't know what kobo is. Use `formatNGN(kobo)` from `lib/format/money.ts`.

### 5. Optimistic update without rollback

```ts
// ❌
onMutate: () => qc.setQueryData(...)
// ...no onError, no rollback
```

When the request fails, the user sees the success state forever. Always pair `onMutate` with `onError` + restore.

### 6. Redirect from inside the HTTP client

```ts
// ❌
if (res.status === 401) window.location.assign("/login");
```

The cache might be probing — a session check that returns 401 is normal. Handle 401 in one place: the global cache subscriber.

### 7. Role-string checks scattered in JSX

```tsx
// ❌
{user.role === "admin" && <ApproveButton />}
```

Use CASL. Tomorrow you'll have moderators, mechanics, dealers — and you don't want to grep for role strings.

### 8. One giant `types.ts` per feature with both DTOs and domain types blurred

Keep `*Dto` and view types side by side, but **named clearly**. The mapper makes the boundary explicit.

### 9. "Temporary" `any`

There are no temporary `any`s. They're permanent. Use `unknown` and narrow.

### 10. Manual URL string concatenation

```ts
// ❌
fetch(`${API_BASE}/api/v1/auctions?status=${status}&limit=${limit}`)
```

Use `apiClient(path, { query })`. Never compose URLs by hand.

---

## PR review checklist

Reviewers should reject any PR that misses these.

**Architecture**
- [ ] No new `fetch` calls outside `lib/api/client.ts`.
- [ ] No new context for server state.
- [ ] No money math in components or hooks (only in `lib/format/money.ts` and mappers).
- [ ] DTOs and view models are both defined; mapper exists.
- [ ] Query key factory updated; no inline string-array keys.
- [ ] Mutations invalidate the smallest correct scope.
- [ ] If optimistic, rollback is wired.

**Quality**
- [ ] No `any`. No `@ts-ignore` without a comment naming the issue.
- [ ] Loading, error, empty states all render. Tested by toggling MSW.
- [ ] Form uses RHF + Zod resolver, not ad-hoc state.
- [ ] Component file is under 500 lines (project rule). Split by widget.
- [ ] No `console.log` left behind.

**Behavior**
- [ ] On 401, the user is redirected to `/login` once (not in a loop).
- [ ] Server errors are user-readable (not "ApiError: 500").
- [ ] Disabled state on submit while pending.
- [ ] Idempotency key on payment-like mutations.

**Tests**
- [ ] At least one happy-path test for the new hook or screen.
- [ ] If a mutation, an error-path test that asserts rollback.

---

## References

- TanStack Query docs — query keys are arrays, include all variables the queryFn uses.
- TkDodo, "Effective React Query Keys" — colocate keys, export custom hooks, factory shape.
- TkDodo, "Status Checks in React Query" — `isLoading`, `isFetching`, `data`, `isPlaceholderData` are not the same thing. Use them deliberately.
- "You Might Not Need Redux" / Zustand docs — keep client UI state small and local.
- Better Auth docs — session cookie name, `getSession`, `signOut`, plugin endpoints.
- React Hook Form + Zod resolver guide — schema as the source of truth, `setError` to map server-side validation back to fields.
- Next.js App Router metadata and file conventions docs in `node_modules/next/dist/docs/` — read before touching new APIs.

---

If a pattern here conflicts with something a teammate did before this document landed, **this document wins for new code**. Refactor the older code opportunistically, not in a single sweep.
