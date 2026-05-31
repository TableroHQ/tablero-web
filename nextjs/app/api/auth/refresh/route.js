import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const REAL_BASE = process.env.NEXT_PUBLIC_API_URL; // undefined in demo/dev mode
const ACCESS    = 'tablero_access_token';
const REFRESH   = 'tablero_refresh_token';

const OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

// Proxies a token refresh using the httpOnly refresh cookie so the browser
// never needs to read or send the refresh token directly.
// In demo/dev mode (no NEXT_PUBLIC_API_URL) it re-issues the stored access token.
export async function POST() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH)?.value;
  const accessToken  = jar.get(ACCESS)?.value;

  if (!refreshToken) return NextResponse.json({ error: 'No session' }, { status: 401 });

  if (REAL_BASE) {
    try {
      const up = await fetch(`${REAL_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await up.json();
      if (!up.ok) return NextResponse.json(data, { status: up.status });

      const res = NextResponse.json({ accessToken: data.accessToken });
      res.cookies.set(ACCESS, data.accessToken, { ...OPTS, maxAge: 900 });
      if (data.refreshToken) res.cookies.set(REFRESH, data.refreshToken, { ...OPTS, maxAge: 604800 });
      return res;
    } catch {
      return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
    }
  }

  // Demo mode: re-issue from the stored access cookie
  if (!accessToken) return NextResponse.json({ error: 'No token' }, { status: 401 });
  return NextResponse.json({ accessToken });
}
