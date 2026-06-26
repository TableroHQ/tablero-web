'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import OpsLayout from '@/components/OpsLayout';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { createHubConnection, startHub, stopHub } from '@/lib/signalr';
import { Bell, Volume2, Printer, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Maps backend order/item statuses to KDS display statuses
const KDS_STATUSES = ['QUEUED', 'PREPARING', 'READY'];

function ageSeconds(createdAt) {
  if (!createdAt) return 0;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

export default function KDS() {
  const t = useTranslations('kds');
  const tc = useTranslations('common');
  const [{ user }] = useStore();
  const restaurantId = user.restaurantId;

  const [tickets, setTickets] = React.useState([]);
  const [tableMap, setTableMap] = React.useState({}); // tableId → label
  const [loading, setLoading] = React.useState(true);
  const [tick, setTick] = React.useState(0);
  const [hubConnected, setHubConnected] = React.useState(false);
  const [audioOn, setAudioOn] = React.useState(true);
  const prevTicketIds = React.useRef(new Set());

  // Tick every second for the elapsed timers
  React.useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Load tables once to build id→label map
  React.useEffect(() => {
    if (!restaurantId) return;
    api.get(`/api/restaurants/${restaurantId}/tables`)
      .then(data => {
        const list = Array.isArray(data) ? data : data?.items ?? [];
        const map = {};
        list.forEach(t => { map[t.id] = t.label || t.tableNumber || t.id.slice(-6); });
        setTableMap(map);
      })
      .catch(() => {});
  }, [restaurantId]);

  const loadQueue = React.useCallback(async () => {
    if (!restaurantId) { setLoading(false); return; }
    try {
      const data = await api.get(`/api/restaurants/${restaurantId}/orders`);
      const orders = Array.isArray(data) ? data : data?.items ?? [];
      // Only show in-kitchen orders (not SERVED, CANCELLED, COMPLETED)
      const active = orders.filter(o => !['SERVED', 'CANCELLED', 'COMPLETED', 'PAID'].includes(o.status));
      setTickets(active.map(o => ({
        id: o.id,
        tableId: o.tableId,
        table: o.tableId ? o.tableId.slice(-6) : (o.type === 'DELIVERY' ? `DLV-${o.id.slice(-3)}` : 'T/O'),
        server: o.waiterName || o.createdBy || '—',
        createdAt: o.createdAt,
        status: o.status || 'QUEUED',
        items: (o.items || o.orderItems || []).map(i => ({
          id: i.id,
          name: i.menuItemName || i.name,
          qty: i.quantity || i.qty || 1,
          mods: i.notes || i.modifiers || '',
          status: i.status || 'QUEUED',
        })),
      })));
    } catch {
      toast.error(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [restaurantId, t]);

  const statusLabel = (s) => ({ QUEUED: t('statusQueued'), PREPARING: t('statusPreparing'), READY: t('statusReady') }[s] || s);

  React.useEffect(() => { loadQueue(); }, [loadQueue]);

  // Play chime when new tickets arrive
  React.useEffect(() => {
    const newIds = new Set(tickets.map(t => t.id));
    const hasNew = tickets.some(t => !prevTicketIds.current.has(t.id));
    if (hasNew && audioOn && prevTicketIds.current.size > 0) playChime();
    prevTicketIds.current = newIds;
  }, [tickets, audioOn]);

  // SignalR KitchenHub — replaces polling when available
  React.useEffect(() => {
    if (!restaurantId) return;
    const conn = createHubConnection('kitchen');
    conn.onclose(() => setHubConnected(false));
    conn.onreconnected(() => setHubConnected(true));
    conn.onreconnecting(() => setHubConnected(false));

    // Listen for real-time order events broadcast by the OrderService KitchenHub.
    conn.on('OrderPlaced',        () => loadQueue());
    conn.on('OrderStatusChanged', () => loadQueue());
    conn.on('ItemStatusChanged', (data) => {
      if (data?.orderId && data?.itemId && data?.status) {
        setTickets(ts => ts.map(t => t.id !== data.orderId ? t : {
          ...t,
          items: t.items.map(i => i.id === data.itemId ? { ...i, status: data.status } : i),
        }));
      }
    });

    startHub(conn).then(ok => {
      if (ok) setHubConnected(true);
      // The hub auto-joins this connection to its restaurant group (restaurant-{id})
      // on connect using the restaurantId claim in the JWT — no client-side join needed.
    });

    return () => { stopHub(conn); };
  }, [restaurantId, loadQueue]);

  // Poll every 15s as a fallback when SignalR is not connected
  React.useEffect(() => {
    if (hubConnected) return;
    const t = setInterval(loadQueue, 15000);
    return () => clearInterval(t);
  }, [loadQueue, hubConnected]);

  // Item-level status is local UI state only — no item-level REST endpoint exists in the gateway.
  // Chefs use Q/P/R buttons as a checklist; the order-level transition happens via callWaiter.
  const updateItemStatus = (orderId, itemId, status) => {
    setTickets(ts => ts.map(t => t.id !== orderId ? t : {
      ...t,
      items: t.items.map(i => i.id === itemId ? { ...i, status } : i),
    }));
  };

  // Progress order to the next backend status in the kitchen workflow.
  // Created → Accepted → Preparing → Ready
  const progressOrder = async (orderId, targetStatus) => {
    try {
      const updated = await api.patch(`/api/orders/${orderId}/status`, { status: targetStatus });
      setTickets(ts => ts.map(t => t.id !== orderId ? t : { ...t, status: (updated?.status || targetStatus).toUpperCase() }));
      if (targetStatus === 'Ready') toast.success(t('waiterCalled'));
      else if (targetStatus === 'Accepted') toast.success(t('orderAccepted'));
      else toast.success(t('orderPreparing'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('failedToUpdate'));
    }
  };

  const allReady = (tk) => tk.items.every(i => i.status === 'READY');

  const right = (
    <div className="flex items-center gap-3">
      <button onClick={loadQueue} className="chip bg-kds-surface2 text-cream/70 hover:text-cream" title={tc('refresh')}>
        <RefreshCw size={12} />
      </button>
      <span className="chip bg-kds-surface2 text-cream/70">
        {hubConnected
          ? <><Wifi size={11} className="text-ok" /> {t('signalR')}</>
          : <><WifiOff size={11} className="text-warn" /> {t('polling')}</>
        }
      </span>
      <span className="font-mono text-xs text-cream/50">{t('openCount', { n: tickets.length })} · {t('readyCount', { n: tickets.filter(allReady).length })}</span>
    </div>
  );

  return (
    <OpsLayout dark title={t('title')} subtitle={t('subtitle')} right={right}>
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 size={28} className="animate-spin text-cream/50" /></div>
      ) : tickets.length === 0 ? (
        <div className="py-20 text-center text-cream/40 font-fn">{t('noOrders')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {tickets.map(tk => {
            const age = ageSeconds(tk.createdAt) + tick * 0; // tick forces re-render
            const overdue = age > 300;
            const ready = allReady(tk);
            return (
              <div key={tk.id} data-testid={`kds-ticket-${tk.id}`}
                className={`kds-card rounded-lg border-t-4 ${ready ? 'border-t-ok' : overdue ? 'border-t-err' : 'border-t-warn'} p-4 ${ready ? 'opacity-95' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-display text-2xl">{(tk.tableId && tableMap[tk.tableId]) || tk.table}</div>
                    <div className="text-[10px] font-mono text-cream/50 uppercase tracking-widest">{tk.server}</div>
                  </div>
                  <div className={`font-mono text-2xl ${overdue ? 'text-err animate-pulse-soft' : 'text-cream'}`}>{fmtTime(age)}</div>
                </div>
                <div className="space-y-2">
                  {tk.items.map((it) => (
                    <div key={it.id} className={`p-3 rounded-md ${it.status === 'READY' ? 'bg-ok/20' : it.status === 'PREPARING' ? 'bg-warn/20' : 'bg-kds-surface2'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-fn font-semibold">{it.qty}× {it.name}</div>
                          {it.mods && <div className="text-[11px] text-cream/60 mt-0.5 italic">{it.mods}</div>}
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-cream/60">{statusLabel(it.status)}</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {KDS_STATUSES.map(s => (
                          <button key={s} onClick={() => updateItemStatus(tk.id, it.id, s)} data-testid={`kds-status-${tk.id}-${it.id}-${s}`}
                            className={`flex-1 text-[10px] font-mono py-1.5 rounded ${it.status === s ? 'bg-cream text-ink' : 'bg-kds-bg text-cream/60 hover:text-cream'}`}>
                            {s[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  {tk.status === 'CREATED' && (
                    <button onClick={() => progressOrder(tk.id, 'Accepted')} className="flex-1 bg-warn text-white text-xs font-fn font-medium py-2 rounded flex items-center justify-center gap-1" data-testid={`kds-accept-${tk.id}`}>
                      {t('btnAccept')}
                    </button>
                  )}
                  {tk.status === 'ACCEPTED' && (
                    <button onClick={() => progressOrder(tk.id, 'Preparing')} className="flex-1 bg-primary text-white text-xs font-fn font-medium py-2 rounded flex items-center justify-center gap-1" data-testid={`kds-prepare-${tk.id}`}>
                      {t('btnStartCooking')}
                    </button>
                  )}
                  {(tk.status === 'PREPARING' || tk.status === 'READY') && (
                    <button onClick={() => progressOrder(tk.id, 'Ready')} disabled={!allReady(tk)} className="flex-1 bg-secondary text-white text-xs font-fn font-medium py-2 rounded flex items-center justify-center gap-1 disabled:opacity-40" data-testid={`kds-call-${tk.id}`}>
                      <Bell size={12} /> {tk.status === 'READY' ? t('btnWaiterCalled') : t('btnCallWaiter')}
                    </button>
                  )}
                  <button onClick={() => { toast.info(t('printingTicket', { table: (tk.tableId && tableMap[tk.tableId]) || tk.table })); window.print(); }} className="bg-kds-bg text-cream/60 hover:text-cream py-2 px-3 rounded" data-testid={`kds-print-${tk.id}`}>
                    <Printer size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={() => setAudioOn(v => !v)} className="fixed bottom-6 right-6 flex items-center gap-2 bg-kds-surface2 rounded-full px-4 py-2 text-xs font-mono text-cream/70 hover:text-cream transition" data-testid="audio-toggle">
        <Volume2 size={14} /> {t('audioChime')} · {audioOn ? t('on') : t('off')}
      </button>
    </OpsLayout>
  );
}
