'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import { Download, Mail, ExternalLink, FileText, Image, Package } from 'lucide-react';
import { IMG } from '@/lib/mock';

const STATS = [
  { value: '12 k+', key: 'stat1Label' },
  { value: '7', key: 'stat2Label' },
  { value: '< 50 ms', key: 'stat3Label' },
  { value: '2022', key: 'stat4Label' },
];
const ASSETS = [
  { icon: Image, key: 'asset1' },
  { icon: Image, key: 'asset2' },
  { icon: FileText, key: 'asset3' },
  { icon: Package, key: 'asset4' },
];
const COVERAGE = [
  { outlet: 'TechCrunch', key: 'c1' },
  { outlet: 'RestaurantDive', key: 'c2' },
  { outlet: 'Forbes', key: 'c3' },
  { outlet: 'Wired', key: 'c4' },
];

export default function Press() {
  const t = useTranslations('press');
  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
      <div className="label-eyebrow">{t('eyebrow')}</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2 max-w-3xl">{t('title')}</h1>
      <p className="mt-4 text-ink-body max-w-xl leading-relaxed">
        {t.rich('intro', { email: (c) => <a href="mailto:press@tablero.com" className="text-primary hover:underline">{c}</a> })}
      </p>

      {/* Stats */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.key} className="bg-white rounded-3xl border border-border p-6">
            <div className="font-display text-4xl text-ink">{s.value}</div>
            <div className="label-eyebrow mt-2">{t(s.key)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {/* Download kit */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-border p-7">
            <h2 className="font-display text-2xl mb-6">{t('assetsTitle')}</h2>
            <div className="space-y-3">
              {ASSETS.map(a => (
                <a key={a.key} href="#"
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-cream-sub/60 transition group">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <a.icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-fn font-medium text-ink group-hover:text-primary transition">{t(`${a.key}Label`)}</div>
                    <div className="text-xs text-ink-muted">{t(`${a.key}Desc`)}</div>
                  </div>
                  <Download size={16} className="text-ink-muted group-hover:text-primary transition shrink-0" />
                </a>
              ))}
            </div>
          </div>

          {/* Recent coverage */}
          <div className="bg-white rounded-3xl border border-border p-7">
            <h2 className="font-display text-2xl mb-6">{t('coverageTitle')}</h2>
            <div className="space-y-4">
              {COVERAGE.map(c => (
                <a key={c.key} href="#" target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-cream-sub/60 transition group">
                  <div className="flex-1">
                    <div className="text-xs font-mono text-ink-muted uppercase tracking-wide mb-1">{c.outlet} · {t(`${c.key}Date`)}</div>
                    <div className="font-fn font-medium text-ink group-hover:text-primary transition leading-snug">{t(`${c.key}Headline`)}</div>
                  </div>
                  <ExternalLink size={14} className="text-ink-muted group-hover:text-primary transition shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact sidebar */}
        <div className="space-y-4">
          <div className="bg-ink text-cream rounded-3xl p-7">
            <div className="label-eyebrow !text-cream/50 mb-4">{t('pressContact')}</div>
            <div className="font-display text-2xl">Marco Ferretti</div>
            <div className="text-sm text-cream/70 mt-1">{t('contactRole')}</div>
            <a href="mailto:press@tablero.com" className="mt-5 flex items-center gap-2 text-sm text-cream/70 hover:text-cream transition">
              <Mail size={14} /> press@tablero.com
            </a>
            <a href="mailto:press@tablero.com"
              className="mt-5 w-full block text-center py-3 rounded-full bg-primary text-white font-fn font-medium hover:bg-terracotta-dark transition">
              {t('sendPitch')}
            </a>
          </div>

          <div className="bg-white rounded-3xl border border-border p-6">
            <div className="label-eyebrow mb-3">{t('inProduct')}</div>
            <div className="aspect-video rounded-2xl overflow-hidden">
              <img src={IMG.interior} alt={t('productAlt')} className="w-full h-full object-cover" />
            </div>
            <p className="mt-4 text-xs text-ink-muted leading-relaxed">
              {t('imageCredit')}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-border p-6">
            <div className="label-eyebrow mb-3">{t('embargoTitle')}</div>
            <p className="text-sm text-ink-body leading-relaxed">
              {t('embargoText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
