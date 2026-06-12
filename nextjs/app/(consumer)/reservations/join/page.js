'use client';
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Loader2, QrCode, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/client';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';

function JoinContent() {
  const t = useTranslations('reservationDetail');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [{ user }] = useStore();
  const token = searchParams.get('token') || '';

  const [error, setError] = React.useState(null);
  const isGuest = user.role === 'GUEST';
  const attempted = React.useRef(false);

  React.useEffect(() => {
    if (!token) {
      setError(t('joinInvalidLink'));
      return;
    }
    if (isGuest) {
      // Sign in first, then come back here with the same token.
      router.replace(`/login?next=${encodeURIComponent(`/reservations/join?token=${token}`)}`);
      return;
    }
    if (!user.id || attempted.current) return;
    attempted.current = true;

    api.post('/api/reservations/join', { token })
      .then((reservation) => {
        toast.success(t('joinSuccess'));
        router.replace(`/reservations/${reservation.id}`);
      })
      .catch((err) => {
        setError(err.response?.data?.message || t('joinFailed'));
      });
  }, [token, isGuest, user.id, router, t]);

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      {error ? (
        <>
          <div className="h-16 w-16 rounded-3xl bg-err-bg text-err mx-auto flex items-center justify-center mb-6">
            <AlertTriangle size={28} />
          </div>
          <h1 className="font-display text-3xl">{t('joinFailedTitle')}</h1>
          <p className="mt-3 text-ink-body text-sm" data-testid="join-error">{error}</p>
          <Link href="/reservations" className="btn-primary mt-8 inline-block">{t('backToReservations')}</Link>
        </>
      ) : (
        <>
          <div className="h-16 w-16 rounded-3xl bg-cream-sub mx-auto flex items-center justify-center mb-6">
            <QrCode size={28} className="text-primary" />
          </div>
          <h1 className="font-display text-3xl">{t('joiningTitle')}</h1>
          <div className="mt-6 flex justify-center"><Loader2 size={24} className="animate-spin text-ink-muted" /></div>
        </>
      )}
    </div>
  );
}

export default function JoinReservation() {
  return (
    <Suspense fallback={
      <div className="py-24 flex justify-center">
        <Loader2 size={28} className="animate-spin text-ink-muted" />
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
