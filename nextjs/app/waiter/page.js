'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import OpsLayout from '@/components/OpsLayout';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { createHubConnection, startHub } from '@/lib/signalr';
import { Bell, Plus, CheckCircle2, Calendar, UtensilsCrossed, Check, X as XIcon, UserCheck, Loader2, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

// Maps a backend table status to its waiter translation key
const tableStatusKey = (s) => ({ EMPTY: 'statusEmpty', AVAILABLE: 'statusAvailable', OCCUPIED: 'statusOccupied', BILL_REQUESTED: 'statusBillRequested' }[s]);
// Maps a backend reservation status to its waiter translation key
const resStatusKey = (s) => ({ PENDING: 'resPending', CONFIRMED: 'resConfirmed', SEATED: 'resSeated', COMPLETED: 'resCompleted', NO_SHOW: 'resNoShow', CANCELLED: 'resCancelled' }[s]);

export default function Waiter() {
  const t = useTranslations('waiter');
  const [{ user }] = useStore();
  const restaurantId = user.restaurantId;

  const [tab, setTab] = React.useState('floor');
  const [orderTableId, setOrderTableId] = React.useState('');
  const [submitCart, setSubmitCart] = React.useState([]);
  const [tables, setTables] = React.useState([]);
  const [reservations, setReservations] = React.useState([]);
  const [menuItems, setMenuItems] = React.useState([]);
  const [alerts, setAlerts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [hubConnected, setHubConnected] = React.useState(false);

  const loadData = React.useCallback(async () => {
    if (!restaurantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [tablesData, resData, menuData] = await Promise.allSettled([
        api.get(`/api/restaurants/${restaurantId}/tables`),
        api.get(`/api/restaurants/${restaurantId}/reservations`),
        api.get(`/api/restaurants/${restaurantId}/menu`),
      ]);
      if (tablesData.status === 'fulfilled') {
        const t = tablesData.value;
        setTables(Array.isArray(t) ? t : t?.items ?? []);
      }
      if (resData.status === 'fulfilled') {
        const r = resData.value;
        setReservations(Array.isArray(r) ? r : r?.items ?? []);
      }
      if (menuData.status === 'fulfilled') {
        const m = menuData.value;
        const items = Array.isArray(m) ? m : m?.items ?? m?.categories?.flatMap(c => c.items ?? []) ?? [];
        setMenuItems(items.filter(i => i.isAvailable !== false));
      }
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  React.useEffect(() => { loadData(); }, [loadData]);

  // SignalR WaiterHub — notifies this waiter when orders are ready for pickup
  React.useEffect(() => {
    if (!restaurantId || !user.id) return;
    const conn = createHubConnection('waiter');
    conn.onclose(() => setHubConnected(false));
    conn.onreconnected(() => setHubConnected(true));
    conn.onreconnecting(() => setHubConnected(false));

    // The WaiterHub broadcasts OrderPlaced and OrderStatusChanged to the
    // restaurant group. A transition to READY means the kitchen finished an
    // order and it's waiting for pickup — surface that as a floor alert.
    conn.on('OrderStatusChanged', (data) => {
      if (data?.newStatus === 'READY') {
        const alert = {
          id: `alert_${Date.now()}`,
          type: 'READY',
          table: data?.tableId || t('colTable'),
          text: t('orderReadyAlert', { table: data?.tableId || '?' }),
        };
        setAlerts(al => [alert, ...al].slice(0, 10));
        toast.success(t('orderReady', { table: alert.table }));
      }
      loadData();
    });

    conn.on('OrderPlaced', () => loadData());

    startHub(conn).then(ok => {
      if (ok) setHubConnected(true);
      // Hub auto-joins this connection to restaurant-{id} from the JWT claim.
    });

    return () => { conn.stop().catch(() => {}); };
  }, [restaurantId, user.id, loadData]);

  const actOnReservation = async (id, status) => {
    try {
      await api.patch(`/api/reservations/${id}/status`, { status });
      setReservations(l => l.map(r => r.id === id ? { ...r, status } : r));
      const msg = {
        CONFIRMED: t('reservationConfirmed'),
        SEATED: t('guestsSeated'),
        COMPLETED: t('completed'),
        NO_SHOW: t('noShow'),
        CANCELLED: t('cancelled'),
      }[status] || t('updated');
      toast.success(msg);
    } catch (err) {
      toast.error(err.response?.data?.message || t('actionFailed'));
    }
  };

  const activeReservations = reservations.filter(r => !['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(r.status));

  return (
    <OpsLayout title={t('title')} subtitle={t('subtitle', { name: user.name || t('waiter'), n: tables.length })}
      right={
        <span className={`chip ${hubConnected ? 'bg-ok-bg text-ok' : 'bg-cream-sub text-ink-muted'}`}>
          {hubConnected ? <><Wifi size={11} /> {t('signalR')}</> : <><WifiOff size={11} /> {t('polling')}</>}
        </span>
      }>

      <div className="flex gap-2 mb-5 bg-white border border-border rounded-full p-1 w-fit">
        {[
          ['floor', t('floor')],
          ['reservations', t('todaysReservations', { n: activeReservations.length })],
          ['submit', t('submitOrder')],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} data-testid={`waiter-tab-${k}`}
            className={`px-4 py-2 rounded-full text-sm font-fn transition ${tab === k ? 'bg-ink text-white' : 'text-ink-body'}`}>{l}</button>
        ))}
      </div>

      {loading && <div className="py-16 flex justify-center"><Loader2 size={28} className="animate-spin text-ink-muted" /></div>}
      {!loading && tab === 'floor' && <FloorTab tables={tables} alerts={alerts} setAlerts={setAlerts} restaurantId={restaurantId} onAddOrder={(tableId) => { setTab('submit'); setOrderTableId(tableId); }} onSeat={(id) => {
        api.patch(`/api/restaurants/${restaurantId}/tables/${id}/status`, { status: 'OCCUPIED' })
          .then(() => setTables(ts => ts.map(t => t.id === id ? { ...t, status: 'OCCUPIED' } : t)))
          .catch(() => toast.error(t('couldNotUpdateTable')));
      }} />}
      {!loading && tab === 'reservations' && <ReservationsTab list={reservations} actOn={actOnReservation} tables={tables} />}
      {!loading && tab === 'submit' && <SubmitTab menuItems={menuItems} tables={tables} restaurantId={restaurantId} initialTableId={orderTableId} cart={submitCart} onCartChange={setSubmitCart} />}
    </OpsLayout>
  );
}

function FloorTab({ tables, alerts, setAlerts, restaurantId, onAddOrder, onSeat }) {
  const t = useTranslations('waiter');
  const statusLabel = (s) => { const k = tableStatusKey(s); return k ? t(k) : s.replace('_', ' '); };
  const map = { EMPTY: 'border-border bg-white text-ink-muted', AVAILABLE: 'border-border bg-white text-ink-muted', OCCUPIED: 'border-warn/40 bg-warn-bg', BILL_REQUESTED: 'border-primary bg-primary/5' };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(tbl => {
            const status = tbl.status || 'EMPTY';
            const label = tbl.label || tbl.tableNumber || tbl.id;
            return (
              <div key={tbl.id} className={`rounded-2xl border-2 p-5 ${map[status] || map.EMPTY}`} data-testid={`waiter-table-${tbl.id}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-3xl">{label}</div>
                    <div className="text-[10px] font-mono text-ink-muted uppercase tracking-widest">{tbl.zone || tbl.section} · {tbl.seats || tbl.capacity} {t('seats')}</div>
                  </div>
                  <span className={`chip ${(status === 'EMPTY' || status === 'AVAILABLE') ? 'bg-cream-sub text-ink-muted' : status === 'OCCUPIED' ? 'bg-warn text-white' : 'bg-primary text-white'}`}>
                    {statusLabel(status)}
                  </span>
                </div>
                {status !== 'EMPTY' && tbl.total > 0 && <div className="mt-4 font-mono text-2xl font-semibold">${Number(tbl.total).toFixed(2)}</div>}
                <div className="mt-4 flex gap-2">
                  {status === 'OCCUPIED' && (
                    <button onClick={() => onAddOrder && onAddOrder(tbl.id)} className="flex-1 bg-ink text-white text-xs py-2 rounded-lg font-fn" data-testid={`waiter-add-${tbl.id}`}>
                      <Plus size={12} className="inline mr-1" />{t('addOrder')}
                    </button>
                  )}
                  {status === 'BILL_REQUESTED' && (
                    <button onClick={() => toast.success(t('sentToCashier'))} className="flex-1 bg-primary text-white text-xs py-2 rounded-lg font-fn" data-testid={`waiter-bill-${tbl.id}`}>
                      {t('sendToCashier')}
                    </button>
                  )}
                  {(status === 'EMPTY' || status === 'AVAILABLE') && (
                    <button onClick={() => onSeat && onSeat(tbl.id)} className="flex-1 bg-cream-sub text-ink text-xs py-2 rounded-lg font-fn" data-testid={`waiter-seat-${tbl.id}`}>
                      {t('seatGuest')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2"><Bell size={16} className="text-primary" /><div className="label-eyebrow">{t('liveAlerts')}</div></div>
          <div className="mt-4 space-y-3">
            {alerts.map(a => (
              <div key={a.id} className={`p-4 rounded-xl border-l-4 ${a.type === 'READY' ? 'border-ok bg-ok-bg' : 'border-primary bg-primary/5'}`} data-testid={`alert-${a.id}`}>
                <div className="flex justify-between">
                  <span className="font-fn font-semibold">{a.table}</span>
                  <span className="text-[10px] font-mono text-ink-muted">{t('justNow')}</span>
                </div>
                <p className="text-sm text-ink-body mt-1">{a.text}</p>
                <button onClick={() => setAlerts(al => al.filter(x => x.id !== a.id))} className="mt-2 text-xs font-mono text-primary uppercase" data-testid={`ack-${a.id}`}>
                  {t('acknowledge')}
                </button>
              </div>
            ))}
            {alerts.length === 0 && <div className="text-sm text-ink-muted py-6 text-center">{t('allCaughtUp')}</div>}
          </div>
        </div>
      </aside>
    </div>
  );
}

function ReservationsTab({ list, actOn, tables }) {
  const t = useTranslations('waiter');
  const resStatusLabel = (s) => { const k = resStatusKey(s); return k ? t(k) : s; };
  const tableMap = React.useMemo(() => {
    const m = {};
    tables.forEach(tbl => { m[tbl.id] = tbl.label || tbl.tableNumber || tbl.id.slice(-6); });
    return m;
  }, [tables]);
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Calendar size={14} className="text-ink-muted" />
        <div className="label-eyebrow">{t('reservationsTitle')}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-cream-sub/40 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
            <tr>
              <th className="text-left p-3 pl-5">{t('colTime')}</th>
              <th className="text-left p-3">{t('colGuest')}</th>
              <th className="text-left p-3">{t('colParty')}</th>
              <th className="text-left p-3">{t('colTable')}</th>
              <th className="text-left p-3">{t('colStatus')}</th>
              <th className="text-right p-3 pr-5">{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {list.map(r => {
              const resStart = r.reservationStartAt ? new Date(r.reservationStartAt) : null;
              const resTime = resStart ? resStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—';
              return (
              <tr key={r.id} className="border-t border-border" data-testid={`res-row-${r.id}`}>
                <td className="p-3 pl-5 font-mono font-semibold">{resTime}</td>
                <td className="p-3 font-fn">{r.customerName || r.guestName || r.name || '—'}</td>
                <td className="p-3 text-sm">{t('pax', { n: r.partySize })}</td>
                <td className="p-3 text-sm">{r.tableId ? (tableMap[r.tableId] || r.tableId.slice(-6)) : '—'}</td>
                <td className="p-3">
                  <span className={`chip ${r.status === 'CONFIRMED' ? 'bg-ok-bg text-ok' : r.status === 'PENDING' ? 'bg-warn-bg text-warn' : r.status === 'SEATED' ? 'bg-primary/10 text-primary' : r.status === 'COMPLETED' ? 'bg-cream-sub text-ink-muted' : 'bg-err-bg text-err'}`}>
                    {resStatusLabel(r.status)}
                  </span>
                </td>
                <td className="p-3 pr-5 text-right">
                  <div className="inline-flex gap-1">
                    {r.status === 'PENDING'    && <Btn onClick={() => actOn(r.id, 'CONFIRMED')} icon={Check}        testid={`confirm-${r.id}`}>{t('confirm')}</Btn>}
                    {r.status === 'CONFIRMED'  && <Btn onClick={() => actOn(r.id, 'SEATED')}    icon={UserCheck}     testid={`seat-${r.id}`}>{t('seat')}</Btn>}
                    {r.status === 'SEATED'     && <Btn onClick={() => actOn(r.id, 'COMPLETED')} icon={CheckCircle2}  testid={`complete-${r.id}`}>{t('complete')}</Btn>}
                    {(r.status === 'PENDING' || r.status === 'CONFIRMED') && <Btn onClick={() => actOn(r.id, 'NO_SHOW')} icon={XIcon} variant="err" testid={`noshow-${r.id}`}>{t('noShowBtn')}</Btn>}
                  </div>
                </td>
              </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-sm text-ink-muted">{t('noReservations')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubmitTab({ menuItems, tables, restaurantId, initialTableId, cart, onCartChange }) {
  const t = useTranslations('waiter');
  const tc = useTranslations('common');
  const [{ user }] = useStore();
  const setCart = onCartChange;
  const [tableId, setTableId] = React.useState(initialTableId || '');

  React.useEffect(() => {
    if (initialTableId) setTableId(initialTableId);
  }, [initialTableId]);
  const [customerName, setCustomerName] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const sub = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);

  // Show all tables; prefer occupied ones first but allow any table selection
  const occupiedTables = tables.filter(t => t.status !== 'EMPTY' && t.status !== 'AVAILABLE');
  const tableOptions = occupiedTables.length > 0 ? occupiedTables : tables;

  const sendToKitchen = async () => {
    if (!tableId) return toast.error(t('selectTableError'));
    if (cart.length === 0) return toast.error(t('addItemsFirst'));
    if (!restaurantId) return toast.error(t('restaurantNotConfigured'));
    setSubmitting(true);
    try {
      const selectedTable = tables.find(tbl => tbl.id === tableId);
      const tableLabel = selectedTable?.label || selectedTable?.tableNumber || tableId.slice(-6);
      const body = {
        tableId,
        customerName: customerName.trim() || t('orderForTable', { table: tableLabel }),
        items: cart.map(i => ({
          menuItemId: i.id,
          menuItemName: i.name,
          quantity: i.qty,
          unitPrice: Number(i.price),
        })),
      };
      await api.post(`/api/restaurants/${restaurantId}/orders`, body);
      toast.success(t('orderSent', { table: tableLabel }));
      onCartChange([]);
      setCustomerName('');
    } catch (err) {
      toast.error(err.response?.data?.message || t('failedToPlace'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="label-eyebrow flex items-center gap-2"><UtensilsCrossed size={14} /> {t('pickItems')}</div>
            <div className="flex gap-2 flex-wrap">
              <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder={t('guestNamePlaceholder')} data-testid="submit-customer-name"
                className="text-sm font-fn bg-cream-sub rounded-full px-4 py-2 outline-none w-48" />
              <select value={tableId} onChange={e => setTableId(e.target.value)} className="text-sm font-fn bg-cream-sub rounded-full px-4 py-2 outline-none" data-testid="submit-table">
                <option value="">{t('selectTablePlaceholder')}</option>
                {tableOptions.map(tbl => (
                  <option key={tbl.id} value={tbl.id}>{tbl.label || tbl.tableNumber || tbl.id}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {menuItems.map(m => {
              const ex = cart.find(c => c.id === m.id);
              const img = m.imageUrl || m.image || m.img;
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-cream-sub/50 border border-border" data-testid={`submit-item-${m.id}`}>
                  {img ? <img src={img} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-cream-sub flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-fn font-semibold text-sm truncate">{m.name}</div>
                    <div className="text-xs font-mono text-ink-muted">${Number(m.price).toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => setCart(c => ex ? c.map(x => x.id === m.id ? { ...x, qty: x.qty + 1 } : x) : [...c, { ...m, qty: 1 }])}
                    className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0" data-testid={`add-${m.id}`}>
                    <Plus size={16} />
                  </button>
                  {ex && <span className="chip bg-primary text-white">{ex.qty}</span>}
                </div>
              );
            })}
            {menuItems.length === 0 && <div className="col-span-3 text-center py-8 text-sm text-ink-muted">{t('noMenuItems')}</div>}
          </div>
        </div>
      </div>
      <aside className="lg:col-span-4">
        <div className="bg-white rounded-2xl border border-border p-5 sticky top-[88px]">
          <div className="label-eyebrow">{t('orderForTable', { table: tableId || '—' })}</div>
          {cart.length === 0 ? (
            <div className="py-10 text-center text-ink-muted text-sm">{t('addItemsHint')}</div>
          ) : (
            <>
              <div className="mt-4 space-y-2 divide-y divide-border">
                {cart.map(i => (
                  <div key={i.id} className="pt-2 flex justify-between text-sm font-fn">
                    <span>{i.qty}× {i.name}</span>
                    <span className="font-mono">${(Number(i.price) * i.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <hr className="my-4 border-border" />
              <div className="flex justify-between items-end mb-4">
                <span className="font-fn font-semibold">{t('total')}</span>
                <span className="font-display text-2xl">${sub.toFixed(2)}</span>
              </div>
              <button onClick={sendToKitchen} disabled={submitting} className="btn-primary w-full disabled:opacity-50" data-testid="send-to-kitchen">
                {submitting ? tc('sending') : t('sendToKitchen')}
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Btn({ onClick, icon: Icon, children, variant, testid }) {
  return (
    <button onClick={onClick} data-testid={testid}
      className={`px-3 py-1.5 rounded-lg text-xs font-fn inline-flex items-center gap-1 ${variant === 'err' ? 'bg-err-bg text-err hover:bg-err hover:text-white' : 'bg-cream-sub hover:bg-ink hover:text-white transition'}`}>
      <Icon size={12} /> {children}
    </button>
  );
}
