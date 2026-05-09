# Bite Backend — Restaurant Operating System

7 ASP.NET Core 9 microservices, database-per-service (PostgreSQL 16), event-driven via RabbitMQ + MassTransit Transactional Outbox, real-time via SignalR, JWT validation centralized at YARP gateway.

## Solution structure

```
bite-backend/
├── docker-compose.yml          # full local stack
├── Bite.sln                    # solution file
├── Directory.Build.props       # shared MSBuild settings
├── Directory.Packages.props    # central package management
├── src/
│   ├── BuildingBlocks/         # shared lib: outbox, idempotency, headers, telemetry
│   ├── Gateway/                # YARP reverse proxy (port 5000)
│   ├── Identity/               # auth, JWT, users (port 5001)
│   ├── Restaurant/             # info, menu cache, QR, ratings (port 5002)
│   ├── Reservation/            # tables, slots, bookings, pre-orders (port 5003)
│   ├── OrderKitchen/           # menu, orders, KDS, SignalR (port 5004)
│   ├── Payment/                # invoices, Stripe, cashier, loyalty (port 5005)
│   ├── Delivery/               # courier, GPS, ratings (port 5006)
│   └── Notification/           # email/sms/push, reviews (port 5007)
└── docs/                       # ADRs and protocol docs
```

## Quick start

### 1. Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- Docker + Docker Compose
- (Optional) Visual Studio 2022 17.8+ or JetBrains Rider 2024.2+

### 2. Bring up the stack

```bash
cd bite-backend
docker compose up -d postgres rabbitmq redis consul tempo loki grafana
```

This starts the **infrastructure only**. Wait ~15 seconds for everything to be healthy.

### 3. Run all services

```bash
dotnet build
docker compose up -d
```

The gateway is now at **http://localhost:5000**. Each service is also reachable directly on its port for debugging.

### 4. First-time DB setup

Migrations are EF Core code-first. Each service auto-migrates on startup if `ApplyMigrationsOnStartup=true` (set in Development by default). To create migrations manually:

```bash
cd src/Identity/Bite.Identity.Api
dotnet ef migrations add InitialCreate -o Infrastructure/Migrations
```

## API surface

All ~85 endpoints sit behind the YARP gateway on port 5000:

| Service              | Public route prefix    | Direct port |
|----------------------|------------------------|-------------|
| Identity             | `/api/identity/*`      | 5001        |
| Restaurant           | `/api/restaurant/*`    | 5002        |
| Reservation          | `/api/reservations/*`  | 5003        |
| Order & Kitchen      | `/api/orders/*`        | 5004        |
| Payment & Loyalty    | `/api/payments/*`      | 5005        |
| Delivery             | `/api/delivery/*`      | 5006        |
| Notification & Review| `/api/notify/*`        | 5007        |

## Authentication

- Register and login at `/api/identity/auth/register` and `/api/identity/auth/login`
- Login auto-detects email vs username by presence of `@`
- JWT (15 min) + refresh token (7 d) returned. Refresh rotates on use.
- Gateway validates JWT and forwards `X-User-Id`, `X-User-Role`, `X-User-Email`, `X-Restaurant-Id` headers downstream. **Downstream services never parse JWTs** — they read these headers via `BuildingBlocks/Identity/CurrentUser`.

## Eventing (RabbitMQ + MassTransit)

- All cross-service events flow through the **Transactional Outbox** pattern. Business data + outbox row are written in the same EF Core transaction. A background `MassTransit` outbox publisher reads pending rows and publishes to RabbitMQ.
- All consumers are **idempotent**: each consumed `messageId` is recorded in `processed_messages` (handled by `IdempotentConsumer<T>` base in BuildingBlocks).
- Failed messages retry 3 times (1s → 2s → 4s) then move to `{event-name}.dlq`.

Event catalog and consumer queues are described in `docs/EVENTS.md`.

## Real-time (SignalR)

| Hub          | Service       | Group pattern              |
|--------------|---------------|----------------------------|
| KitchenHub   | OrderKitchen  | `kitchen:{restaurantId}`   |
| WaiterHub    | OrderKitchen  | `waiter:{waiterId}`        |
| TableHub     | OrderKitchen  | `table:{tableId}`          |
| CourierHub   | Delivery      | `couriers:{restaurantId}`  |
| NotifyHub    | Notification  | `user:{userId}`            |
| CashierHub   | Payment       | `cashier:{restaurantId}`   |

Hubs are exposed at `/hubs/{hubName}` on each service. The gateway also proxies the WebSocket upgrade.

## Observability

- **Tracing**: OpenTelemetry → Grafana Tempo (port 3200, OTLP gRPC at 4317)
- **Logs**: Serilog JSON → stdout → Promtail → Grafana Loki (3100)
- **Dashboards**: Grafana on http://localhost:3000 (admin/admin)

## External integrations (set in `.env`)

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=+1...
```

`.env` is consumed by `docker-compose.yml`.

## Conventions

- All HTTP responses return Pydantic-style problem details on error (RFC 7807).
- All UUIDs are `Guid` in C#, `uuid` in PostgreSQL.
- All timestamps are `DateTime` with `Utc` kind, stored as `timestamptz`.
- Soft deletes use a `DeletedAt` shadow property + a global EF Core query filter.
- All controllers use `[ApiController]` + `[Authorize]` by default. Public endpoints opt-in with `[AllowAnonymous]`.

## Next steps

- See `docs/DEVELOPMENT.md` for day-to-day workflows
- See `docs/EVENTS.md` for the full event catalog
- See `docs/DEPLOYMENT.md` for k8s manifests (TODO)
