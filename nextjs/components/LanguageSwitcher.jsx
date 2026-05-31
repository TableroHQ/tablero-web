'use client';
import React from 'react';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';

const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'az', label: 'Azərbaycan', flag: '🇦🇿' },
];

export default function LanguageSwitcher({ dark = false }) {
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const setLocale = (code) => {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  const current = LANGS.find(l => l.code === locale) ?? LANGS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Change language"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-fn transition ${
          dark
            ? 'text-cream/70 hover:text-cream hover:bg-white/10'
            : 'text-ink-body hover:bg-cream-sub'
        }`}
      >
        <Globe size={15} />
        <span className="hidden sm:inline">{current.flag} {current.label}</span>
        <span className="sm:hidden">{current.flag}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-border py-1 z-50">
          {LANGS.map(lang => (
            <button
              key={lang.code}
              onClick={() => { setLocale(lang.code); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm font-fn flex items-center gap-2.5 transition hover:bg-cream-sub ${
                lang.code === locale ? 'text-primary font-semibold' : 'text-ink-body'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {lang.code === locale && <span className="ml-auto text-[10px] font-mono text-primary">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
