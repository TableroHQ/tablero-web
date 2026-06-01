'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { toast } from 'sonner';
import { CreditCard, Wallet, ArrowLeft, Shield, Loader2, Check } from 'lucide-react';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;
const NULL_ORDER_ID = '00000000-0000-0000-0000-000000000000';

export default function TopUp() {
  const t = useTranslations('topup');
  const tc = useTranslations('common');
  const [state, store] = useStore();
  const { user } = state;
  const [amount, setAmount] = React.useState(50);
  const [processing, setProcessing] = React.useState(false);
  const [paymentId, setPaymentId] = React.useState(null);
  const router = useRouter();
  const quick = [25, 50, 100, 200];

  const submit = async () => {
    if (amount <= 0) return toast.error(t('invalidAmount'));
    if (!RESTAURANT_ID) return toast.error(t('notConfigured'));
    setProcessing(true);
    try {
      const res = await api.post('/api/payments', {
        orderId: NULL_ORDER_ID,
        restaurantId: RESTAURANT_ID,
        amount,
        currency: 'USD',
        provider: 'Stripe',
      });
      setPaymentId(res.id);
      // Optimistic local balance update — server balance sync via /api/users/me after Stripe confirms
      store.setBalance(user.balance + amount, user.heldBalance, user.loyaltyPoints);
      toast.success(t('paymentCreated', { id: res.id?.slice(-8) }));
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || t('couldNotInitiate'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 md:px-12 py-12">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-ink-body hover:text-primary mb-6" data-testid="back"><ArrowLeft size={14} /> {tc('back')}</button>
      <div className="label-eyebrow">{t('eyebrow')}</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">{t('title')}</h1>
      <p className="mt-3 text-ink-body max-w-md">{t('intro')}</p>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-10">
        <div className="md:col-span-3 space-y-5">
          <div className="bg-white rounded-3xl border border-border p-7">
            <div className="label-eyebrow">{t('amount')}</div>
            <div className="mt-3 relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-display text-3xl text-ink-muted">$</span>
              <input type="number" min="1" value={amount} onChange={e => setAmount(Number(e.target.value) || 0)} data-testid="amount-input"
                className="w-full bg-cream-sub rounded-2xl pl-14 pr-5 py-5 font-display text-5xl outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {quick.map(q => (
                <button key={q} onClick={() => setAmount(q)} data-testid={`quick-${q}`}
                  className={`py-3 rounded-xl font-mono font-semibold ${amount === q ? 'bg-primary text-white' : 'bg-cream-sub hover:bg-cream-warm'}`}>${q}</button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-border p-7">
            <div className="label-eyebrow mb-4">{t('paymentMethod')}</div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-cream-sub">
              <CreditCard size={20} className="text-primary" />
              <div className="flex-1">
                <div className="font-fn font-semibold text-sm">{t('stripeCard')}</div>
                <div className="text-xs font-mono text-ink-muted">{t('securedBy')}</div>
              </div>
              <Check size={16} className="text-ok" />
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-ink-muted"><Shield size={12} /> {t('neverSee')}</div>
          </div>
        </div>

        <aside className="md:col-span-2">
          <div className="bg-ink text-cream rounded-3xl p-7 sticky top-[88px]">
            <div className="label-eyebrow !text-cream/60 flex items-center gap-2"><Wallet size={12} /> {t('summary')}</div>
            <div className="mt-5 space-y-3 text-sm font-mono">
              <div className="flex justify-between"><span className="text-cream/70">{t('currentBalance')}</span><span>${(user.balance || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-cream/70">{t('topupRow')}</span><span>+ ${amount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-cream/70">{t('fee')}</span><span>$0.00</span></div>
            </div>
            <hr className="my-4 border-cream/20" />
            <div className="flex justify-between items-end">
              <span className="label-eyebrow !text-cream/60">{t('newBalance')}</span>
              <span className="font-display text-3xl">${((user.balance || 0) + amount).toFixed(2)}</span>
            </div>
            <button disabled={processing || amount <= 0} onClick={submit} className="mt-6 w-full py-4 rounded-full bg-primary hover:bg-terracotta-dark disabled:opacity-60 font-fn font-semibold transition inline-flex items-center justify-center gap-2" data-testid="confirm-topup">
              {processing ? <><Loader2 size={16} className="animate-spin" /> {t('processing')}</> : t('pay', { amount: amount.toFixed(2) })}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
