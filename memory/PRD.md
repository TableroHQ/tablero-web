# Bite — Restaurant Operating System · PRD

## Original Problem Statement
User shared a complete C4 architecture (L1-L4) + API reference (~85 endpoints) + RabbitMQ event catalog + database design (7 PostgreSQL DBs) for **Bite — Restaurant Operating System**. Asked to build the full React SPA frontend (mock data, no backend) and then the **C# ASP.NET microservices backend** as ready-to-paste files.

## Codebase Layout

```
/app/
├── frontend/              # React 19 SPA — 27 pages, role-based dashboards (✅ shipped)
├── bite-backend/          # .NET 9 microservices — 7 services + gateway (✅ shipped)
└── memory/                # PRD, test creds
```

---

## Frontend (`/app/frontend`)

15-page consumer SPA + 12 operational dashboards. All mocked, all interactive.
See earlier sections of this PRD or just open the app.

---

## Backend (`/app/bite-backend`)

**Status:** Full reference scaffold — 105 source files, 7 services, 1 gateway, 1 shared lib.

### Architecture
- ASP.NET Core 9 (preview/stable) per service, isolated `Program.cs`
- PostgreSQL 16 (database-per-service, 7 dbs)
- RabbitMQ + MassTransit Transactional Outbox + Idempotent Inbox
- Redis (slot locking, accept locking, SignalR backplane)
- SignalR hubs: KitchenHub, WaiterHub, TableHub, CashierHub, CourierHub, NotifyHub
- YARP gateway with central JWT validation + identity-header forwarding
- Consul service discovery + health checks
- OpenTelemetry → Tempo (traces), Serilog JSON → Loki (logs), Grafana dashboards
- Docker Compose for whole stack (`docker compose up -d`)

### Services + endpoints

| Service              | DB             | Port  | Endpoints (sample)                                                  |
|----------------------|----------------|-------|---------------------------------------------------------------------|
| **Identity**         | identity_db    | 5001  | register, login (auto-detect email/username), refresh (rotation), forgot-password OTP, reset-password, profile CRUD, users CRUD |
| **Restaurant**       | restaurant_db  | 5002  | restaurant CRUD, photos CRUD, public menu (cached), QR PNG generator, rating snapshots, consumes ReviewSubmitted + MenuItemUnavailable |
| **Reservation**      | reservation_db | 5003  | tables CRUD, availability search, create/cancel/seat/complete/no-show, Redis-locked slot booking, Quartz reminder job (24h before) |
| **Order & Kitchen**  | order_db       | 5004  | menu CRUD + 86 toggle, order placement with auto-pricing, KDS tickets, item-level status updates (Q→P→R→S), call-waiter, 3 SignalR hubs |
| **Payment & Loyalty**| payment_db     | 5005  | invoices, Stripe Checkout, balance topup, cash/card/balance/split, refunds with reason, loyalty config, bonus catalogue, redeem, Stripe webhook |
| **Delivery**         | delivery_db    | 5006  | available broadcasts, accept (Redis lock), GPS checkpoints, mark delivered, customer confirms receipt, courier ratings, online/offline toggle |
| **Notification**     | notify_db      | 5007  | inbox + filter + read, preferences (email/SMS/push/marketing), reviews submit/moderate/publish, promotion blasts, 8 event consumers (1 per important event) |

### Cross-cutting

- **`BuildingBlocks`** shared library:
  - `OutboxEvent`, `ProcessedMessage`, `IdempotentConsumer<T>`, `OutboxWriter<T>`, `OutboxModelBuilderExtensions`
  - `ICurrentUser` reads `X-User-Id`, `X-User-Role`, etc. (set by gateway)
  - `JwtExtensions`, `MassTransitExtensions`, `TelemetryExtensions`, `ConsulExtensions`
  - `Bite.BuildingBlocks.Contracts.Events` — 28 event records, single source of truth
  - `CorrelationIdMiddleware` — every request gets `X-Correlation-Id`

### Docs delivered
- `README.md` — architecture overview + getting started
- `docs/EVENTS.md` — full producer/consumer matrix
- `docs/DEVELOPMENT.md` — day-zero setup, migrations, debugging tips
- `docs/FRONTEND_INTEGRATION.md` — drop-in `lib/api.js` replacement + SignalR setup

### How to run (on user's local machine — not in this pod)
```bash
cd bite-backend
cp .env.example .env
./scripts/dev-up.sh        # boots everything via docker compose
./scripts/smoke.sh          # hits register/login/menu/order to verify
```

### Test credentials seeded
| Email                 | Username  | Password       | Role     |
|-----------------------|-----------|----------------|----------|
| admin@bite.com        | admin     | Password123!   | Admin    |
| director@bite.com     | director  | Password123!   | Director |
| chef@bite.com         | chef      | Password123!   | Chef     |
| waiter@bite.com       | waiter    | Password123!   | Waiter   |
| cashier@bite.com      | cashier   | Password123!   | Cashier  |
| courier@bite.com      | courier   | Password123!   | Courier  |
| sofia@bite.com        | sofia     | Password123!   | User     |

---

## Future / Backlog
- P1: EF Core migrations committed to repo (currently auto-created on first run)
- P1: Per-service xUnit test projects with Testcontainers
- P1: GitHub Actions CI (build → test → docker push)
- P2: Kubernetes manifests + Helm charts (`docs/DEPLOYMENT.md` planned)
- P2: Real Stripe webhook + 3DS confirmation flow
- P2: Promtail config for log shipping (currently logs only via Docker)
- P3: API integration tests at the gateway level
