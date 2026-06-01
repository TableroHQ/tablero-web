'use client';
import React from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { createHubConnection, startHub } from '@/lib/signalr';
import { Check, CheckCheck, Mail, MessageSquare, BellRing, Megaphone, Loader2, Wifi, WifiOff } from 'lucide-react';
import { SkeletonRow } from '@/components/Skeleton';
import { useTranslations } from 'next-intl';

export default function Notifications() {
  const t = useTranslations('notifications');
  const [state, store] = useStore();
  const { notifications: localNotifs, prefs, user } = state;
  const [filter, setFilter] = React.useState('all');
  const [serverNotifs, setServerNotifs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [hubConnected, setHubConnected] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const listRef = React.useRef(null);
  const PAGE_SIZE = 20;

  // Every authenticated user can see their own notifications via the user-scoped
  // endpoint; the backend derives the recipient from the JWT, never a query param.
  const fetchServerNotifs = React.useCallback((pageNum = 1) => {
    if (!user.id) return;
    setLoading(true);
    api.get('/api/notifications/me', { params: { pageSize: PAGE_SIZE, page: pageNum } })
      .then(data => {
        const list = Array.isArray(data) ? data : data?.items ?? [];
        const mapped = list.map(n => ({
          id: n.id,
          type: n.type || n.channel || 'system',
          title: n.subject || n.title || 'Notification',
          body: n.body || n.message || '',
          at: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
          read: n.status === 'SENT' || n.status === 'DELIVERED',
          source: 'server',
        }));
        setServerNotifs(prev => pageNum === 1 ? mapped : [...prev, ...mapped]);
        setHasMore(list.length === PAGE_SIZE);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  React.useEffect(() => { fetchServerNotifs(1); }, [fetchServerNotifs]);

  // Load persisted notification preferences so the toggles reflect server state.
  React.useEffect(() => {
    if (!user.id) return;
    api.get('/api/users/me/preferences')
      .then(data => {
        if (data && typeof data === 'object') {
          store.setPrefs({
            email: !!data.email,
            sms: !!data.sms,
            push: !!data.push,
            marketing: !!data.marketing,
          });
        }
      })
      .catch(() => {});
  }, [user.id]);

  // Infinite scroll: load next page when bottom of list is visible
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80 && hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchServerNotifs(nextPage);
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [hasMore, loading, page, fetchServerNotifs]);

  // NotifyHub — push in-app notifications in real time
  React.useEffect(() => {
    if (!user.id || typeof window === 'undefined') return;
    const conn = createHubConnection('notify');
    conn.onclose(() => setHubConnected(false));
    conn.onreconnected(() => setHubConnected(true));
    conn.onreconnecting(() => setHubConnected(false));

    conn.on('Notify', (data) => {
      store.addNotif({
        type: data?.type || 'system',
        title: data?.subject || data?.title || 'Notification',
        body: data?.body || data?.message || '',
      });
    });

    startHub(conn).then(ok => {
      if (ok) {
        setHubConnected(true);
        conn.invoke('JoinGroup', `user:${user.id}`).catch(() => {});
      }
    });

    return () => { conn.stop().catch(() => {}); };
  }, [user.id]);

  // Merge server + local; local first (most recent actions)
  const allNotifs = React.useMemo(() => {
    const seen = new Set(localNotifs.map(n => n.id));
    const extra = serverNotifs.filter(n => !seen.has(n.id));
    return [...localNotifs, ...extra].sort((a, b) => (b.at || 0) - (a.at || 0));
  }, [localNotifs, serverNotifs]);

  const list = allNotifs.filter(n =>
    filter === 'all' ? true : filter === 'unread' ? !n.read : n.read
  );

  const unreadCount = allNotifs.filter(n => !n.read).length;

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-12">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">{t('eyebrow')}</div>
        <span className={`chip text-xs ${hubConnected ? 'bg-ok-bg text-ok' : 'bg-cream-sub text-ink-muted'}`}>
          {hubConnected ? <><Wifi size={10} /> {t('live')}</> : <><WifiOff size={10} /> {t('offline')}</>}
        </span>
      </div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">{t('title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {[['all', t('all')], ['unread', unreadCount > 0 ? t('unreadCount', { n: unreadCount }) : t('unread')], ['read', t('read')]].map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)} data-testid={`filter-${k}`}
                  className={`px-4 py-2 rounded-full text-sm font-fn ${filter === k ? 'bg-ink text-white' : 'bg-white border border-border'}`}>{l}</button>
              ))}
            </div>
            <button onClick={store.markAllRead} className="text-sm font-mono text-primary flex items-center gap-1" data-testid="mark-all">
              <CheckCheck size={14} /> {t('markAllRead')}
            </button>
          </div>

          {loading && page === 1 && (
            <div className="bg-white rounded-3xl border border-border divide-y divide-border">
              {[0,1,2,3,4].map(i => <SkeletonRow key={i} className="px-5" />)}
            </div>
          )}

          <div ref={listRef} className="bg-white rounded-3xl border border-border divide-y divide-border max-h-[70vh] overflow-y-auto">
            {list.length === 0 ? (
              <div className="p-10 text-center text-ink-muted">{t('noNotifications')}</div>
            ) : list.map(n => (
              <div key={n.id} className={`p-5 flex gap-4 ${!n.read ? 'bg-primary/5' : ''}`} data-testid={`notif-row-${n.id}`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-mono font-bold flex-shrink-0 ${!n.read ? 'bg-primary text-white' : 'bg-cream-sub text-ink-muted'}`}>●</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-fn font-semibold">{n.title}</span>
                    <span className="text-[10px] font-mono text-ink-muted uppercase tracking-widest flex-shrink-0">{n.type}</span>
                  </div>
                  <p className="text-sm text-ink-body mt-1">{n.body}</p>
                  {n.at && (
                    <p className="text-[10px] font-mono text-ink-muted mt-1">{new Date(n.at).toLocaleString()}</p>
                  )}
                </div>
                {!n.read && !n.source && (
                  <button onClick={() => store.markRead(n.id)} className="text-ink-muted hover:text-primary flex-shrink-0" data-testid={`read-${n.id}`}>
                    <Check size={16} />
                  </button>
                )}
              </div>
            ))}
            {loading && page > 1 && (
              <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-ink-muted" /></div>
            )}
            {!hasMore && list.length > 0 && (
              <div className="py-3 text-center text-xs font-mono text-ink-muted">{t('allCaughtUp')}</div>
            )}
          </div>
        </div>

        <aside>
          <div className="bg-white rounded-3xl border border-border p-6">
            <div className="label-eyebrow">{t('preferences')}</div>
            <p className="text-sm text-ink-body mt-2">{t('preferencesSubtitle')}</p>
            <div className="mt-5 space-y-4">
              <Toggle label={t('emailReceipts')} hint={t('emailReceiptsHint')} icon={Mail} value={prefs.email} onChange={v => { store.setPrefs({ email: v }); api.patch('/api/users/me/preferences', { email: v }).catch(() => {}); }} testid="pref-email" />
              <Toggle label={t('smsAlerts')} hint={t('smsAlertsHint')} icon={MessageSquare} value={prefs.sms} onChange={v => { store.setPrefs({ sms: v }); api.patch('/api/users/me/preferences', { sms: v }).catch(() => {}); }} testid="pref-sms" />
              <Toggle label={t('pushNotifications')} hint={t('pushNotificationsHint')} icon={BellRing} value={prefs.push} onChange={v => { store.setPrefs({ push: v }); api.patch('/api/users/me/preferences', { push: v }).catch(() => {}); }} testid="pref-push" />
              <Toggle label={t('promotions')} hint={t('promotionsHint')} icon={Megaphone} value={prefs.marketing} onChange={v => { store.setPrefs({ marketing: v }); api.patch('/api/users/me/preferences', { marketing: v }).catch(() => {}); }} testid="pref-marketing" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Toggle({ label, hint, value, onChange, icon: Icon, testid }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer" data-testid={testid}>
      <div className="h-9 w-9 rounded-lg bg-cream-sub text-ink-muted flex items-center justify-center flex-shrink-0">
        <Icon size={14} />
      </div>
      <div className="flex-1">
        <div className="font-fn font-semibold text-sm">{label}</div>
        <div className="text-xs text-ink-muted">{hint}</div>
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={`h-6 w-11 rounded-full transition relative flex-shrink-0 ${value ? 'bg-primary' : 'bg-cream-sub'}`}>
        <span className={`h-5 w-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}
