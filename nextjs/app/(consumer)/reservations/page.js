'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/client';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import { MAX_PARTY_SIZE } from '@/lib/config';
import { useTranslations } from 'next-intl';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;

function todayDays() {
  const days = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d);
  }
  return days;
}

function fmt(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`; // YYYY-MM-DD in local time
}

function fmtLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Slot startAt can be either "HH:mm:ss" (TimeOnly) or a full ISO datetime string.
function fmtSlotTime(startAt) {
  if (!startAt) return '';
  const s = String(startAt);
  if (s.includes('T')) return s.slice(11, 16); // "2026-05-29T12:00:00Z" → "12:00"
  return s.slice(0, 5);                         // "12:00:00" → "12:00"
}

// Parse a reservation's reservationStartAt ISO string into a readable date + time.
function fmtResDatetime(reservationStartAt) {
  if (!reservationStartAt) return { date: '—', time: '—' };
  const d = new Date(reservationStartAt);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return { date, time };
}

export default function Reservations() {
  const t = useTranslations('reservations');
  const days = React.useMemo(() => todayDays(), []);
  const [{ user }] = useStore();
  const router = useRouter();

  const [selectedDay, setSelectedDay] = React.useState(0);
  const [slot, setSlot] = React.useState('');
  const [party, setParty] = React.useState(2);
  const [zone, setZone] = React.useState('Indoor');
  const [tableId, setTableId] = React.useState('');

  const [slots, setSlots] = React.useState([]);
  const [tables, setTables] = React.useState([]);
  const [myReservations, setMyReservations] = React.useState([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [loadingTables, setLoadingTables] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  const selectedDate = days[selectedDay];

  // Load available slots when date or party changes
  React.useEffect(() => {
    if (!RESTAURANT_ID) return;
    setLoadingSlots(true);
    setSlot('');
    api.get(`/api/restaurants/${RESTAURANT_ID}/availability/slots`, {
      params: { date: fmt(selectedDate), partySize: party },
    })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.slots ?? []);
        const available = list.filter(s => s.isAvailable !== false);
        setSlots(available);
        if (available.length > 0) setSlot(fmtSlotTime(available[0].startAt));
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDay, party]);

  // Load tables when restaurant mounts
  React.useEffect(() => {
    if (!RESTAURANT_ID) return;
    setLoadingTables(true);
    api.get(`/api/restaurants/${RESTAURANT_ID}/tables`)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.items ?? []);
        setTables(list);
      })
      .catch(() => {})
      .finally(() => setLoadingTables(false));
  }, []);

  // Load my reservations
  React.useEffect(() => {
    if (!user.id) return;
    api.get('/api/reservations/me').then((data) => {
      setMyReservations(Array.isArray(data) ? data : data?.items ?? []);
    }).catch(() => {});
  }, [user.id]);

  const confirm = async () => {
    if (!slot) return toast.error(t('errSelectSlot'));
    if (!RESTAURANT_ID) return toast.error('Restaurant not configured');
    setConfirming(true);
    try {
      const customerName = (user.firstName && user.lastName)
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.name || undefined;
      // Build ISO datetime from selected date + time slot (e.g. "2026-05-29T19:30:00")
      const reservationStartAt = `${fmt(selectedDate)}T${slot.length === 5 ? slot + ':00' : slot}`;
      const body = {
        reservationStartAt,
        partySize: party,
        tableId: tableId || undefined,
        customerName,
        customerPhoneNumber: user.phone || undefined,
      };
      const res = await api.post(`/api/restaurants/${RESTAURANT_ID}/reservations`, body);
      toast.success(t('confirmedToast', { date: fmtLabel(selectedDate), time: slot }));
      setMyReservations(r => [res, ...r]);
    } catch (err) {
      toast.error(err.response?.data?.message || t('couldNotConfirm'));
    } finally {
      setConfirming(false);
    }
  };

  const cancel = async (id) => {
    try {
      await api.patch(`/api/reservations/${id}/cancel`, {});
      setMyReservations(r => r.map(x => x.id === id ? { ...x, status: 'CANCELLED' } : x));
      toast.success(t('cancelledToast'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('couldNotCancel'));
    }
  };

  const filteredTables = tables.filter(t => (t.zone || t.section || '').toLowerCase() === zone.toLowerCase());

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow">{t('eyebrow')}</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">{t('title')}</h1>
      <p className="mt-3 text-ink-body max-w-xl">{t('subtitle')}</p>

      <div className="grid lg:grid-cols-12 gap-6 mt-12">
        <div className="lg:col-span-8 space-y-6">
          {/* DATE */}
          <Card title={t('date')} icon={Calendar}>
            <div className="grid grid-cols-7 gap-2 mt-4">
              {days.map((d, i) => (
                <button key={i} onClick={() => setSelectedDay(i)} data-testid={`date-${i}`}
                  className={`py-3 rounded-xl border text-sm font-mono transition ${selectedDay === i ? 'bg-primary text-white border-primary' : 'border-border bg-white hover:border-ink/30'}`}>
                  <div className="text-[9px] tracking-widest opacity-70">{d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</div>
                  <div className="font-bold text-base">{d.getDate()}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* TIME */}
          <Card title={t('time')}>
            {loadingSlots ? (
              <div className="mt-4 flex gap-2"><Loader2 size={16} className="animate-spin text-ink-muted" /><span className="text-sm text-ink-muted">{t('loadingSlots')}</span></div>
            ) : slots.length === 0 ? (
              <div className="mt-4 text-sm text-ink-muted">{t('noSlots')}</div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-4">
                {slots.map(s => {
                  const timeStr = fmtSlotTime(s.startAt);
                  return (
                    <button key={timeStr} onClick={() => setSlot(timeStr)} data-testid={`slot-${timeStr}`}
                      className={`px-4 py-2 rounded-full font-mono text-sm transition ${slot === timeStr ? 'bg-ink text-white' : 'bg-white border border-border hover:border-ink/30'}`}>
                      {timeStr}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* PARTY */}
          <Card title={t('party')} icon={Users}>
            <div className="flex items-center gap-4 mt-4">
              <button onClick={() => setParty(Math.max(1, party - 1))} className="h-12 w-12 rounded-full bg-cream-sub text-xl" data-testid="party-minus">−</button>
              <div className="font-display text-5xl text-ink min-w-[80px] text-center" data-testid="party-count">{party}</div>
              <button onClick={() => setParty(Math.min(MAX_PARTY_SIZE, party + 1))} className="h-12 w-12 rounded-full bg-cream-sub text-xl" data-testid="party-plus">+</button>
              <span className="ml-4 text-ink-body text-sm">{party === 1 ? t('guest') : t('guests')}</span>
            </div>
          </Card>

          {/* ZONE & TABLE */}
          <Card title={t('zoneTable')}>
            <div className="flex gap-2 mt-4 flex-wrap">
              {(['Indoor', 'Terrace', 'Bar', 'Outdoor']).map(z => (
                <button key={z} onClick={() => { setZone(z); setTableId(''); }} data-testid={`zone-${z}`}
                  className={`px-4 py-2 rounded-full text-sm font-fn ${zone === z ? 'bg-secondary text-white' : 'bg-white border border-border'}`}>
                  {t(z)}
                </button>
              ))}
            </div>
            {loadingTables ? (
              <div className="mt-4 flex gap-2"><Loader2 size={14} className="animate-spin text-ink-muted" /></div>
            ) : filteredTables.length > 0 ? (
              <div className="mt-6 grid grid-cols-4 sm:grid-cols-6 gap-3">
                {filteredTables.map(t => {
                  const taken = t.status === 'OCCUPIED';
                  const id = t.id;
                  const label = t.label || t.tableNumber || id;
                  return (
                    <button key={id} disabled={taken} onClick={() => setTableId(id)} data-testid={`table-${id}`}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-xs font-mono transition ${taken ? 'bg-cream-sub text-ink-muted line-through' : tableId === id ? 'bg-primary text-white shadow-lg' : 'bg-white border border-border hover:border-primary'}`}>
                      <span className="text-base font-bold">{label}</span>
                      <span className="text-[10px] opacity-70">{t.seats || t.capacity || '?'} seats</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-3">
                {Array.from({ length: 8 }).map((_, i) => {
                  const label = `T-${String(i + 1).padStart(2, '0')}`;
                  return (
                    <button key={label} onClick={() => setTableId(label)} data-testid={`table-${label}`}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-xs font-mono transition ${tableId === label ? 'bg-primary text-white shadow-lg' : 'bg-white border border-border hover:border-primary'}`}>
                      <span className="text-base font-bold">{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* MY RESERVATIONS */}
          {myReservations.length > 0 && (
            <Card title={t('myReservations')}>
              <div className="mt-4 space-y-3">
                {myReservations.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl bg-cream-sub/50">
                    <div>
                      {(() => { const { date, time } = fmtResDatetime(r.reservationStartAt); return (
                        <div className="font-fn font-medium">{date} · {time}</div>
                      ); })()}
                      <div className="text-xs text-ink-muted font-mono">{r.partySize} {r.partySize === 1 ? t('guest') : t('guests')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`chip text-xs ${r.status === 'CONFIRMED' ? 'bg-ok-bg text-ok' : r.status === 'CANCELLED' ? 'bg-err-bg text-err' : 'bg-cream-sub text-ink-muted'}`}>{r.status}</span>
                      {r.status === 'CONFIRMED' && (
                        <button onClick={() => cancel(r.id)} className="text-xs text-err hover:underline font-fn">{t('cancel')}</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* SUMMARY SIDEBAR */}
        <aside className="lg:col-span-4">
          <div className="sticky top-[88px] bg-white rounded-3xl border border-border p-7">
            <div className="label-eyebrow">{t('bookingSummary')}</div>
            <Row k={t('date')} v={fmtLabel(selectedDate)} />
            <Row k={t('time')} v={slot || '—'} />
            <Row k={t('party')} v={`${party} ${party === 1 ? t('guest') : t('guests')}`} />
            <Row k="Zone" v={t(zone)} />
            <Row k="Table" v={tableId || t('anyAvailable')} />
            <hr className="my-5 border-border" />
            <button onClick={confirm} disabled={confirming || !slot} className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50" data-testid="confirm-reservation">
              {confirming ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {confirming ? t('confirming') : t('confirmReservation')}
            </button>
            <p className="mt-4 text-[11px] text-ink-muted text-center font-mono uppercase tracking-wide">{t('freeCancellation')}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-3xl border border-border p-6 md:p-7">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-ink-muted" />}
        <div className="label-eyebrow">{title}</div>
      </div>
      {children}
    </div>
  );
}
function Row({ k, v }) {
  return <div className="flex justify-between py-2.5 text-sm"><span className="text-ink-muted font-mono uppercase text-[10px] tracking-widest pt-1">{k}</span><span className="font-fn font-medium">{v}</span></div>;
}
