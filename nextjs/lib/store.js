'use client';
import React from 'react';
import { tokenStore } from './client';

const STORE_KEY = 'tablero_store_v1';

// Decode JWT payload without verifying signature (verification is server-side)
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function userFromToken(token) {
  if (!token) return null;
  const claims = decodeToken(token);
  if (!claims) return null;
  return {
    id:           claims.userId   || claims.sub || '',
    name:         claims.name     || claims.username || '',
    email:        claims.email    || '',
    username:     claims.username || '',
    phone:        claims.phone    || '',
    avatar:       claims.avatar   || null,
    role:         claims.role     || 'GUEST',
    restaurantId: claims.restaurantId || process.env.NEXT_PUBLIC_RESTAURANT_ID || '',
    loyaltyPoints: 0,
    balance:      0,
    heldBalance:  0,
  };
}

const guestUser = {
  id: '', name: '', email: '', username: '', phone: '',
  avatar: null, role: 'GUEST',
  restaurantId: process.env.NEXT_PUBLIC_RESTAURANT_ID || '',
  loyaltyPoints: 0, balance: 0, heldBalance: 0,
};

const defaultState = {
  user:          guestUser,
  notifications: [],
  prefs:         { email: true, sms: true, push: true, marketing: false, darkMode: false },
  cart:          [],
  lastOrderId:   null,
  hydrated:      false,
  hasSession:    false,
};

function loadUiState() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveUiState(s) {
  try {
    // Only persist non-sensitive UI state
    const { notifications, prefs, cart, lastOrderId } = s;
    localStorage.setItem(STORE_KEY, JSON.stringify({ notifications, prefs, cart, lastOrderId }));
  } catch {}
}

const Ctx = React.createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = React.useState(defaultState);

  // Async hydration: restore session from httpOnly cookies, then populate state.
  React.useEffect(() => {
    (async () => {
      const token = await tokenStore.restore();
      if (!token) tokenStore.clear(); // clears stale signal cookies if no session
      const fromToken = userFromToken(token);
      const ui = loadUiState();
      setState({
        ...defaultState,
        ...ui,
        user:       fromToken || guestUser,
        hydrated:   true,
        hasSession: !!token,
      });
    })();
  }, []);

  React.useEffect(() => { saveUiState(state); }, [state]);

  const store = React.useMemo(() => ({
    get: () => state,

    // Called after successful POST /api/auth/login or /api/auth/register
    login: (accessToken, refreshToken, profilePatch = {}) => {
      tokenStore.set(accessToken, refreshToken);
      const fromToken = userFromToken(accessToken) || guestUser;
      setState(s => ({ ...s, user: { ...fromToken, ...profilePatch } }));
    },

    // Called on logout — clears tokens and resets to guest
    logout: () => {
      tokenStore.clear();
      setState({ ...defaultState });
    },

    // Merge profile data from GET /api/users/me into the user object.
    // The backend returns PascalCase (C# default) so we normalise here.
    setProfile: (profile) => {
      const firstName = profile.firstName ?? profile.FirstName ?? '';
      const lastName  = profile.lastName  ?? profile.LastName  ?? '';
      setState(s => ({
        ...s,
        user: {
          ...s.user,
          firstName,
          lastName,
          name:         `${firstName} ${lastName}`.trim() || s.user.name,
          email:        profile.email        ?? profile.Email        ?? s.user.email,
          username:     profile.username     ?? profile.Username     ?? s.user.username,
          phone:        profile.phoneNumber  ?? profile.PhoneNumber  ?? profile.phone ?? s.user.phone,
          avatar:       profile.avatarUrl    ?? profile.AvatarUrl    ?? profile.avatar ?? s.user.avatar,
          role:         profile.role         ?? profile.Role         ?? s.user.role,
          restaurantId: profile.restaurantId ?? profile.RestaurantId ?? s.user.restaurantId,
          id:           profile.id           ?? profile.Id           ?? s.user.id,
        },
      }));
    },

    // Keep role in sync after admin changes it
    setRole: (role) => setState(s => ({ ...s, user: { ...s.user, role } })),

    updateUser: (patch) => setState(s => ({ ...s, user: { ...s.user, ...patch } })),

    // Notifications
    setNotifications: (list) => setState(s => ({ ...s, notifications: list })),
    addNotif:   (n) => setState(s => ({ ...s, notifications: [{ ...n, id: `n_${Date.now()}`, at: Date.now(), read: false }, ...s.notifications].slice(0, 50) })),
    markRead:   (id) => setState(s => ({ ...s, notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
    markAllRead: () => setState(s => ({ ...s, notifications: s.notifications.map(n => ({ ...n, read: true })) })),
    setPrefs:   (p) => setState(s => ({ ...s, prefs: { ...s.prefs, ...p } })),

    // Cart
    addToCart: (item) => setState(s => {
      const ex = s.cart.find(c => c.id === item.id);
      const cart = ex
        ? s.cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
        : [...s.cart, { ...item, qty: 1 }];
      return { ...s, cart };
    }),
    changeQty:  (id, delta) => setState(s => ({ ...s, cart: s.cart.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c) })),
    removeCart: (id) => setState(s => ({ ...s, cart: s.cart.filter(c => c.id !== id) })),
    clearCart:  () => setState(s => ({ ...s, cart: [] })),

    // Called after successful payment to sync balance from server response
    setBalance: (balance, held = 0, loyaltyPoints) => setState(s => ({
      ...s,
      user: {
        ...s.user,
        balance,
        heldBalance: held,
        ...(loyaltyPoints !== undefined ? { loyaltyPoints } : {}),
      },
    })),

    placeOrder: (total) => {
      const oid = `o_${Date.now()}`;
      setState(s => ({
        ...s,
        lastOrderId: oid,
        cart: [],
        user: { ...s.user, loyaltyPoints: s.user.loyaltyPoints + Math.floor(total) },
      }));
      return oid;
    },

    reset: () => { tokenStore.clear(); setState(defaultState); },
  }), [state]);

  return <Ctx.Provider value={[state, store]}>{children}</Ctx.Provider>;
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
