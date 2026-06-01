'use client';
import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronDown, Search, BookOpen, CreditCard, Calendar, ShoppingBag, Star, Settings } from 'lucide-react';

// Each section keeps a stable slug (used for anchors + translation keys) and an icon.
const SECTIONS = [
  { slug: 's1', icon: Calendar },
  { slug: 's2', icon: ShoppingBag },
  { slug: 's3', icon: CreditCard },
  { slug: 's4', icon: Star },
  { slug: 's5', icon: Settings },
];
const FAQ_INDEXES = [1, 2, 3];

function Accordion({ q, a }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left">
        <span className="font-fn font-medium text-ink">{q}</span>
        <ChevronDown size={16} className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-ink-body leading-relaxed">{a}</p>}
    </div>
  );
}

export default function Help() {
  const t = useTranslations('help');
  const [q, setQ] = React.useState('');

  // Build translated sections, then filter by the search query.
  const sections = SECTIONS.map(s => ({
    slug: s.slug,
    icon: s.icon,
    title: t(`${s.slug}Title`),
    faqs: FAQ_INDEXES.map(i => ({ q: t(`${s.slug}q${i}`), a: t(`${s.slug}a${i}`) })),
  }));
  const filtered = sections.map(s => ({
    ...s,
    faqs: s.faqs.filter(f => !q || f.q.toLowerCase().includes(q.toLowerCase()) || f.a.toLowerCase().includes(q.toLowerCase())),
  })).filter(s => s.faqs.length > 0);

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
      <div className="label-eyebrow">{t('eyebrow')}</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">{t('title')}</h1>

      {/* Search */}
      <div className="mt-8 max-w-lg">
        <div className="flex items-center gap-3 bg-white border border-border rounded-full px-5 py-3 shadow-sm">
          <Search size={16} className="text-ink-muted shrink-0" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('searchPlaceholder')}
            className="flex-1 bg-transparent outline-none font-fn text-sm" />
        </div>
      </div>

      {/* Quick links */}
      {!q && (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {sections.map(s => (
            <a key={s.slug} href={`#${s.slug}`}
              className="bg-white rounded-2xl border border-border p-5 flex flex-col items-center gap-3 hover:-translate-y-1 transition text-center shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><s.icon size={18} /></div>
              <span className="font-fn text-sm font-medium text-ink">{s.title}</span>
            </a>
          ))}
        </div>
      )}

      {/* FAQ sections */}
      <div className="mt-12 space-y-10">
        {filtered.map(s => (
          <div key={s.slug} id={s.slug}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><s.icon size={15} /></div>
              <h2 className="font-display text-2xl">{s.title}</h2>
            </div>
            <div className="bg-white rounded-3xl border border-border px-6 md:px-8">
              {s.faqs.map(f => <Accordion key={f.q} q={f.q} a={f.a} />)}
            </div>
          </div>
        ))}
        {q && filtered.length === 0 && (
          <div className="py-16 text-center text-ink-muted font-fn">
            {t.rich('noResults', { q, link: (c) => <Link href="/contact" className="text-primary hover:underline">{c}</Link> })}
          </div>
        )}
      </div>

      {/* Still stuck CTA */}
      <div className="mt-16 bg-ink text-cream rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2"><BookOpen size={18} className="text-secondary" /><span className="label-eyebrow !text-cream/50">{t('stillStuck')}</span></div>
          <h3 className="font-display text-2xl">{t('talkTitle')}</h3>
          <p className="text-sm text-cream/70 mt-1">{t('talkText')}</p>
        </div>
        <Link href="/contact" className="btn-primary whitespace-nowrap">{t('openConversation')}</Link>
      </div>
    </div>
  );
}
