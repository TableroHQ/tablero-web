'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const SECTIONS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'];

export default function Terms() {
  const t = useTranslations('terms');
  return (
    <div className="max-w-[900px] mx-auto px-6 md:px-12 py-16">
      <div className="label-eyebrow">{t('eyebrow')}</div>
      <h1 className="font-display text-5xl mt-2">{t('title')}</h1>
      <p className="mt-3 text-ink-muted font-mono text-sm">{t('updated')}</p>
      <p className="mt-4 text-ink-body leading-relaxed max-w-2xl">
        {t.rich('intro', { link: (c) => <Link href="/contact" className="text-primary hover:underline">{c}</Link> })}
      </p>

      <div className="mt-12 space-y-10">
        {SECTIONS.map((s, i) => (
          <div key={s} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
            <div className="md:pt-0.5">
              <span className="font-mono text-xs text-ink-muted">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="font-fn font-semibold text-ink mt-1">{t(`${s}Title`)}</h2>
            </div>
            <div className="bg-white rounded-2xl border border-border p-5">
              <p className="text-sm text-ink-body leading-relaxed">{t(`${s}Body`)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3 text-sm font-fn">
        <Link href="/privacy" className="text-primary hover:underline">{t('linkPrivacy')}</Link>
        <span className="text-ink-muted">·</span>
        <Link href="/cookies" className="text-primary hover:underline">{t('linkCookies')}</Link>
        <span className="text-ink-muted">·</span>
        <Link href="/contact" className="text-primary hover:underline">{t('linkContact')}</Link>
      </div>
    </div>
  );
}
