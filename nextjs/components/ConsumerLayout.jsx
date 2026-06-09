'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, Menu as MenuIcon, X, Instagram, Twitter, Facebook, Youtube, Linkedin } from 'lucide-react';
import { IMG } from '@/lib/brand';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useStore } from '@/lib/store';
import { useTranslations } from 'next-intl';

export default function ConsumerLayout({ children }) {
  const t = useTranslations('nav');
  const tf = useTranslations('footer');
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const [state] = useStore();
  const cartCount = state.cart.reduce((s, i) => s + i.qty, 0);
  const isGuest = state.user.role === 'GUEST';
  const isCustomer = state.user.role === 'USER';

  const PUBLIC_NAV = [
    { to: '/',            label: t('home') },
    { to: '/menu',        label: t('menu') },
    { to: '/reservations', label: t('reserve') },
  ];
  const GUEST_NAV = [
    { to: '/#how-it-works', label: t('howItWorks') },
    { to: '/#pricing',      label: t('pricing') },
  ];
  const AUTH_NAV = [
    { to: '/loyalty',   label: t('rewards') },
    { to: '/orders',    label: t('orders') },
    { to: '/dashboard', label: t('myTablero') },
  ];

  const NAV = isCustomer
    ? [...PUBLIC_NAV, ...AUTH_NAV]
    : isGuest
      ? [...PUBLIC_NAV, ...GUEST_NAV]
      : PUBLIC_NAV;

  React.useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="glass-nav sticky top-0 z-50 border-b border-border/60" data-testid="consumer-header">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 h-[72px] flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0" data-testid="brand-link">
            <img src={IMG.logo} alt="Tablero" className="h-9 w-9 rounded-full object-cover" />
            <span className="font-display text-2xl font-semibold text-ink hidden min-[360px]:inline">Tablero</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-2">
            {NAV.map(n => {
              const isActive = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to);
              return (
                <Link key={n.to} href={n.to} data-testid={`nav-${n.label.toLowerCase()}`}
                  className={`px-3 xl:px-4 py-2 rounded-full text-sm font-fn font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-ink-body hover:bg-cream-sub'}`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <LanguageSwitcher />
            <ThemeToggle />
            {!isGuest && <NotificationBell />}
            {isCustomer && (
              <Link href="/checkout" className="hidden sm:flex items-center gap-2 px-3 xl:px-4 py-2 rounded-full bg-cream-sub hover:bg-cream-warm transition relative" data-testid="cart-button">
                <ShoppingBag size={16} /><span className="hidden xl:inline text-sm font-fn">{t('cart')}</span>
                {cartCount > 0 && <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>}
              </Link>
            )}
            {isGuest ? (
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-white hover:bg-ink-body dark:bg-primary dark:hover:bg-primary/80 transition" data-testid="signin-cta">
                <User size={16} /><span className="text-sm font-fn">{t('signIn')}</span>
              </Link>
            ) : (
              <Link href="/profile" className="hidden sm:flex items-center gap-2 px-3 xl:px-4 py-2 rounded-full bg-ink text-white hover:bg-ink-body dark:bg-primary dark:hover:bg-primary/80 transition" data-testid="profile-cta">
                {state.user.avatar
                  ? <img src={state.user.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                  : <User size={16} />}
                <span className="hidden xl:inline text-sm font-fn whitespace-nowrap max-w-[120px] truncate">{state.user.firstName || (state.user.name || '').split(' ')[0] || state.user.username || t('myProfile')}</span>
              </Link>
            )}
            <button className="lg:hidden p-2" onClick={() => setOpen(o => !o)} data-testid="mobile-menu-toggle">
              {open ? <X size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden border-t border-border/60 bg-background/95 px-6 py-4 flex flex-col gap-2">
            {NAV.map(n => {
              const isActive = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to);
              return (
                <Link key={n.to} href={n.to} className={`py-2 font-fn ${isActive ? 'text-primary' : 'text-ink-body'}`}>{n.label}</Link>
              );
            })}
            {isGuest
              ? <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="py-2 font-fn text-primary font-semibold">{t('signInRegister')}</Link>
              : <Link href="/profile" className="py-2 font-fn text-ink-body">{t('myProfile')}</Link>
            }
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-border/60 bg-ink text-cream">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={IMG.logo} alt="Tablero" className="h-9 w-9 rounded-full object-cover" />
              <span className="font-display text-2xl text-cream">Tablero</span>
            </div>
            <p className="text-sm text-cream/70 leading-relaxed max-w-xs">{tf('tagline')}</p>
            <div className="mt-6 flex items-center gap-3">
              {[
                { href: 'https://instagram.com', Icon: Instagram, label: 'Instagram' },
                { href: 'https://twitter.com',   Icon: Twitter,   label: 'Twitter / X' },
                { href: 'https://facebook.com',  Icon: Facebook,  label: 'Facebook' },
                { href: 'https://youtube.com',   Icon: Youtube,   label: 'YouTube' },
                { href: 'https://linkedin.com',  Icon: Linkedin,  label: 'LinkedIn' },
              ].map(({ href, Icon, label }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="h-9 w-9 rounded-full bg-white/10 hover:bg-primary transition flex items-center justify-center text-cream/70 hover:text-white">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="label-eyebrow !text-cream/40 mb-4">{tf('howItWorks')}</div>
            <ul className="space-y-2.5">
              {[
                ['/#how-it-works', tf('overview')],
                ['/#how-it-works', tf('forGuests')],
                ['/#how-it-works', tf('forKitchens')],
                ['/#how-it-works', tf('forDirectors')],
                ['/qr',            tf('qrOrdering')],
              ].map(([to, label]) => (
                <li key={label}><Link href={to} className="text-sm text-cream/70 hover:text-cream transition">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <div className="label-eyebrow !text-cream/40 mb-4">{tf('pricing')}</div>
            <ul className="space-y-2.5">
              {[
                ['/#pricing', 'Plus — $20 / mo'],
                ['/#pricing', 'Premium — $45 / mo'],
                ['/#pricing', 'Business — $100 / mo'],
                ['/#pricing', tf('comparePlans')],
                ['/#pricing', tf('freeTrial')],
              ].map(([to, label]) => (
                <li key={label}><Link href={to} className="text-sm text-cream/70 hover:text-cream transition">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <div className="label-eyebrow !text-cream/40 mb-4">{tf('about')}</div>
            <ul className="space-y-2.5">
              {[
                ['/menu',         tf('ourMenu')],
                ['/reservations', tf('bookTable')],
                ['/loyalty',      tf('rewardsProgram')],
                ['/reviews',      tf('reviews')],
                ['/about',        tf('ourStory')],
              ].map(([to, label]) => (
                <li key={label}><Link href={to} className="text-sm text-cream/70 hover:text-cream transition">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <div className="label-eyebrow !text-cream/40 mb-4">{tf('contact')}</div>
            <ul className="space-y-2.5">
              {[
                ['mailto:hello@tablero.com', 'hello@tablero.com'],
                ['tel:+15550001234',         '+1 (555) 000-1234'],
              ].map(([to, label]) => (
                <li key={label}><a href={to} className="text-sm text-cream/70 hover:text-cream transition">{label}</a></li>
              ))}
              {[
                ['/contact', tf('liveChat')],
                ['/help',    tf('helpCentre')],
                ['/press',   tf('pressEnquiries')],
              ].map(([to, label]) => (
                <li key={label}><Link href={to} className="text-sm text-cream/70 hover:text-cream transition">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-5">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-cream/40 font-mono">{tf('copyright')}</span>
            <div className="flex items-center gap-5">
              {[['/privacy', tf('privacy')], ['/terms', tf('terms')], ['/cookies', tf('cookies')]].map(([to, label]) => (
                <Link key={label} href={to} className="text-xs text-cream/40 hover:text-cream/70 transition font-mono">{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
