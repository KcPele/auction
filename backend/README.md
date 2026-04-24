# Auction Backend

NestJS backend for the cars and gadgets auction platform.

## Stack

- NestJS with Fastify
- PostgreSQL with TypeORM
- Redis and BullMQ
- Socket.IO
- OPay, Openinary, and WhatsApp integrations

## Local Setup

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm run start:dev
```

The API starts on `http://localhost:4000/api/v1` by default.
Swagger docs are available at `http://localhost:4000/docs`.
