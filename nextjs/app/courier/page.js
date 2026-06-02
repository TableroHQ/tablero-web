'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import OpsLayout from '@/components/OpsLayout';
import { COURIER_ORDERS } from '@/lib/mock';
import { api } from '@/lib/client';
import { MapPin, Navigation, CheckCircle2, Phone, Power } from 'lucide-react';
import { toast } from 'sonner';

const CHECKPOINTS = [
  { time: '12:04', key: 'cp1' },
  { time: '12:09', key: 'cp2' },
  { time: '12:14', key: 'cp3' },
];

export default function Courier() {
  const t = useTranslations('courier');
  const [online, setOnline] = React.useState(true);
  const [active, setActive] = React.useState(null);
  const [orders, setOrders] = React.useState([]);

  // Pull live delivery orders; a delivery that is READY is available to grab,
  // anything earlier in the pipeline is shown as already assigned/in-prep.
  React.useEffect(() => {
    api.get('/api/orders/deliveries')
      .then(data => {
        const list = (Array.isArray(data) ? data : []).map(o => ({
          id: o.id,
          address: o.deliveryAddress || o.customerName,
          distance: '—',
          payout: Number(o.totalAmount) || 0,
          items: o.items?.length || 0,
          status: o.status === 'READY' ? 'AVAILABLE' : 'ASSIGNED',
        }));
        setOrders(list);
        setActive(list.find(o => o.status === 'ASSIGNED') || null);
      })
      .catch(() => {
        setOrders(COURIER_ORDERS);
        setActive(COURIER_ORDERS.find(o => o.status === 'ASSIGNED') || null);
      });
  }, []);

  return (
    <OpsLayout title={t('title')} subtitle={t('subtitle', { count: orders.length })}
      right={
        <button onClick={() => setOnline(o => !o)} data-testid="online-toggle"
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-fn font-medium ${online ? 'bg-ok text-white' : 'bg-cream-sub text-ink-muted'}`}>
          <Power size={14} /> {online ? t('online') : t('offline')}
        </button>
      }>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[16/10] rounded-2xl overflow-hidden relative bg-ink">
            <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_30%_40%,#E4883A,transparent_40%),radial-gradient(circle_at_70%_60%,#C8553D,transparent_50%)]" />
            <div className="absolute inset-0 [background:linear-gradient(transparent_31px,#3A332E_32px),linear-gradient(90deg,transparent_31px,#3A332E_32px)] [background-size:32px_32px] opacity-20" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-secondary ring-4 ring-secondary/30 animate-pulse-soft" />
            <div className="absolute bottom-1/3 right-1/4 h-4 w-4 rounded-full bg-primary ring-4 ring-primary/30" />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 50 33 Q 65 50 75 67" stroke="#E4883A" strokeWidth="0.5" strokeDasharray="2 1.5" fill="none" />
            </svg>
            <div className="absolute bottom-4 left-4 right-4 backdrop-blur bg-white/95 rounded-2xl p-4 flex items-center gap-3">
              <Navigation className="text-primary" size={20} />
              <div className="flex-1">
                <div className="font-fn font-semibold">{active?.address || t('pickDelivery')}</div>
                <div className="text-xs font-mono text-ink-muted">{active ? t('etaLine', { distance: active.distance }) : t('youAreHere')}</div>
              </div>
              <button onClick={() => { setActive(null); toast.success(t('deliveryConfirmed')); }} className="bg-ok text-white px-4 py-2 rounded-full text-sm font-fn font-semibold" data-testid="courier-delivered">
                <CheckCircle2 size={14} className="inline mr-1" /> {t('delivered')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="label-eyebrow mb-3">{t('gpsCheckpoints')}</div>
            <div className="space-y-2">
              {CHECKPOINTS.map((cp, i) => (
                <div key={i} className="flex items-center gap-3" data-testid={`checkpoint-${i}`}>
                  <div className="font-mono text-xs text-ink-muted w-12">{cp.time}</div>
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="text-sm font-fn">{t(cp.key)}</span>
                </div>
              ))}
              <button onClick={() => toast.success(t('gpsRecorded'))} className="ml-[88px] mt-2 text-xs font-mono text-primary uppercase tracking-widest" data-testid="add-checkpoint">{t('addCheckpoint')}</button>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-5 space-y-3">
          <div className="label-eyebrow">{online ? t('availableBroadcasts') : t('goOnline')}</div>
          {online && orders.map(o => (
            <div key={o.id} className={`bg-white rounded-2xl border p-5 ${o.status === 'ASSIGNED' ? 'border-primary' : 'border-border'}`} data-testid={`courier-order-${o.id}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-ink-muted text-xs font-mono"><MapPin size={12} /> {o.distance}</div>
                  <div className="font-fn font-semibold mt-1">{o.address}</div>
                  <div className="text-xs text-ink-muted mt-1">{t('itemsPaid', { count: o.items })}</div>
                </div>
                <div className="font-display text-2xl text-secondary">${o.payout.toFixed(2)}</div>
              </div>
              <div className="mt-4 flex gap-2">
                {o.status === 'AVAILABLE' ? (
                  <>
                    <button onClick={() => setActive(o)} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-fn font-medium" data-testid={`accept-${o.id}`}>{t('accept')}</button>
                    <button onClick={() => setOrders(os => os.filter(x => x.id !== o.id))} className="bg-cream-sub py-2.5 px-4 rounded-xl text-ink-muted text-sm font-fn" data-testid={`skip-${o.id}`}>{t('skip')}</button>
                  </>
                ) : (
                  <button className="flex-1 bg-ink text-white py-2.5 rounded-xl font-fn font-medium flex items-center justify-center gap-2" data-testid={`call-${o.id}`}>
                    <Phone size={14} /> {t('callCustomer')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </OpsLayout>
  );
}
