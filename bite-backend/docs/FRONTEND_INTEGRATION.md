# Bite — Frontend ↔ Backend Bridging Guide

Your existing **React SPA** in `/app/frontend` talks to a mock layer in `src/lib/api.js`.
To connect it to the real backend you just generated, swap that module for an HTTP client pointing at the gateway.

## Step 1 — Set the gateway URL

In `frontend/.env`:

```
REACT_APP_BACKEND_URL=http://localhost:5000
```

Restart the frontend (`yarn start`).

## Step 2 — Replace `lib/api.js`

A drop-in version that hits the real services through the gateway:

```js
const BASE = process.env.REACT_APP_BACKEND_URL;
let token = localStorage.getItem('bite_token');

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) return { ok: false, error: (await res.json().catch(() => ({}))).error || res.statusText };
  return { ok: true, data: await res.json().catch(() => null) };
}

export const api = {
  // identity
  register: (b) => call('POST', '/api/identity/auth/register', b),
  login:    (id, pw) => call('POST', '/api/identity/auth/login', { identifier: id, password: pw }).then(r => {
    if (r.ok) { token = r.data.accessToken; localStorage.setItem('bite_token', token); localStorage.setItem('bite_refresh', r.data.refreshToken); }
    return r;
  }),
  forgotPassword: (email) => call('POST', '/api/identity/auth/forgot-password', { email }),
  verifyOtp:      (email, code) => call('POST', '/api/identity/auth/verify-otp', { email, code }),
  resetPassword:  (email, code, newPassword) => call('POST', '/api/identity/auth/reset-password', { email, code, newPassword }),

  // restaurant + menu
  getMenu:           (restaurantId) => call('GET',  `/api/menu?restaurantId=${restaurantId}`),
  getRestaurant:     (id)          => call('GET',  `/api/restaurant/public/${id}`),

  // reservations
  availability:      (rid, date, party) => call('GET', `/api/reservations/availability?restaurantId=${rid}&date=${date}&partySize=${party}`),
  createReservation: (b) => call('POST', '/api/reservations', b),

  // orders
  placeOrder:        (b) => call('POST', '/api/orders', b),
  getOrder:          (id) => call('GET', `/api/orders/${id}`),
  myOrders:          () => call('GET', '/api/orders/mine'),

  // payment
  getBalance:        () => call('GET', '/api/payments/balance'),
  topup:             (amount, token) => call('POST', '/api/payments/balance/topup', { amount, stripeToken: token }),

  // delivery tracking
  trackDelivery:     (id) => call('GET', `/api/delivery/mine`).then(r => ({ ...r, data: r.data?.find(d => d.id === id) })),
  confirmReceipt:    (id) => call('POST', `/api/delivery/${id}/confirm-receipt`),

  // notifications
  getNotifications:  (filter='all') => call('GET', `/api/notify?filter=${filter}`),
  markRead:          (id) => call('POST', `/api/notify/${id}/read`),
  markAllRead:       () => call('POST', '/api/notify/read-all'),

  // reviews
  submitReview:      (b) => call('POST', '/api/reviews', b),
};
```

## Step 3 — Real-time (SignalR)

Install:
```
yarn add @microsoft/signalr
```

Connect to a hub (example: live notifications):

```js
import * as signalR from '@microsoft/signalr';

const conn = new signalR.HubConnectionBuilder()
  .withUrl(`${process.env.REACT_APP_BACKEND_URL}/hubs/notify`, {
    accessTokenFactory: () => localStorage.getItem('bite_token')
  })
  .withAutomaticReconnect()
  .build();

conn.on('notify', (payload) => store.addNotif(payload));
await conn.start();
```

Repeat for `/hubs/kitchen` (KDS), `/hubs/table` (live order status on the customer's table), `/hubs/courier` (broadcasts), `/hubs/cashier`, `/hubs/waiter`.

## Step 4 — Replace `LiveSimulator`

Once SignalR is wired, delete the `LiveSimulator` component — real events from the backend will populate the bell automatically.

## Test credentials (seeded by Identity service)

```
admin@bite.com    / Password123!  (Admin)
director@bite.com / Password123!  (Director)
chef@bite.com     / Password123!  (Chef)
waiter@bite.com   / Password123!  (Waiter)
cashier@bite.com  / Password123!  (Cashier)
courier@bite.com  / Password123!  (Courier)
sofia@bite.com    / Password123!  (User)
```

Or pass `sofia` / `Password123!` — `Identifier` auto-detects email vs username.
