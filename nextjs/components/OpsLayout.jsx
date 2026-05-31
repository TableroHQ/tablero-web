'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChefHat, Bell, Wallet, Bike, Gauge, ArrowLeft, UtensilsCrossed, Grid3x3, Users, Megaphone, BarChart3, Undo2, MessageSquareWarning } from 'lucide-react';
import { IMG } from '@/lib/mock';
import NotificationBell from '@/components/NotificationBell';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useStore } from '@/lib/store';
import { useTranslations } from 'next-intl';

const DIRECTOR = ['DIRECTOR', 'ADMIN'];

export default function OpsLayout({ children, dark = false, title, subtitle, right }) {
  const t = useTranslations('ops');
  const pathname = usePathname();
  const [{ user }] = useStore();

  const OPS = [
    { to: '/kds',              label: t('kitchen'),    icon: ChefHat,              roles: ['CHEF']    },
    { to: '/waiter',           label: t('waiter'),     icon: Bell,                 roles: ['WAITER']  },
    { to: '/pos',              label: t('cashierPos'), icon: Wallet,               roles: ['CASHIER'] },
    { to: '/courier',          label: t('courier'),    icon: Bike,                 roles: ['COURIER'] },
    { to: '/admin',            label: t('dashboard'),  icon: Gauge,                section: t('admin'), roles: DIRECTOR },
    { to: '/admin/menu',       label: t('menu'),       icon: UtensilsCrossed,      section: t('admin'), roles: DIRECTOR },
    { to: '/admin/tables',     label: t('tables'),     icon: Grid3x3,              section: t('admin'), roles: DIRECTOR },
    { to: '/admin/staff',      label: t('staff'),      icon: Users,                section: t('admin'), roles: DIRECTOR },
    { to: '/admin/reviews',    label: t('reviews'),    icon: MessageSquareWarning, section: t('admin'), roles: DIRECTOR },
    { to: '/admin/promotions', label: t('promotions'), icon: Megaphone,            section: t('admin'), roles: DIRECTOR },
    { to: '/admin/refunds',    label: t('refunds'),    icon: Undo2,                section: t('admin'), roles: DIRECTOR },
    { to: '/admin/revenue',    label: t('revenue'),    icon: BarChart3,            section: t('admin'), roles: DIRECTOR },
  ];

  const visibleOps = OPS.filter(o => o.roles.includes(user.role));

  return (
    <div className={`min-h-screen ${dark ? 'kds-shell' : 'bg-cream-sub/40'}`}>
      <div className="flex">
        <aside className={`hidden md:flex md:w-[240px] flex-col ${dark ? 'bg-kds-surface text-cream' : 'bg-white border-r border-border'} h-screen sticky top-0`} data-testid="ops-sidebar">
          <div className="px-6 py-6 flex items-center gap-3">
            <img src={IMG.logo} alt="Tablero" className="h-8 w-8 rounded-full object-cover" />
            <div>
              <div className={`font-display text-xl ${dark ? 'text-cream' : 'text-ink'}`}>Tablero</div>
              <div className="label-eyebrow !text-[9px]">{t('operations')}</div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {visibleOps.map((o, idx) => {
              const showLabel = o.section && visibleOps[idx - 1]?.section !== o.section;
              const isActive = o.to === '/admin' ? pathname === '/admin' : pathname === o.to;
              return (
                <React.Fragment key={o.to}>
                  {showLabel && <div className={`label-eyebrow px-4 pt-5 pb-2 ${dark ? '!text-cream/40' : ''}`}>{o.section}</div>}
                  <Link href={o.to} data-testid={`ops-nav-${o.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-fn font-medium transition ${
                      isActive
                        ? (dark ? 'bg-terracotta text-white' : 'bg-primary text-primary-foreground')
                        : (dark ? 'text-cream/70 hover:bg-kds-surface2' : 'text-ink-body hover:bg-cream-sub')
                    }`}>
                    <o.icon size={16} /> {o.label}
                  </Link>
                </React.Fragment>
              );
            })}
          </nav>
          <div className="p-4 space-y-2">
            <LanguageSwitcher dark={dark} />
            <Link href="/" className={`flex items-center gap-2 text-xs font-mono ${dark ? 'text-cream/60 hover:text-cream' : 'text-ink-muted hover:text-ink'}`}>
              <ArrowLeft size={14} /> {t('backToConsumer')}
            </Link>
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <div className={`${dark ? 'border-b border-kds-surface2' : 'border-b border-border bg-white'} px-4 md:px-8 py-5 flex items-center justify-between gap-4`}>
            <div>
              {title && <div className={`font-display text-2xl md:text-3xl ${dark ? 'text-cream' : 'text-ink'}`}>{title}</div>}
              {subtitle && <div className="label-eyebrow mt-1">{subtitle}</div>}
            </div>
            <div className="flex items-center gap-3">
              {right}
              <NotificationBell dark={dark} />
            </div>
          </div>
          <div className="p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
