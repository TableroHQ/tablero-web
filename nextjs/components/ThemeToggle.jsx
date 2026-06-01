'use client';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';

export default function ThemeToggle({ className = '' }) {
  const t = useTranslations('common');
  const [{ prefs }, store] = useStore();
  return (
    <button
      onClick={() => store.setPrefs({ darkMode: !prefs.darkMode })}
      className={`p-2 rounded-full hover:bg-cream-sub dark:hover:bg-muted transition-colors ${className}`}
      aria-label={prefs.darkMode ? t('lightMode') : t('nightMode')}
      data-testid="theme-toggle"
    >
      {prefs.darkMode
        ? <Sun size={18} className="text-amber-400" />
        : <Moon size={18} className="text-ink-body" />}
    </button>
  );
}
