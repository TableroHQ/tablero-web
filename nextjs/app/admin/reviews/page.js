'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import OpsLayout from '@/components/OpsLayout';
import { Check, X, Star, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';

const MOD_KEY = { pending: 'stPending', approved: 'stApproved', rejected: 'stRejected' };

export default function ReviewsModeration() {
  const t = useTranslations('adminReviews');
  const modLabel = (s) => (MOD_KEY[s] ? t(MOD_KEY[s]) : s);
  const [{ user }] = useStore();
  const restaurantId = user.restaurantId;
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('pending');
  const [q, setQ] = React.useState('');

  React.useEffect(() => {
    if (!restaurantId) { setLoading(false); return; }
    api.get(`/api/restaurants/${restaurantId}/reviews`, { params: { pageSize: 100 } })
      .then(data => {
        const list = Array.isArray(data) ? data : data?.items ?? [];
        setReviews(list.map(r => ({
          id: r.id,
          author: r.authorName || r.userName || r.author || '—',
          rating: r.rating || 0,
          comment: r.content || r.comment || r.body || '',
          date: r.createdAt?.slice(0, 10) || '',
          modStatus: r.status === 'PUBLISHED' ? 'approved' : r.status === 'REJECTED' ? 'rejected' : 'pending',
        })));
      })
      .catch(() => toast.error(t('failedLoad')))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const act = async (id, status) => {
    try {
      if (status === 'approved') {
        await api.patch(`/api/reviews/${id}/publish`, {});
      } else if (status === 'rejected') {
        await api.delete(`/api/reviews/${id}`);
      }
      setReviews(rs => rs.map(r => r.id === id ? { ...r, modStatus: status } : r));
      toast.success(status === 'approved' ? t('approvedToast') : t('rejectedToast'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('couldNotModerate'));
    }
  };

  const list = reviews.filter(r =>
    (filter === 'all' || r.modStatus === filter) &&
    (!q || r.author?.toLowerCase().includes(q.toLowerCase()) || r.comment?.toLowerCase().includes(q.toLowerCase()))
  );

  const pending = reviews.filter(r => r.modStatus === 'pending').length;

  return (
    <OpsLayout title={t('title')} subtitle={t('subtitlePending', { n: pending })}
      right={
        <span className={`chip ${pending > 0 ? 'bg-warn-bg text-warn' : 'bg-ok-bg text-ok'}`}>{loading ? '…' : t('pendingChip', { n: pending })}</span>
      }>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-border rounded-full px-4 py-2 flex-1 max-w-md">
          <Search size={14} className="text-ink-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('searchPlaceholder')}
            className="bg-transparent outline-none flex-1 text-sm" data-testid="review-search" />
        </div>
        <div className="flex bg-white border border-border rounded-full p-1">
          {[['all', t('filterAll')], ['pending', t('filterPending')], ['approved', t('filterApproved')], ['rejected', t('filterRejected')]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} data-testid={`filter-${k}`}
              className={`px-3 py-1.5 text-xs font-mono rounded-full ${filter === k ? 'bg-ink text-white' : 'text-ink-body'}`}>{l}</button>
          ))}
        </div>
      </div>

      {loading && <div className="py-10 flex justify-center"><Loader2 size={24} className="animate-spin text-ink-muted" /></div>}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat n={String(reviews.filter(r => r.modStatus === 'pending').length)} l={t('statPending')} color="warn" />
        <Stat n={String(reviews.filter(r => r.modStatus === 'approved').length)} l={t('statApproved')} color="ok" />
        <Stat n={String(reviews.filter(r => r.modStatus === 'rejected').length)} l={t('statRejected')} color="err" />
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center text-ink-muted">
          {reviews.length === 0 ? t('emptyNone') : t('emptyFilter')}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {list.map(r => (
            <div key={r.id}
              className={`bg-white rounded-2xl border p-5 ${r.modStatus === 'pending' ? 'border-warn/30' : r.modStatus === 'approved' ? 'border-ok/30' : 'border-err/30'}`}
              data-testid={`review-${r.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display">
                    {(r.author || '?')[0]}
                  </div>
                  <div>
                    <div className="font-fn font-semibold">{r.author}</div>
                    <div className="text-xs font-mono text-ink-muted">{r.date}</div>
                  </div>
                </div>
                <span className={`chip flex-shrink-0 ${r.modStatus === 'pending' ? 'bg-warn-bg text-warn' : r.modStatus === 'approved' ? 'bg-ok-bg text-ok' : 'bg-err-bg text-err'}`}>
                  {modLabel(r.modStatus)}
                </span>
              </div>

              <div className="flex gap-0.5 text-secondary mt-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill={i < r.rating ? 'currentColor' : 'none'} />
                ))}
                <span className="ml-1 text-xs font-mono text-ink-muted">{r.rating}/5</span>
              </div>

              <p className="text-sm text-ink-body mt-3 leading-relaxed">"{r.comment}"</p>

              {r.modStatus === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => act(r.id, 'approved')}
                    className="flex-1 bg-ok text-white py-2.5 rounded-xl font-fn font-medium text-sm flex items-center justify-center gap-1"
                    data-testid={`approve-${r.id}`}>
                    <Check size={14} /> {t('approve')}
                  </button>
                  <button onClick={() => act(r.id, 'rejected')}
                    className="flex-1 bg-err text-white py-2.5 rounded-xl font-fn font-medium text-sm flex items-center justify-center gap-1"
                    data-testid={`reject-${r.id}`}>
                    <X size={14} /> {t('reject')}
                  </button>
                </div>
              )}
              {r.modStatus !== 'pending' && (
                <button onClick={() => act(r.id, 'pending')}
                  className="mt-4 text-xs font-mono text-ink-muted hover:text-primary"
                  data-testid={`undo-${r.id}`}>
                  {t('undo')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </OpsLayout>
  );
}

function Stat({ n, l, color }) {
  const colors = { warn: 'text-warn', ok: 'text-ok', err: 'text-err' };
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className={`font-display text-4xl ${colors[color]}`}>{n}</div>
      <div className="label-eyebrow mt-1">{l}</div>
    </div>
  );
}
