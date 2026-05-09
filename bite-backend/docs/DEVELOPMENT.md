# Development Workflow

## Day-zero setup

```bash
# clone the repo, then:
cd bite-backend
cp .env.example .env       # fill in Stripe / SendGrid / Twilio if you have them
docker compose up -d postgres rabbitmq redis consul tempo loki grafana
sleep 10                   # wait for services to be healthy

dotnet restore
dotnet build
docker compose up -d       # boots all 7 services + gateway
```

Visit:
- Gateway:        http://localhost:5000
- RabbitMQ admin: http://localhost:15672 (bite/bite)
- Consul UI:      http://localhost:8500
- Grafana:        http://localhost:3000
- Tempo:          http://localhost:3200

## Working on a single service

```bash
# stop just that service in compose so the local one wins:
docker compose stop identity

cd src/Identity/Bite.Identity.Api
dotnet watch run
# now your local port 5001 takes over
```

The gateway routes by service name via the `Cluster.Destinations` config, so when you bring the local service back up on `http://localhost:5001`, it just works (you can override the address in the gateway's appsettings if needed).

## Migrations

EF Core code-first. To create a new migration after changing entities:

```bash
cd src/Identity/Bite.Identity.Api
dotnet ef migrations add YourChangeName -o Infrastructure/Migrations
dotnet ef database update    # or rely on auto-migration on startup
```

Auto-migration runs in **Development** only (`ApplyMigrationsOnStartup=true`).

## Adding a new event

1. Add the record to `BuildingBlocks/Contracts/Events.cs`.
2. Producer: `await _bus.Publish(new MyEvent(...), ct);` inside a transaction (the outbox handles delivery).
3. Consumer: add a class extending `IdempotentConsumer<MyEvent, YourDbContext>` and register in `Program.cs`:
   ```csharp
   x.AddConsumer<MyEventConsumer>();
   ```

## Adding a new endpoint

Vertical slice — keep DTOs, validator, controller, service all under `Features/<FeatureName>/`.

## Tests

(Test project skeleton TODO — recommended: xUnit + Testcontainers for Postgres + Respawn between tests.)

## Logs / Traces

Every service writes structured JSON logs to stdout — Docker Compose ships them to Loki via Promtail (you'd add a Promtail config; not included here for simplicity).

OpenTelemetry traces ship to Tempo on OTLP gRPC port 4317. Open Grafana → Explore → Tempo, search by service name and you'll see the full distributed trace including MassTransit publishes and consumes.

## Common gotchas

- **MassTransit endpoint names** — by default MassTransit derives queue names from the consumer class name (kebab-cased). Override with `[EntityName]` if you need a stable name across renames.
- **Outbox not publishing** — make sure your `SaveChangesAsync` happens *after* the `Publish` call. The publish stages the message in the outbox; SaveChanges commits it; the background process then sends to RabbitMQ.
- **SignalR + multiple replicas** — already handled with the Redis backplane in OrderKitchen, Payment, Delivery, Notification services.
- **Time zones** — always store UTC. Convert to `Restaurant.Timezone` only at read time.
