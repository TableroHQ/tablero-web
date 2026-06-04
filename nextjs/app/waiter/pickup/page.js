'use client';
import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { api } from '@/lib/client';
import { createHubConnection, startHub } from '@/lib/signalr';
import { Loader2, RefreshCw, Wifi, WifiOff, Package, HandCoins } from 'lucide-react';
import { toast } from 'sonner';

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function WaiterPickup() {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [live, setLive] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = await api.get('/api/staff/waiter/ready-pickup-orders');
      setOrders(Array.isArray(data) ? data : data?.items ?? []);
    } catch {
      toast.error('Could not load ready pickup orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    const conn = createHubConnection('waiter');
    conn.on('OrderReadyForPackaging', () => { load(); toast.info('A pickup order is ready for handoff'); });
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

  const collect = async (id) => {
    try {
      await api.patch(`/api/staff/waiter/pickup-orders/${id}/collect-remaining-payment`, { method: 'CASH' });
      toast.success('Remaining payment recorded — cashier will confirm.');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not record payment.');
    }
  };

  const handOver = async (id) => {
    try {
      await api.patch(`/api/staff/waiter/pickup-orders/${id}/mark-packaged`, {});
      toast.success('Order handed over.');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not hand over order.');
    }
  };

  const right = (
    <span className="chip bg-cream-sub text-ink-body inline-flex items-center gap-1">
      {live ? <Wifi size={11} className="text-green-600" /> : <WifiOff size={11} className="text-ink-muted" />}
      {live ? 'Live' : 'Polling'}
      <button onClick={load} className="ml-2" aria-label="Refresh"><RefreshCw size={12} /></button>
    </span>
  );

  return (
    <OpsLayout title="Pickup handoff" subtitle="Ready for packaging" right={right}>
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-ink-muted" /></div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-ink-muted">No orders ready for pickup.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map(o => {
            const balanceDue = o.paymentStatus !== 'FULLYPAID' && o.remainingAmount > 0;
            return (
              <div key={o.id} data-testid={`waiter-pickup-${o.id}`} className="bg-white border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="font-fn font-semibold">{o.customerName}</div>
                  <span className="chip bg-green-100 text-green-800">{o.status}</span>
                </div>
                <div className="text-sm text-ink-muted mt-1">Pickup {new Date(o.pickupTime).toLocaleTimeString()}</div>
                <div className="mt-3 space-y-1 text-sm">
                  {o.items?.map(it => <div key={it.id}>{it.quantity}× {it.menuItemName}</div>)}
                </div>
                <div className="mt-3 flex justify-between text-sm border-t border-border pt-3">
                  <span className="text-ink-muted">Balance</span>
                  <span className="font-mono">{money(o.remainingAmount)} · {o.paymentStatus}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  {balanceDue && (
                    <button onClick={() => collect(o.id)}
                      className="flex-1 border border-border text-ink-body text-xs font-fn py-2 rounded inline-flex items-center justify-center gap-1">
                      <HandCoins size={14} /> Collect balance
                    </button>
                  )}
                  <button onClick={() => handOver(o.id)}
                    className="flex-1 bg-primary text-primary-foreground text-xs font-fn py-2 rounded inline-flex items-center justify-center gap-1">
                    <Package size={14} /> Hand over
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </OpsLayout>
  );
}
