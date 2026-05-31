'use client';
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { QrCode, Check, ArrowRight } from 'lucide-react';

function QrContent() {
  const t = useTranslations('qr');
  const searchParams = useSearchParams();
  const table = searchParams.get('t') || '—';

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-br from-ink via-ink/90 to-ink/80" />
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_30%_40%,#E4883A,transparent_50%),radial-gradient(circle_at_70%_60%,#C8553D,transparent_50%)]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 pt-20 pb-16 text-center text-white">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur font-mono text-xs mb-6">
          <span className="h-2 w-2 rounded-full bg-secondary animate-pulse-soft" />
          {t('sessionDetected')}
        </div>
        <div className="h-20 w-20 rounded-3xl bg-white/10 backdrop-blur mx-auto flex items-center justify-center mb-6">
          <QrCode size={36} />
        </div>
        <h1 className="font-display text-4xl md:text-5xl">{t('welcome', { table })}</h1>
        <p className="mt-4 text-white/80">{t('connectedText')}</p>

        <div className="mt-10 space-y-3 text-left bg-white/10 backdrop-blur-lg rounded-3xl p-5">
          <Row label={t('rowRestaurant')} value={t('restaurantValue')} />
          <Row label={t('rowTable')} value={table} />
          <Row label={t('rowZone')} value={t('zoneValue')} />
          <Row label={t('rowSession')} value={`qr_${Date.now().toString().slice(-6)}`} />
        </div>

        <Link href={`/menu?table=${encodeURIComponent(table)}`} className="mt-8 inline-flex items-center justify-center gap-2 w-full py-4 rounded-full bg-primary text-white font-fn font-semibold text-lg" data-testid="open-menu">
          {t('openMenu')} <ArrowRight size={18} />
        </Link>
        <Link href="/login" className="mt-3 inline-block text-sm text-white/70 hover:text-white" data-testid="sign-in-for-order">
          {t('signInForOrder')}
        </Link>

        <div className="mt-12 flex items-center justify-center gap-1 text-[10px] font-mono uppercase tracking-widest text-white/50">
          <Check size={12} /> {t('publicMenu')}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">{label}</span>
      <span className="font-fn text-sm">{value}</span>
    </div>
  );
}

export default function QrScan() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <QrContent />
    </Suspense>
  );
}
