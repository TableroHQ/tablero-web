'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ChefHat, Bell, Wallet, Bike, Gauge, LogOut, UtensilsCrossed, Grid3x3, Users, Megaphone, BarChart3, Undo2, MessageSquareWarning, Menu as MenuIcon, X, Clock, Package } from 'lucide-react';
import { IMG } from '@/lib/brand';
import { api } from '@/lib/client';
import NotificationBell from '@/components/NotificationBell';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useStore } from '@/lib/store';
import { useTranslations } from 'next-intl';

const DIRECTOR = ['DIRECTOR', 'ADMIN'];

export default function OpsLayout({ children, dark = false, title, subtitle, right }) {
  const t = useTranslations('ops');
  const pathname = usePathname();
  const router = useRouter();
  const [{ user }, store] = useStore();
  const [navOpen, setNavOpen] = React.useState(false);

  const logout = async () => {
    try { await api.post('/api/auth/logout', {}); } catch {}
    store.logout();
    router.push('/login');
  };

  React.useEffect(() => { setNavOpen(false); }, [pathname]);

  const OPS = [
    { to: '/kds',              label: t('kitchen'),    icon: ChefHat,              roles: ['CHEF']    },
    { to: '/kds/pickup',       label: t('pickupQueue'), icon: Clock,               roles: ['CHEF']    },
    { to: '/waiter',           label: t('waiter'),     icon: Bell,                 roles: ['WAITER']  },
    { to: '/waiter/pickup',    label: t('pickupHandoff'), icon: Package,           roles: ['WAITER']  },
    { to: '/pos',              label: t('cashierPos'), icon: Wallet,               roles: ['CASHIER'] },
    { to: '/pos/pickup',       label: t('pickupPayments'), icon: Clock,           roles: ['CASHIER'] },
    { to: '/courier',          label: t('courier'),    icon: Bike,                 roles: ['COURIER'] },
    { to: '/admin',            label: t('dashboard'),  icon: Gauge,                section: t('admin'), roles: DIRECTOR },
    { to: '/admin/pickup',     label: t('pickupOps'),  icon: Clock,                section: t('admin'), roles: DIRECTOR },
    { to: '/admin/menu',       label: t('menu'),       icon: UtensilsCrossed,      section: t('admin'), roles: DIRECTOR },
    { to: '/admin/tables',     label: t('tables'),     icon: Grid3x3,              section: t('admin'), roles: DIRECTOR },
    { to: '/admin/staff',      label: t('staff'),      icon: Users,                section: t('admin'), roles: DIRECTOR },
    { to: '/admin/reviews',    label: t('reviews'),    icon: MessageSquareWarning, section: t('admin'), roles: DIRECTOR },
    { to: '/admin/promotions', label: t('promotions'), icon: Megaphone,            section: t('admin'), roles: DIRECTOR },
    { to: '/admin/refunds',    label: t('refunds'),    icon: Undo2,                section: t('admin'), roles: DIRECTOR },
    { to: '/admin/revenue',    label: t('revenue'),    icon: BarChart3,            section: t('admin'), roles: DIRECTOR },
  ];

  const visibleOps = OPS.filter(o => o.roles.includes(user.role));

  const brand = (
    <div className="px-6 py-6 flex items-center gap-3">
      <img src={IMG.logo} alt="Tablero" className="h-8 w-8 rounded-full object-cover" />
      <div>
        <div className={`font-display text-xl ${dark ? 'text-cream' : 'text-ink'}`}>Tablero</div>
        <div className="label-eyebrow !text-[9px]">{t('operations')}</div>
      </div>
    </div>
  );

  const navLinks = (
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
  );

  const sidebarFooter = (
    <div className="p-4 space-y-1">
      <LanguageSwitcher dark={dark} dropUp />
      <button onClick={logout} data-testid="ops-logout"
        className={`flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-full transition ${dark ? 'text-cream/60 hover:text-cream hover:bg-white/10' : 'text-ink-muted hover:text-ink hover:bg-cream-sub'}`}>
        <LogOut size={14} /> {t('signOut')}
      </button>
    </div>
  );

  const surface = dark ? 'bg-kds-surface text-cream' : 'bg-white border-r border-border';

  return (
    <div className={`min-h-screen ${dark ? 'kds-shell' : 'bg-cream-sub/40'}`}>
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className={`hidden md:flex md:w-[240px] flex-col ${surface} h-screen sticky top-0`} data-testid="ops-sidebar">
          {brand}
          {navLinks}
          {sidebarFooter}
        </aside>

        {/* Mobile drawer */}
        {navOpen && (
          <div className="md:hidden fixed inset-0 z-[70]" data-testid="ops-mobile-nav">
            <div className="absolute inset-0 bg-black/50" onClick={() => setNavOpen(false)} aria-hidden="true" />
            <aside className={`absolute left-0 top-0 h-full w-[260px] max-w-[80vw] flex flex-col ${surface} shadow-2xl`}>
              <div className="flex items-center justify-between pr-3">
                {brand}
                <button onClick={() => setNavOpen(false)} aria-label="Close menu"
                  className={`p-2 rounded-lg ${dark ? 'text-cream/70 hover:bg-kds-surface2' : 'text-ink-body hover:bg-cream-sub'}`}>
                  <X size={20} />
                </button>
              </div>
              {navLinks}
              {sidebarFooter}
            </aside>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className={`${dark ? 'border-b border-kds-surface2' : 'border-b border-border bg-white'} px-4 md:px-8 py-5 flex items-center justify-between gap-4`}>
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setNavOpen(true)} aria-label="Open menu" data-testid="ops-mobile-menu-toggle"
                className={`md:hidden p-2 -ml-2 rounded-lg shrink-0 ${dark ? 'text-cream/80 hover:bg-kds-surface2' : 'text-ink-body hover:bg-cream-sub'}`}>
                <MenuIcon size={22} />
              </button>
              <div className="min-w-0">
                {title && <div className={`font-display text-2xl md:text-3xl truncate ${dark ? 'text-cream' : 'text-ink'}`}>{title}</div>}
                {subtitle && <div className="label-eyebrow mt-1">{subtitle}</div>}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
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
