import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChefHat, Bell, Wallet, Bike, Gauge, ArrowLeft } from 'lucide-react';
import { IMG } from '@/lib/mock';

const OPS = [
  { to: '/kds', label: 'Kitchen', icon: ChefHat },
  { to: '/waiter', label: 'Waiter', icon: Bell },
  { to: '/pos', label: 'Cashier POS', icon: Wallet },
  { to: '/courier', label: 'Courier', icon: Bike },
  { to: '/admin', label: 'Admin', icon: Gauge },
];

export default function OpsLayout({ children, dark = false, title, subtitle, right }) {
  return (
    <div className={`min-h-screen ${dark ? 'kds-shell' : 'bg-cream-sub/40'}`}>
      <div className="flex">
        <aside className={`hidden md:flex md:w-[240px] flex-col ${dark ? 'bg-kds-surface text-cream' : 'bg-white border-r border-border'} h-screen sticky top-0`} data-testid="ops-sidebar">
          <div className="px-6 py-6 flex items-center gap-3">
            <img src={IMG.logo} alt="Bite" className="h-8 w-8 rounded-full object-cover" />
            <div>
              <div className={`font-display text-xl ${dark?'text-cream':'text-ink'}`}>Bite</div>
              <div className="label-eyebrow !text-[9px]">Operations</div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {OPS.map(o => (
              <NavLink key={o.to} to={o.to} data-testid={`ops-nav-${o.label.toLowerCase().replace(/\s+/g,'-')}`}
                className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-fn font-medium transition ${
                  isActive
                    ? (dark?'bg-terracotta text-white':'bg-primary text-primary-foreground')
                    : (dark?'text-cream/70 hover:bg-kds-surface2':'text-ink-body hover:bg-cream-sub')
                }`}>
                <o.icon size={18} /> {o.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-4">
            <Link to="/" className={`flex items-center gap-2 text-xs font-mono ${dark?'text-cream/60 hover:text-cream':'text-ink-muted hover:text-ink'}`}>
              <ArrowLeft size={14} /> Back to consumer
            </Link>
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <div className={`${dark?'border-b border-kds-surface2':'border-b border-border bg-white'} px-4 md:px-8 py-5 flex items-center justify-between gap-4`}>
            <div>
              {title && <div className={`font-display text-2xl md:text-3xl ${dark?'text-cream':'text-ink'}`}>{title}</div>}
              {subtitle && <div className="label-eyebrow mt-1">{subtitle}</div>}
            </div>
            {right}
          </div>
          <div className="p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
