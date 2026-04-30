import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Menu as MenuIcon, X } from 'lucide-react';
import { IMG } from '@/lib/mock';
import NotificationBell from '@/components/NotificationBell';
import { useStore } from '@/lib/store';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/reservations', label: 'Reserve' },
  { to: '/loyalty', label: 'Rewards' },
  { to: '/dashboard', label: 'My Bite' },
];

export default function Layout({ children }) {
  const [open, setOpen] = React.useState(false);
  const loc = useLocation();
  const [state] = useStore();
  const cartCount = state.cart.reduce((s,i)=>s+i.qty,0);
  React.useEffect(() => { setOpen(false); }, [loc.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="glass-nav sticky top-0 z-50 border-b border-border/60" data-testid="consumer-header">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="brand-link">
            <img src={IMG.logo} alt="Bite" className="h-9 w-9 rounded-full object-cover" />
            <span className="font-display text-2xl font-semibold text-ink">Bite</span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to==='/'} data-testid={`nav-${n.label.toLowerCase()}`}
                className={({isActive}) => `px-4 py-2 rounded-full text-sm font-fn font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-ink-body hover:bg-cream-sub'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <NotificationBell/>
            <Link to="/checkout" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-cream-sub hover:bg-cream-warm transition relative" data-testid="cart-button">
              <ShoppingBag size={16} /><span className="text-sm font-fn">Cart</span>
              {cartCount > 0 && <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>}
            </Link>
            <Link to="/profile" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-white hover:bg-ink-body transition" data-testid="profile-cta">
              <User size={16} /><span className="text-sm font-fn">{state.user.name.split(' ')[0]}</span>
            </Link>
            <button className="md:hidden p-2" onClick={() => setOpen(o => !o)} data-testid="mobile-menu-toggle">
              {open ? <X size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-border/60 bg-background/95 px-6 py-4 flex flex-col gap-2">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to==='/'} className={({isActive}) => `py-2 font-fn ${isActive?'text-primary':'text-ink-body'}`}>{n.label}</NavLink>
            ))}
            <Link to="/login" className="py-2 font-fn">Sign in</Link>
          </div>
        )}
      </header>
      <main className="fade-up">{children}</main>
      <footer className="mt-24 border-t border-border/60 bg-cream-sub/40">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={IMG.logo} alt="Bite" className="h-8 w-8 rounded-full" />
              <span className="font-display text-xl">Bite</span>
            </div>
            <p className="text-sm text-ink-body leading-relaxed">A restaurant operating system for everyone at the table — guests, staff, and the kitchen.</p>
          </div>
          <FootCol title="Discover" links={[['Menu','/menu'],['Reservations','/reservations'],['Rewards','/loyalty']]} />
          <FootCol title="Staff" links={[['Kitchen Display','/kds'],['Waiter','/waiter'],['Cashier POS','/pos'],['Courier','/courier']]} />
          <FootCol title="Manage" links={[['Admin Console','/admin'],['Reviews','/reviews']]} />
        </div>
        <div className="border-t border-border/60 py-5 text-center text-xs text-ink-muted font-mono">© 2026 BITE · BUILT FOR RESTAURANTS</div>
      </footer>
    </div>
  );
}

function FootCol({ title, links }) {
  return (
    <div>
      <div className="label-eyebrow mb-4">{title}</div>
      <ul className="space-y-2">
        {links.map(([label,to]) => <li key={to}><Link to={to} className="text-sm text-ink-body hover:text-primary">{label}</Link></li>)}
      </ul>
    </div>
  );
}
