'use client';
import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';
import { toast } from 'sonner';
import { Loader2, ShoppingBag, ArrowRight, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Matches backend OrderStatus enum: Created, Accepted, Preparing, Ready, Served, Completed, Cancelled
const STATUS_CHIP = {
  CREATED:   'bg-cream-sub text-ink-muted',
  ACCEPTED:  'bg-warn-bg text-warn',
  PREPARING: 'bg-warn-bg text-warn',
  READY:     'bg-ok-bg text-ok',
  SERVED:    'bg-ok-bg text-ok',
  COMPLETED: 'bg-primary/10 text-primary',
  CANCELLED: 'bg-err-bg text-err',
};

export default function OrdersPage() {
  const t = useTranslations('orders');
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/api/orders/me')
      .then(data => {
        const list = Array.isArray(data) ? data : data?.items ?? [];
        // Most recent first
        setOrders(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      })
      .catch(() => toast.error(t('couldNotLoad')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow">{t('eyebrow')}</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">{t('title')}</h1>
      <p className="mt-3 text-ink-body max-w-xl">{t('subtitle')}</p>

      <div className="mt-10">
        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 size={28} className="animate-spin text-ink-muted" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-24 text-center">
            <ShoppingBag size={48} className="mx-auto text-ink-muted/40 mb-4" />
            <p className="text-ink-muted text-sm font-fn">{t('noOrders')}</p>
            <Link href="/menu" className="mt-6 inline-block btn-primary hover-sheen">{t('browseMenu')}</Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream-sub/40 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                  <tr>
                    <th className="text-left p-4 pl-6">{t('thOrder')}</th>
                    <th className="text-left p-4">{t('thDate')}</th>
                    <th className="text-left p-4">{t('thType')}</th>
                    <th className="text-left p-4">{t('thItems')}</th>
                    <th className="text-left p-4">{t('thTotal')}</th>
                    <th className="text-left p-4">{t('thStatus')}</th>
                    <th className="text-right p-4 pr-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => {
                    const items = o.items || o.orderItems || [];
                    const total = Number(o.totalAmount || 0);
                    const statusChip = STATUS_CHIP[o.status] || 'bg-cream-sub text-ink-muted';
                    const isActive = !['SERVED', 'CANCELLED', 'COMPLETED'].includes(o.status);
                    return (
                      <tr key={o.id} className="group border-t border-border hover:bg-cream-sub/30 transition-colors duration-200" data-testid={`order-row-${o.id}`}>
                        <td className="p-4 pl-6">
                          <div className="font-fn font-semibold">#{o.id?.slice(-4)}</div>
                          <div className="text-[11px] font-mono text-ink-muted">{o.id?.slice(-12)}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-ink-body">
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                          </div>
                          <div className="text-[11px] font-mono text-ink-muted">
                            {o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-ink-body">
                          {o.tableId ? t('dineIn') : o.type === 'DELIVERY' ? t('delivery') : t('takeaway')}
                        </td>
                        <td className="p-4 text-sm font-mono">{items.length !== 1 ? t('itemPlural', { n: items.length }) : t('itemSingular', { n: items.length })}</td>
                        <td className="p-4 font-mono font-semibold text-sm">
                          {total > 0 ? `$${total.toFixed(2)}` : '—'}
                        </td>
                        <td className="p-4">
                          <span className={`chip ${statusChip} ${isActive ? 'animate-pulse-soft' : ''}`}>
                            {isActive && <Clock size={10} />}
                            {o.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Link href={`/orders/${o.id}`} className="inline-flex items-center gap-1 text-xs font-fn font-medium text-primary link-underline tap" data-testid={`order-detail-${o.id}`}>
                            View <ArrowRight size={12} className="icon-nudge" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
