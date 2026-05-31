'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { User, Mail, Phone, AtSign, Shield, Camera, LogOut, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

function maskEmail(email) {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const vis = local.length <= 2 ? local[0] + '**' : local[0] + '**' + local.slice(-1);
  return `${vis}@${domain}`;
}

export default function Profile() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const [state, store] = useStore();
  const router = useRouter();

  const [draft, setDraft] = React.useState({
    firstName: '', lastName: '', username: '', phone: '',
  });
  const [loading, setLoading] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState({});

  React.useEffect(() => {
    const handler = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Load fresh profile from server; draft is set from the response
  React.useEffect(() => {
    api.get('/api/users/me')
      .then((data) => {
        store.setProfile(data);
        const fn = data.firstName ?? data.FirstName ?? '';
        const ln = data.lastName  ?? data.LastName  ?? '';
        setDraft({
          firstName: fn,
          lastName:  ln,
          username:  data.username  ?? data.Username  ?? '',
          phone:     data.phoneNumber ?? data.PhoneNumber ?? data.phone ?? '',
        });
      })
      .catch(() => {
        // Fallback: populate draft from whatever the store already has
        const u = store.get().user;
        setDraft({
          firstName: u.firstName || '',
          lastName:  u.lastName  || '',
          username:  u.username  || '',
          phone:     u.phone     || '',
        });
      });
  }, []);

  const save = async () => {
    const errs = {};
    if (!draft.firstName.trim()) errs.firstName = t('errRequired');
    if (!draft.lastName.trim())  errs.lastName  = t('errRequired');
    if (draft.username && draft.username.length < 3) errs.username = t('errMin3');
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      const updated = await api.patch('/api/users/me', {
        FirstName:   draft.firstName,
        LastName:    draft.lastName,
        Username:    draft.username,
        PhoneNumber: draft.phone,
      });
      store.setProfile(updated);
      setDirty(false);
      toast.success(t('profileUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('couldNotSave'));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await api.post('/api/auth/logout', {}); } catch {}
    store.logout();
    router.push('/login');
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/api/users/me');
      store.logout();
      router.push('/');
      toast.success(t('accountDeleted'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete account');
    } finally {
      setConfirmDelete(false);
    }
  };

  const user = state.user;
  const firstName = user.firstName || draft.firstName || '';
  const lastName  = user.lastName  || draft.lastName  || '';
  const displayName = `${firstName} ${lastName}`.trim() || user.username || user.name || 'User';
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('') || (user.username?.[0] ?? 'U');

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow">{t('eyebrow')}</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">{t('title')}</h1>

      <div className="grid lg:grid-cols-3 gap-6 mt-10">
        <div className="lg:col-span-2 space-y-6">
          <Card title={t('identity')}>
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display text-3xl uppercase">
                  {initials}
                </div>
                <button className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-ink text-white flex items-center justify-center" data-testid="change-avatar" aria-label="Change profile photo">
                  <Camera size={14} />
                </button>
              </div>
              <div>
                <div className="font-display text-2xl">{displayName}</div>
                <div className="text-sm text-ink-muted font-mono mt-1">
                  {user.role} · @{user.username || '—'}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <Field icon={User}   label={t('firstName')} value={draft.firstName} onChange={v => { setDraft(d => ({ ...d, firstName: v })); setDirty(true); setFieldErrors(e => ({ ...e, firstName: '' })); }} testid="profile-first-name" fieldId="profile-first-name" error={fieldErrors.firstName} />
              <Field icon={User}   label={t('lastName')}  value={draft.lastName}  onChange={v => { setDraft(d => ({ ...d, lastName: v }));  setDirty(true); setFieldErrors(e => ({ ...e, lastName: '' })); }}  testid="profile-last-name"  fieldId="profile-last-name"  error={fieldErrors.lastName} />
              <Field icon={AtSign} label={t('username')}  value={draft.username}  onChange={v => { setDraft(d => ({ ...d, username: v }));  setDirty(true); setFieldErrors(e => ({ ...e, username: '' })); }}  testid="profile-username"   fieldId="profile-username"   error={fieldErrors.username} />
              <Field icon={Phone}  label={t('phone')}     value={draft.phone}     onChange={v => { setDraft(d => ({ ...d, phone: v }));     setDirty(true); }} testid="profile-phone" fieldId="profile-phone" />
            </div>

            {/* Email is identity-linked — show masked read-only */}
            <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-cream-sub text-sm font-fn text-ink-muted" data-testid="profile-email">
              <Mail size={14} className="shrink-0" />
              <span>{maskEmail(user.email)}</span>
              <span className="ml-auto text-[10px] font-mono uppercase tracking-wide">{t('readOnly')}</span>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={save} disabled={loading} className="btn-primary disabled:opacity-50" data-testid="save-profile">
                {loading ? tc('saving') : t('saveChanges')}
              </button>
              <Link href="/forgot-password" className="btn-outline inline-flex items-center gap-2" data-testid="reset-password-link">
                <Shield size={14} /> {t('resetPassword')}
              </Link>
            </div>
          </Card>

          <Card title={t('security')}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Info label={t('role')}         value={user.role || '—'} />
              <Info label={t('restaurant')}   value={user.restaurantId || '—'} />
              <Info label={t('jwtRotation')}  value={t('jwtValue')} />
              <Info label={t('refreshToken')} value={t('refreshValue')} />
            </div>
          </Card>

          <Card title={t('dangerZone')} tone="err">
            <div className="flex flex-wrap gap-3">
              <button onClick={logout} className="px-5 py-2.5 rounded-full bg-cream-sub text-ink font-fn inline-flex items-center gap-2" data-testid="logout">
                <LogOut size={14} /> {t('signOut')}
              </button>
              {confirmDelete ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-err font-fn">{t('permanentWarning')}</span>
                  <button onClick={deleteAccount} className="px-5 py-2.5 rounded-full bg-err text-white font-fn inline-flex items-center gap-2" data-testid="delete-confirm">
                    <Trash2 size={14} /> {t('yesDelete')}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="px-5 py-2.5 rounded-full bg-cream-sub text-ink font-fn" data-testid="delete-cancel">
                    {tc('cancel')}
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="px-5 py-2.5 rounded-full bg-err-bg text-err font-fn inline-flex items-center gap-2" data-testid="delete-account">
                  <Trash2 size={14} /> {t('deleteMyAccount')}
                </button>
              )}
            </div>
          </Card>
        </div>

        <aside>
          <div className="bg-ink text-cream rounded-3xl p-6">
            <div className="label-eyebrow !text-cream/60">{t('wallet')}</div>
            <div className="font-display text-5xl mt-2">${(user.balance || 0).toFixed(2)}</div>
            <div className="text-xs font-mono text-cream/60 mt-1">{t('availableHeld')} ${(user.heldBalance || 0).toFixed(2)}</div>
            <Link href="/topup" className="mt-4 w-full block text-center py-3 rounded-full bg-primary text-white font-fn font-medium" data-testid="topup-link">{t('topUp')}</Link>
          </div>
          <div className="bg-white rounded-3xl border border-border p-6 mt-4">
            <div className="label-eyebrow">{t('loyalty')}</div>
            <div className="font-display text-4xl mt-2">{(user.loyaltyPoints || 0).toLocaleString()}</div>
            <div className="text-xs font-mono text-ink-muted">{t('points')}</div>
            <Link href="/loyalty" className="mt-3 block text-sm text-primary font-fn">{t('browseRewards')}</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, children, tone }) {
  return (
    <div className={`bg-white rounded-3xl border p-6 md:p-7 ${tone === 'err' ? 'border-err/30' : 'border-border'}`}>
      <div className={`label-eyebrow mb-5 ${tone === 'err' ? '!text-err' : ''}`}>{title}</div>
      {children}
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, testid, fieldId, error }) {
  const id = fieldId || testid;
  return (
    <div data-testid={testid}>
      <label htmlFor={id} className="label-eyebrow">{label}</label>
      <div className="mt-2 relative">
        <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`w-full bg-cream-sub rounded-xl pl-11 pr-4 py-3 font-fn outline-none focus:ring-2 ${error ? 'focus:ring-err ring-1 ring-err' : 'focus:ring-primary'}`}
        />
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs text-err font-fn">{error}</p>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="p-4 rounded-2xl bg-cream-sub/50">
      <div className="label-eyebrow !text-[9px]">{label}</div>
      <div className="font-fn text-sm mt-1">{value}</div>
    </div>
  );
}
