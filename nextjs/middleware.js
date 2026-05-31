import { NextResponse } from 'next/server';

/**
 * Ops routes — the roles that may access each prefix.
 * Checked in order; first match wins.
 */
const ROLE_GATES = [
  { prefix: '/admin',   roles: ['ADMIN', 'DIRECTOR'] },
  { prefix: '/waiter',  roles: ['WAITER', 'ADMIN', 'DIRECTOR'] },
  { prefix: '/kds',     roles: ['CHEF', 'ADMIN', 'DIRECTOR'] },
  { prefix: '/pos',     roles: ['CASHIER', 'ADMIN', 'DIRECTOR'] },
  { prefix: '/courier', roles: ['COURIER', 'ADMIN', 'DIRECTOR'] },
];

/**
 * Consumer routes that require any authenticated session (not GUEST).
 */
const AUTH_REQUIRED = [
  '/dashboard',
  '/profile',
  '/checkout',
  '/topup',
  '/orders',
  '/delivery',
  '/loyalty',
  '/notifications',
  '/reviews',
];

/** Where each role lands after login. */
const ROLE_HOME = {
  USER:     '/dashboard',
  WAITER:   '/waiter',
  CHEF:     '/kds',
  CASHIER:  '/pos',
  COURIER:  '/courier',
  ADMIN:    '/admin',
  DIRECTOR: '/admin',
};

function loginRedirect(request, pathname) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const auth = request.cookies.get('tablero_auth')?.value;   // '1' when logged in
  const role = request.cookies.get('tablero_role')?.value || 'GUEST';
  // tablero_exp holds the JWT exp (Unix seconds) so we can confirm the token is fresh
  const expStr = request.cookies.get('tablero_exp')?.value;
  const tokenFresh = expStr ? parseInt(expStr, 10) * 1000 > Date.now() : false;

  // ── Already authenticated with a fresh token → bounce off auth pages ───────
  // Only redirect when we know the access token is still valid.
  // An expired/missing tablero_exp means the token has lapsed; let the user
  // reach /login so the refresh flow can take over.
  if (auth && tokenFresh) {
    const isAuthPage = ['/login', '/register'].some(
      p => pathname === p || pathname.startsWith(p + '/')
    );
    if (isAuthPage) {
      return NextResponse.redirect(
        new URL(ROLE_HOME[role] || '/dashboard', request.url)
      );
    }
  }

  // ── Ops role gates ─────────────────────────────────────────────────────────
  for (const { prefix, roles } of ROLE_GATES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      if (!auth) return loginRedirect(request, pathname);
      if (!roles.includes(role)) {
        // Logged in but wrong role → send to their own home
        return NextResponse.redirect(
          new URL(ROLE_HOME[role] || '/dashboard', request.url)
        );
      }
      return NextResponse.next();
    }
  }

  // ── Consumer auth-required routes ──────────────────────────────────────────
  if (AUTH_REQUIRED.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    if (!auth) return loginRedirect(request, pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Ops
    '/admin/:path*',
    '/waiter',
    '/kds',
    '/pos',
    '/courier',
    // Consumer (auth-required)
    '/dashboard/:path*',
    '/profile/:path*',
    '/checkout/:path*',
    '/topup/:path*',
    '/orders/:path*',
    '/delivery/:path*',
    '/loyalty/:path*',
    '/notifications/:path*',
    '/reviews/:path*',
    // Auth pages (bounce if already logged in)
    '/login',
    '/register',
  ],
};
