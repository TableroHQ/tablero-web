'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MapPin, Phone, Navigation, Clock, Check, Star } from 'lucide-react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { toast } from 'sonner';

export default function DeliveryTracking() {
  const t = useTranslations('delivery');
  const { id } = useParams();
  const [, s] = useStore();
  const [courierPos, setCourierPos] = React.useState({ x: 50, y: 33 });
  const [checkpoints] = React.useState([
    { id: 1, time: '12:04', key: 'cp1', done: true },
    { id: 2, time: '12:09', key: 'cp2', done: true },
    { id: 3, time: '12:14', key: 'cp3', done: true },
  ]);
  const [status, setStatus] = React.useState('EN_ROUTE');
  const [rating, setRating] = React.useState(0);

  React.useEffect(() => {
    if (status !== 'EN_ROUTE') return;
    const tm = setInterval(() => {
      setCourierPos(p => {
        const dx = 75 - p.x, dy = 67 - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 2) { setStatus('ARRIVED'); return p; }
        return { x: p.x + dx * 0.05, y: p.y + dy * 0.05 };
      });
    }, 1200);
    return () => clearInterval(tm);
  }, [status]);

  React.useEffect(() => {
    if (status === 'ARRIVED') {
      s.addNotif({ type: 'delivery.checkpoint', title: t('courierArrivedTitle'), body: t('courierArrivedBody') });
    }
  }, [status]);

  const confirmReceipt = async () => {
    try {
      // Mark delivery order as received (Delivery service is planned — falls back to order status update)
      await api.patch(`/api/orders/${id}/status`, { status: 'SERVED' }).catch(() => {});
    } catch {}
    s.addNotif({ type: 'delivery.confirmed', title: t('deliveryConfirmedTitle'), body: t('deliveryConfirmedBody') });
    setStatus('CONFIRMED');
    toast.success(t('thanksBalance'));
  };

  const submitRating = async () => {
    if (!rating) return toast.error(t('pickStars'));
    toast.success(t('courierRated'));
    setStatus('RATED');
  };

  const title = status === 'EN_ROUTE' ? t('titleEnRoute') : status === 'ARRIVED' ? t('titleArrived') : status === 'CONFIRMED' ? t('titleConfirmed') : t('titleThankYou');

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="label-eyebrow">{t('order')} {id || '#d_001'}</div>
          <h1 className="font-display text-5xl md:text-6xl mt-2">{title}</h1>
        </div>
        <span className={`chip ${status === 'EN_ROUTE' ? 'bg-warn-bg text-warn' : status === 'ARRIVED' ? 'bg-primary/10 text-primary animate-pulse-soft' : 'bg-ok-bg text-ok'}`}>
          {t(`st${status}`)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="aspect-[16/10] rounded-3xl overflow-hidden relative bg-ink" data-testid="tracking-map">
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_30%_40%,#E4883A,transparent_40%),radial-gradient(circle_at_70%_60%,#C8553D,transparent_50%)]" />
            <div className="absolute inset-0 [background:linear-gradient(transparent_31px,#3A332E_32px),linear-gradient(90deg,transparent_31px,#3A332E_32px)] [background-size:32px_32px] opacity-30" />

            {/* Restaurant marker */}
            <div className="absolute" style={{ left: '30%', top: '40%' }}>
              <div className="h-5 w-5 rounded-full bg-secondary ring-4 ring-secondary/30 -translate-x-1/2 -translate-y-1/2" />
              <div className="text-[10px] font-mono text-secondary mt-2 -translate-x-1/2 whitespace-nowrap">{t('mapRestaurant')}</div>
            </div>

            {/* Destination */}
            <div className="absolute" style={{ left: '75%', top: '67%' }}>
              <div className="h-5 w-5 rounded-full bg-primary ring-4 ring-primary/30 -translate-x-1/2 -translate-y-1/2" />
              <div className="text-[10px] font-mono text-primary mt-2 -translate-x-1/2 whitespace-nowrap">{t('mapYou')}</div>
            </div>

            {/* Courier position */}
            <div className="absolute transition-all duration-1000" style={{ left: `${courierPos.x}%`, top: `${courierPos.y}%` }}>
              <div className="h-6 w-6 rounded-full bg-cream ring-4 ring-cream/40 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs">🛵</div>
              <div className="text-[10px] font-mono text-cream mt-3 -translate-x-1/2 whitespace-nowrap">{t('mapCourier')}</div>
            </div>

            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 30 40 Q 52 50 75 67" stroke="#E4883A" strokeWidth="0.6" strokeDasharray="1.5 1.2" fill="none" />
            </svg>

            <div className="absolute bottom-4 left-4 right-4 flex gap-3">
              <div className="flex-1 backdrop-blur bg-white/95 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display text-lg">J</div>
                <div className="flex-1">
                  <div className="font-fn font-semibold">Jamie Okafor</div>
                  <div className="text-xs font-mono text-ink-muted">{t('courierStats')}</div>
                </div>
                <button className="h-11 w-11 rounded-full bg-ok text-white flex items-center justify-center" data-testid="call-courier">
                  <Phone size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <Stat icon={Clock} label={t('statEta')} value={status === 'EN_ROUTE' ? t('etaValue') : t('arrivedValue')} />
            <Stat icon={Navigation} label={t('statDistance')} value={status === 'EN_ROUTE' ? t('distanceValue') : '—'} />
            <Stat icon={MapPin} label={t('statRoute')} value={t('routeValue')} />
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-3xl border border-border p-6" data-testid="checkpoints-list">
            <div className="label-eyebrow mb-4">{t('gpsCheckpoints')}</div>
            <div className="space-y-3">
              {checkpoints.map(cp => (
                <div key={cp.id} className="flex items-start gap-3">
                  <div className="font-mono text-xs text-ink-muted w-12 pt-0.5">{cp.time}</div>
                  <span className={`h-2.5 w-2.5 rounded-full mt-1.5 ${cp.done ? 'bg-primary' : 'bg-cream-sub'}`} />
                  <span className="text-sm font-fn flex-1">{t(cp.key)}</span>
                </div>
              ))}
            </div>
          </div>

          {status === 'ARRIVED' && (
            <div className="bg-primary text-white rounded-3xl p-6">
              <div className="label-eyebrow !text-white/70">{t('actionNeeded')}</div>
              <div className="font-display text-2xl mt-2">{t('confirmReceipt')}</div>
              <p className="text-sm mt-2 text-white/90">{t('fundsHeld')}</p>
              <button onClick={confirmReceipt} className="mt-4 w-full bg-white text-primary py-3 rounded-full font-fn font-semibold inline-flex items-center justify-center gap-2" data-testid="confirm-receipt">
                <Check size={16} /> {t('gotIt')}
              </button>
              <p className="mt-2 text-[10px] font-mono text-white/60 text-center">{t('autoConfirmed')}</p>
            </div>
          )}

          {status === 'CONFIRMED' && (
            <div className="bg-white rounded-3xl border border-border p-6">
              <div className="label-eyebrow">{t('rateJamie')}</div>
              <div className="flex gap-1 mt-4">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRating(n)} className={`p-1 ${rating >= n ? 'text-secondary' : 'text-cream-sub'}`} data-testid={`rate-${n}`}>
                    <Star size={28} fill={rating >= n ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <textarea placeholder={t('optionalComment')} className="w-full mt-3 bg-cream-sub rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary" data-testid="courier-comment" />
              <button onClick={submitRating} className="btn-primary w-full mt-3" data-testid="submit-rating">{t('submitRating')}</button>
            </div>
          )}

          {status === 'RATED' && (
            <div className="bg-ok-bg text-ok rounded-3xl p-6 text-center">
              <Check className="mx-auto mb-2" size={36} />
              <div className="font-display text-xl">{t('allDone')}</div>
              <Link href="/dashboard" className="mt-3 inline-block text-sm font-mono underline">{t('backToDashboard')}</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-cream-sub flex items-center justify-center text-ink-muted">
        <Icon size={16} />
      </div>
      <div>
        <div className="label-eyebrow !text-[9px]">{label}</div>
        <div className="font-display text-xl">{value}</div>
      </div>
    </div>
  );
}
