import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Tokens live in module memory only — never in localStorage.
// httpOnly cookies (managed by /api/auth/session) provide persistence across page refreshes.
let _access  = null;
let _refresh = null;

// Non-httpOnly signal cookies — readable by middleware for route protection.
function _cookieSet(name, val, days = 7) {
  if (typeof document === 'undefined') return;
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${val}; path=/; SameSite=Lax; expires=${exp}`;
}
function _cookieClear(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
function _claimsFromToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return {}; }
}

export const tokenStore = {
  getAccess:  () => _access,
  getRefresh: () => _refresh,

  set: (access, refresh) => {
    _access = access;
    if (refresh != null) _refresh = refresh;
    const claims = _claimsFromToken(access);
    _cookieSet('tablero_auth', '1');
    _cookieSet('tablero_role', claims.role || 'USER');
    if (claims.exp) _cookieSet('tablero_exp', String(claims.exp), 1);
    // Persist to httpOnly cookies (fire-and-forget)
    if (typeof window !== 'undefined') {
      fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: access, refreshToken: refresh ?? _refresh }),
      }).catch(() => {});
    }
  },

  clear: () => {
    _access  = null;
    _refresh = null;
    _cookieClear('tablero_auth');
    _cookieClear('tablero_role');
    _cookieClear('tablero_exp');
    if (typeof window !== 'undefined') {
      fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
    }
  },

  // Called once on app mount to restore a session from httpOnly cookies.
  restore: async () => {
    if (typeof window === 'undefined') return null;
    try {
      const r = await fetch('/api/auth/session');
      const { accessToken } = await r.json();
      if (!accessToken) return null;
      _access = accessToken;
      const claims = _claimsFromToken(accessToken);
      _cookieSet('tablero_auth', '1');
      _cookieSet('tablero_role', claims.role || 'USER');
      if (claims.exp) _cookieSet('tablero_exp', String(claims.exp), 1);
      return accessToken;
    } catch { return null; }
  },
};

const http = axios.create({ baseURL: BASE });

// Attach JWT to every outbound request
http.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 → refresh via the Next.js proxy (which reads the httpOnly refresh cookie),
// then retry once. Deduplicates concurrent refresh calls.
let refreshing = null;

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) return Promise.reject(err);

    original._retry = true;

    if (!refreshing) {
      refreshing = fetch('/api/auth/refresh', { method: 'POST' })
        .then(async (r) => {
          if (!r.ok) throw new Error('refresh failed');
          const { accessToken } = await r.json();
          tokenStore.set(accessToken, null);
          return accessToken;
        })
        .catch((e) => {
          tokenStore.clear();
          if (typeof window !== 'undefined') window.location.href = '/login';
          return Promise.reject(e);
        })
        .finally(() => { refreshing = null; });
    }

    const newToken = await refreshing;
    original.headers.Authorization = `Bearer ${newToken}`;
    return http(original);
  },
);

// Normalise PascalCase keys (C# backend default) to camelCase on every response.
function toCamel(s) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
function normalizeKeys(v) {
  if (Array.isArray(v)) return v.map(normalizeKeys);
  if (!v || typeof v !== 'object' || v instanceof Date) return v;
  return Object.fromEntries(Object.entries(v).map(([k, val]) => [toCamel(k), normalizeKeys(val)]));
}

http.interceptors.response.use((res) => {
  if (res.data !== null && typeof res.data === 'object') res.data = normalizeKeys(res.data);
  return res;
});

// Convenience wrappers that unwrap .data automatically
export const api = {
  get:    (url, cfg)       => http.get(url, cfg).then((r) => r.data),
  post:   (url, body, cfg) => http.post(url, body, cfg).then((r) => r.data),
  patch:  (url, body, cfg) => http.patch(url, body, cfg).then((r) => r.data),
  put:    (url, body, cfg) => http.put(url, body, cfg).then((r) => r.data),
  delete: (url, cfg)       => http.delete(url, cfg).then((r) => r.data),
};

export default http;
