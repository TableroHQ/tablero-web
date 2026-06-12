'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import QRCode from 'react-qr-code';
import {
  Calendar, Users, Loader2, QrCode, Copy, RefreshCw, Ban, Plus, Minus,
  Search, UtensilsCrossed, ArrowRight, Crown,
} from 'lucide-react';
import { api } from '@/lib/client';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';

const INACTIVE_STATUSES = ['CANCELLED', 'COMPLETED', 'NO_SHOW'];

function fmtDatetime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

export default function ReservationDetail() {
  const t = useTranslations('reservationDetail');
  const locale = useLocale();
  const { id } = useParams();
  const router = useRouter();
  const [{ user }] = useStore();

  const [reservation, setReservation] = React.useState(null);
  const [orders, setOrders] = React.useState([]);
  const [members, setMembers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Share state (owner only)
  const [shareToken, setShareToken] = React.useState(null);
  const [shareBusy, setShareBusy] = React.useState(false);

  // Add-order picker state
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [menu, setMenu] = React.useState(null); // null = not loaded yet
  const [loadingMenu, setLoadingMenu] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [picked, setPicked] = React.useState({}); // menuItemId -> { item, qty }
  const [placing, setPlacing] = React.useState(false);

  const isGuest = user.role === 'GUEST';
  const isOwner = reservation && user.id && reservation.customerUserId === user.id;
  const isActive = reservation && !INACTIVE_STATUSES.includes(reservation.status);

  const loadOrders = React.useCallback(() => {
    api.get(`/api/reservations/${id}/orders`)
      .then((data) => setOrders(Array.isArray(data) ? data : data?.items ?? []))
      .catch(() => {});
  }, [id]);

  React.useEffect(() => {
    if (!id || isGuest) return;
    api.get(`/api/reservations/${id}`)
      .then((data) => {
        setReservation(data);
        loadOrders();
        api.get(`/api/reservations/${id}/members`)
          .then((m) => setMembers(Array.isArray(m) ? m : []))
          .catch(() => {});
      })
      .catch(() => setReservation(null))
      .finally(() => setLoading(false));
  }, [id, isGuest, loadOrders]);

  React.useEffect(() => {
    if (isGuest) router.replace(`/login?next=/reservations/${id}`);
  }, [isGuest, id, router]);

  const showQr = async (rotate = false) => {
    setShareBusy(true);
    try {
      const res = await api.post(`/api/reservations/${id}/share${rotate ? '?rotate=true' : ''}`, {});
      setShareToken(res.shareToken);
      if (rotate) toast.success(t('linkRotated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('couldNotShare'));
    } finally {
      setShareBusy(false);
    }
  };

  const revokeShare = async () => {
    setShareBusy(true);
    try {
      await api.delete(`/api/reservations/${id}/share`);
      setShareToken(null);
      toast.success(t('sharingStopped'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('couldNotShare'));
    } finally {
      setShareBusy(false);
    }
  };

  const shareUrl = shareToken && typeof window !== 'undefined'
    ? `${window.location.origin}/reservations/join?token=${shareToken}`
    : null;

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('linkCopied'));
    } catch {
      toast.error(t('couldNotCopy'));
    }
  };

  const openPicker = () => {
    setPickerOpen(true);
    if (menu !== null || loadingMenu) return;
    setLoadingMenu(true);
    api.get(`/api/restaurants/${reservation.restaurantId}/menu`, {
      headers: { 'Accept-Language': locale },
    })
      .then((data) => {
        // The menu API returns { categories: [{ items: [] }] }; older payloads
        // may be a flat list.
        const list = Array.isArray(data)
          ? data
          : data?.items ?? (data?.categories ?? []).flatMap((c) => c.items ?? []);
        const orderable = list.filter((m) =>
          m.isOrderable !== undefined
            ? m.isOrderable
            : (m.isAvailable !== false && (m.stockQuantity == null || m.stockQuantity > 0)));
        setMenu(orderable);
      })
      .catch(() => toast.error(t('couldNotLoadMenu')))
      .finally(() => setLoadingMenu(false));
  };

  const changeQty = (item, delta) => {
    setPicked((p) => {
      const cur = p[item.id]?.qty || 0;
      const qty = Math.max(0, cur + delta);
      const next = { ...p };
      if (qty === 0) delete next[item.id];
      else next[item.id] = { item, qty };
      return next;
    });
  };

  const pickedList = Object.values(picked);
  const pickedTotal = pickedList.reduce((s, x) => s + Number(x.item.price || 0) * x.qty, 0);

  const placeOrder = async () => {
    if (pickedList.length === 0) return toast.error(t('pickSomething'));
    setPlacing(true);
    try {
      const customerName = (user.firstName && user.lastName)
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.name || user.username || 'Guest';
      const body = {
        tableId: null,
        customerName,
        customerPhoneNumber: user.phone || null,
        specialRequest: null,
        items: pickedList.map(({ item, qty }) => ({
          menuItemId: item.id,
          menuItemName: item.name,
          quantity: qty,
          unitPrice: Number(item.price || 0),
          notes: null,
        })),
      };
      await api.post(`/api/reservations/${id}/orders`, body);
      toast.success(t('orderPlaced'));
      setPicked({});
      setPickerOpen(false);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || t('couldNotPlaceOrder'));
    } finally {
      setPlacing(false);
    }
  };

  if (isGuest) return null;
  if (loading) return <div className="py-24 flex justify-center"><Loader2 size={28} className="animate-spin text-ink-muted" /></div>;
  if (!reservation) return (
    <div className="py-24 text-center">
      <div className="text-ink-muted">{t('notFound')}</div>
      <Link href="/reservations" className="mt-4 inline-block text-primary hover:underline text-sm">{t('backToReservations')}</Link>
    </div>
  );

  const menuList = (menu || []).filter((m) => (m.name || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-12">
      <Link href="/reservations" className="text-sm text-ink-body hover:text-primary mb-6 inline-block" data-testid="back-link">{t('backToReservations')}</Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label-eyebrow">{t('eyebrow')}</div>
          <h1 className="font-display text-5xl md:text-6xl mt-2">{fmtDatetime(reservation.reservationStartAt)}</h1>
          <p className="text-ink-body mt-2 font-mono text-xs flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1"><Users size={12} /> {t('partySize', { n: reservation.partySize })}</span>
            {reservation.tableId && <span className="inline-flex items-center gap-1"><Calendar size={12} /> {t('table')} …{reservation.tableId.slice(-6)}</span>}
          </p>
        </div>
        <span className={`chip ${reservation.status === 'CONFIRMED' || reservation.status === 'SEATED' ? 'bg-ok-bg text-ok' : INACTIVE_STATUSES.includes(reservation.status) ? 'bg-err-bg text-err' : 'bg-warn-bg text-warn'}`} data-testid="reservation-status">
          {reservation.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-10">
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {/* ORDERS */}
          <section className="bg-white rounded-3xl border border-border p-6 md:p-7">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={16} className="text-ink-muted" />
                <div className="label-eyebrow">{t('orders')}</div>
              </div>
              {isActive && (
                <button onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())} className="btn-primary inline-flex items-center gap-2 text-sm" data-testid="add-order">
                  <Plus size={14} /> {pickerOpen ? t('closeMenu') : t('addOrder')}
                </button>
              )}
            </div>

            {/* Inline menu picker */}
            {pickerOpen && (
              <div className="mt-5 rounded-2xl border border-border bg-cream-sub/30 p-5" data-testid="order-picker">
                {loadingMenu ? (
                  <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 size={14} className="animate-spin" /> {t('loadingMenu')}</div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 rounded-full bg-white border border-border px-4 py-2">
                      <Search size={14} className="text-ink-muted" />
                      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchMenu')} className="bg-transparent flex-1 outline-none text-sm font-fn" data-testid="picker-search" />
                    </div>
                    <div className="mt-4 max-h-[340px] overflow-y-auto space-y-2 pr-1">
                      {menuList.map((m) => {
                        const qty = picked[m.id]?.qty || 0;
                        return (
                          <div key={m.id} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-border px-4 py-3">
                            <div className="min-w-0">
                              <div className="font-fn text-sm font-medium truncate">{m.name}</div>
                              <div className="text-xs text-ink-muted font-mono">${Number(m.price || 0).toFixed(2)}</div>
                            </div>
                            {qty === 0 ? (
                              <button onClick={() => changeQty(m, +1)} className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0" data-testid={`pick-${m.id}`}><Plus size={14} /></button>
                            ) : (
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => changeQty(m, -1)} className="h-8 w-8 rounded-full bg-cream-sub flex items-center justify-center"><Minus size={14} /></button>
                                <span className="font-mono text-sm w-5 text-center" data-testid={`pick-qty-${m.id}`}>{qty}</span>
                                <button onClick={() => changeQty(m, +1)} className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center"><Plus size={14} /></button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {menuList.length === 0 && <div className="text-sm text-ink-muted py-6 text-center">{t('noMenuMatches')}</div>}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="font-mono text-sm">{t('pickerTotal')}: <span className="font-bold">${pickedTotal.toFixed(2)}</span></div>
                      <button onClick={placeOrder} disabled={placing || pickedList.length === 0} className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-50" data-testid="place-reservation-order">
                        {placing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                        {placing ? t('placing') : t('placeOrder')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Orders list */}
            <div className="mt-5 space-y-3">
              {orders.length === 0 && !pickerOpen && (
                <div className="text-sm text-ink-muted py-6 text-center">{t('noOrders')}</div>
              )}
              {orders.map((o) => (
                <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-cream-sub/50 hover:bg-cream-sub transition" data-testid={`reservation-order-${o.id}`}>
                  <div className="min-w-0">
                    <div className="font-fn font-medium text-sm">#{o.id?.slice(-4)} · {o.customerName}</div>
                    <div className="text-xs text-ink-muted truncate mt-0.5">
                      {(o.items || []).map((i) => `${i.quantity}× ${i.menuItemName}`).join(', ')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`chip text-xs ${o.status === 'CANCELLED' ? 'bg-err-bg text-err' : ['SERVED', 'COMPLETED'].includes(o.status) ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn'}`}>{o.status}</span>
                    <div className="font-mono text-sm mt-1">${Number(o.totalAmount || 0).toFixed(2)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* MEMBERS */}
          <section className="bg-white rounded-3xl border border-border p-6 md:p-7">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-ink-muted" />
              <div className="label-eyebrow">{t('members')}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {members.map((m) => (
                <span key={m.userId} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-sub text-sm font-fn" data-testid={`member-${m.userId}`}>
                  {m.isOwner && <Crown size={12} className="text-primary" />}
                  {m.displayName}{m.userId === user.id ? ` (${t('you')})` : ''}
                </span>
              ))}
              {members.length === 0 && <span className="text-sm text-ink-muted">—</span>}
            </div>
          </section>
        </div>

        {/* SHARE SIDEBAR */}
        <aside className="lg:col-span-4 min-w-0">
          <div className="sticky top-[88px] bg-white rounded-3xl border border-border p-7">
            <div className="flex items-center gap-2">
              <QrCode size={16} className="text-ink-muted" />
              <div className="label-eyebrow">{t('shareTitle')}</div>
            </div>

            {!isOwner ? (
              <p className="mt-4 text-sm text-ink-body">{t('memberShareHint')}</p>
            ) : !isActive ? (
              <p className="mt-4 text-sm text-ink-muted">{t('inactiveShareHint')}</p>
            ) : !shareToken ? (
              <>
                <p className="mt-4 text-sm text-ink-body">{t('shareHint')}</p>
                <button onClick={() => showQr(false)} disabled={shareBusy} className="mt-5 btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50" data-testid="show-qr">
                  {shareBusy ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />} {t('showQr')}
                </button>
              </>
            ) : (
              <>
                <div className="mt-5 bg-white p-4 rounded-2xl border border-border flex justify-center" data-testid="share-qr">
                  <QRCode value={shareUrl || ''} size={180} />
                </div>
                <p className="mt-3 text-[11px] text-ink-muted text-center font-mono break-all">{shareUrl}</p>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  <button onClick={copyLink} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-border text-sm font-fn hover:border-ink/30" data-testid="copy-share-link">
                    <Copy size={14} /> {t('copyLink')}
                  </button>
                  <button onClick={() => showQr(true)} disabled={shareBusy} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-border text-sm font-fn hover:border-ink/30 disabled:opacity-50" data-testid="rotate-share-link">
                    <RefreshCw size={14} /> {t('newLink')}
                  </button>
                  <button onClick={revokeShare} disabled={shareBusy} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-err/30 text-err text-sm font-fn hover:bg-err-bg disabled:opacity-50" data-testid="revoke-share-link">
                    <Ban size={14} /> {t('stopSharing')}
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
