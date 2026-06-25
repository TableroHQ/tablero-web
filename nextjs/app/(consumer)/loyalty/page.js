'use client';
import React from 'react';
import { Coins, Lock, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { toast } from 'sonner';
import { LOYALTY_TIER_GOLD } from '@/lib/config';
import { useTranslations } from 'next-intl';
import Reveal from '@/components/Reveal';

export default function Loyalty() {
  const t = useTranslations('loyalty');
  const [state, s] = useStore();
  const { user } = state;
  const points = user.loyaltyPoints;
  const [redeeming, setRedeeming] = React.useState(null);
  const [rewards, setRewards] = React.useState([]);

  // Load the redeemable rewards catalogue from the server.
  React.useEffect(() => {
    api.get('/api/loyalty/rewards')
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setRewards(list.map(r => ({ id: r.id, name: r.name, cost: r.pointsCost, img: r.imageUrl || '' })));
      })
      .catch(() => setRewards([]));
  }, []);

  // Load the server-side loyalty balance so points survive refreshes and reflect spend.
  React.useEffect(() => {
    if (!user.id) return;
    api.get('/api/loyalty/balance')
      .then(data => {
        if (typeof data?.points === 'number') {
          s.setBalance(user.balance, user.heldBalance, data.points);
        }
      })
      .catch(() => {});
  }, [user.id]);

  const redeem = async (b) => {
    if (b.cost > points) return toast.error(t('needMorePoints', { n: b.cost - points }));
    setRedeeming(b.id);
    try {
      const res = await api.post('/api/loyalty/redeem', { bonusId: b.id, bonusName: b.name, cost: b.cost });
      const newPoints = typeof res?.points === 'number' ? res.points : points - b.cost;
      s.setBalance(user.balance, user.heldBalance, newPoints);
      toast.success(t('redeemSuccessToast', { name: b.name }));
    } catch (err) {
      toast.error(err.response?.data?.message || t('couldNotRedeem'));
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow">{t('eyebrow')}</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2 max-w-3xl">{t('title')}</h1>
      <p className="mt-3 text-ink-body max-w-xl">{t('subtitle')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
        <div className="lg:col-span-2 bg-gradient-to-br from-primary to-terracotta-dark text-white rounded-3xl p-8 md:p-10 relative overflow-hidden hover-lift">
          <Sparkles className="absolute top-6 right-6 opacity-20 animate-float" size={120} />
          <div className="label-eyebrow !text-white/70">{t('yourBalance')}</div>
          <div key={points} className="font-display text-7xl md:text-8xl mt-2 animate-pop origin-left">{points.toLocaleString()}</div>
          <div className="font-mono text-sm opacity-80">{t('points')}</div>
          <div className="mt-8 max-w-md">
            <div className="flex justify-between text-xs font-mono mb-2"><span>{t('nextTier')}</span><span>{LOYALTY_TIER_GOLD.toLocaleString()}</span></div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-secondary transition-all duration-700 ease-out" style={{ width: `${Math.min(100, (points / LOYALTY_TIER_GOLD) * 100)}%` }} /></div>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-border p-7 card-interactive">
          <div className="label-eyebrow">{t('howItWorks')}</div>
          <ul className="mt-4 space-y-3 text-sm text-ink-body">
            <li className="flex gap-3"><span className="font-mono text-primary">01</span> {t('step1')}</li>
            <li className="flex gap-3"><span className="font-mono text-primary">02</span> {t('step2')}</li>
            <li className="flex gap-3"><span className="font-mono text-primary">03</span> {t('step3')}</li>
          </ul>
        </div>
      </div>

      <h2 className="font-display text-3xl mt-14">{t('availableRewards')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
        {rewards.map((b, i) => {
          const locked = b.cost > points;
          return (
            <Reveal key={b.id} delay={Math.min(i, 8) * 60}>
            <article className={`group bg-white rounded-3xl border border-border overflow-hidden h-full ${locked ? 'opacity-70' : 'card-interactive'}`} data-testid={`bonus-${b.id}`}>
              <div className="aspect-square relative bg-cream-sub overflow-hidden">
                {b.img
                  ? <img src={b.img} alt={b.name} className={`w-full h-full object-cover transition-transform duration-700 ${locked ? 'grayscale' : 'group-hover:scale-105'}`} onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} />
                  : <div className="absolute inset-0 flex items-center justify-center text-secondary/40"><Coins size={48} className={locked ? '' : 'hover-wiggle'} /></div>}
                {locked && <div className="absolute inset-0 bg-ink/40 flex items-center justify-center"><Lock className="text-white" size={28} /></div>}
              </div>
              <div className="p-5">
                <h3 className="font-fn font-semibold">{b.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="chip bg-secondary/10 text-secondary"><Coins size={12} /> {b.cost} {t('pts')}</span>
                  <button onClick={() => redeem(b)} disabled={locked || redeeming === b.id} className={`text-sm font-fn font-medium text-primary disabled:text-ink-muted tap ${locked || redeeming === b.id ? '' : 'link-underline'}`} data-testid={`redeem-${b.id}`}>
                    {redeeming === b.id ? t('redeeming') : locked ? t('need', { n: b.cost - points }) : t('redeem')}
                  </button>
                </div>
              </div>
            </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
