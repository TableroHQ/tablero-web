'use client';
import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

/**
 * Shows a "no access to staff pages" toast when the middleware bounces a guest
 * or consumer off a back-of-house route to `/?denied=staff`, then strips the
 * flag from the URL so it doesn't re-fire on refresh or back-navigation.
 */
export default function AccessToast() {
  const t = useTranslations('common');
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);

  useEffect(() => {
    if (params.get('denied') !== 'staff' || shown.current) return;
    shown.current = true;
    toast.error(t('noStaffAccess'));
    const rest = new URLSearchParams(params.toString());
    rest.delete('denied');
    const qs = rest.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [params, pathname, router, t]);

  return null;
}
