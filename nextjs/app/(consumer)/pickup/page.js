'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, Minus, Plus, Loader2, Wallet, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/client';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;
const PREPAY_PERCENT = 40;

function normaliseItems(data) {
  if (Array.isArray(data)) return data;
  if (data?.items) return data.items;
  if (data?.categories) return data.categories.flatMap(c => (c.items ?? []).map(i => ({ ...i, cat: c.name })));
  return [];
}

function defaultPickupLocal() {
  const d = new Date(Date.now() + 45 * 60 * 1000);
  d.setSeconds(0, 0);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 16);
}

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function PickupCreate() {
  const t = useTranslations('pickup');
  const router = useRouter();
  const [{ user }] = useStore();
  const [items, setItems] = React.useState([]);
  const [qty, setQty] = React.useState({});
  const [pickupAt, setPickupAt] = React.useState(defaultPickupLocal());
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!RESTAURANT_ID) { setLoading(false); return; }
    api.get(`/api/restaurants/${RESTAURANT_ID}/menu`)
      .then((data) => setItems(
        normaliseItems(data)
          .filter(i => i.isAvailable !== false && i.available !== false)
          .map(i => ({ id: i.id, name: i.name, price: Number(i.price ?? 0), img: i.imageUrl || i.image || '' }))
      ))
      .catch(() => toast.error(t('create.couldNotLoadMenu')))
      .finally(() => setLoading(false));
  }, [t]);

  const setItemQty = (id, delta) =>
    setQty(q => {
      const next = Math.max(0, (q[id] || 0) + delta);
      const copy = { ...q };
      if (next === 0) delete copy[id]; else copy[id] = next;
      return copy;
    });

  const lines = items.filter(i => qty[i.id] > 0);
  const total = lines.reduce((s, i) => s + i.price * qty[i.id], 0);
  const deposit = Math.round(total * PREPAY_PERCENT) / 100;
  const remaining = Math.round((total - deposit) * 100) / 100;

  const submit = async () => {
    if (lines.length === 0) { toast.error(t('create.addOneItem')); return; }
    if (new Date(pickupAt).getTime() <= Date.now()) { toast.error(t('create.pickupFuture')); return; }

    setSubmitting(true);
    try {
      const order = await api.post('/api/pickup-orders', {
        restaurantId: RESTAURANT_ID,
        pickupTime: new Date(pickupAt).toISOString(),
        paymentMethod: 'WALLET',
        items: lines.map(i => ({ menuItemId: i.id, quantity: qty[i.id] })),
      });

      try {
        await api.post('/api/payments', {
          orderId: order.id,
          restaurantId: RESTAURANT_ID,
          amount: order.prepaidAmount,
          currency: order.currency || 'USD',
          provider: 'WALLET',
          paymentType: 'PREPAYMENT',
        });
        toast.success(t('create.placedPaid'));
      } catch (payErr) {
        toast.warning(t('create.depositFailed'), {
          action: { label: t('create.topUp'), onClick: () => router.push('/topup') },
        });
      }

      router.push(`/pickup/${order.id}`);
    } catch (err) {
      const msg = err?.response?.data?.message
        || err?.response?.data?.errors?.Items?.[0]
        || t('create.createFailed');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-12">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="label-eyebrow">{t('create.eyebrow')}</div>
          <h1 className="font-display text-4xl md:text-5xl mt-2">{t('create.title')}</h1>
          <p className="mt-3 text-ink-body max-w-xl">{t('create.subtitle', { percent: PREPAY_PERCENT })}</p>
        </div>
        <Link href="/pickup/mine" className="text-sm font-fn text-primary hover:underline inline-flex items-center gap-1">
          {t('create.myOrders')} <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="space-y-3">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-ink-muted" /></div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-ink-muted">{t('create.noMenu')}</div>
          ) : items.map(i => (
            <div key={i.id} data-testid={`pickup-item-${i.id}`}
              className="flex items-center gap-4 bg-white border border-border rounded-xl p-3">
              {i.img
                ? <img src={i.img} alt={i.name} className="h-14 w-14 rounded-lg object-cover" />
                : <div className="h-14 w-14 rounded-lg bg-cream-sub" />}
              <div className="flex-1 min-w-0">
                <div className="font-fn font-semibold truncate">{i.name}</div>
                <div className="text-sm text-ink-muted">{money(i.price)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setItemQty(i.id, -1)} disabled={!qty[i.id]}
                  className="h-8 w-8 rounded-full border border-border flex items-center justify-center disabled:opacity-30"
                  aria-label={t('create.decrease')}><Minus size={14} /></button>
                <span className="w-6 text-center font-mono">{qty[i.id] || 0}</span>
                <button onClick={() => setItemQty(i.id, 1)}
                  className="h-8 w-8 rounded-full border border-border flex items-center justify-center"
                  aria-label={t('create.increase')}><Plus size={14} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 lg:sticky lg:top-24 space-y-4">
          <div>
            <label className="label-eyebrow flex items-center gap-1"><Clock size={12} /> {t('create.pickupTime')}</label>
            <input type="datetime-local" value={pickupAt} min={defaultPickupLocal()}
              onChange={e => setPickupAt(e.target.value)} data-testid="pickup-time"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-sm font-mono" />
            <p className="text-xs text-ink-muted mt-1.5">{t('create.readyHint')}</p>
          </div>

          <div className="border-t border-border pt-4 space-y-1.5 text-sm">
            {lines.length === 0
              ? <p className="text-ink-muted">{t('create.noItemsYet')}</p>
              : lines.map(i => (
                <div key={i.id} className="flex justify-between">
                  <span className="text-ink-body">{qty[i.id]} × {i.name}</span>
                  <span className="font-mono">{money(i.price * qty[i.id])}</span>
                </div>
              ))}
          </div>

          <div className="border-t border-border pt-4 space-y-1.5">
            <Row label={t('create.total')} value={money(total)} />
            <Row label={t('create.depositDue', { percent: PREPAY_PERCENT })} value={money(deposit)} strong />
            <Row label={t('create.remainingOnCollection')} value={money(remaining)} muted />
          </div>

          <button onClick={submit} disabled={submitting || lines.length === 0} data-testid="pickup-submit"
            className="w-full bg-primary text-primary-foreground rounded-full py-3 font-fn font-medium flex items-center justify-center gap-2 disabled:opacity-40">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
            {t('create.payDeposit', { amount: money(deposit) })}
          </button>
          <p className="text-[11px] text-ink-muted text-center">{t('create.depositWallet')}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong, muted }) {
  return (
    <div className="flex justify-between text-sm">
      <span className={muted ? 'text-ink-muted' : 'text-ink-body'}>{label}</span>
      <span className={`font-mono ${strong ? 'font-bold text-ink' : muted ? 'text-ink-muted' : ''}`}>{value}</span>
    </div>
  );
}
