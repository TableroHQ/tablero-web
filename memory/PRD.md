# Bite — Restaurant Operating System · PRD

## Original Problem Statement
User shared a comprehensive C4 architecture (4 levels) for "Bite — Restaurant Operating System" — a microservices platform connecting guests, customers, waiters, chefs, cashiers, couriers and admin/director. They asked for "simple frontend design pages" based on this C4 diagram.

## User Choices Confirmed
- **Scope**: Maximum (~12-15 pages), including all role dashboards
- **Tech**: React SPA (mock data only, no backend)
- **Style**: Modern restaurant aesthetic (warm tones, food photography)
- **Backend / integrations**: NOT NEEDED

## Architecture (frontend only)
- React 19 + React Router 7 + Tailwind CSS + Recharts
- Mock data lives in `/app/frontend/src/lib/mock.js`
- Two layout modes:
  - **Consumer pages** (`Layout.jsx`): glass-morphism sticky nav, footer, Tetris grids
  - **Operational dashboards** (`OpsLayout.jsx`): left sidebar nav, optional dark mode for KDS

## Design System
- Palette: Cream `#FAFAF8` base, Terracotta `#C8553D` primary, Amber `#E4883A` secondary, Ink `#2C221E`
- Fonts: Playfair Display (display headings), Outfit (functional UI), Figtree (body), JetBrains Mono (numbers/eyebrow labels)
- Border radius: rounded-3xl on consumer, rounded-lg on ops dashboards
- All interactive elements have `data-testid`

## What's Implemented (2026-01)
### Consumer pages (8)
- `/` — Landing (hero, Tetris menu peek, why-bite, dark reviews band, find-us)
- `/menu` — Menu with category sticky filter, search, allergen chips, 86'd state
- `/login` — Auth (split screen, single-field email/username auto-detect, OTP hint)
- `/dashboard` — Customer dashboard (loyalty, balance, reservations, orders, live updates panel)
- `/reservations` — Booking (date strip, time chips, party stepper, zone + visual table grid)
- `/checkout` — Cart + delivery/dine-in toggle + payment options + loyalty redeem
- `/loyalty` — Bonus catalogue (locked items, progress to gold tier)
- `/reviews` — Submit review (chef/waiter/cleanliness/service stars) + recent reviews

### Operational dashboards (5)
- `/kds` — Chef Kitchen Display (dark mode, live timers, item status Q→P→R, call-waiter, printer)
- `/waiter` — Service floor (color-coded table grid, alerts, today stats, pickup ready card)
- `/pos` — Cashier POS (floor grid, bill detail, cash tendered + change, card/split/release)
- `/courier` — Courier app (faux map with route, GPS checkpoint timeline, online toggle, broadcasts)
- `/admin` — Director console (KPIs, revenue area chart, orders bar chart, staff roster, reviews moderation, branch selector)

## Backlog / Future
- P1: Real backend (FastAPI + Mongo) for any subset of features (auth, reservations, orders)
- P1: Real-time SignalR-style WS for KDS / Waiter / POS sync
- P2: Stripe Checkout integration for the customer checkout
- P2: Per-role authentication & route guards
- P2: Mobile-native screens for Courier (PWA / Capacitor)
- P2: i18n (Russian + English)

## Test Credentials
N/A — auth is mocked (any submit lands on `/dashboard`).
