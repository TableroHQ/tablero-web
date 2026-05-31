'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import OpsLayout from '@/components/OpsLayout';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { UserPlus, Ban, RotateCcw, Search, X, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

// Maps a backend role enum to its adminStaff translation key
const roleKey = (r) => ({ all: 'roleAll', WAITER: 'roleWaiter', CHEF: 'roleChef', CASHIER: 'roleCashier', COURIER: 'roleCourier', ADMIN: 'roleAdmin' }[r]);

export default function StaffMgmt() {
  const t = useTranslations('adminStaff');
  const tc = useTranslations('common');
  const roleLabel = (r) => { const k = roleKey(r); return k ? t(k) : r; };
  const [{ user }] = useStore();
  const restaurantId = user.restaurantId;

  const [staff, setStaff] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [invite, setInvite] = React.useState(false);

  const loadStaff = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/users');
      setStaff(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      toast.error(t('failedLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => { loadStaff(); }, [loadStaff]);

  const list = staff.filter(s =>
    (roleFilter === 'all' || s.role?.toLowerCase() === roleFilter.toLowerCase()) &&
    (s.name || s.username || '').toLowerCase().includes(q.toLowerCase())
  );

  const suspend = async (id, currentStatus) => {
    const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      await api.patch(`/api/users/${id}/status`, { status: newStatus });
      setStaff(s => s.map(x => x.id === id ? { ...x, status: newStatus } : x));
      toast.success(t('statusUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('failedUpdate'));
    }
  };

  const changeRole = async (id, newRole) => {
    try {
      await api.patch(`/api/users/${id}/role`, { role: newRole });
      setStaff(s => s.map(x => x.id === id ? { ...x, role: newRole } : x));
      toast.success(t('roleUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('failedRole'));
    }
  };

  const addStaff = async (data) => {
    try {
      const created = await api.post('/api/users/staff', data);
      setStaff(s => [...s, created]);
      toast.success(t('staffCreated'));
      setInvite(false);
    } catch (err) {
      toast.error(err.response?.data?.message || t('failedCreate'));
    }
  };

  const statusLabel = (status) => {
    if (status === 'SUSPENDED') return t('suspended');
    if (status === 'ACTIVE') return t('active');
    return status || t('active');
  };

  return (
    <OpsLayout title={t('title')} subtitle={t('subtitle')}
      right={
        <button onClick={() => setInvite(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-fn font-medium" data-testid="invite-staff">
          <UserPlus size={14} /> {t('inviteStaff')}
        </button>
      }>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-cream-sub rounded-full px-4 py-2 flex-1 max-w-md min-w-[200px]">
            <Search size={14} className="text-ink-muted" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('searchStaff')} className="bg-transparent outline-none flex-1 text-sm" data-testid="staff-search" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'WAITER', 'CHEF', 'CASHIER', 'COURIER'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} data-testid={`role-filter-${r.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-full text-xs font-fn ${roleFilter === r ? 'bg-ink text-white' : 'bg-cream-sub text-ink-body'}`}>
                {roleLabel(r)}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="p-10 text-center text-ink-muted font-fn text-sm">{t('loadingStaff')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-sub/40 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                <tr>
                  <th className="text-left p-3 pl-5">{t('colName')}</th>
                  <th className="text-left p-3">{t('colRole')}</th>
                  <th className="text-left p-3">{t('colEmail')}</th>
                  <th className="text-left p-3">{t('colStatus')}</th>
                  <th className="text-right p-3 pr-5">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map(m => (
                  <tr key={m.id} className="border-t border-border" data-testid={`staff-row-${m.id}`}>
                    <td className="p-3 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {(m.name || m.username || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div className="font-fn font-medium">{m.name || m.username}</div>
                          <div className="text-xs font-mono text-ink-muted">{m.username || m.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <select value={m.role || ''} onChange={e => changeRole(m.id, e.target.value)} data-testid={`role-${m.id}`}
                        className="text-xs font-fn bg-cream-sub rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-primary">
                        {['WAITER', 'CHEF', 'CASHIER', 'COURIER', 'ADMIN'].map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-sm text-ink-muted">{m.email || '—'}</td>
                    <td className="p-3">
                      <span className={`chip ${m.status === 'SUSPENDED' ? 'bg-err-bg text-err' : 'bg-ok-bg text-ok'}`}>
                        {statusLabel(m.status)}
                      </span>
                    </td>
                    <td className="p-3 pr-5 text-right">
                      <button onClick={() => suspend(m.id, m.status)} className="p-2 rounded-lg hover:bg-cream-sub" aria-label={m.status === 'SUSPENDED' ? t('reactivateAria', { name: m.name || m.username }) : t('suspendAria', { name: m.name || m.username })} data-testid={`suspend-${m.id}`}>
                        {m.status === 'SUSPENDED' ? <RotateCcw size={14} /> : <Ban size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-sm text-ink-muted">{t('noStaff')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {invite && <InviteModal onClose={() => setInvite(false)} onSave={addStaff} />}
    </OpsLayout>
  );
}

function InviteModal({ onClose, onSave }) {
  const t = useTranslations('adminStaff');
  const tc = useTranslations('common');
  const roleLabel = (r) => { const k = roleKey(r); return k ? t(k) : r; };
  const [form, setForm] = React.useState({ name: '', email: '', username: '', role: 'WAITER', password: '' });
  const [loading, setLoading] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);

  const submit = async () => {
    if (!form.email || !form.password) return toast.error(t('emailRequired'));
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md p-7" onClick={e => e.stopPropagation()} data-testid="invite-modal">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="label-eyebrow">{t('inviteTitle')}</div>
            <h2 className="font-display text-2xl mt-1">{t('newTeamMember')}</h2>
          </div>
          <button onClick={onClose} className="p-2" data-testid="invite-close"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <FieldLabel label={t('fullName')} testid="invite-name">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" placeholder="Maya Holloway" />
          </FieldLabel>
          <FieldLabel label={t('username')} testid="invite-username">
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" placeholder="maya" />
          </FieldLabel>
          <FieldLabel label={t('emailLabel')} testid="invite-email">
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" placeholder="maya@tablero.com" />
          </FieldLabel>
          <FieldLabel label={t('tempPassword')} testid="invite-password">
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full bg-cream-sub rounded-xl px-4 py-3 pr-11 font-fn outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink" aria-label={showPw ? t('hidePassword') : t('showPassword')}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-ink-muted font-mono">{t('passwordNote')}</p>
          </FieldLabel>
          <FieldLabel label={t('colRole')} testid="invite-role">
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary">
              {['WAITER', 'CHEF', 'CASHIER', 'COURIER', 'ADMIN'].map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
          </FieldLabel>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-outline" data-testid="invite-cancel">{tc('cancel')}</button>
          <button onClick={submit} disabled={loading} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50" data-testid="invite-send">
            <Mail size={14} /> {loading ? t('creating') : t('createAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ label, children, testid }) {
  return (
    <label data-testid={testid}>
      <span className="label-eyebrow">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
