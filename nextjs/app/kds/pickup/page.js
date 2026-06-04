'use client';
import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { api } from '@/lib/client';
import { createHubConnection, startHub } from '@/lib/signalr';
import { Loader2, RefreshCw, Wifi, WifiOff, ChefHat } from 'lucide-react';
import { toast } from 'sonner';

const PRIORITY_STYLE = {
  URGENT: 'border-t-red-500',
  SOON: 'border-t-amber-500',
  SCHEDULED: 'border-t-cream/30',
};

export default function ChefPickup() {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [live, setLive] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = await api.get('/api/staff/chef/pickup-orders');
      setOrders(Array.isArray(data) ? data : data?.items ?? []);
    } catch {
      toast.error('Could not load the pickup queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    const conn = createHubConnection('kitchen');
    conn.on('NewScheduledPickupOrder', () => { load(); toast.info('New scheduled pickup order'); });
    conn.on('PickupOrderUpdated', () => load());
    conn.onclose(() => setLive(false));
    conn.onreconnected(() => setLive(true));
    startHub(conn).then(ok => setLive(ok));
    return () => { conn.stop().catch(() => {}); };
  }, [load]);

  React.useEffect(() => {
    if (live) return;
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [live, load]);

  const act = async (id, action, label) => {
    try {
      await api.patch(`/api/staff/chef/pickup-orders/${id}/${action}`, {});
      toast.success(label);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed.');
    }
  };

  const right = (
    <span className="chip bg-kds-surface2 text-cream/70 inline-flex items-center gap-1">
      {live ? <Wifi size={11} className="text-ok" /> : <WifiOff size={11} className="text-warn" />}
      {live ? 'Live' : 'Polling'}
      <button onClick={load} className="ml-2" aria-label="Refresh"><RefreshCw size={12} /></button>
    </span>
  );

  return (
    <OpsLayout dark title="Pickup queue" subtitle="Scheduled pickup orders" right={right}>
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-cream/50" /></div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-cream/40 font-fn">No scheduled pickup orders.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map(o => (
            <div key={o.id} data-testid={`chef-pickup-${o.id}`}
              className={`kds-card rounded-lg border-t-4 ${PRIORITY_STYLE[o.priority] || 'border-t-cream/30'} p-4`}>
              <div className="flex items-center justify-between">
                <div className="font-display text-xl text-cream flex items-center gap-2"><ChefHat size={16} /> {o.customerName}</div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cream/60">{o.priority}</span>
              </div>
              <div className="mt-1 text-sm text-cream/70 font-mono">
                Pickup {new Date(o.pickupTime).toLocaleTimeString()} · ready in {o.minutesUntilReady}m
              </div>
              <div className="mt-3 space-y-1">
                {o.items?.map(it => (
                  <div key={it.id} className="flex justify-between text-sm text-cream/90">
                    <span>{it.quantity}× {it.menuItemName}</span>
                    <span className="text-[10px] font-mono text-cream/50 uppercase self-center">{it.preparationStatus}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                {o.status === 'SCHEDULED' && (
                  <button onClick={() => act(o.id, 'start-preparing', 'Started preparing')}
                    className="flex-1 bg-primary text-white text-xs font-fn py-2 rounded">Start preparing</button>
                )}
                {o.status === 'ISPREPARING' && (
                  <button onClick={() => act(o.id, 'mark-prepared', 'Marked prepared')}
                    className="flex-1 bg-secondary text-white text-xs font-fn py-2 rounded">Mark prepared</button>
                )}
                {(o.status === 'PREPARED' || o.status === 'ISPREPARING') && (
                  <button onClick={() => act(o.id, 'ready', 'Marked ready for pickup')}
                    className="flex-1 bg-ok text-white text-xs font-fn py-2 rounded">Ready for pickup</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </OpsLayout>
  );
}
