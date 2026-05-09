#!/usr/bin/env bash
# Quick smoke-tests against the running gateway.
set -e
BASE="${BASE:-http://localhost:5000}"

echo "→ Register"
curl -s -X POST $BASE/api/identity/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@bite.com","username":"smoke","password":"Password123!","fullName":"Smoke Test"}' \
  | jq

echo "→ Login (auto-detect: username)"
TOKEN=$(curl -s -X POST $BASE/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"smoke","password":"Password123!"}' \
  | jq -r '.accessToken')
echo "  token=${TOKEN:0:30}…"

echo "→ Get profile"
curl -s $BASE/api/identity/profile -H "Authorization: Bearer $TOKEN" | jq

echo "→ Public menu"
curl -s "$BASE/api/menu?restaurantId=00000000-0000-0000-0000-000000000001" | jq '.[0:2]'

echo "→ Reservation availability"
curl -s "$BASE/api/reservations/availability?restaurantId=00000000-0000-0000-0000-000000000001&date=2026-02-15&partySize=2" \
  -H "Authorization: Bearer $TOKEN" | jq '.[0]'

echo "→ Place order"
curl -s -X POST $BASE/api/orders \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"restaurantId":"00000000-0000-0000-0000-000000000001","type":"DineIn","items":[]}' | jq

echo "→ Notifications"
curl -s $BASE/api/notify -H "Authorization: Bearer $TOKEN" | jq

echo "Done."
