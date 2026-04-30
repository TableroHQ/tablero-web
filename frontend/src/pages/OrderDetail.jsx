import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Check, Package, ChefHat, Bell, ArrowRight } from 'lucide-react';
import { MENU } from '@/lib/mock';

const STEPS = ['PENDING', 'IN_KITCHEN', 'READY', 'SERVED'];

export default function OrderDetail() {
  const { id } = useParams();
  const [stage, setStage] = React.useState(1); // cycles for demo
  React.useEffect(() => { const t = setInterval(()=>setStage(s => s<3?s+1:s), 8000); return ()=>clearInterval(t); }, []);

  const items = [
    { ...MENU[0], qty: 1, note: 'No pickles' },
    { ...MENU[2], qty: 2, note: '' },
    { ...MENU[3], qty: 1, note: 'Extra raspberry coulis' },
  ];
  const sub = items.reduce((s,i)=>s+i.price*i.qty,0);

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-12">
      <Link to="/dashboard" className="text-sm text-ink-body hover:text-primary mb-6 inline-block" data-testid="back-link">← Back</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label-eyebrow">Order</div>
          <h1 className="font-display text-5xl md:text-6xl mt-2">#{(id||'o_4412').slice(-4)}</h1>
          <p className="text-ink-body mt-1 font-mono text-xs">DINE_IN · Table T-07 · Waiter Maya</p>
        </div>
        <span className={`chip ${stage<3?'bg-warn-bg text-warn animate-pulse-soft':'bg-ok-bg text-ok'}`}>{STEPS[stage]}</span>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-3xl border border-border p-6 md:p-8 mt-8">
        <div className="flex items-start justify-between relative">
          {STEPS.map((s, i) => {
            const done = i <= stage;
            const Icon = [Package, ChefHat, Bell, Check][i];
            return (
              <div key={s} className="flex-1 flex flex-col items-center relative" data-testid={`timeline-${s}`}>
                {i < STEPS.length - 1 && <div className={`absolute top-5 left-1/2 w-full h-0.5 ${i < stage ? 'bg-primary' : 'bg-cream-sub'}`}/>}
                <div className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center ${done?'bg-primary text-white':'bg-cream-sub text-ink-muted'}`}>
                  <Icon size={16}/>
                </div>
                <div className="mt-3 text-center">
                  <div className={`font-fn text-xs font-semibold ${done?'text-ink':'text-ink-muted'}`}>{s.replace('_',' ')}</div>
                  <div className="text-[9px] font-mono text-ink-muted mt-0.5">{done ? timeFor(i) : '—'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border p-6 md:p-7">
          <div className="label-eyebrow mb-5">Items ({items.length})</div>
          <div className="divide-y divide-border">
            {items.map((it, idx) => {
              const itemStatus = idx < stage ? 'READY' : idx === stage ? 'PREPARING' : 'QUEUED';
              return (
                <div key={it.id} className="py-4 flex items-center gap-4" data-testid={`item-${it.id}`}>
                  <img src={it.img} alt="" className="h-16 w-16 rounded-2xl object-cover"/>
                  <div className="flex-1">
                    <div className="font-fn font-semibold">{it.qty}× {it.name}</div>
                    {it.note && <div className="text-xs italic text-ink-muted">{it.note}</div>}
                  </div>
                  <span className={`chip ${itemStatus==='READY'?'bg-ok-bg text-ok':itemStatus==='PREPARING'?'bg-warn-bg text-warn':'bg-cream-sub text-ink-muted'}`}>{itemStatus}</span>
                  <div className="font-mono text-sm w-20 text-right">${(it.price*it.qty).toFixed(2)}</div>
                </div>
              );
            })}
          </div>
          <hr className="my-5 border-border"/>
          <div className="flex justify-between text-sm font-mono"><span>Subtotal</span><span>${sub.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm font-mono"><span>Service 15%</span><span>${(sub*0.15).toFixed(2)}</span></div>
          <div className="flex justify-between items-end mt-2">
            <span className="font-fn font-semibold">Total</span>
            <span className="font-display text-3xl">${(sub*1.15).toFixed(2)}</span>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-ink text-cream rounded-3xl p-6">
            <div className="label-eyebrow !text-cream/60">Kitchen pulse</div>
            <div className="mt-3 space-y-2 text-sm">
              <Pulse color="ok" text="Buddha Bowl — READY"/>
              <Pulse color={stage>=1?'ok':'warn'} text="Smokehouse Burger — PREPARING"/>
              <Pulse color="warn" text="Chocolate Cake — QUEUED"/>
            </div>
            <div className="mt-4 text-[10px] font-mono text-cream/60">LIVE VIA SIGNALR · TABLEHUB</div>
          </div>

          <div className="bg-white rounded-3xl border border-border p-5">
            <div className="label-eyebrow">Need something?</div>
            <button className="mt-3 w-full py-3 rounded-full bg-cream-sub hover:bg-cream-warm text-ink font-fn text-sm inline-flex items-center justify-center gap-2" data-testid="request-bill"><Bell size={14}/> Request bill</button>
            <button className="mt-2 w-full py-3 rounded-full bg-cream-sub hover:bg-cream-warm text-ink font-fn text-sm" data-testid="add-items">+ Add more items</button>
            <Link to="/checkout" className="mt-2 w-full block text-center py-3 rounded-full bg-primary text-white font-fn text-sm inline-flex items-center justify-center gap-2" data-testid="pay-now">Pay now <ArrowRight size={14}/></Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Pulse({ color, text }) {
  const c = { ok:'bg-ok', warn:'bg-secondary', err:'bg-err' }[color];
  return <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${c} animate-pulse-soft`}/><span className="text-cream/90">{text}</span></div>;
}

function timeFor(i) {
  const now = new Date();
  now.setMinutes(now.getMinutes() - (3-i)*6);
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}
