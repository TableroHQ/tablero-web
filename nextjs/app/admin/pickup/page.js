'use client';
import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/client';
import { createHubConnection, startHub, stopHub } from '@/lib/signalr';
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function AdminPickup() {
  const t = useTranslations('pickup');
  const [summary, setSummary] = React.useState(null);
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [live, setLive] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [s, o] = await Promise.all([
        api.get('/api/director/dashboard/order-payment-summary'),
        api.get('/api/admin/live-orders'),
      ]);
      setSummary(s);
      setOrders(Array.isArray(o) ? o : o?.items ?? []);
    } catch {
      toast.error(t('admin.loadFail'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    const conn = createHubConnection('admin');
    conn.on('LiveOrderUpdated', () => load());
    conn.on('LivePaymentUpdated', () => load());
    conn.on('DashboardMetricsUpdated', () => load());
    conn.onclose(() => setLive(false));
    conn.onreconnected(() => setLive(true));
    startHub(conn).then(ok => setLive(ok));
    return () => { stopHub(conn); };
  }, [load]);

  React.useEffect(() => {
    if (live) return;
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [live, load]);

  const right = (
    <span className="chip bg-cream-sub text-ink-body inline-flex items-center gap-1">
      {live ? <Wifi size={11} className="text-green-600" /> : <WifiOff size={11} className="text-ink-muted" />}
      {live ? t('common.live') : t('common.polling')}
      <button onClick={load} className="ml-2" aria-label={t('common.refresh')}><RefreshCw size={12} /></button>
    </span>
  );

  const cards = summary ? [
    { label: t('admin.today'), value: summary.totalToday },
    { label: t('admin.scheduled'), value: summary.scheduledCount },
    { label: t('admin.preparing'), value: summary.preparingCount },
    { label: t('admin.ready'), value: summary.readyCount },
    { label: t('admin.completed'), value: summary.completedCount },
    { label: t('admin.cancelled'), value: summary.cancelledCount },
    { label: t('admin.totalSales'), value: money(summary.totalSales) },
    { label: t('admin.prepaid'), value: money(summary.totalPrepaid) },
    { label: t('admin.remainingUnpaid'), value: money(summary.remainingUnpaid) },
    { label: t('admin.awaitingCashier'), value: summary.paymentsAwaitingCashier },
  ] : [];

  return (
    <OpsLayout title={t('admin.title')} subtitle={t('admin.subtitle')} right={right}>
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-ink-muted" /></div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {cards.map(c => (
              <div key={c.label} className="bg-white border border-border rounded-xl p-4">
                <div className="label-eyebrow">{c.label}</div>
                <div className="font-display text-2xl mt-1">{c.value}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="label-eyebrow mb-2">{t('admin.liveOrders')}</div>
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream-sub text-ink-muted text-left">
                  <tr>
                    <th className="px-4 py-2 font-fn">{t('admin.colCustomer')}</th>
                    <th className="px-4 py-2 font-fn">{t('admin.colPickup')}</th>
                    <th className="px-4 py-2 font-fn">{t('admin.colStatus')}</th>
                    <th className="px-4 py-2 font-fn">{t('admin.colPayment')}</th>
                    <th className="px-4 py-2 font-fn text-right">{t('admin.colTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-muted">{t('admin.none')}</td></tr>
                  ) : orders.map(o => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="px-4 py-2">{o.customerName}</td>
                      <td className="px-4 py-2 font-mono text-xs">{new Date(o.pickupTime).toLocaleTimeString()}</td>
                      <td className="px-4 py-2"><span className="chip bg-cream-sub text-ink-body">{o.status}</span></td>
                      <td className="px-4 py-2 text-ink-muted">{o.paymentStatus}</td>
                      <td className="px-4 py-2 text-right font-mono">{money(o.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </OpsLayout>
  );
}
