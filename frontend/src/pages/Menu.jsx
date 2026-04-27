import React from 'react';
import { MENU, CATS } from '@/lib/mock';
import { Plus, Search, AlertTriangle } from 'lucide-react';

export default function Menu() {
  const [cat, setCat] = React.useState('All');
  const [q, setQ] = React.useState('');
  const list = MENU.filter(m => (cat==='All' || m.cat===cat) && m.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-16">
      <div className="label-eyebrow">Tonight's menu · Downtown</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2 max-w-2xl">A short menu, made well.</h1>
      <p className="mt-4 text-ink-body max-w-xl">Sourced locally where we can. Pre-order with your reservation and we'll start when you sit down.</p>

      <div className="sticky top-[72px] z-30 -mx-6 md:-mx-12 px-6 md:px-12 py-4 mt-10 glass-nav border-y border-border/60">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-border rounded-full px-4 py-2 flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="text-ink-muted"/>
            <input data-testid="menu-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search dishes" className="bg-transparent flex-1 outline-none text-sm font-fn"/>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} data-testid={`menu-cat-${c.toLowerCase()}`}
                className={`px-4 py-2 rounded-full text-sm font-fn whitespace-nowrap transition ${cat===c?'bg-ink text-white':'bg-white border border-border text-ink-body hover:border-ink/30'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {list.map(m => (
          <article key={m.id} className="bg-white rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition group">
            <div className="aspect-[4/3] relative overflow-hidden">
              <img src={m.img} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700"/>
              {!m.available && (
                <div className="absolute inset-0 bg-ink/70 flex items-center justify-center">
                  <span className="chip bg-white text-ink"><AlertTriangle size={12}/> 86'd today</span>
                </div>
              )}
              <span className="absolute top-3 left-3 chip bg-white/90 text-ink-body">{m.cat}</span>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-xl text-ink">{m.name}</h3>
                <span className="font-mono text-sm font-semibold">${m.price.toFixed(2)}</span>
              </div>
              <p className="mt-2 text-sm text-ink-body leading-relaxed">{m.desc}</p>
              <div className="mt-3 flex items-center gap-1 flex-wrap">
                {m.allergens.map(a => <span key={a} className="text-[10px] font-mono uppercase tracking-wide bg-cream-sub px-2 py-0.5 rounded-full text-ink-muted">{a}</span>)}
              </div>
              <button disabled={!m.available} data-testid={`menu-add-${m.id}`}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-white font-fn font-medium hover:bg-terracotta-dark transition disabled:bg-cream-sub disabled:text-ink-muted">
                <Plus size={16}/> Add to order
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
