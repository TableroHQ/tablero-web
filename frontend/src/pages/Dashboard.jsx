import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Coins, Receipt, ArrowRight, Wallet, Star, Bell, ChevronRight } from 'lucide-react';
import { RESERVATIONS, ORDERS, IMG } from '@/lib/mock';
import { useStore } from '@/lib/store';

export default function Dashboard() {
  const [state] = useStore();
  const { user } = state;
  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="label-eyebrow">My Bite</div>
          <h1 className="font-display text-5xl md:text-6xl mt-2">Hello, {user.name.split(' ')[0]}.</h1>
          <p className="text-ink-body mt-2">Here's what's on your plate this week.</p>
        </div>
        <Link to="/menu" className="btn-primary inline-flex items-center gap-2" data-testid="dashboard-order-cta">Start an order <ArrowRight size={16}/></Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-5 mt-10">
        <Stat label="Loyalty points" value={user.loyaltyPoints.toLocaleString()} sub="+50 last visit" icon={Coins} accent="primary" testid="stat-loyalty"/>
        <Stat label="Account balance" value={`$${user.balance.toFixed(2)}`} sub={`$${user.heldBalance.toFixed(2)} held`} icon={Wallet} accent="ink" testid="stat-balance"/>
        <Stat label="Avg. visit rating" value="4.9" sub="From 12 reviews" icon={Star} accent="amber" testid="stat-rating"/>
        <Stat label="Reservations" value="2 upcoming" sub="Next: Feb 4, 19:30" icon={Calendar} accent="ok" testid="stat-reservations"/>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border p-6 md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Upcoming reservations</h2>
            <Link to="/reservations" className="text-sm text-primary font-fn flex items-center gap-1">New <ChevronRight size={14}/></Link>
          </div>
          <div className="mt-5 divide-y divide-border">
            {RESERVATIONS.map(r => (
              <div key={r.id} className="py-4 flex items-center gap-4" data-testid={`reservation-${r.id}`}>
                <div className="h-14 w-14 rounded-2xl bg-cream-sub flex flex-col items-center justify-center font-mono">
                  <span className="text-[10px] text-ink-muted">FEB</span>
                  <span className="text-lg font-bold">{r.date.split('-')[2]}</span>
                </div>
                <div className="flex-1">
                  <div className="font-fn font-semibold">{r.zone} · {r.table} · party of {r.party}</div>
                  <div className="text-sm text-ink-body">{r.slot} · {r.status}</div>
                </div>
                <span className={`chip ${r.status==='CONFIRMED'?'bg-ok-bg text-ok':'bg-cream-sub text-ink-muted'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-border p-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/10"/>
          <div className="relative">
            <div className="label-eyebrow">Reward</div>
            <h3 className="font-display text-3xl mt-2">Free hotdog at 1,250 pts.</h3>
            <p className="text-sm text-ink-body mt-2">You're 10 points away. About one coffee.</p>
            <div className="mt-5 h-2 rounded-full bg-cream-sub overflow-hidden">
              <div className="h-full bg-primary" style={{width: '99%'}}/>
            </div>
            <Link to="/loyalty" className="mt-5 btn-outline inline-flex items-center gap-2" data-testid="loyalty-cta">View catalogue <ArrowRight size={14}/></Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border p-6 md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Recent orders</h2>
            <span className="text-xs font-mono text-ink-muted">Last 30 days</span>
          </div>
          <div className="mt-5 divide-y divide-border">
            {ORDERS.map(o => (
              <div key={o.id} className="py-4 flex items-center gap-4" data-testid={`order-${o.id}`}>
                <div className="h-12 w-12 rounded-xl bg-cream-sub flex items-center justify-center text-ink-muted"><Receipt size={18}/></div>
                <div className="flex-1">
                  <div className="font-fn font-semibold">{o.type} · {o.items} items</div>
                  <div className="text-sm text-ink-body">{o.date}</div>
                </div>
                <div className="font-mono text-sm font-semibold">${o.total.toFixed(2)}</div>
                <Link to={o.type==='DELIVERY'?`/delivery/${o.id}`:`/orders/${o.id}`} className="text-xs text-primary font-fn">{o.type==='DELIVERY'?'Track':'View'}</Link>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-ink text-cream rounded-3xl p-6 relative overflow-hidden">
          <img src={IMG.chef} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25"/>
          <div className="relative">
            <Bell size={20} className="text-secondary"/>
            <h3 className="font-display text-2xl mt-3">Live updates</h3>
            <p className="text-sm text-cream/80 mt-2">When you're seated, your table comes alive — order status, bill prompts, and rewards appear here.</p>
            <div className="mt-5 space-y-2 text-sm">
              <Pulse>Reservation reminder · 24h before</Pulse>
              <Pulse>Order placed → Kitchen accepted</Pulse>
              <Pulse>Bonus earned: +50 pts</Pulse>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon, accent, testid }) {
  const map = { primary:'bg-primary/10 text-primary', ink:'bg-ink/5 text-ink', amber:'bg-warn-bg text-warn', ok:'bg-ok-bg text-ok' };
  return (
    <div className="lg:col-span-3 bg-white rounded-3xl border border-border p-6" data-testid={testid}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${map[accent]}`}><Icon size={18}/></div>
      <div className="label-eyebrow mt-5">{label}</div>
      <div className="font-display text-4xl mt-1 text-ink">{value}</div>
      <div className="text-xs text-ink-muted mt-1 font-mono uppercase">{sub}</div>
    </div>
  );
}

function Pulse({ children }) {
  return <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-secondary animate-pulse-soft"/> <span className="text-cream/90">{children}</span></div>;
}
