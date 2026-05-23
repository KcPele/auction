FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --ignore-scripts skips ALL post-install scripts, bypassing ERR_PNPM_IGNORED_BUILDS.
# We then explicitly rebuild the two packages that need native compilation.
RUN pnpm install --frozen-lockfile --ignore-scripts && \
    pnpm rebuild sharp unrs-resolver

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# API_ORIGIN is read by next.config.ts at build time to configure the /api/v1/*
# rewrite proxy destination. Pass via --build-arg or the platform's build-time
# variables (e.g. Coolify "Build-time Variables" section).
ARG API_ORIGIN=http://localhost:4000
ENV API_ORIGIN=${API_ORIGIN}
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
