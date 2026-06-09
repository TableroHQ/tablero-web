'use client';
import React from 'react';
import Link from 'next/link';
import { Loader2, Plus, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/client';
import { toast } from 'sonner';

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const STATUS_STYLE = {
  AWAITINGPREPAYMENT: 'bg-amber-100 text-amber-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  ISPREPARING: 'bg-orange-100 text-orange-800',
  PREPARED: 'bg-indigo-100 text-indigo-800',
  READYFORPICKUP: 'bg-green-100 text-green-800',
  PICKEDUP: 'bg-teal-100 text-teal-800',
  COMPLETED: 'bg-cream-sub text-ink-body',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function MyPickupOrders() {
  const t = useTranslations('pickup');
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/api/pickup-orders/me')
      .then(data => setOrders(Array.isArray(data) ? data : data?.items ?? []))
      .catch(() => toast.error(t('mine.loadFail')))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="max-w-[760px] mx-auto px-6 md:px-12 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">{t('mine.title')}</h1>
        <Link href="/pickup" className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-fn font-medium inline-flex items-center gap-1">
          <Plus size={14} /> {t('mine.new')}
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-ink-muted" /></div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-ink-muted">{t('mine.none')}</div>
        ) : orders.map(o => (
          <Link key={o.id} href={`/pickup/${o.id}`} data-testid={`pickup-row-${o.id}`}
            className="flex items-center gap-4 bg-white border border-border rounded-xl p-4 hover:border-primary transition">
            <div className="flex-1 min-w-0">
              <div className="font-fn font-semibold">{money(o.totalAmount)} · {t('mine.items', { count: o.items?.length || 0 })}</div>
              <div className="text-sm text-ink-muted">{new Date(o.pickupTime).toLocaleString()}</div>
            </div>
            <span className={`chip ${STATUS_STYLE[o.status] || 'bg-cream-sub text-ink-body'}`}>{o.status}</span>
            <ChevronRight size={16} className="text-ink-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
