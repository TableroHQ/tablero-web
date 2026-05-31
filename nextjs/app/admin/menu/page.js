'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import OpsLayout from '@/components/OpsLayout';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { Plus, Edit3, Trash2, EyeOff, Eye, Search, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MenuMgmt() {
  const t = useTranslations('adminMenu');
  const [{ user }] = useStore();
  const restaurantId = user.restaurantId;

  const [items, setItems] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(null);
  const [deletingId, setDeletingId] = React.useState(null);
  const [q, setQ] = React.useState('');

  const loadMenu = React.useCallback(async () => {
    if (!restaurantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api.get(`/api/restaurants/${restaurantId}/menu`);
      // Normalise: menu can be { categories: [{ id, name, items: [] }] } or flat array
      const cats = data?.categories ?? [];
      const flatItems = cats.length
        ? cats.flatMap(c => (c.items ?? []).map(i => ({ ...i, cat: c.name, categoryId: c.id, img: i.imageUrl || i.image || '', available: i.isAvailable ?? i.available ?? true })))
        : (Array.isArray(data) ? data : data?.items ?? []).map(i => ({ ...i, img: i.imageUrl || i.image || '', cat: i.categoryName || 'Other', available: i.isAvailable ?? i.available ?? true }));
      setItems(flatItems);
      setCategories(cats.map(c => ({ id: c.id, name: c.name })));
    } catch {
      toast.error(t('failedLoad'));
    } finally {
      setLoading(false);
    }
  }, [restaurantId, t]);

  React.useEffect(() => { loadMenu(); }, [loadMenu]);

  const toggle86 = async (item) => {
    const next = !(item.available ?? item.isAvailable ?? true);
    try {
      await api.patch(`/api/restaurants/${restaurantId}/menu/items/${item.id}/availability`, { isAvailable: next });
      setItems(it => it.map(i => i.id === item.id ? { ...i, available: next, isAvailable: next } : i));
      toast.success(next ? t('markedAvailable') : t('item86d'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('failedAvailability'));
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/api/restaurants/${restaurantId}/menu/items/${id}`);
      setItems(it => it.filter(i => i.id !== id));
      toast.success(t('itemDeleted'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('failedDelete'));
    } finally {
      setDeletingId(null);
    }
  };

  const save = async (form) => {
    const body = {
      name:        form.name,
      description: form.desc,
      price:       Number(form.price),
      categoryId:  form.categoryId,
      imageUrl:    form.img || undefined,
      allergens:   form.allergens,
    };
    try {
      if (form.id) {
        const updated = await api.patch(`/api/restaurants/${restaurantId}/menu/items/${form.id}`, body);
        setItems(it => it.map(i => i.id === form.id ? { ...i, ...updated, cat: form.cat, img: form.img } : i));
        toast.success(t('itemUpdated'));
      } else {
        const created = await api.post(`/api/restaurants/${restaurantId}/menu/items`, body);
        setItems(it => [...it, { ...created, cat: form.cat, img: form.img, available: true }]);
        toast.success(t('itemCreated'));
      }
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || t('failedSave'));
    }
  };

  const list = items.filter(i => i.name?.toLowerCase().includes(q.toLowerCase()));

  return (
    <OpsLayout title={t('title')} subtitle={t('subtitle', { id: restaurantId || t('setRestaurantId') })}
      right={
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-fn font-medium" data-testid="new-item">
          <Plus size={14} /> {t('newItem')}
        </button>
      }>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="flex items-center gap-2 bg-cream-sub rounded-full px-4 py-2 flex-1 max-w-md">
            <Search size={14} className="text-ink-muted" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('searchMenu')} className="bg-transparent outline-none flex-1 text-sm" data-testid="menu-search" />
          </div>
          <div className="text-xs font-mono text-ink-muted">{t('itemsStat', { count: list.length, off: items.filter(i => !i.available).length })}</div>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 size={24} className="animate-spin text-ink-muted" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-sub/40 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                <tr>
                  <th className="text-left p-3 pl-5">{t('thItem')}</th>
                  <th className="text-left p-3">{t('thCategory')}</th>
                  <th className="text-left p-3">{t('thPrice')}</th>
                  <th className="text-left p-3">{t('thAllergens')}</th>
                  <th className="text-left p-3">{t('thStatus')}</th>
                  <th className="text-right p-3 pr-5">{t('thActions')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map(m => (
                  <tr key={m.id} className="border-t border-border" data-testid={`menu-row-${m.id}`}>
                    <td className="p-3 pl-5">
                      <div className="flex items-center gap-3">
                        {m.img
                          ? <img src={m.img} alt="" className="h-10 w-10 rounded-lg object-cover" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = ''; e.currentTarget.className = 'h-10 w-10 rounded-lg bg-cream-sub'; }} />
                          : <div className="h-10 w-10 rounded-lg bg-cream-sub" />
                        }
                        <div>
                          <div className="font-fn font-medium">{m.name}</div>
                          <div className="text-xs text-ink-muted truncate max-w-[260px]">{m.desc || m.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{m.cat}</td>
                    <td className="p-3 font-mono text-sm">${Number(m.price).toFixed(2)}</td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {(m.allergens || []).map(a => <span key={a} className="text-[9px] font-mono uppercase bg-cream-sub px-1.5 py-0.5 rounded text-ink-muted">{a}</span>)}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`chip ${m.available !== false ? 'bg-ok-bg text-ok' : 'bg-err-bg text-err'}`}>
                        {m.available !== false ? t('available') : t('unavailable')}
                      </span>
                    </td>
                    <td className="p-3 pr-5 text-right">
                      <button onClick={() => toggle86(m)} className="p-2 rounded-lg hover:bg-cream-sub" data-testid={`toggle-${m.id}`} aria-label={m.available !== false ? t('markUnavailable', { name: m.name }) : t('markAvailable', { name: m.name })}>
                        {m.available !== false ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => setEditing(m)} className="p-2 rounded-lg hover:bg-cream-sub" data-testid={`edit-${m.id}`} aria-label={t('editAria', { name: m.name })}>
                        <Edit3 size={14} />
                      </button>
                      {deletingId === m.id ? (
                        <span className="inline-flex items-center gap-1 text-xs text-err font-fn">
                          {t('sure')}
                          <button onClick={() => remove(m.id)} className="px-2 py-1 rounded bg-err text-white" data-testid={`delete-confirm-${m.id}`}>{t('yes')}</button>
                          <button onClick={() => setDeletingId(null)} className="px-2 py-1 rounded bg-cream-sub" data-testid={`delete-cancel-${m.id}`}>{t('no')}</button>
                        </span>
                      ) : (
                        <button onClick={() => setDeletingId(m.id)} className="p-2 rounded-lg hover:bg-err-bg text-ink-muted hover:text-err" data-testid={`delete-${m.id}`}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-sm text-ink-muted">{t('noItems')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing !== null && <EditModal item={editing} categories={categories} restaurantId={restaurantId} onClose={() => setEditing(null)} onSave={save} />}
    </OpsLayout>
  );
}

function EditModal({ item, categories, restaurantId, onClose, onSave }) {
  const t = useTranslations('adminMenu');
  const tc = useTranslations('common');
  const [form, setForm] = React.useState({
    name: '', cat: categories[0]?.name || 'Mains', categoryId: categories[0]?.id || '',
    price: 10, desc: '', allergens: [], img: '', ...item,
  });
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    if (!form.name) return toast.error(t('nameRequired'));
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-xl p-6 md:p-8" onClick={e => e.stopPropagation()} data-testid="menu-modal">
        <div className="flex justify-between items-start mb-5">
          <h2 className="font-display text-3xl">{form.id ? t('modalEditTitle') : t('modalNewTitle')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-cream-sub" data-testid="modal-close"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ModalInput label={t('mName')} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} full testid="modal-name" />
          <label className="col-span-2" data-testid="modal-cat">
            <span className="label-eyebrow">{t('mCategory')}</span>
            <select value={form.categoryId} onChange={e => {
              const cat = categories.find(c => c.id === e.target.value);
              setForm(f => ({ ...f, categoryId: e.target.value, cat: cat?.name || f.cat }));
            }} className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              {categories.length === 0 && <option value="">{t('noCategories')}</option>}
            </select>
          </label>
          <ModalInput label={t('mPrice')} type="number" value={form.price} onChange={v => setForm(f => ({ ...f, price: Number(v) }))} testid="modal-price" />
          <label className="col-span-2" data-testid="modal-img">
            <span className="label-eyebrow">{t('mImage')}</span>
            <div className="mt-2 flex gap-2 items-start">
              <input value={form.img} onChange={e => setForm(f => ({ ...f, img: e.target.value }))}
                placeholder={t('imagePlaceholder')}
                className="flex-1 bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary text-sm" />
              <label className="cursor-pointer px-4 py-3 rounded-xl bg-cream-sub border border-border hover:bg-cream-warm text-sm font-fn whitespace-nowrap" title={t('upload')}>
                {t('upload')}
                <input type="file" accept="image/*" className="sr-only" onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setForm(f => ({ ...f, img: reader.result }));
                  reader.readAsDataURL(file);
                }} />
              </label>
            </div>
            {form.img && (
              <img src={form.img} alt="" className="mt-2 h-20 w-20 object-cover rounded-xl border border-border" onError={e => { e.currentTarget.style.display = 'none'; }} />
            )}
          </label>
          <ModalTextarea label={t('mDescription')} value={form.desc} onChange={v => setForm(f => ({ ...f, desc: v }))} full testid="modal-desc" />
          <ModalInput label={t('mAllergens')} value={(form.allergens || []).join(', ')} onChange={v => setForm(f => ({ ...f, allergens: v.split(',').map(s => s.trim()).filter(Boolean) }))} full testid="modal-allergens" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-outline" data-testid="modal-cancel">{tc('cancel')}</button>
          <button onClick={submit} disabled={saving} className="btn-primary disabled:opacity-50" data-testid="modal-save">
            {saving ? tc('saving') : tc('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalInput({ label, value, onChange, type = 'text', full, testid }) {
  return (
    <label className={full ? 'col-span-2' : ''} data-testid={testid}>
      <span className="label-eyebrow">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" />
    </label>
  );
}

function ModalTextarea({ label, value, onChange, full, testid }) {
  return (
    <label className={full ? 'col-span-2' : ''} data-testid={testid}>
      <span className="label-eyebrow">{label}</span>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
        className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" />
    </label>
  );
}
