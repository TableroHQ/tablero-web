# Bite — Restaurant Operating System · PRD

## Original Problem Statement
User shared a complete C4 architecture (L1-L4) + API reference (~85 endpoints) + RabbitMQ event catalog + database design (7 PostgreSQL DBs) for **Bite — Restaurant Operating System**. They asked to build a full React SPA front-end covering every role and every function, mocked, no backend.

## User Choices Confirmed
- **Scope**: Max — all consumer + operational + admin sub-pages (~28 pages)
- **Tech**: React SPA, pure front-end, mock data only
- **Style**: Modern restaurant aesthetic (terracotta + cream, Playfair Display)
- **Backend / integrations**: Not needed

## Architecture (frontend only)
- React 19 + React Router 7 + Tailwind CSS + Recharts + Sonner (toasts)
- **Global store** (`/src/lib/store.js`): user, role, notifications, cart, balance, prefs — persisted to localStorage
- **Mock API** (`/src/lib/api.js`): imitates ~85 endpoints with tiny delays + pass/fail states
- **LiveSimulator**: every 22s pushes a random RabbitMQ-style event into notifications
- **RoleSwitcher**: floating dev panel (bottom-left) lets you preview the app as any of 7 roles — jumps to the matching route
- Two layouts: `Layout` (consumer, glass-morphism nav, footer) and `OpsLayout` (operations, left sidebar, admin section; dark variant for KDS)

## Design System
- Palette: Cream `#FAFAF8`, Terracotta `#C8553D`, Amber `#E4883A`, Ink `#2C221E`, Ok `#437E55`, Err `#D14949`
- Fonts: Playfair Display, Outfit, Figtree, JetBrains Mono
- All interactive elements include `data-testid`
- Live animations: pulsing dots, courier moving on map, KDS live timers counting up each second, auto-triggered events

## What's Implemented

### Consumer (15 pages)
| Route | Purpose |
|---|---|
| `/` | Landing — hero, Tetris grid, reviews band, branches |
| `/menu` | Menu with search, category filter, allergens, 86'd state, add-to-cart |
| `/login` | Auth — split screen, single-field auto-detect email/username |
| `/forgot-password` | 3-step OTP reset flow (email → code → new password) |
| `/dashboard` | Customer dashboard — loyalty, balance, upcoming reservations, recent orders |
| `/reservations` | Booking — date strip, time chips, party stepper, zone + visual table grid |
| `/checkout` | Cart + delivery/dine-in toggle + payment options + loyalty redeem, wired to store |
| `/loyalty` | Bonus catalogue (redeemable food items, progress to gold tier) |
| `/reviews` | Submit review (chef/waiter/cleanliness/service) + recent reviews |
| `/profile` | Full profile — avatar, name/username/email/phone, security, danger zone |
| `/topup` | Fake Stripe Checkout flow for balance top-up |
| `/notifications` | Inbox with filters (all/unread/read) + preferences (email/SMS/push/marketing) |
| `/orders/:id` | Order detail — timeline (PENDING→IN_KITCHEN→READY→SERVED) + live kitchen pulse |
| `/delivery/:id` | Delivery tracking — animated courier on map, GPS checkpoints, confirm receipt, rate courier |
| `/qr?t=T-07` | QR scan landing — session detected, opens public menu |

### Operational dashboards (5 core)
| Route | Purpose |
|---|---|
| `/kds` | Chef KDS — dark mode, live timers, item Q→P→R controls, call-waiter, printer |
| `/waiter` | Service floor with **tabs**: Floor (color-coded grid), Today's reservations (confirm/seat/no-show), Submit order (menu picker per table) |
| `/pos` | Cashier POS — floor grid, bill detail, cash tendered + change, card/split/release |
| `/courier` | Courier app — faux map, GPS checkpoints, online toggle, broadcasts, accept flow |
| `/admin` | Director dashboard — KPIs, revenue/orders charts, staff roster, reviews moderation preview |

### Admin sub-pages (7)
| Route | Purpose |
|---|---|
| `/admin/menu` | Menu CRUD — create/edit/delete items, 86 toggle, edit modal |
| `/admin/tables` | Tables + QR management — floor view, regenerate QR modal |
| `/admin/staff` | Staff management — invite modal, role dropdown, suspend/reactivate |
| `/admin/reviews` | Full reviews moderation — pending/published/rejected tabs, approve/reject/remove |
| `/admin/promotions` | Email/SMS campaign composer — audience selector, template variables, preview |
| `/admin/refunds` | Refunds — invoice list, issue refund with reason |
| `/admin/revenue` | Revenue report — date range, line chart by payment method, pie breakdown, top items |

### Shared
- Notification bell in both layouts (unread badge, inline panel, mark-read)
- Role switcher (floating) — USER → WAITER → CHEF → CASHIER → COURIER → ADMIN
- Toast feedback on every mutation (sonner)
- Live event ticker (every 22s a random event lands in the bell)

## Known Constraints
- All data resets if user clicks "Reset" or clears localStorage
- Maps are SVG fakes — no real Google/Mapbox integration
- QR codes are CSS art — no real encoding
- Stripe Checkout is a fake delay + success

## Future / Backlog
- P1: Real FastAPI + Mongo backend wired to any subset (auth + orders + reservations first)
- P1: WebSocket for true real-time KDS/Waiter sync (match SignalR architecture)
- P2: Real Stripe Checkout + webhook handling
- P2: Emergent Google OAuth integration
- P2: Mobile-native Courier PWA
- P2: i18n (RU/EN)
- P3: Actual QR encoding + scanner entry

## Test Credentials
Not applicable — auth is fully mocked. Clicking "Sign in" always lands on `/dashboard`. Any 6-digit OTP works.
Use the **floating Role Switcher** (bottom-left) to preview the app as any of the 7 roles.
