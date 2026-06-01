'use client';
import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const COOKIES = [
  { slug: 'cat1', required: true, items: [{ name: 'tablero_refresh', key: 'i1' }, { name: 'tablero_session', key: 'i2' }] },
  { slug: 'cat2', required: false, items: [{ name: 'tablero_store_v1', key: 'i1' }] },
  { slug: 'cat3', required: false, analytics: true, items: [{ name: '_tablero_anon', key: 'i1' }] },
];

export default function Cookies() {
  const t = useTranslations('cookies');
  const [analytics, setAnalytics] = React.useState(false);
  const save = () => toast.success(t('savedToast'));

  return (
    <div className="max-w-[900px] mx-auto px-6 md:px-12 py-16">
      <div className="label-eyebrow">{t('eyebrow')}</div>
      <h1 className="font-display text-5xl mt-2">{t('title')}</h1>
      <p className="mt-3 text-ink-muted font-mono text-sm">{t('updated')}</p>
      <p className="mt-4 text-ink-body leading-relaxed max-w-2xl">
        {t('intro')}
      </p>

      <div className="mt-12 space-y-8">
        {COOKIES.map(cat => (
          <div key={cat.slug} className="bg-white rounded-3xl border border-border p-6 md:p-7">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-fn font-semibold text-lg text-ink">{t(`${cat.slug}Name`)}</h2>
                <p className="mt-1 text-sm text-ink-body">{t(`${cat.slug}Desc`)}</p>
              </div>
              {cat.required ? (
                <span className="chip bg-ok-bg text-ok">{t('alwaysOn')}</span>
              ) : (
                <button
                  role="switch"
                  aria-checked={cat.analytics ? analytics : true}
                  onClick={() => cat.analytics && setAnalytics(v => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cat.analytics ? (analytics ? 'bg-primary' : 'bg-border') : 'bg-primary'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${(cat.analytics ? analytics : true) ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              )}
            </div>
            <div className="mt-5 divide-y divide-border">
              {cat.items.map(item => (
                <div key={item.name} className="py-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                  <div>
                    <code className="text-xs font-mono bg-cream-sub px-2 py-0.5 rounded text-ink">{item.name}</code>
                    <p className="mt-2 text-sm text-ink-body">{t(`${cat.slug}${item.key}Purpose`)}</p>
                  </div>
                  <div className="text-xs font-mono text-ink-muted sm:text-right">{t(`${cat.slug}${item.key}Duration`)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button onClick={save} className="btn-primary">{t('savePrefs')}</button>
      </div>

      <div className="mt-10 text-sm text-ink-body leading-relaxed">
        {t.rich('footer', {
          privacy: (c) => <Link href="/privacy" className="text-primary hover:underline">{c}</Link>,
          contact: (c) => <Link href="/contact" className="text-primary hover:underline">{c}</Link>,
        })}
      </div>
    </div>
  );
}
