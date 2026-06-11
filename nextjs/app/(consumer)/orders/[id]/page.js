'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Clock, Check, Package, ChefHat, Bell, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/client';
import { toast } from 'sonner';

// Match the backend OrderStatus enum: Created → Accepted → Preparing → Ready → Served → Completed
const STEPS = ['CREATED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'];

export default function OrderDetail() {
  const t = useTranslations('orderDetail');
  const { id } = useParams();
  const [order, setOrder] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    api.get(`/api/orders/${id}`)
      .then(setOrder)
      .catch(() => toast.error(t('couldNotLoad')))
      .finally(() => setLoading(false));
  }, [id]);

  // Poll for status changes every 10s while order is active
  React.useEffect(() => {
    if (!order || ['SERVED', 'COMPLETED', 'CANCELLED'].includes(order?.status)) return;
    const tm = setInterval(() => {
      api.get(`/api/orders/${id}`).then(setOrder).catch(() => {});
    }, 10000);
    return () => clearInterval(tm);
  }, [id, order?.status]);

  // Translate a backend status enum, falling back to the raw value if unmapped.
  const st = (s) => { try { return t(`st${s}`); } catch { return s; } };

  if (loading) return <div className="py-24 flex justify-center"><Loader2 size={28} className="animate-spin text-ink-muted" /></div>;
  if (!order) return <div className="py-24 text-center text-ink-muted">{t('notFound')}</div>;

  const items = order.items || order.orderItems || [];
  const sub = items.reduce((s, i) => s + Number(i.price || i.unitPrice || 0) * Number(i.quantity || i.qty || 1), 0);
  // The backend total is authoritative — don't invent a service charge the
  // customer was never billed. Any difference vs the line subtotal is fees.
  const total = Number(order.totalAmount ?? order.total) || sub;
  const fees = Math.max(0, total - sub);
  const stage = STEPS.indexOf(order.status);
  const currentStage = stage >= 0 ? stage : 0;

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-12">
      <Link href="/orders" className="text-sm text-ink-body hover:text-primary mb-6 inline-block" data-testid="back-link">{t('backToOrders')}</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label-eyebrow">{t('eyebrow')}</div>
          <h1 className="font-display text-5xl md:text-6xl mt-2">#{order.id?.slice(-4) || id?.slice(-4)}</h1>
          <p className="text-ink-body mt-1 font-mono text-xs">{order.tableId ? t('dineIn') : t('takeaway')}{order.tableId ? ` · ${t('table')} …${order.tableId.slice(-8)}` : ''}</p>
        </div>
        <span className={`chip ${order.status === 'CANCELLED' ? 'bg-err-bg text-err' : order.status === 'COMPLETED' || order.status === 'SERVED' ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn animate-pulse-soft'}`}>{st(order.status)}</span>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-3xl border border-border p-6 md:p-8 mt-8">
        <div className="flex items-start justify-between relative">
          {STEPS.map((s, i) => {
            const done = i <= currentStage;
            const Icon = [Package, Check, ChefHat, Bell, Check][i] || Check;
            return (
              <div key={s} className="flex-1 flex flex-col items-center relative" data-testid={`timeline-${s}`}>
                {i < STEPS.length - 1 && (
                  <div className={`absolute top-5 left-1/2 w-full h-0.5 ${i < currentStage ? 'bg-primary' : 'bg-cream-sub'}`} />
                )}
                <div className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center ${done ? 'bg-primary text-white' : 'bg-cream-sub text-ink-muted'}`}>
                  <Icon size={16} />
                </div>
                <div className="mt-3 text-center">
                  <div className={`font-fn text-xs font-semibold ${done ? 'text-ink' : 'text-ink-muted'}`}>{st(s)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border p-6 md:p-7">
          <div className="label-eyebrow mb-5">{t('items', { count: items.length })}</div>
          <div className="divide-y divide-border">
            {items.map((it) => {
              const price = Number(it.price || it.unitPrice || 0);
              const qty = Number(it.quantity || it.qty || 1);
              const img = it.imageUrl || it.image || it.img;
              return (
                <div key={it.id} className="py-4 flex items-center gap-4" data-testid={`item-${it.id}`}>
                  {img ? <img src={img} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="h-16 w-16 rounded-2xl bg-cream-sub" />}
                  <div className="flex-1">
                    <div className="font-fn font-semibold">{qty}× {it.menuItemName || it.name}</div>
                    {it.notes && <div className="text-xs italic text-ink-muted">{it.notes}</div>}
                  </div>
                  {it.status && <span className={`chip ${it.status === 'READY' ? 'bg-ok-bg text-ok' : it.status === 'PREPARING' ? 'bg-warn-bg text-warn' : 'bg-cream-sub text-ink-muted'}`}>{st(it.status)}</span>}
                  <div className="font-mono text-sm w-20 text-right">${(price * qty).toFixed(2)}</div>
                </div>
              );
            })}
          </div>
          <hr className="my-5 border-border" />
          <div className="flex justify-between text-sm font-mono"><span>{t('subtotal')}</span><span>${sub.toFixed(2)}</span></div>
          {fees > 0 && (
            <div className="flex justify-between text-sm font-mono"><span>{t('fees')}</span><span>${fees.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between items-end mt-2">
            <span className="font-fn font-semibold">{t('total')}</span>
            <span className="font-display text-3xl">${total.toFixed(2)}</span>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-ink text-cream rounded-3xl p-6">
            <div className="label-eyebrow !text-cream/60">{t('kitchenPulse')}</div>
            <div className="mt-3 space-y-2 text-sm">
              {items.map(it => (
                <Pulse key={it.id} color={it.status === 'READY' ? 'ok' : it.status === 'PREPARING' ? 'warn' : 'muted'}>
                  {it.menuItemName || it.name} — {st(it.status || 'QUEUED')}
                </Pulse>
              ))}
            </div>
            <div className="mt-4 text-[10px] font-mono text-cream/60">{t('pollingNote')}</div>
          </div>

          <div className="bg-white rounded-3xl border border-border p-5">
            <div className="label-eyebrow">{t('needSomething')}</div>
            <button className="mt-3 w-full py-3 rounded-full bg-cream-sub hover:bg-cream-warm text-ink font-fn text-sm inline-flex items-center justify-center gap-2" data-testid="request-bill">
              <Bell size={14} /> {t('requestBill')}
            </button>
            <Link href="/checkout" className="mt-2 w-full block text-center py-3 rounded-full bg-primary text-white font-fn text-sm" data-testid="pay-now">
              {t('payNow')} <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Pulse({ color, children }) {
  const c = { ok: 'bg-ok', warn: 'bg-secondary', muted: 'bg-cream/30', err: 'bg-err' }[color] || 'bg-cream/30';
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${c} animate-pulse-soft`} />
      <span className="text-cream/90">{children}</span>
    </div>
  );
}
