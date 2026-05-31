'use client';
import React from 'react';
import Link from 'next/link';
import { Calendar, Coins, Receipt, ArrowRight, Wallet, Star, Bell, ChevronRight } from 'lucide-react';
import { IMG } from '@/lib/mock';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { LOYALTY_NEXT_TARGET } from '@/lib/config';
import { SkeletonRow, SkeletonStat } from '@/components/Skeleton';
import { useTranslations } from 'next-intl';

export default function Dashboard() {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const [state, store] = useStore();
  const { user, hydrated, hasSession } = state;

  const [orders, setOrders] = React.useState([]);
  const [reservations, setReservations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!hydrated) return;
    if (!user.id && !hasSession) { setLoading(false); return; }

    Promise.allSettled([
      api.get('/api/orders/me'),
      api.get('/api/reservations/me'),
      api.get('/api/users/me'),
    ]).then(([ordersRes, resRes, profileRes]) => {
      if (ordersRes.status === 'fulfilled') {
        const d = ordersRes.value;
        setOrders((Array.isArray(d) ? d : d?.items ?? []).slice(0, 5));
      }
      if (resRes.status === 'fulfilled') {
        const d = resRes.value;
        setReservations((Array.isArray(d) ? d : d?.items ?? []).filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').slice(0, 3));
      }
      if (profileRes.status === 'fulfilled') {
        // Pass the full profile so setProfile can populate firstName, lastName, name, etc.
        store.setProfile(profileRes.value);
      }
    }).finally(() => setLoading(false));
  }, [user.id, hydrated, hasSession]);

  const nextRes = reservations[0];
  const loyaltyTarget = LOYALTY_NEXT_TARGET;
  const loyaltyPct = Math.min(100, ((user.loyaltyPoints || 0) / loyaltyTarget) * 100);

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="label-eyebrow">{t('eyebrow')}</div>
          <h1 className="font-display text-5xl md:text-6xl mt-2">{t('hello', { name: user.firstName || (user.name || 'there').split(' ')[0] })}</h1>
          <p className="text-ink-body mt-2">{t('subtitle')}</p>
        </div>
        <Link href="/menu" className="btn-primary inline-flex items-center gap-2" data-testid="dashboard-order-cta">{t('startOrder')} <ArrowRight size={16} /></Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-5 mt-10">
        {loading ? (
          [0,1,2,3].map(i => <SkeletonStat key={i} className="lg:col-span-3" />)
        ) : (
          <>
            <Stat label={t('statLoyalty')} value={(user.loyaltyPoints || 0).toLocaleString()} sub={t('lastVisit')} icon={Coins} accent="primary" testid="stat-loyalty" />
            <Stat label={t('statBalance')} value={`$${(user.balance || 0).toFixed(2)}`} sub={`$${(user.heldBalance || 0).toFixed(2)} held`} icon={Wallet} accent="ink" testid="stat-balance" />
            <Stat label={t('statRating')} value="4.9" sub={t('fromReviews')} icon={Star} accent="amber" testid="stat-rating" />
            <Stat label={t('statReservations')} value={t('upcoming', { n: reservations.length })} sub={nextRes && nextRes.reservationStartAt ? `${t('next')} ${new Date(nextRes.reservationStartAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${new Date(nextRes.reservationStartAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}` : t('noneUpcoming')} icon={Calendar} accent="ok" testid="stat-reservations" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border p-6 md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">{t('upcomingReservations')}</h2>
            <Link href="/reservations" className="text-sm text-primary font-fn flex items-center gap-1">{t('newReservation')} <ChevronRight size={14} /></Link>
          </div>
          {loading ? (
            <div className="mt-5 divide-y divide-border">
              {[0,1,2].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <div className="mt-5 divide-y divide-border">
              {reservations.length === 0 ? (
                <div className="py-8 text-center text-ink-muted text-sm">{t('noUpcomingReservations')}</div>
              ) : reservations.map(r => (
                <div key={r.id} className="py-4 flex items-center gap-4" data-testid={`reservation-${r.id}`}>
                  <div className="h-14 w-14 rounded-2xl bg-cream-sub flex flex-col items-center justify-center font-mono">
                    <span className="text-[10px] text-ink-muted">{r.reservationStartAt ? new Date(r.reservationStartAt).toLocaleString('en', { month: 'short' }).toUpperCase() : '—'}</span>
                    <span className="text-lg font-bold">{r.reservationStartAt ? new Date(r.reservationStartAt).getDate() : '—'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-fn font-semibold">{t('partyOf', { n: r.partySize })}</div>
                    <div className="text-sm text-ink-body">{r.reservationStartAt ? new Date(r.reservationStartAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}</div>
                  </div>
                  <span className={`chip ${r.status === 'CONFIRMED' ? 'bg-ok-bg text-ok' : 'bg-cream-sub text-ink-muted'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-3xl border border-border p-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/10" />
          <div className="relative">
            <div className="label-eyebrow">{t('reward')}</div>
            <h3 className="font-display text-3xl mt-2">{t('freeHotdog', { n: loyaltyTarget.toLocaleString() })}</h3>
            <p className="text-sm text-ink-body mt-2">{t('pointsToGo', { n: Math.max(0, loyaltyTarget - (user.loyaltyPoints || 0)).toLocaleString() })}</p>
            <div className="mt-5 h-2 rounded-full bg-cream-sub overflow-hidden">
              <div className="h-full bg-primary transition-all duration-700" style={{ width: `${loyaltyPct}%` }} />
            </div>
            <Link href="/loyalty" className="mt-5 btn-outline inline-flex items-center gap-2" data-testid="loyalty-cta">{t('viewCatalogue')} <ArrowRight size={14} /></Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border p-6 md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">{t('recentOrders')}</h2>
            <span className="text-xs font-mono text-ink-muted">{t('last30')}</span>
          </div>
          {loading ? (
            <div className="mt-5 divide-y divide-border">
              {[0,1,2,3].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <div className="mt-5 divide-y divide-border">
              {orders.length === 0 ? (
                <div className="py-8 text-center text-ink-muted text-sm">{t('noOrders')}</div>
              ) : orders.map(o => (
                <div key={o.id} className="py-4 flex items-center gap-4" data-testid={`order-${o.id}`}>
                  <div className="h-12 w-12 rounded-xl bg-cream-sub flex items-center justify-center text-ink-muted"><Receipt size={18} /></div>
                  <div className="flex-1">
                    <div className="font-fn font-semibold">{o.tableId ? t('dineIn') : t('takeaway')} · {(o.items || o.orderItems || []).length} items</div>
                    <div className="text-sm text-ink-body">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : o.date}</div>
                  </div>
                  <div className="font-mono text-sm font-semibold">${Number(o.total || o.totalAmount || 0).toFixed(2)}</div>
                  <Link href={`/orders/${o.id}`} className="text-xs text-primary font-fn">{tc('view')}</Link>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-ink text-cream rounded-3xl p-6 relative overflow-hidden">
          <img src={IMG.chef} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className="relative">
            <Bell size={20} className="text-secondary" />
            <h3 className="font-display text-2xl mt-3">{t('liveUpdates')}</h3>
            <p className="text-sm text-cream/80 mt-2">{t('liveSubtitle')}</p>
            <div className="mt-5 space-y-2 text-sm">
              <Pulse>{t('reservationReminder')}</Pulse>
              <Pulse>{t('orderPlaced')}</Pulse>
              <Pulse>{t('bonusEarned')}</Pulse>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon, accent, testid }) {
  const map = { primary: 'bg-primary/10 text-primary', ink: 'bg-ink/5 text-ink', amber: 'bg-warn-bg text-warn', ok: 'bg-ok-bg text-ok' };
  return (
    <div className="lg:col-span-3 bg-white rounded-3xl border border-border p-6" data-testid={testid}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${map[accent]}`}><Icon size={18} /></div>
      <div className="label-eyebrow mt-5">{label}</div>
      <div className="font-display text-4xl mt-1 text-ink">{value}</div>
      <div className="text-xs text-ink-muted mt-1 font-mono uppercase">{sub}</div>
    </div>
  );
}
function Pulse({ children }) {
  return <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-secondary animate-pulse-soft" /> <span className="text-cream/90">{children}</span></div>;
}
