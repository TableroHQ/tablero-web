// Global mock store — auth (role) + notifications + cart + balance
// Uses React context; persisted to localStorage. Single source of truth.
import React from 'react';

const KEY = 'bite_store_v1';
const defaultState = {
  user: {
    id: 'u_sofia',
    name: 'Sofia Marin',
    email: 'sofia@bite.com',
    username: 'sofia',
    phone: '+1 415 555 0184',
    avatar: null,
    role: 'USER', // GUEST | USER | WAITER | CHEF | CASHIER | COURIER | ADMIN | DIRECTOR
    restaurantId: 'rest_downtown',
    loyaltyPoints: 1240,
    balance: 84.00,
    heldBalance: 0,
  },
  notifications: [
    { id: 'n1', type: 'bonus.earned', title: 'You earned +50 points', body: 'Tonight at Bite Downtown. Keep it going!', read: false, at: Date.now() - 1000*60*12 },
    { id: 'n2', type: 'reservation.reminder', title: 'Reservation tomorrow · 19:30', body: 'Table T-07 · Terrace · party of 4. See you soon.', read: false, at: Date.now() - 1000*60*60*3 },
    { id: 'n3', type: 'delivery.checkpoint', title: 'Your order is nearby', body: 'Jamie is 600m away. Heating things up.', read: true, at: Date.now() - 1000*60*60*20 },
  ],
  prefs: { email: true, sms: true, push: true, marketing: false },
  cart: [],
  lastOrderId: null,
};

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return { ...defaultState, ...JSON.parse(raw) }; } catch {}
  return defaultState;
}
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

const Ctx = React.createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = React.useState(load);
  React.useEffect(() => { save(state); }, [state]);

  const api = React.useMemo(() => ({
    get: () => state,
    setRole: (role) => setState(s => ({ ...s, user: { ...s.user, role } })),
    updateUser: (patch) => setState(s => ({ ...s, user: { ...s.user, ...patch } })),
    addNotif: (n) => setState(s => ({ ...s, notifications: [{ ...n, id: `n_${Date.now()}`, at: Date.now(), read: false }, ...s.notifications].slice(0, 50) })),
    markRead: (id) => setState(s => ({ ...s, notifications: s.notifications.map(n => n.id===id?{...n, read: true}:n) })),
    markAllRead: () => setState(s => ({ ...s, notifications: s.notifications.map(n => ({...n, read: true})) })),
    setPrefs: (p) => setState(s => ({ ...s, prefs: { ...s.prefs, ...p } })),
    addToCart: (item) => setState(s => {
      const ex = s.cart.find(c => c.id===item.id);
      const cart = ex ? s.cart.map(c => c.id===item.id?{...c, qty:c.qty+1}:c) : [...s.cart, { ...item, qty: 1 }];
      return { ...s, cart };
    }),
    changeQty: (id, delta) => setState(s => ({ ...s, cart: s.cart.map(c => c.id===id?{...c, qty: Math.max(1, c.qty+delta)}:c) })),
    removeCart: (id) => setState(s => ({ ...s, cart: s.cart.filter(c => c.id!==id) })),
    clearCart: () => setState(s => ({ ...s, cart: [] })),
    topUp: (amount) => setState(s => ({ ...s, user: { ...s.user, balance: s.user.balance + amount } })),
    redeemPoints: (cost) => setState(s => ({ ...s, user: { ...s.user, loyaltyPoints: s.user.loyaltyPoints - cost } })),
    placeOrder: (total) => {
      const oid = `o_${Date.now()}`;
      setState(s => ({ ...s, lastOrderId: oid, cart: [], user: { ...s.user, loyaltyPoints: s.user.loyaltyPoints + Math.floor(total) } }));
      return oid;
    },
    reset: () => { setState(defaultState); },
  }), [state]);

  return <Ctx.Provider value={[state, api]}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error('useStore must be inside StoreProvider');
  return v;
}

export const ROLE_LABELS = {
  GUEST: 'Guest', USER: 'Customer', WAITER: 'Waiter', CHEF: 'Chef',
  CASHIER: 'Cashier', COURIER: 'Courier', ADMIN: 'Admin', DIRECTOR: 'Director',
};

export const ROLE_ROUTES = {
  USER: '/dashboard', WAITER: '/waiter', CHEF: '/kds', CASHIER: '/pos',
  COURIER: '/courier', ADMIN: '/admin', DIRECTOR: '/admin', GUEST: '/',
};
