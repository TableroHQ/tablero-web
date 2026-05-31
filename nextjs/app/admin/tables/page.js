'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import OpsLayout from '@/components/OpsLayout';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { Plus, Edit3, Trash2, X, QrCode, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ZONES = ['Indoor', 'Terrace', 'Bar', 'Private'];
const STATUSES = ['EMPTY', 'OCCUPIED', 'BILL_REQUESTED'];
const ZONE_KEY = { Indoor: 'zoneIndoor', Terrace: 'zoneTerrace', Bar: 'zoneBar', Private: 'zonePrivate' };
const STATUS_KEY = { EMPTY: 'stEMPTY', OCCUPIED: 'stOCCUPIED', BILL_REQUESTED: 'stBILL_REQUESTED' };

export default function TablesMgmt() {
  const t = useTranslations('adminTables');
  const zoneLabel = (z) => (ZONE_KEY[z] ? t(ZONE_KEY[z]) : z);
  const statusLabel = (s) => (STATUS_KEY[s] ? t(STATUS_KEY[s]) : (s || '').replace('_', ' '));
  const [{ user }] = useStore();
  const restaurantId = user.restaurantId;

  const [tables, setTables] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(null);
  const [filter, setFilter] = React.useState('all');

  const loadTables = React.useCallback(async () => {
    if (!restaurantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api.get(`/api/restaurants/${restaurantId}/tables`);
      setTables(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      toast.error(t('failedLoad'));
    } finally {
      setLoading(false);
    }
  }, [restaurantId, t]);

  React.useEffect(() => { loadTables(); }, [loadTables]);

  const list = tables.filter(tb => filter === 'all' || (tb.zone || tb.section) === filter);

  const save = async (form) => {
    const body = { seats: Number(form.seats), zone: form.zone, label: form.id || undefined };
    try {
      if (form.id) {
        await api.patch(`/api/restaurants/${restaurantId}/tables/${form.id}/status`, { status: form.status });
        setTables(ts => ts.map(tb => tb.id === form.id ? { ...tb, ...form } : tb));
        toast.success(t('tableUpdated'));
      } else {
        const created = await api.post(`/api/restaurants/${restaurantId}/tables`, body);
        setTables(ts => [...ts, { ...created, status: 'EMPTY', total: 0 }]);
        toast.success(t('tableCreated'));
      }
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || t('failedSave'));
    }
  };

  const getQr = async (tableId) => {
    try {
      const data = await api.get(`/api/restaurants/tables/${tableId}/qr`);
      const url = data?.url || data?.qrUrl;
      if (url) window.open(url, '_blank');
      else toast.success(t('qrData') + JSON.stringify(data));
    } catch {
      toast.error(t('couldNotFetchQr'));
    }
  };

  const statusColor = {
    EMPTY: 'bg-cream-sub text-ink-muted',
    OCCUPIED: 'bg-warn-bg text-warn',
    BILL_REQUESTED: 'bg-primary/10 text-primary',
  };

  const zones = [...new Set(tables.map(tb => tb.zone || tb.section || 'Indoor').filter(Boolean))];

  return (
    <OpsLayout title={t('title')} subtitle={t('subtitle')}
      right={
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-fn font-medium" data-testid="new-table">
          <Plus size={14} /> {t('addTable')}
        </button>
      }>

      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', ...zones].map(z => (
          <button key={z} onClick={() => setFilter(z)} data-testid={`zone-filter-${z.toLowerCase()}`}
            className={`px-4 py-2 rounded-full text-sm font-fn ${filter === z ? 'bg-ink text-white' : 'bg-white border border-border'}`}>
            {z === 'all' ? t('allZones') : zoneLabel(z)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 size={28} className="animate-spin text-ink-muted" /></div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {list.map(tb => {
              const status = tb.status || 'EMPTY';
              const label = tb.label || tb.tableNumber || tb.id;
              const zone = tb.zone || tb.section || '—';
              return (
                <div key={tb.id} className={`bg-white rounded-2xl border-2 p-5 ${status === 'BILL_REQUESTED' ? 'border-primary' : status === 'OCCUPIED' ? 'border-warn/40' : 'border-border'}`} data-testid={`table-card-${tb.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display text-3xl">{label}</div>
                      <div className="text-[10px] font-mono text-ink-muted uppercase tracking-widest mt-0.5">{zoneLabel(zone)} · {tb.seats || tb.capacity || '—'} {t('seatsWord')}</div>
                    </div>
                    <span className={`chip ${statusColor[status] || 'bg-cream-sub text-ink-muted'}`}>{statusLabel(status)}</span>
                  </div>
                  {status !== 'EMPTY' && tb.total > 0 && <div className="font-mono text-xl font-semibold mt-3">${Number(tb.total).toFixed(2)}</div>}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setEditing(tb)} className="flex-1 flex items-center justify-center gap-1 bg-cream-sub hover:bg-cream-warm py-2 rounded-lg text-xs font-fn" data-testid={`edit-table-${tb.id}`}>
                      <Edit3 size={12} /> {t('edit')}
                    </button>
                    <button onClick={() => getQr(tb.id)} className="p-2 rounded-lg hover:bg-cream-sub text-ink-muted" title="QR" data-testid={`qr-table-${tb.id}`}>
                      <QrCode size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {list.length === 0 && <div className="col-span-4 text-center text-sm text-ink-muted py-12">{t('noTables')}</div>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat n={tables.length} l={t('statTotalTables')} />
            <Stat n={tables.reduce((s, tb) => s + Number(tb.seats || tb.capacity || 0), 0)} l={t('statTotalSeats')} />
            <Stat n={tables.filter(tb => tb.status === 'OCCUPIED').length} l={t('statOccupied')} />
            <Stat n={`$${tables.reduce((s, tb) => s + Number(tb.total || 0), 0).toFixed(0)}`} l={t('statOpenBills')} />
          </div>
        </>
      )}

      {editing !== null && <TableModal table={editing} onClose={() => setEditing(null)} onSave={save} />}
    </OpsLayout>
  );
}

function TableModal({ table, onClose, onSave }) {
  const t = useTranslations('adminTables');
  const tc = useTranslations('common');
  const [form, setForm] = React.useState({ seats: 4, zone: 'Indoor', status: 'EMPTY', ...table });
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md p-7" onClick={e => e.stopPropagation()} data-testid="table-modal">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="label-eyebrow">{t('modalConfig')}</div>
            <h2 className="font-display text-2xl mt-1">{form.id ? t('modalEdit', { label: form.label || form.id }) : t('modalNew')}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-cream-sub" data-testid="table-modal-close"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          {form.id ? (
            /* Edit mode: seats and zone are read-only (no PATCH endpoint for them) */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="label-eyebrow">{t('mSeats')}</div>
                <div className="mt-2 px-4 py-3 bg-cream-sub/50 rounded-xl font-fn text-ink-muted" data-testid="table-seats">{form.seats || '—'}</div>
              </div>
              <div>
                <div className="label-eyebrow">{t('mZone')}</div>
                <div className="mt-2 px-4 py-3 bg-cream-sub/50 rounded-xl font-fn text-ink-muted" data-testid="table-zone">{form.zone ? (ZONE_KEY[form.zone] ? t(ZONE_KEY[form.zone]) : form.zone) : '—'}</div>
              </div>
              <p className="col-span-2 text-[10px] font-mono text-ink-muted">{t('seatsZoneNote')}</p>
            </div>
          ) : (
            <>
              <label>
                <span className="label-eyebrow">{t('mSeats')}</span>
                <input type="number" value={form.seats} onChange={e => setForm(f => ({ ...f, seats: Number(e.target.value) }))}
                  className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" data-testid="table-seats" />
              </label>
              <label>
                <span className="label-eyebrow">{t('mZone')}</span>
                <select value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                  className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" data-testid="table-zone">
                  {ZONES.map(z => <option key={z} value={z}>{t(ZONE_KEY[z])}</option>)}
                </select>
              </label>
            </>
          )}
          {form.id && (
            <label>
              <span className="label-eyebrow">{t('mStatus')}</span>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" data-testid="table-status">
                {STATUSES.map(s => <option key={s} value={s}>{t(STATUS_KEY[s])}</option>)}
              </select>
            </label>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-outline" data-testid="table-modal-cancel">{tc('cancel')}</button>
          <button onClick={submit} disabled={saving} className="btn-primary disabled:opacity-50" data-testid="table-modal-save">
            {saving ? tc('saving') : tc('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="font-display text-3xl">{n}</div>
      <div className="label-eyebrow mt-1">{l}</div>
    </div>
  );
}
