'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, Loader2, Wallet, ChevronLeft, Wifi, WifiOff } from 'lucide-react';
import { api } from '@/lib/client';
import { createHubConnection, startHub } from '@/lib/signalr';
import { toast } from 'sonner';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;
const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const STEPS = [
  { key: 'AWAITINGPREPAYMENT', label: 'Awaiting deposit' },
  { key: 'SCHEDULED',          label: 'Scheduled' },
  { key: 'ISPREPARING',        label: 'Being prepared' },
  { key: 'PREPARED',           label: 'Prepared' },
  { key: 'READYFORPICKUP',     label: 'Ready for pickup' },
  { key: 'PICKEDUP',           label: 'Handed over' },
  { key: 'COMPLETED',          label: 'Completed' },
];

export default function PickupDetail() {
  const { id } = useParams();
  const [order, setOrder] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [paying, setPaying] = React.useState(false);
  const [live, setLive] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = await api.get(`/api/pickup-orders/${id}`);
      setOrder(data);
    } catch {
      toast.error('Could not load this order.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  // Live refresh via the customer notify hub.
  React.useEffect(() => {
    const conn = createHubConnection('notify');
    conn.on('NotificationReceived', () => load());
    conn.onclose(() => setLive(false));
    conn.onreconnected(() => setLive(true));
    startHub(conn).then(ok => setLive(ok));
    return () => { conn.stop().catch(() => {}); };
  }, [load]);

  // Poll fallback when the hub isn't connected.
  React.useEffect(() => {
    if (live) return;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [live, load]);

  const payRemaining = async () => {
    setPaying(true);
    try {
      await api.post('/api/payments', {
        orderId: order.id,
        restaurantId: order.restaurantId || RESTAURANT_ID,
        amount: order.remainingAmount,
        currency: order.currency || 'USD',
        provider: 'WALLET',
        paymentType: 'REMAININGPAYMENT',
      });
      toast.success('Balance paid in full. Thank you!');
      load();
    } catch {
      toast.warning('Could not charge your wallet. Top up and try again.', {
        action: { label: 'Top up', onClick: () => (window.location.href = '/topup') },
      });
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-ink-muted" /></div>;
  if (!order) return <div className="py-32 text-center text-ink-muted">Order not found.</div>;

  const status = order.status;
  const cancelled = status === 'CANCELLED';
  const activeIdx = STEPS.findIndex(s => s.key === status);
  const balanceDue = order.paymentStatus !== 'FULLYPAID' && order.remainingAmount > 0 && !cancelled;

  return (
    <div className="max-w-[760px] mx-auto px-6 md:px-12 py-12">
      <Link href="/pickup/mine" className="text-sm text-ink-muted hover:text-ink inline-flex items-center gap-1">
        <ChevronLeft size={14} /> My pickup orders
      </Link>

      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="label-eyebrow">Pickup order</div>
          <h1 className="font-display text-3xl mt-1">{money(order.totalAmount)} · {order.items?.length || 0} item(s)</h1>
        </div>
        <span className="chip bg-cream-sub text-ink-body inline-flex items-center gap-1">
          {live ? <Wifi size={12} className="text-green-600" /> : <WifiOff size={12} className="text-ink-muted" />}
          {live ? 'Live' : 'Polling'}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-ink-body">
        <Clock size={14} /> Pickup at <span className="font-mono">{new Date(order.pickupTime).toLocaleString()}</span>
      </div>

      {/* Timeline */}
      <div className="mt-8 bg-white border border-border rounded-2xl p-6">
        {cancelled ? (
          <div className="text-center text-red-600 font-fn py-4">This order was cancelled.</div>
        ) : (
          <ol className="space-y-4">
            {STEPS.map((s, idx) => {
              const done = activeIdx >= 0 && idx < activeIdx;
              const current = idx === activeIdx;
              return (
                <li key={s.key} className="flex items-center gap-3">
                  <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${
                    done ? 'bg-green-600 text-white' : current ? 'bg-primary text-primary-foreground' : 'bg-cream-sub text-ink-muted'
                  }`}>
                    {done ? <Check size={14} /> : idx + 1}
                  </span>
                  <span className={`font-fn ${current ? 'font-semibold text-ink' : done ? 'text-ink-body' : 'text-ink-muted'}`}>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Payment */}
      <div className="mt-6 bg-white border border-border rounded-2xl p-6 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-ink-body">Total</span><span className="font-mono">{money(order.totalAmount)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-ink-body">Deposit paid (40%)</span><span className="font-mono">{money(order.prepaidAmount)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-ink-body">Remaining</span><span className="font-mono">{money(order.remainingAmount)}</span></div>
        <div className="flex justify-between text-sm pt-1"><span className="text-ink-muted">Payment status</span><span className="font-mono">{order.paymentStatus}</span></div>

        {balanceDue && (
          <button onClick={payRemaining} disabled={paying} data-testid="pay-remaining"
            className="mt-3 w-full bg-primary text-primary-foreground rounded-full py-3 font-fn font-medium flex items-center justify-center gap-2 disabled:opacity-40">
            {paying ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
            Pay remaining {money(order.remainingAmount)}
          </button>
        )}
      </div>
    </div>
  );
}
