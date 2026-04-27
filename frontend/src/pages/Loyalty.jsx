import React from 'react';
import { Coins, Lock, Sparkles } from 'lucide-react';
import { BONUSES } from '@/lib/mock';

export default function Loyalty() {
  const points = 1240;
  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow">Bonus catalogue</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2 max-w-3xl">Earn food, not coupons.</h1>
      <p className="mt-3 text-ink-body max-w-xl">Spend a dollar, earn a point. Trade points for real items off our menu — chosen by the chef, configured by the director.</p>

      <div className="grid lg:grid-cols-3 gap-6 mt-12">
        <div className="lg:col-span-2 bg-gradient-to-br from-primary to-terracotta-dark text-white rounded-3xl p-8 md:p-10 relative overflow-hidden">
          <Sparkles className="absolute top-6 right-6 opacity-20" size={120}/>
          <div className="label-eyebrow !text-white/70">Your balance</div>
          <div className="font-display text-7xl md:text-8xl mt-2">{points.toLocaleString()}</div>
          <div className="font-mono text-sm opacity-80">POINTS</div>
          <div className="mt-8 max-w-md">
            <div className="flex justify-between text-xs font-mono mb-2"><span>NEXT TIER · GOLD</span><span>1,500</span></div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-secondary" style={{width:'82%'}}/></div>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-border p-7">
          <div className="label-eyebrow">How it works</div>
          <ul className="mt-4 space-y-3 text-sm text-ink-body">
            <li className="flex gap-3"><span className="font-mono text-primary">01</span> Spend a dollar — earn a point.</li>
            <li className="flex gap-3"><span className="font-mono text-primary">02</span> Pick a real food item below.</li>
            <li className="flex gap-3"><span className="font-mono text-primary">03</span> It joins your next bill at $0.</li>
          </ul>
        </div>
      </div>

      <h2 className="font-display text-3xl mt-14">Available rewards</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
        {BONUSES.map(b => {
          const locked = b.cost > points;
          return (
            <article key={b.id} className={`bg-white rounded-3xl border overflow-hidden ${locked?'opacity-70':'border-border hover:-translate-y-1 transition'}`} data-testid={`bonus-${b.id}`}>
              <div className="aspect-square relative">
                <img src={b.img} alt={b.name} className={`w-full h-full object-cover ${locked?'grayscale':''}`}/>
                {locked && <div className="absolute inset-0 bg-ink/40 flex items-center justify-center"><Lock className="text-white" size={28}/></div>}
              </div>
              <div className="p-5">
                <h3 className="font-fn font-semibold">{b.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="chip bg-secondary/10 text-secondary"><Coins size={12}/> {b.cost} PTS</span>
                  <button disabled={locked} className="text-sm font-fn font-medium text-primary disabled:text-ink-muted disabled:no-underline hover:underline" data-testid={`redeem-${b.id}`}>
                    {locked ? `Need ${b.cost-points}` : 'Redeem →'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
