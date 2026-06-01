'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import OpsLayout from '@/components/OpsLayout';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { CreditCard, Banknote, SplitSquareHorizontal, Receipt, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Show all in-flight orders on the POS floor; cashier selects which table to bill
const BILL_STATUSES = ['CREATED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'];

export default function POS() {
  const t = useTranslations('pos');
  const tc = useTranslations('common');
  const [{ user }] = useStore();
  const restaurantId = user.restaurantId;

  const [tables, setTables] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [payments, setPayments] = React.useState({});
  const [active, setActive] = React.useState(null);
  const [tendered, setTendered] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [paying, setPaying] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!restaurantId) { setLoading(false); return; }
    try {
      const [tablesData, ordersData] = await Promise.all([
        api.get(`/api/restaurants/${restaurantId}/tables`),
        api.get(`/api/restaurants/${restaurantId}/orders`),
      ]);
      const tList = Array.isArray(tablesData) ? tablesData : tablesData?.items ?? [];
      const oList = Array.isArray(ordersData) ? ordersData : ordersData?.items ?? [];
      const activeOrders = oList.filter(o => BILL_STATUSES.includes(o.status));
      setTables(tList);
      setOrders(activeOrders);
    } catch {
      toast.error(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [restaurantId, t]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  // Build a map from tableId → order
  const tableOrderMap = React.useMemo(() => {
    const map = {};
    for (const o of orders) {
      if (o.tableId) map[o.tableId] = o;
    }
    return map;
  }, [orders]);

  const pendingBills = orders.filter(o => o.status === 'SERVED' || o.status === 'READY');

  const change = active?.order && tendered
    ? parseFloat(tendered) - Number(active.order.totalAmount || 0)
    : 0;

  const selectTable = (tbl) => {
    const order = tableOrderMap[tbl.id] || null;
    setActive({ table: tbl, order });
    setTendered('');
  };

  const getOrCreatePayment = async (order, provider) => {
    // Check if pending payment already exists for this order
    try {
      const existing = await api.get('/api/payments', { params: { orderId: order.id, status: 'PENDING' } });
      const items = Array.isArray(existing) ? existing : existing?.items ?? [];
      const found = items.find(p => p.orderId === order.id && p.status === 'PENDING');
      if (found) return found;
    } catch {}
    // Create new payment
    return api.post('/api/payments', {
      orderId: order.id,
      restaurantId,
      amount: Number(order.totalAmount || 0),
      currency: order.currency || 'USD',
      provider,
    });
  };

  const markPaid = async (provider) => {
    if (!active?.order) return;
    setPaying(true);
    try {
      const payment = await getOrCreatePayment(active.order, provider);
      await api.patch(`/api/payments/${payment.id}/paid`);
      toast.success(t('billPaid', { table: active.table?.label || active.table?.id, provider }));
      setActive(null);
      setTendered('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('couldNotPay'));
    } finally {
      setPaying(false);
    }
  };

  const openBillsTotal = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);

  const right = (
    <div className="flex items-center gap-2">
      <button onClick={load} className="chip bg-white/10 text-cream/70 hover:text-cream" title={tc('refresh')}><RefreshCw size={12} /></button>
      <span className="chip bg-warn-bg text-warn">{t('billsPending', { n: pendingBills.length })}</span>
    </div>
  );

  return (
    <OpsLayout title={t('title')} subtitle={t('subtitle', { name: user.name || t('cashier') })} right={right}>
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 size={28} className="animate-spin text-ink-muted" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="label-eyebrow">{t('floor')}</div>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest">
                  <Legend color="bg-cream-sub" label={t('empty')} />
                  <Legend color="bg-warn" label={t('occupied')} />
                  <Legend color="bg-primary" label={t('billReady')} />
                </div>
              </div>
              {tables.length === 0 ? (
                <div className="py-8 text-center text-ink-muted text-sm">{t('noTables')}</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {tables.map(tbl => {
                    const order = tableOrderMap[tbl.id];
                    const hasBill = order && (order.status === 'SERVED' || order.status === 'READY');
                    const isOccupied = !!order;
                    const sel = active?.table?.id === tbl.id;
                    const colorMap = hasBill
                      ? 'bg-primary text-white animate-pulse-soft'
                      : isOccupied
                        ? 'bg-warn text-white'
                        : 'bg-cream-sub text-ink-muted';
                    const label = tbl.label || tbl.tableNumber || tbl.id?.slice(-4);
                    return (
                      <button key={tbl.id} onClick={() => selectTable(tbl)} data-testid={`pos-table-${tbl.id}`}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center transition ${colorMap} ${sel ? 'ring-4 ring-ink' : ''}`}>
                        <span className="font-display text-2xl">{label}</span>
                        <span className="text-[10px] font-mono opacity-80 mt-1">
                          {order ? `$${Number(order.totalAmount || 0).toFixed(0)}` : '—'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <Kpi n={`$${openBillsTotal.toFixed(0)}`} l={t('openBills')} />
              <Kpi n={String(pendingBills.length)} l={t('awaitingPayment')} />
              <Kpi n={String(orders.length)} l={t('activeOrders')} />
            </div>
          </div>

          <aside className="lg:col-span-5 space-y-4">
            {active ? (
              <div className="bg-white rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="label-eyebrow">{t('billLabel')} · {active.table?.label || active.table?.id?.slice(-4)}</div>
                    <div className="font-display text-3xl mt-1">{active.table?.zone || active.table?.section || '—'}</div>
                  </div>
                  {active.order && (
                    <span className="chip bg-primary/10 text-primary">{active.order.status}</span>
                  )}
                </div>

                {active.order ? (
                  <>
                    <div className="mt-5 space-y-2 text-sm">
                      {(active.order.items || active.order.orderItems || []).map(it => (
                        <div key={it.id} className="flex justify-between font-mono">
                          <span>{it.quantity || it.qty || 1}× {it.menuItemName || it.name}</span>
                          <span>${(Number(it.unitPrice || it.price || 0) * Number(it.quantity || it.qty || 1)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <hr className="my-4 border-border" />
                    <div className="flex justify-between font-mono text-sm"><span>{t('subtotal')}</span><span>${Number(active.order.subtotalAmount || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between mt-2">
                      <span className="font-fn font-semibold">{t('total')}</span>
                      <span className="font-display text-3xl">${Number(active.order.totalAmount || 0).toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-5">
                      <input data-testid="cash-tendered" value={tendered} onChange={e => setTendered(e.target.value)} placeholder={t('tenderedPlaceholder')}
                        className="col-span-3 bg-cream-sub rounded-xl px-4 py-3 font-mono text-lg outline-none focus:ring-2 focus:ring-primary" />
                      {[10, 20, 50, 100, 'EXACT'].map(n => (
                        <button key={n} onClick={() => setTendered(n === 'EXACT' ? String(Number(active.order.totalAmount || 0)) : String(n))} data-testid={`bill-${n}`}
                          className="bg-cream-sub hover:bg-cream-warm font-mono text-sm py-2 rounded-lg">
                          {n === 'EXACT' ? t('exact') : `$${n}`}
                        </button>
                      ))}
                    </div>
                    {tendered && (
                      <div className="mt-3 text-sm font-mono text-right">
                        {t('change')}: <span className={change < 0 ? 'text-err' : 'text-ok font-bold'}>${change.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button onClick={() => markPaid('Mock')} disabled={paying}
                        className="flex items-center justify-center gap-2 bg-ok text-white py-3 rounded-xl font-fn font-semibold disabled:opacity-60" data-testid="pos-cash">
                        {paying ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={16} />} {t('markPaidCash')}
                      </button>
                      <button onClick={() => markPaid('Card')} disabled={paying}
                        className="flex items-center justify-center gap-2 bg-ink text-white py-3 rounded-xl font-fn font-semibold disabled:opacity-60" data-testid="pos-card">
                        <CreditCard size={16} /> {t('card')}
                      </button>
                      <button onClick={() => toast.info(t('splitBillHint'))} className="flex items-center justify-center gap-2 bg-cream-sub py-3 rounded-xl font-fn" data-testid="pos-split">
                        <SplitSquareHorizontal size={16} /> {t('splitBill')}
                      </button>
                      <button onClick={() => { toast.info(t('printingReceipt')); window.print(); }} className="flex items-center justify-center gap-2 bg-cream-sub py-3 rounded-xl font-fn" data-testid="pos-receipt">
                        <Receipt size={16} /> {t('receipt')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center text-ink-muted text-sm">{t('noActiveOrder')}</div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-border p-10 text-center text-ink-muted">{t('selectTable')}</div>
            )}
          </aside>
        </div>
      )}
    </OpsLayout>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-sm ${color}`} />{label}
    </span>
  );
}

function Kpi({ n, l }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="font-display text-3xl">{n}</div>
      <div className="label-eyebrow mt-1">{l}</div>
    </div>
  );
}
