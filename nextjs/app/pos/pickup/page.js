'use client';
import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/client';
import { createHubConnection, startHub } from '@/lib/signalr';
import { Loader2, RefreshCw, Wifi, WifiOff, Check } from 'lucide-react';
import { toast } from 'sonner';

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const STATUS_STYLE = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-cream-sub text-ink-muted',
  REFUNDED: 'bg-cream-sub text-ink-body',
};

export default function CashierPickup() {
  const t = useTranslations('pickup');
  const [payments, setPayments] = React.useState([]);
  const [bills, setBills] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [live, setLive] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [p, b] = await Promise.all([
        api.get('/api/staff/cashier/payments?pageSize=50'),
        api.get('/api/staff/cashier/table-bills').catch(() => []),
      ]);
      setPayments(Array.isArray(p) ? p : p?.items ?? []);
      setBills(Array.isArray(b) ? b : b?.items ?? []);
    } catch {
      toast.error(t('cashier.loadFail'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    const conn = createHubConnection('cashier');
    conn.on('RemainingPaymentCollected', () => { load(); toast.info(t('cashier.awaitConfirm')); });
    conn.on('CashierConfirmationRequired', () => load());
    conn.on('OrderFullyPaid', () => load());
    conn.on('PrepaymentReceived', () => load());
    conn.onclose(() => setLive(false));
    conn.onreconnected(() => setLive(true));
    startHub(conn).then(ok => setLive(ok));
    return () => { conn.stop().catch(() => {}); };
  }, [load, t]);

  React.useEffect(() => {
    if (live) return;
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [live, load]);

  const confirm = async (paymentId) => {
    try {
      await api.patch(`/api/staff/cashier/payments/${paymentId}/confirm`, { reason: 'Cash reconciled' });
      toast.success(t('cashier.confirmed'));
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || t('cashier.confirmFail'));
    }
  };

  const right = (
    <span className="chip bg-cream-sub text-ink-body inline-flex items-center gap-1">
      {live ? <Wifi size={11} className="text-green-600" /> : <WifiOff size={11} className="text-ink-muted" />}
      {live ? t('common.live') : t('common.polling')}
      <button onClick={load} className="ml-2" aria-label={t('common.refresh')}><RefreshCw size={12} /></button>
    </span>
  );

  return (
    <OpsLayout title={t('cashier.title')} subtitle={t('cashier.subtitle')} right={right}>
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-ink-muted" /></div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream-sub text-ink-muted text-left">
                <tr>
                  <th className="px-4 py-2 font-fn">{t('cashier.colOrder')}</th>
                  <th className="px-4 py-2 font-fn">{t('cashier.colType')}</th>
                  <th className="px-4 py-2 font-fn text-right">{t('cashier.colAmount')}</th>
                  <th className="px-4 py-2 font-fn">{t('cashier.colStatus')}</th>
                  <th className="px-4 py-2 font-fn text-right">{t('cashier.colAction')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-muted">{t('cashier.noPayments')}</td></tr>
                ) : payments.map(p => (
                  <tr key={p.id} data-testid={`cashier-payment-${p.id}`} className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-xs">{String(p.orderId).slice(0, 8)}</td>
                    <td className="px-4 py-2">{p.paymentType}</td>
                    <td className="px-4 py-2 text-right font-mono">{money(p.amount)}</td>
                    <td className="px-4 py-2"><span className={`chip ${STATUS_STYLE[p.status] || ''}`}>{p.status}</span></td>
                    <td className="px-4 py-2 text-right">
                      {p.status === 'PENDING' && (
                        <button onClick={() => confirm(p.id)} data-testid={`confirm-${p.id}`}
                          className="bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-xs font-fn inline-flex items-center gap-1">
                          <Check size={12} /> {t('cashier.confirm')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div className="label-eyebrow mb-2">{t('cashier.openTableBills')}</div>
            {bills.length === 0 ? (
              <div className="text-ink-muted text-sm">{t('cashier.noTableBills')}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {bills.map(b => (
                  <div key={b.tableId} className="bg-white border border-border rounded-xl p-4">
                    <div className="text-xs text-ink-muted font-mono">{t('cashier.table')} {String(b.tableId).slice(0, 6)}</div>
                    <div className="font-display text-2xl mt-1">{money(b.totalAmount)}</div>
                    <div className="text-xs text-ink-muted">{t('cashier.openOrders', { count: b.openOrderCount })}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </OpsLayout>
  );
}
