import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ACCESS  = 'tablero_access_token';
const REFRESH = 'tablero_refresh_token';

const OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

// Returns the stored access token so the client can populate its in-memory store
// on page load without touching localStorage.
export async function GET() {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS)?.value ?? null;
  return NextResponse.json({ accessToken });
}

// Sets both tokens as httpOnly cookies after a successful login.
export async function POST(req) {
  const { accessToken, refreshToken } = await req.json();
  const res = NextResponse.json({ ok: true });
  if (accessToken)  res.cookies.set(ACCESS,  accessToken,  { ...OPTS, maxAge: 900 });     // 15 min
  if (refreshToken) res.cookies.set(REFRESH, refreshToken, { ...OPTS, maxAge: 604800 });  // 7 days
  return res;
}

// Clears both token cookies on logout.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ACCESS);
  res.cookies.delete(REFRESH);
  return res;
}
