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
      accessTokenFactory: () => tokenStore.getAccess() || '',
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

    const conn = createHubConnection(hubName);

    conn.onclose(() => setConnected(false));
    conn.onreconnected(() => setConnected(true));
    conn.onreconnecting(() => setConnected(false));

    startHub(conn).then(ok => {
      if (ok) {
        setConnected(true);
        setConnection(conn);
      }
    });

    return () => {
      conn.stop().catch(() => {});
    };
  }, [hubName, enabled]);

  return { connection, connected };
}
