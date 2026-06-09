'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import { Star, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { toast } from 'sonner';

const CATEGORIES = ['chef', 'waiter', 'cleanliness', 'service'];
const catKey = (k) => 'cat' + k.charAt(0).toUpperCase() + k.slice(1);

export default function Reviews() {
  const t = useTranslations('reviews');
  const [state, store] = useStore();
  const { user } = state;

  const [ratings, setRatings] = React.useState({ chef: 5, waiter: 4, cleanliness: 5, service: 5 });
  const [comment, setComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  // Local review feed — populated after submission
  const [myReviews, setMyReviews] = React.useState([]);

  const submit = async () => {
    if (!comment.trim()) return toast.error(t('addComment'));
    setSubmitting(true);
    try {
      const avg = Math.round(Object.values(ratings).reduce((s, v) => s + v, 0) / CATEGORIES.length);
      const author = user.name || user.username || t('you');

      // Persist to the backend so it shows up in admin moderation. The review feed
      // below is local-only optimism; failure is non-fatal but surfaced to the user.
      const restaurantId = user.restaurantId;
      if (restaurantId) {
        await api.post(`/api/restaurants/${restaurantId}/reviews`, {
          rating: avg,
          content: comment,
          authorName: author,
        });
      }

      const review = {
        id: `rv_${Date.now()}`,
        author,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rating: avg,
        comment,
        ratings: { ...ratings },
        status: 'PENDING',
      };
      setMyReviews(rs => [review, ...rs]);
      store.addNotif({ type: 'review.submitted', title: t('submittedTitle'), body: t('submittedBody') });
      setComment('');
      setRatings({ chef: 5, waiter: 4, cleanliness: 5, service: 5 });
      setSubmitted(true);
      toast.success(t('submittedToast'));
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || t('addComment'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow">{t('eyebrow')}</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">{t('title')}</h1>
      <p className="mt-3 text-ink-body max-w-xl">{t('intro')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-10">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-border p-7 md:p-8">
          {submitted ? (
            <div className="py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-ok-bg text-ok flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
              <h3 className="font-display text-2xl">{t('thankYou')}</h3>
              <p className="text-ink-body mt-2 text-sm">{t('pendingApproval')}</p>
              <button onClick={() => setSubmitted(false)} className="btn-outline mt-6" data-testid="new-review">{t('writeAnother')}</button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl">{t('rateVisit')}</h2>
              <div className="space-y-5 mt-6">
                {CATEGORIES.map(k => (
                  <div key={k} className="flex items-center justify-between" data-testid={`rate-${k}`}>
                    <span className="font-fn">{t(catKey(k))}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setRatings(s => ({ ...s, [k]: n }))}
                          className={`p-1 ${ratings[k] >= n ? 'text-secondary' : 'text-cream-sub'}`}
                          data-testid={`star-${k}-${n}`}>
                          <Star size={22} fill={ratings[k] >= n ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <textarea data-testid="review-comment" value={comment} onChange={e => setComment(e.target.value)}
                placeholder={t('placeholder')}
                className="w-full mt-6 bg-cream-sub rounded-2xl p-4 min-h-[140px] outline-none focus:ring-2 focus:ring-primary font-fn" />
              <div className="mt-5 flex gap-3">
                <button onClick={submit} disabled={submitting} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60" data-testid="submit-review">
                  {submitting && <Loader2 size={14} className="animate-spin" />} {t('submitReview')}
                </button>
                <button className="btn-outline" data-testid="cancel-review" onClick={() => setComment('')}>{t('maybeLater')}</button>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-border p-6">
            <div className="label-eyebrow">{t('yourReviews')}</div>
            {myReviews.length === 0 ? (
              <p className="text-sm text-ink-muted mt-4">{t('noReviews')}</p>
            ) : (
              <div className="mt-4 space-y-5 divide-y divide-border">
                {myReviews.map(rv => (
                  <div key={rv.id} className="pt-5 first:pt-0">
                    <div className="flex items-center justify-between">
                      <span className="font-fn font-semibold">{rv.author}</span>
                      <span className="font-mono text-xs text-ink-muted">{rv.date}</span>
                    </div>
                    <div className="flex gap-0.5 text-secondary mt-1">
                      {Array.from({ length: rv.rating }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                    </div>
                    <p className="text-sm text-ink-body mt-2 leading-relaxed">"{rv.comment}"</p>
                    <span className="chip bg-warn-bg text-warn mt-2">{t('statusPending')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
