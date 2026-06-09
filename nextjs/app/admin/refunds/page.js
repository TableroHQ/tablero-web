'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import OpsLayout from '@/components/OpsLayout';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { Search, Check, X, AlertCircle, Euro, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_KEY = { PAID: 'stPAID', REFUNDED: 'stREFUNDED', PENDING: 'stPENDING' };

export default function Refunds() {
  const t = useTranslations('adminRefunds');
  const statusLabel = (s) => (STATUS_KEY[s] ? t(STATUS_KEY[s]) : s);
  const [{ user }] = useStore();
  const restaurantId = user.restaurantId;

  const [payments, setPayments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('PAID');
  const [q, setQ] = React.useState('');
  const [selected, setSelected] = React.useState(null);
  const [acting, setActing] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const params = {};
      if (restaurantId) params.restaurantId = restaurantId;
      const data = await api.get('/api/payments', { params });
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setPayments(list);
    } catch {
      toast.error(t('failedLoad'));
    } finally {
      setLoading(false);
    }
  }, [restaurantId, t]);

  React.useEffect(() => { load(); }, [load]);

  const refund = async (payment) => {
    setActing(true);
    try {
      const updated = await api.patch(`/api/payments/${payment.id}/refund`, { reason: 'Approved by admin' });
      setPayments(ps => ps.map(p => p.id === payment.id ? updated : p));
      toast.success(t('refundInitiated'));
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || t('couldNotRefund'));
    } finally {
      setActing(false);
    }
  };

  const list = payments.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (q) {
      const qs = q.toLowerCase();
      return p.id?.toLowerCase().includes(qs) || p.orderId?.toLowerCase().includes(qs);
    }
    return true;
  });

  const pending = payments.filter(p => p.status === 'PAID').length;
  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount || 0), 0);
  const refunded = payments.filter(p => p.status === 'REFUNDED');

  const right = (
    <div className="flex items-center gap-2">
      <button onClick={load} className="chip bg-white border border-border" title="Refresh"><RefreshCw size={12} /></button>
      {pending > 0 && (
        <span className="chip bg-err-bg text-err animate-pulse-soft">
          <AlertCircle size={12} /> {t('refundableChip', { n: pending })}
        </span>
      )}
    </div>
  );

  return (
    <OpsLayout title={t('title')} subtitle={t('subtitle')} right={right}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Kpi n={String(pending)} l={t('kpiPaidRefundable')} color="warn" />
        <Kpi n={`$${totalPaid.toFixed(2)}`} l={t('kpiPaidAmount')} color="warn" />
        <Kpi n={String(refunded.length)} l={t('kpiRefunded30d')} color="ok" />
        <Kpi n={`$${refunded.reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2)}`} l={t('kpiRefundedTotal')} />
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-border rounded-full px-4 py-2 flex-1 max-w-md">
          <Search size={14} className="text-ink-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('searchPlaceholder')}
            className="bg-transparent outline-none flex-1 text-sm" data-testid="refund-search" />
        </div>
        <div className="flex bg-white border border-border rounded-full p-1">
          {[['all', t('filterAll')], ['PAID', t('filterPaid')], ['REFUNDED', t('filterRefunded')], ['PENDING', t('filterPending')]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} data-testid={`refund-filter-${k.toLowerCase()}`}
              className={`px-3 py-1.5 text-xs font-mono rounded-full ${filter === k ? 'bg-ink text-white' : 'text-ink-body'}`}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 size={24} className="animate-spin text-ink-muted" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cream-sub/40 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                    <tr>
                      <th className="text-left p-3 pl-5">{t('thPaymentId')}</th>
                      <th className="text-left p-3">{t('thOrder')}</th>
                      <th className="text-left p-3">{t('thAmount')}</th>
                      <th className="text-left p-3">{t('thProvider')}</th>
                      <th className="text-left p-3">{t('thStatus')}</th>
                      <th className="text-left p-3">{t('thDate')}</th>
                      <th className="text-right p-3 pr-5">{t('thAction')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(p => (
                      <tr key={p.id} onClick={() => setSelected(p)}
                        className={`border-t border-border cursor-pointer hover:bg-cream-sub/30 ${selected?.id === p.id ? 'bg-primary/5' : ''}`}
                        data-testid={`refund-${p.id}`}>
                        <td className="p-3 pl-5 font-mono text-xs text-ink-muted">{p.id?.slice(-8)}</td>
                        <td className="p-3 font-mono text-sm">{p.orderId?.slice(-8)}</td>
                        <td className="p-3 font-mono font-semibold text-sm">${Number(p.amount || 0).toFixed(2)}</td>
                        <td className="p-3 text-xs text-ink-muted">{p.provider}</td>
                        <td className="p-3">
                          <span className={`chip ${p.status === 'PAID' ? 'bg-ok-bg text-ok' : p.status === 'REFUNDED' ? 'bg-primary/10 text-primary' : p.status === 'PENDING' ? 'bg-warn-bg text-warn' : 'bg-cream-sub text-ink-muted'}`}>
                            {statusLabel(p.status)}
                          </span>
                        </td>
                        <td className="p-3 text-xs font-mono text-ink-muted">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-3 pr-5 text-right">
                          {p.status === 'PAID' && (
                            <button onClick={(e) => { e.stopPropagation(); refund(p); }} disabled={acting}
                              className="p-2 rounded-lg bg-err-bg hover:bg-err text-err hover:text-white transition disabled:opacity-50"
                              data-testid={`approve-${p.id}`}><Check size={14} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {list.length === 0 && (
                      <tr><td colSpan={7} className="p-10 text-center text-ink-muted">{t('noMatch')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5">
            {selected ? (
              <div className="bg-white rounded-2xl border border-border p-6 sticky top-[88px]">
                <div className="label-eyebrow">{t('detailTitle')}</div>
                <div className="font-display text-4xl mt-2">${Number(selected.amount || 0).toFixed(2)}</div>
                <span className={`chip mt-2 w-fit ${selected.status === 'PAID' ? 'bg-ok-bg text-ok' : selected.status === 'REFUNDED' ? 'bg-primary/10 text-primary' : 'bg-warn-bg text-warn'}`}>
                  {statusLabel(selected.status)}
                </span>
                <div className="mt-5 space-y-3 text-sm">
                  <Row label={t('rowPaymentId')} value={selected.id?.slice(-12)} />
                  <Row label={t('rowOrderId')} value={selected.orderId?.slice(-12)} />
                  <Row label={t('rowProvider')} value={selected.provider} />
                  <Row label={t('rowCurrency')} value={selected.currency} />
                  <Row label={t('rowCreated')} value={selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'} />
                  {selected.paidAt && <Row label={t('rowPaidAt')} value={new Date(selected.paidAt).toLocaleString()} />}
                </div>
                {selected.status === 'PAID' && (
                  <div className="mt-5">
                    <button onClick={() => refund(selected)} disabled={acting}
                      className="w-full bg-err text-white py-3 rounded-xl font-fn font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                      data-testid="detail-approve">
                      {acting ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />} {t('issueRefund')}
                    </button>
                  </div>
                )}
                <p className="mt-3 text-[10px] font-mono text-ink-muted text-center">
                  {selected.status === 'PAID' ? t('footPaid') : t('footOther')}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-border p-10 text-center text-ink-muted">
                <Euro className="mx-auto mb-3 text-ink-muted/40" size={36} />
                <p className="text-sm">{t('emptySelect')}</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </OpsLayout>
  );
}

function Kpi({ n, l, color }) {
  const colors = { err: 'text-err', warn: 'text-warn', ok: 'text-ok' };
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className={`font-display text-3xl ${colors[color] || ''}`}>{n}</div>
      <div className="label-eyebrow mt-1">{l}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="font-fn font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
