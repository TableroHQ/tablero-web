'use client';
import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Heart, Zap, Users, Globe } from 'lucide-react';
import { IMG } from '@/lib/brand';

const VALUES = [
  { icon: Heart, key: 'v1' },
  { icon: Zap, key: 'v2' },
  { icon: Users, key: 'v3' },
  { icon: Globe, key: 'v4' },
];

const TIMELINE = ['2022', '2023', '2024', '2025', '2026'];

export default function About() {
  const t = useTranslations('about');
  return (
    <div>
      {/* Hero */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="label-eyebrow">{t('eyebrow')}</div>
          <h1 className="font-display text-5xl md:text-7xl mt-3 leading-[0.95]">
            {t('titleLine1')}<br />
            <span className="italic text-primary">{t('titleEmphasis')}</span>
          </h1>
          <p className="mt-6 text-lg text-ink-body max-w-lg leading-relaxed">
            {t('intro')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/menu" className="btn-primary inline-flex items-center gap-2">{t('seeAction')} <ArrowRight size={16} /></Link>
            <Link href="/contact" className="btn-outline inline-flex items-center gap-2">{t('getInTouch')}</Link>
          </div>
        </div>
        <div className="aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl">
          <img src={IMG.interior2} alt={t('teamAlt')} className="w-full h-full object-cover" />
        </div>
      </section>

      {/* Values */}
      <section className="bg-cream-sub/50 py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="label-eyebrow">{t('valuesEyebrow')}</div>
          <h2 className="font-display text-4xl md:text-5xl mt-2 max-w-2xl">{t('valuesTitle')}</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(v => (
              <div key={v.key} className="bg-white rounded-3xl p-7 shadow-sm">
                <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                  <v.icon size={20} />
                </div>
                <h3 className="font-fn font-semibold text-lg text-ink">{t(`${v.key}Title`)}</h3>
                <p className="mt-2 text-sm text-ink-body leading-relaxed">{t(`${v.key}Text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-20">
        <div className="label-eyebrow">{t('timelineEyebrow')}</div>
        <h2 className="font-display text-4xl md:text-5xl mt-2 max-w-xl">{t('timelineTitle')}</h2>
        <div className="mt-14 relative">
          <div className="absolute left-[52px] top-0 bottom-0 w-px bg-border hidden md:block" />
          <div className="space-y-10">
            {TIMELINE.map(year => (
              <div key={year} className="md:flex items-start gap-10">
                <div className="flex items-center gap-6 md:w-[104px] md:shrink-0 mb-3 md:mb-0">
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-mono font-bold shrink-0 z-10">{year.slice(-2)}</div>
                  <span className="font-mono text-xs text-ink-muted">{year}</span>
                </div>
                <div className="flex-1 bg-white rounded-2xl border border-border p-5">
                  <div className="font-fn font-semibold text-ink">{t(`t${year}Title`)}</div>
                  <p className="mt-1 text-sm text-ink-body leading-relaxed">{t(`t${year}Text`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-cream py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 text-center">
          <h2 className="font-display text-4xl md:text-5xl max-w-2xl mx-auto">{t('quote')}</h2>
          <p className="mt-4 text-cream/70 max-w-lg mx-auto">{t('quoteText')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/reservations" className="btn-primary inline-flex items-center gap-2">{t('reserve')} <ArrowRight size={16} /></Link>
            <Link href="/press" className="px-6 py-3 rounded-full border border-white/30 text-cream hover:border-white/70 transition font-fn font-medium">{t('pressKit')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
