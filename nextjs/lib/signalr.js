import * as signalR from '@microsoft/signalr';
import { tokenStore } from './client';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Hub URL mapping — matches the planned ASP.NET Core SignalR hub routes.
 * All hubs are proxied through the API Gateway at BASE.
 */
export const HUB_URLS = {
  kitchen: `${BASE}/hubs/kitchen`,
  waiter:  `${BASE}/hubs/waiter`,
  table:   `${BASE}/hubs/table`,
  notify:  `${BASE}/hubs/notify`,
  cashier: `${BASE}/hubs/cashier`,
  courier: `${BASE}/hubs/courier`,
  admin:   `${BASE}/hubs/admin`,
};

/**
 * Resolve the current access token, waiting briefly for it to become available.
 *
 * The token lives in module memory (see lib/client.js) and is populated
 * asynchronously — by `tokenStore.restore()` on a fresh page load, or by
 * `tokenStore.set()` right after login. A hub effect can mount and call
 * `connection.start()` *before* that hydration finishes, which is the root of
 * the token race: the negotiate then goes out with an empty token, the initial
 * start fails, and because automatic reconnect only covers drops *after* a
 * first successful connect, the hub stays dead and the UI falls back to polling
 * forever.
 *
 * SignalR allows an async `accessTokenFactory`, so instead of returning '' we
 * wait (poll cheaply) until the token appears, up to a timeout. This makes the
 * very first negotiate carry a valid token.
 *
 * @param {number} [timeoutMs=10000]
 * @param {number} [intervalMs=50]
 * @returns {Promise<string>} the token, or '' if none arrives before timeout
 */
export function waitForAccessToken(timeoutMs = 10000, intervalMs = 50) {
  const existing = tokenStore.getAccess();
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const token = tokenStore.getAccess();
      if (token || Date.now() - startedAt >= timeoutMs) {
        clearInterval(timer);
        resolve(token || '');
      }
    }, intervalMs);
  });
}

/**
 * Build a HubConnection for the given hub with JWT auth and automatic reconnect.
 *
 * @param {'kitchen'|'waiter'|'table'|'notify'|'cashier'|'courier'|'admin'} hub
 * @returns {signalR.HubConnection}
 */
export function createHubConnection(hub) {
  const url = HUB_URLS[hub];
  if (!url) throw new Error(`Unknown hub: ${hub}`);

  return new signalR.HubConnectionBuilder()
    .withUrl(url, {
      // Async factory: SignalR awaits it during negotiate, so the connection
      // waits for the token to hydrate instead of racing it (see above).
      accessTokenFactory: () => waitForAccessToken(),
      skipNegotiation: false,
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(
      process.env.NODE_ENV === 'development'
        ? signalR.LogLevel.Information
        : signalR.LogLevel.Warning
    )
    .build();
}

/**
 * Start a hub connection with graceful error handling.
 * Returns true on success, false if the hub is not yet available.
 *
 * @param {signalR.HubConnection} connection
 * @returns {Promise<boolean>}
 */
export async function startHub(connection) {
  try {
    await connection.start();
    return true;
  } catch (err) {
    // Hub not yet implemented in backend — log quietly and fall back to polling
    if (process.env.NODE_ENV === 'development') {
      console.info(`[SignalR] Hub not available (${connection.baseUrl}) — polling fallback active.`, err?.message);
    }
    return false;
  }
}

/**
 * React hook that manages a SignalR hub lifecycle.
 * Connects on mount, disconnects on unmount.
 * Returns { connection, connected } — connection is null until started.
 *
 * @param {'kitchen'|'waiter'|'table'|'notify'|'cashier'|'courier'} hubName
 * @param {boolean} [enabled=true] - skip connection if false (e.g., no restaurantId yet)
 */
export function useHub(hubName, enabled = true) {
  const React = require('react');
  const [connection, setConnection] = React.useState(null);
  const [connected, setConnected] = React.useState(false);

  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let cancelled = false;
    const conn = createHubConnection(hubName);

    conn.onclose(() => { if (!cancelled) setConnected(false); });
    conn.onreconnected(() => { if (!cancelled) setConnected(true); });
    conn.onreconnecting(() => { if (!cancelled) setConnected(false); });

    // Retry the *initial* connect. withAutomaticReconnect only revives a
    // connection that has already connected once, so without this a hub that
    // misses its first start (token still hydrating, transient unavailability,
    // or a StrictMode mount/unmount aborting negotiate in dev) would be stuck
    // on polling for the whole session. Backs off and stops on unmount.
    (async () => {
      for (let attempt = 0; attempt < 5 && !cancelled; attempt++) {
        const ok = await startHub(conn);
        if (cancelled) return;
        if (ok) {
          setConnected(true);
          setConnection(conn);
          return;
        }
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    })();

    return () => {
      cancelled = true;
      conn.stop().catch(() => {});
    };
  }, [hubName, enabled]);

  return { connection, connected };
}
