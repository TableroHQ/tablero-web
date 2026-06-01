'use client';
import React from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';

const typeIcon = {
  'bonus.earned': '★', 'reservation.reminder': '◷', 'reservation.confirmed': '✓',
  'delivery.checkpoint': '⊙', 'delivery.assigned': '⚡', 'delivery.confirmed': '✓',
  'order.placed': '●', 'order.ready': '◆', 'order.served': '⇨',
  'payment.succeeded': '$', 'review.submitted': '✎',
};

function timeAgo(ts, t) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return t('secondsAgo', { n: s });
  if (s < 3600) return t('minutesAgo', { n: Math.floor(s / 60) });
  if (s < 86400) return t('hoursAgo', { n: Math.floor(s / 3600) });
  return t('daysAgo', { n: Math.floor(s / 86400) });
}

export default function NotificationBell({ dark = false }) {
  const t = useTranslations('notifications');
  const [, s] = useStore();
  const { notifications } = s.get();
  const unread = notifications.filter(n => !n.read).length;
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} data-testid="notification-bell" aria-label={unread > 0 ? t('bellLabelUnread', { n: unread }) : t('bellLabel')} aria-expanded={open} aria-haspopup="dialog"
        className={`relative h-10 w-10 rounded-full flex items-center justify-center transition ${dark ? 'bg-kds-surface2 hover:bg-kds-bg text-cream' : 'bg-cream-sub hover:bg-cream-warm text-ink'}`}>
        <Bell size={18} />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>}
      </button>

      {open && (
        <div className={`absolute right-0 top-12 w-[380px] max-w-[calc(100vw-32px)] rounded-2xl shadow-2xl border overflow-hidden z-[60] ${dark ? 'bg-kds-surface text-cream border-kds-surface2' : 'bg-white text-ink border-border'}`} data-testid="notification-panel">
          <div className={`flex items-center justify-between px-5 py-4 border-b ${dark ? 'border-kds-surface2' : 'border-border'}`}>
            <div>
              <div className="label-eyebrow">{t('eyebrow')}</div>
              <div className="font-display text-lg">{unread ? t('unreadShort', { n: unread }) : t('allCaughtUp')}</div>
            </div>
            <button onClick={s.markAllRead} className="text-xs font-mono uppercase text-primary flex items-center gap-1" data-testid="mark-all-read">
              <CheckCheck size={12} /> {t('markAll')}
            </button>
          </div>
          <div className="max-h-[420px] overflow-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-ink-muted text-sm">{t('empty')}</div>
            ) : notifications.map(n => (
              <button key={n.id} onClick={() => { s.markRead(n.id); setOpen(false); }} data-testid={`notif-${n.id}`}
                className={`w-full text-left px-5 py-4 flex gap-3 border-b ${dark ? 'border-kds-surface2 hover:bg-kds-bg' : 'border-border/50 hover:bg-cream-sub/50'} ${!n.read ? 'bg-primary/5' : ''}`}>
                <span className={`h-8 w-8 rounded-lg flex items-center justify-center font-mono ${dark ? 'bg-kds-surface2' : 'bg-cream-sub'} ${!n.read ? 'text-primary' : 'text-ink-muted'}`}>{typeIcon[n.type] || '●'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-fn font-semibold text-sm truncate">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <div className={`text-xs mt-0.5 line-clamp-2 ${dark ? 'text-cream/70' : 'text-ink-body'}`}>{n.body}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mt-1">{timeAgo(n.at, t)} · {n.type}</div>
                </div>
              </button>
            ))}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className={`block text-center py-3 text-sm font-fn font-medium border-t ${dark ? 'border-kds-surface2 text-cream/80 hover:bg-kds-bg' : 'border-border text-primary hover:bg-cream-sub/50'}`} data-testid="view-all-notifs">
            {t('viewAll')}
          </Link>
        </div>
      )}
    </div>
  );
}
