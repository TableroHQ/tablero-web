'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import OpsLayout from '@/components/OpsLayout';
import { Plus, ToggleLeft, ToggleRight, Trash2, Edit3, X, Megaphone } from 'lucide-react';
import { api } from '@/lib/client';
import { toast } from 'sonner';

const INITIAL_PROMOS = [
  { id: 'p1', name: 'Weekend Brunch Deal', code: 'BRUNCH20', type: 'percent', value: 20, minOrder: 30, active: true, expires: '2026-06-30', uses: 142 },
  { id: 'p2', name: 'Free Delivery Tuesday', code: 'FREEDEL', type: 'delivery', value: 0, minOrder: 20, active: true, expires: '2026-12-31', uses: 89 },
  { id: 'p3', name: 'Loyal Customer $10 Off', code: 'LOYAL10', type: 'fixed', value: 10, minOrder: 50, active: false, expires: '2026-05-01', uses: 320 },
  { id: 'p4', name: 'First Order Discount', code: 'WELCOME15', type: 'percent', value: 15, minOrder: 0, active: true, expires: '2026-12-31', uses: 67 },
];

export default function Promotions() {
  const t = useTranslations('adminPromotions');
  const [promos, setPromos] = React.useState(INITIAL_PROMOS);
  const [editing, setEditing] = React.useState(null);
  const [filter, setFilter] = React.useState('all');

  const toggle = (id) => {
    setPromos(ps => ps.map(p => p.id === id ? { ...p, active: !p.active } : p));
    toast.success(t('statusUpdated'));
  };

  const broadcast = async (p) => {
    try {
      const discount = p.type === 'percent' ? t('discountPercent', { value: p.value })
        : p.type === 'fixed' ? t('discountFixed', { value: p.value })
        : t('discountDelivery');
      await api.post('/api/notifications', {
        recipientUserId: null,
        recipientEmail: null,
        recipientPhoneNumber: null,
        channel: 'InApp',
        subject: `🎉 ${p.name}`,
        body: t('notifBody', { code: p.code, discount, min: p.minOrder || 0 }),
      });
      toast.success(t('notifSent'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('couldNotSend'));
    }
  };
  const remove = (id) => { setPromos(ps => ps.filter(p => p.id !== id)); toast.success(t('promoDeleted')); };
  const save = (data) => {
    if (data.id) setPromos(ps => ps.map(p => p.id === data.id ? data : p));
    else setPromos(ps => [...ps, { ...data, id: `p_${Date.now()}`, uses: 0 }]);
    setEditing(null);
    toast.success(data.id ? t('promoUpdated') : t('promoCreated'));
  };

  const list = promos.filter(p => filter === 'all' ? true : filter === 'active' ? p.active : !p.active);

  const typeLabel = { percent: t('typePercent'), fixed: t('typeFixed'), delivery: t('typeDelivery') };
  const typeChip = { percent: 'bg-primary/10 text-primary', fixed: 'bg-secondary/10 text-secondary', delivery: 'bg-ok-bg text-ok' };

  return (
    <OpsLayout title={t('title')} subtitle={t('subtitle')}
      right={
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-fn font-medium" data-testid="new-promo">
          <Plus size={14} /> {t('newPromotion')}
        </button>
      }>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Kpi n={promos.filter(p => p.active).length} l={t('kpiActive')} />
        <Kpi n={promos.reduce((s, p) => s + p.uses, 0).toLocaleString()} l={t('kpiUses')} />
        <Kpi n={promos.length} l={t('kpiCodes')} />
        <Kpi n="$4,280" l={t('kpiDiscount')} />
      </div>

      <div className="flex gap-2 mb-4">
        {[['all', t('filterAll')], ['active', t('filterActive')], ['inactive', t('filterInactive')]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} data-testid={`promo-filter-${k}`}
            className={`px-4 py-2 rounded-full text-sm font-fn ${filter === k ? 'bg-ink text-white' : 'bg-white border border-border'}`}>{l}</button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-sub/40 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
              <tr>
                <th className="text-left p-3 pl-5">{t('thPromotion')}</th>
                <th className="text-left p-3">{t('thCode')}</th>
                <th className="text-left p-3">{t('thType')}</th>
                <th className="text-left p-3">{t('thValue')}</th>
                <th className="text-left p-3">{t('thMinOrder')}</th>
                <th className="text-left p-3">{t('thExpires')}</th>
                <th className="text-left p-3">{t('thUses')}</th>
                <th className="text-left p-3">{t('thStatus')}</th>
                <th className="text-right p-3 pr-5">{t('thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id} className="border-t border-border" data-testid={`promo-${p.id}`}>
                  <td className="p-3 pl-5">
                    <div className="font-fn font-medium">{p.name}</div>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-sm bg-cream-sub px-2 py-1 rounded-md">{p.code}</span>
                  </td>
                  <td className="p-3">
                    <span className={`chip ${typeChip[p.type]}`}>{typeLabel[p.type]}</span>
                  </td>
                  <td className="p-3 font-mono text-sm">
                    {p.type === 'percent' ? `${p.value}%` : p.type === 'fixed' ? `$${p.value}` : t('valueFree')}
                  </td>
                  <td className="p-3 font-mono text-sm">{p.minOrder > 0 ? `$${p.minOrder}` : '—'}</td>
                  <td className="p-3 font-mono text-sm text-ink-muted">{p.expires}</td>
                  <td className="p-3 font-mono text-sm">{p.uses}</td>
                  <td className="p-3">
                    <span className={`chip ${p.active ? 'bg-ok-bg text-ok' : 'bg-cream-sub text-ink-muted'}`}>{p.active ? t('statusActive') : t('statusInactive')}</span>
                  </td>
                  <td className="p-3 pr-5 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => toggle(p.id)} className="p-2 rounded-lg hover:bg-cream-sub" data-testid={`toggle-${p.id}`} title={p.active ? t('titleDeactivate') : t('titleActivate')}>
                        {p.active ? <ToggleRight size={16} className="text-ok" /> : <ToggleLeft size={16} className="text-ink-muted" />}
                      </button>
                      {p.active && (
                        <button onClick={() => broadcast(p)} className="p-2 rounded-lg hover:bg-primary/10 text-ink-muted hover:text-primary" data-testid={`broadcast-${p.id}`} title={t('titleSendNotif')}>
                          <Megaphone size={14} />
                        </button>
                      )}
                      <button onClick={() => setEditing(p)} className="p-2 rounded-lg hover:bg-cream-sub" data-testid={`edit-${p.id}`}><Edit3 size={14} /></button>
                      <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-err-bg text-ink-muted hover:text-err" data-testid={`delete-${p.id}`}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== null && <PromoModal promo={editing} onClose={() => setEditing(null)} onSave={save} />}
    </OpsLayout>
  );
}

function PromoModal({ promo, onClose, onSave }) {
  const t = useTranslations('adminPromotions');
  const tc = useTranslations('common');
  const [form, setForm] = React.useState({ name: '', code: '', type: 'percent', value: 10, minOrder: 0, active: true, expires: '2026-12-31', ...promo });
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg p-7" onClick={e => e.stopPropagation()} data-testid="promo-modal">
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="label-eyebrow">{t('modalLabel')}</div>
            <h2 className="font-display text-2xl mt-1">{form.id ? t('modalEdit') : t('modalNew')}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-cream-sub" data-testid="promo-modal-close"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="col-span-2">
            <span className="label-eyebrow">{t('mName')}</span>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('namePlaceholder')}
              className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" data-testid="promo-name" />
          </label>
          <label>
            <span className="label-eyebrow">{t('mCode')}</span>
            <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder={t('codePlaceholder')}
              className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-primary" data-testid="promo-code" />
          </label>
          <label>
            <span className="label-eyebrow">{t('mType')}</span>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" data-testid="promo-type">
              <option value="percent">{t('typePercent')}</option>
              <option value="fixed">{t('typeFixed')}</option>
              <option value="delivery">{t('typeDelivery')}</option>
            </select>
          </label>
          {form.type !== 'delivery' && (
            <label>
              <span className="label-eyebrow">{form.type === 'percent' ? t('valuePct') : t('valueAmt')}</span>
              <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))}
                className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-primary" data-testid="promo-value" />
            </label>
          )}
          <label>
            <span className="label-eyebrow">{t('mMinOrder')}</span>
            <input type="number" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: Number(e.target.value) }))}
              className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-primary" data-testid="promo-min" />
          </label>
          <label>
            <span className="label-eyebrow">{t('mExpires')}</span>
            <input type="date" value={form.expires} onChange={e => setForm(f => ({ ...f, expires: e.target.value }))}
              className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" data-testid="promo-expires" />
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-outline" data-testid="promo-cancel">{tc('cancel')}</button>
          <button onClick={() => onSave(form)} className="btn-primary" data-testid="promo-save">{t('savePromotion')}</button>
        </div>
      </div>
    </div>
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
