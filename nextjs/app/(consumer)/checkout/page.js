'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, MapPin, Wallet, CreditCard, Coins, Plus, Minus, Loader2, ArrowLeft, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { toast } from 'sonner';
import { DELIVERY_FEE } from '@/lib/config';
import { useTranslations } from 'next-intl';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;

// Initialise once outside the component tree — Stripe warns against re-creating the promise
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '');

// ---------------------------------------------------------------------------
// Stripe confirmation step (shown after PaymentIntent is created)
// ---------------------------------------------------------------------------
function StripeStep({ clientSecret, orderId, onBack, onSuccess, t }) {
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
        >
          <ArrowLeft size={16} /> {t('backToCheckout')}
        </button>

        <div className="mb-6">
          <div className="label-eyebrow mb-1">{t('securePayment')}</div>
          <h2 className="font-display text-3xl">{t('enterCardDetails')}</h2>
        </div>

        <Elements stripe={stripePromise} options={options}>
          <StripeForm orderId={orderId} onBack={onBack} onSuccess={onSuccess} t={t} />
        </Elements>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-muted font-mono">
          <Lock size={11} /> {t('securedByStripe')}
        </div>
      </div>
    </div>
  );
}

function StripeForm({ orderId, onBack, onSuccess, t }) {
  const stripe = useStripe();
  const elements = useElements();
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState(null);
  const router = useRouter();

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setConfirming(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      // redirect: 'if_required' keeps the user on-page when no redirect-based
      // payment method is chosen (covers cards, wallets, etc.).
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}`,
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.');
      setConfirming(false);
    } else {
      onSuccess(orderId);
    }
  };

  return (
    <div className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-fn">
          {error}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!stripe || !elements || confirming}
        className="w-full bg-primary hover:bg-terracotta-dark disabled:opacity-60 text-white py-4 rounded-full font-fn font-semibold transition inline-flex items-center justify-center gap-2"
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

// ---------------------------------------------------------------------------
// Main checkout page
// ---------------------------------------------------------------------------
export default function Checkout() {
  const t = useTranslations('checkout');
  const [state, store] = useStore();
  const { user } = state;

  // Always read directly from the store — avoids a race where the one-time
  // useEffect captured an empty cart before the store hydrated from localStorage.
  const cart = state.cart;

  const [pay, setPay] = React.useState('balance');
  const [type, setType] = React.useState('delivery');
  const [address, setAddress] = React.useState('');
  const [placing, setPlacing] = React.useState(false);
  // When provider is Stripe, holds { clientSecret, orderId } to render Stripe step
  const [stripeCtx, setStripeCtx] = React.useState(null);
  const router = useRouter();

  const sub = cart.reduce(
    (acc, i) => acc + Number(i.price || i.unitPrice || 0) * Number(i.qty || i.quantity || 1),
    0
  );
  const fee = cart.length > 0 && type === 'delivery' ? DELIVERY_FEE : 0;
  const total = sub + fee;

  const changeQty = (id, d) => { store.changeQty(id, d); };
  const removeItem = (id) => { store.removeCart(id); };

  const placeOrder = async () => {
    if (cart.length === 0) return toast.error(t('emptyCartError'));
    if (!RESTAURANT_ID) return toast.error('Restaurant not configured — set NEXT_PUBLIC_RESTAURANT_ID');
    setPlacing(true);
    try {
      // 1. Create the order
      const orderBody = {
        tableId: null,
        type: type === 'delivery' ? 'DELIVERY' : 'DINE_IN',
        deliveryAddress: type === 'delivery' ? address : null,
        customerName: user.name || user.username || 'Guest',
        customerPhoneNumber: user.phone || null,
        specialRequest: type === 'delivery' ? `Delivery to: ${address}` : null,
        items: cart.map(i => ({
          menuItemId: i.id,
          menuItemName: i.name,
          quantity: i.qty || i.quantity || 1,
          unitPrice: Number(i.price || i.unitPrice || 0),
          notes: i.notes || null,
        })),
      };
      const order = await api.post(`/api/restaurants/${RESTAURANT_ID}/orders`, orderBody);

      // 2. Create payment record
      const paymentBody = {
        orderId: order.id,
        restaurantId: RESTAURANT_ID,
        amount: order.totalAmount ?? total,
        currency: order.currency || 'USD',
        provider: pay === 'card' ? 'Stripe' : 'Cash',
      };
      const payment = await api.post('/api/payments', paymentBody);

      if (pay === 'card') {
        // Backend returned a Stripe clientSecret — show the card form
        if (!payment.clientSecret) {
          throw new Error('No Stripe client secret returned from server.');
        }
        setStripeCtx({ clientSecret: payment.clientSecret, orderId: order.id });
        // Don't navigate yet; StripeStep will handle the rest
      } else {
        // Cash / balance — order placed, go straight to order page
        store.clearCart();
        toast.success(t('orderPlacedToast'));
        router.push(`/orders/${order.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  const handleStripeSuccess = (orderId) => {
    store.clearCart();
    setStripeCtx(null);
    toast.success(t('paymentConfirmedToast'));
    router.push(`/orders/${orderId}`);
  };

  const handleStripeBack = () => {
    setStripeCtx(null);
  };

  return (
    <>
      {/* Stripe confirmation overlay */}
      {stripeCtx && (
        <StripeStep
          clientSecret={stripeCtx.clientSecret}
          orderId={stripeCtx.orderId}
          onBack={handleStripeBack}
          onSuccess={handleStripeSuccess}
          t={t}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
        <div className="label-eyebrow">{t('eyebrow')}</div>
        <h1 className="font-display text-5xl md:text-6xl mt-2">{t('title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex gap-2">
              {[['delivery', t('delivery')], ['table', t('orderAtTable')]].map(([k, l]) => (
                <button key={k} onClick={() => setType(k)} data-testid={`type-${k}`}
                  className={`px-5 py-2.5 rounded-full text-sm font-fn ${type === k ? 'bg-ink text-white' : 'bg-white border border-border'}`}>{l}</button>
              ))}
            </div>

            {type === 'delivery' && (
              <div className="bg-white rounded-3xl border border-border p-6 md:p-7">
                <div className="label-eyebrow mb-4">{t('deliveryTo')}</div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><MapPin size={20} /></div>
                  <div className="flex-1">
                    <input data-testid="address-input" value={address} onChange={e => setAddress(e.target.value)}
                      placeholder={t('addressPlaceholder')}
                      className="w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" />
                    <DeliveryMap address={address} />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-border p-6 md:p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">{t('yourOrder')}</h2>
                <span className="text-xs font-mono text-ink-muted">{t('itemsCount', { n: cart.length })}</span>
              </div>
              {cart.length === 0 ? (
                <div className="py-8 text-center text-ink-muted text-sm">{t('emptyCartText')}<a href="/menu" className="text-primary hover:underline">{t('browseMenu')}</a></div>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {cart.map(i => {
                    const price = Number(i.price || i.unitPrice || 0);
                    const qty = i.qty || i.quantity || 1;
                    return (
                      <div key={i.id} className="py-4 flex items-center gap-4" data-testid={`cart-row-${i.id}`}>
                        {i.img || i.imageUrl ? (
                          <img src={i.img || i.imageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                        ) : (
                          <div className="h-16 w-16 rounded-2xl bg-cream-sub" />
                        )}
                        <div className="flex-1">
                          <div className="font-fn font-semibold">{i.name}</div>
                          <div className="text-xs font-mono text-ink-muted">${price.toFixed(2)} {t('eachSuffix')}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => changeQty(i.id, -1)} className="h-8 w-8 rounded-full bg-cream-sub flex items-center justify-center" data-testid={`qty-minus-${i.id}`}><Minus size={14} /></button>
                          <span className="w-6 text-center font-mono">{qty}</span>
                          <button onClick={() => changeQty(i.id, 1)} className="h-8 w-8 rounded-full bg-cream-sub flex items-center justify-center" data-testid={`qty-plus-${i.id}`}><Plus size={14} /></button>
                        </div>
                        <div className="font-mono w-20 text-right">${(price * qty).toFixed(2)}</div>
                        <button onClick={() => removeItem(i.id)} className="text-ink-muted hover:text-err" data-testid={`remove-${i.id}`}><Trash2 size={16} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-border p-6 md:p-7">
              <div className="label-eyebrow mb-4">{t('payment')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PayOption active={pay === 'balance'} onClick={() => setPay('balance')} icon={Wallet} title={t('accountBalance')} sub={`$${(user.balance || 0).toFixed(2)} available`} testid="pay-balance" />
                <PayOption active={pay === 'card'} onClick={() => setPay('card')} icon={CreditCard} title={t('cardViaStripe')} sub="Visa, Mastercard, Apple Pay…" testid="pay-card" />
              </div>
              <label className="flex items-center gap-2 mt-5 text-sm font-fn cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-primary" /> {t('useLoyaltyPoints')} <Coins size={14} className="text-secondary" />
              </label>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-[88px] bg-ink text-cream rounded-3xl p-7">
              <div className="label-eyebrow !text-cream/60">{t('summary')}</div>
              <Row k={t('subtotal')} v={`$${sub.toFixed(2)}`} dark />
              <Row k={type === 'delivery' ? t('deliveryFee') : t('service')} v={`$${fee.toFixed(2)}`} dark />
              <hr className="my-4 border-cream/20" />
              <Row k={t('total')} v={`$${total.toFixed(2)}`} dark big />
              <button onClick={placeOrder} disabled={placing || cart.length === 0} className="mt-6 w-full bg-primary hover:bg-terracotta-dark disabled:opacity-60 py-4 rounded-full font-fn font-semibold transition inline-flex items-center justify-center gap-2" data-testid="place-order">
                {placing ? <><Loader2 size={16} className="animate-spin" /> {t('placing')}</> : pay === 'card' ? t('continueToPayment') : t('placeOrder')}
              </button>
              <p className="mt-3 text-[10px] font-mono text-cream/50 text-center uppercase">
                {pay === 'balance' ? t('balanceHeld') : t('cardCharged')}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Delivery map — OpenStreetMap iframe via Nominatim geocoding (no API key needed)
// ---------------------------------------------------------------------------
function DeliveryMap({ address }) {
  const t = useTranslations('checkout');
  const [coords, setCoords] = React.useState(null);
  const [geocoding, setGeocoding] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    if (!address || address.trim().length < 5) {
      setCoords(null);
      setNotFound(false);
      return;
    }
    setGeocoding(true);
    setNotFound(false);
    const t = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'TableroApp/1.0' } }
      )
        .then(r => r.json())
        .then(data => {
          if (data?.[0]) {
            setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
            setNotFound(false);
          } else {
            setCoords(null);
            setNotFound(true);
          }
        })
        .catch(() => { setCoords(null); setNotFound(false); })
        .finally(() => setGeocoding(false));
    }, 700);
    return () => clearTimeout(t);
  }, [address]);

  if (!address || address.trim().length < 5) {
    return (
      <div className="mt-3 aspect-[16/7] rounded-2xl bg-cream-sub flex items-center justify-center">
        <p className="text-sm text-ink-muted font-fn">{t('enterAddressForMap')}</p>
      </div>
    );
  }

  if (geocoding) {
    return (
      <div className="mt-3 aspect-[16/7] rounded-2xl bg-cream-sub flex items-center justify-center gap-2">
        <Loader2 size={16} className="animate-spin text-ink-muted" />
        <span className="text-sm text-ink-muted font-fn">{t('findingAddress')}</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mt-3 aspect-[16/7] rounded-2xl bg-cream-sub flex items-center justify-center">
        <p className="text-sm text-err font-fn">{t('addressNotFound')}</p>
      </div>
    );
  }

  if (!coords) return null;

  const d = 0.008; // ~800 m bounding box around the pin
  const bbox = `${coords.lon - d},${coords.lat - d},${coords.lon + d},${coords.lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lon}`;

  return (
    <div className="mt-3 rounded-2xl overflow-hidden relative">
      <iframe
        key={src}
        src={src}
        title="Delivery location"
        className="w-full aspect-[16/7] border-0 block"
        loading="lazy"
        referrerPolicy="no-referrer"
        data-testid="delivery-map"
      />
      <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur rounded-full px-3 py-1 font-mono text-xs shadow-md pointer-events-none">
        {t('deliveryEta')}
      </div>
    </div>
  );
}

function PayOption({ active, onClick, icon: Icon, title, sub, testid }) {
  return (
    <button onClick={onClick} data-testid={testid} className={`text-left p-4 rounded-2xl border-2 transition ${active ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-ink/30'}`}>
      <Icon size={20} className={active ? 'text-primary' : 'text-ink-muted'} />
      <div className="mt-3 font-fn font-semibold">{title}</div>
      <div className="text-xs text-ink-muted mt-0.5 font-mono">{sub}</div>
    </button>
  );
}

function Row({ k, v, dark, big }) {
  return (
    <div className={`flex justify-between py-2 ${big ? 'pt-1' : ''}`}>
      <span className={`${dark ? 'text-cream/70' : 'text-ink-body'} text-sm font-fn`}>{k}</span>
      <span className={`${big ? 'font-display text-2xl' : 'font-mono text-sm'} ${dark ? 'text-cream' : ''}`}>{v}</span>
    </div>
  );
}
