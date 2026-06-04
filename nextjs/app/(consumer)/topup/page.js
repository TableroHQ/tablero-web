'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { toast } from 'sonner';
import { CreditCard, Wallet, ArrowLeft, Shield, Loader2, Check, Lock } from 'lucide-react';

// Initialise once outside the component tree — Stripe warns against re-creating the promise.
// NEXT_PUBLIC_STRIPE_KEY is the test publishable key; it must match the PaymentService test keys.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '');

// ---------------------------------------------------------------------------
// Stripe confirmation step — shown after the top-up PaymentIntent is created.
// The wallet is credited server-side by the Stripe webhook once the intent
// succeeds, so on success we re-read the authoritative balance from the API.
// ---------------------------------------------------------------------------
function StripeStep({ clientSecret, intentId, onBack, onSuccess, t, tc }) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#E4883A',
        borderRadius: '12px',
        fontFamily: 'system-ui, sans-serif',
      },
    },
  };

  return (
    <div className="fixed inset-0 z-50 bg-cream/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-border shadow-xl w-full max-w-md p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-6 font-fn transition"
          data-testid="stripe-back"
        >
          <ArrowLeft size={16} /> {tc('back')}
        </button>

        <div className="mb-6">
          <div className="label-eyebrow mb-1">{t('securePayment')}</div>
          <h2 className="font-display text-3xl">{t('enterCardDetails')}</h2>
        </div>

        <Elements stripe={stripePromise} options={options}>
          <StripeForm intentId={intentId} onSuccess={onSuccess} t={t} />
        </Elements>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-muted font-mono">
          <Lock size={11} /> {t('securedByStripe')}
        </div>
      </div>
    </div>
  );
}

function StripeForm({ intentId, onSuccess, t }) {
  const stripe = useStripe();
  const elements = useElements();
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setConfirming(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      // redirect: 'if_required' keeps the user on-page for card payments.
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (stripeError) {
      setError(stripeError.message || t('couldNotInitiate'));
      setConfirming(false);
    } else {
      // Prefer the id from the confirmed intent; fall back to the one we created with.
      await onSuccess(paymentIntent?.id || intentId);
    }
  };

  return (
    <div className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-fn" data-testid="stripe-error">
          {error}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!stripe || !elements || confirming}
        className="w-full bg-primary hover:bg-terracotta-dark disabled:opacity-60 text-white py-4 rounded-full font-fn font-semibold transition inline-flex items-center justify-center gap-2"
        data-testid="stripe-confirm"
      >
        {confirming ? (
          <><Loader2 size={16} className="animate-spin" /> {t('processing')}</>
        ) : (
          t('confirmPayment')
        )}
      </button>
    </div>
  );
}

// Credit the wallet synchronously: ask the server to re-read the PaymentIntent from
// Stripe and apply the top-up. This is idempotent with the webhook and works even when
// the local webhook listener isn't running. Returns the COMPLETED balance, or null if
// Stripe still reports the payment as not-yet-succeeded (rare — it reconciles via webhook).
async function confirmCreditedBalance(intentId) {
  const res = await api.post('/api/wallet/topup/confirm', { intentId });
  return res.status === 'COMPLETED' ? res.balance : null;
}

export default function TopUp() {
  const t = useTranslations('topup');
  const tc = useTranslations('common');
  const [state, store] = useStore();
  const { user } = state;
  const [amount, setAmount] = React.useState(50);
  const [processing, setProcessing] = React.useState(false);
  // When a PaymentIntent is created, holds { clientSecret } to render the Stripe step.
  const [stripeCtx, setStripeCtx] = React.useState(null);
  const router = useRouter();
  const quick = [25, 50, 100, 200];

  const submit = async () => {
    if (amount <= 0) return toast.error(t('invalidAmount'));
    setProcessing(true);
    try {
      // Wallet top-up needs no order — funds belong to the authenticated user.
      // Stripe provider returns an intentId + clientSecret (status PENDING); after the
      // card is confirmed we credit the balance via the confirm endpoint (see below).
      const res = await api.post('/api/wallet/topup', {
        amount,
        currency: 'USD',
        provider: 'Stripe',
      });
      if (!res.clientSecret) {
        throw new Error('No Stripe client secret returned from server.');
      }
      setStripeCtx({ clientSecret: res.clientSecret, intentId: res.intentId });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t('couldNotInitiate'));
    } finally {
      setProcessing(false);
    }
  };

  const handleStripeSuccess = async (intentId) => {
    setStripeCtx(null);
    try {
      // Credit synchronously off the confirmed PaymentIntent — no waiting on the webhook.
      const balance = await confirmCreditedBalance(intentId);
      if (balance != null) {
        store.setBalance(balance, user.heldBalance, user.loyaltyPoints);
        toast.success(t('toppedUp', { balance: balance.toFixed(2) }));
      } else {
        // Stripe still reports the payment as not-yet-succeeded (e.g. async method
        // "processing"); it reconciles via the webhook shortly.
        toast.success(t('topupProcessing'));
      }
    } catch {
      // Confirm failed; the payment still succeeded and reconciles via the webhook on next load.
      toast.success(t('topupProcessing'));
    }
    router.push('/dashboard');
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 md:px-12 py-12">
      {stripeCtx && (
        <StripeStep
          clientSecret={stripeCtx.clientSecret}
          intentId={stripeCtx.intentId}
          onBack={() => setStripeCtx(null)}
          onSuccess={handleStripeSuccess}
          t={t}
          tc={tc}
        />
      )}

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
