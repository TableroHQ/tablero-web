#!/usr/bin/env bash
# Convenience: builds + boots the whole stack.
set -e
cd "$(dirname "$0")/.."

echo "→ Restoring NuGet packages…"
dotnet restore

echo "→ Building solution…"
dotnet build --no-restore

echo "→ Bringing up infrastructure…"
docker compose up -d postgres rabbitmq redis consul tempo loki grafana
echo "   waiting for postgres…"
until docker exec bite-postgres pg_isready -U bite >/dev/null 2>&1; do sleep 1; done
echo "   ready."

echo "→ Bringing up application services…"
docker compose up -d gateway identity restaurant reservation orderkitchen payment delivery notification

echo
echo "════════════════════════════════════════════════════"
echo "  Bite is up. Gateway: http://localhost:5000"
echo "  RabbitMQ:  http://localhost:15672 (bite / bite)"
echo "  Consul:    http://localhost:8500"
echo "  Grafana:   http://localhost:3000"
echo "════════════════════════════════════════════════════"
