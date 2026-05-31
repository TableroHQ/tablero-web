'use client';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export default function ThemeApplier() {
  const [{ prefs }] = useStore();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', !!prefs.darkMode);
  }, [prefs.darkMode]);
  return null;
}
