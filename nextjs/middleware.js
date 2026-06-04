import { NextResponse } from 'next/server';

/**
 * Ops routes — the roles that may access each prefix.
 * Checked in order; first match wins.
 */
const ROLE_GATES = [
  { prefix: '/admin',    roles: ['ADMIN', 'DIRECTOR'] },
  { prefix: '/director', roles: ['ADMIN', 'DIRECTOR'] },
  { prefix: '/waiter',   roles: ['WAITER', 'ADMIN', 'DIRECTOR'] },
  { prefix: '/kds',      roles: ['CHEF', 'ADMIN', 'DIRECTOR'] },
  { prefix: '/pos',      roles: ['CASHIER', 'ADMIN', 'DIRECTOR'] },
  { prefix: '/courier',  roles: ['COURIER', 'ADMIN', 'DIRECTOR'] },
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
  '/pickup',
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

/**
 * Staff roles. These users operate the back-of-house apps only — they must never
 * land on the consumer/guest storefront. Anything outside their ops prefixes (and
 * the shared auth pages) bounces them back to their own home.
 */
const OPS_ROLES = ['WAITER', 'CHEF', 'CASHIER', 'COURIER', 'ADMIN', 'DIRECTOR'];

/** Shared, role-agnostic auth pages that any role may reach. */
const PUBLIC_AUTH = ['/login', '/register', '/forgot-password'];

const isUnder = (pathname, prefix) =>
  pathname === prefix || pathname.startsWith(prefix + '/');

function loginRedirect(request, pathname) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

/**
 * Non-staff (guests and consumers) who reach a back-of-house page are sent to
 * the storefront home with a flag the client reads to show a "no access" toast.
 */
function staffDeniedRedirect(request) {
  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.search = '?denied=staff';
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
    if (isUnder(pathname, prefix)) {
      if (roles.includes(role)) return NextResponse.next();
      // Guests (not logged in) and consumers have no staff credentials → bounce
      // them to the storefront home with a toast flag instead of /login.
      if (!OPS_ROLES.includes(role)) return staffDeniedRedirect(request);
      // A staff member on a page outside their own role → keep them in
      // back-of-house by sending them to their own home.
      return NextResponse.redirect(
        new URL(ROLE_HOME[role] || '/dashboard', request.url)
      );
    }
  }

  // ── Staff are confined to back-of-house ─────────────────────────────────────
  // A logged-in staff member reaching anything outside their ops prefixes (the
  // loop above already let those through) is on consumer/guest ground — bounce
  // them to their own home. Shared auth pages stay reachable so they can log out
  // and back in. Consumers (USER/GUEST) are unaffected.
  if (auth && OPS_ROLES.includes(role)) {
    const onPublicAuth = PUBLIC_AUTH.some(p => isUnder(pathname, p));
    if (!onPublicAuth) {
      return NextResponse.redirect(
        new URL(ROLE_HOME[role] || '/dashboard', request.url)
      );
    }
  }

  // ── Consumer auth-required routes ──────────────────────────────────────────
  if (AUTH_REQUIRED.some(p => isUnder(pathname, p))) {
    if (!auth) return loginRedirect(request, pathname);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every page so staff can be confined to back-of-house and consumers
  // kept out of ops apps. Skip Next.js internals, the API, and static assets
  // (any path segment containing a dot, e.g. *.png, *.ico, *.js).
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
