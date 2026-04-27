import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { TABLES } from '@/lib/mock';
import { CreditCard, Banknote, SplitSquareHorizontal, Receipt, CheckCircle2 } from 'lucide-react';

export default function POS() {
  const [active, setActive] = React.useState(TABLES.find(t=>t.status==='BILL_REQUESTED'));
  const [tendered, setTendered] = React.useState('');

  const change = active && tendered ? (parseFloat(tendered) - active.total) : 0;

  return (
    <OpsLayout title="Cashier POS" subtitle="Priya · register #2"
      right={<div className="flex items-center gap-2"><span className="chip bg-warn-bg text-warn">{TABLES.filter(t=>t.status==='BILL_REQUESTED').length} bills pending</span></div>}>
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="label-eyebrow">Floor</div>
              <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest">
                <Legend color="bg-cream-sub" label="Empty"/>
                <Legend color="bg-warn" label="Occupied"/>
                <Legend color="bg-primary" label="Bill"/>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {TABLES.map(t => {
                const sel = active?.id===t.id;
                const map = { EMPTY:'bg-cream-sub text-ink-muted', OCCUPIED:'bg-warn text-white', BILL_REQUESTED:'bg-primary text-white animate-pulse-soft' };
                return (
                  <button key={t.id} onClick={()=>setActive(t)} data-testid={`pos-table-${t.id}`}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center transition ${map[t.status]} ${sel?'ring-4 ring-ink':''}`}>
                    <span className="font-display text-2xl">{t.id}</span>
                    <span className="text-[10px] font-mono opacity-80 mt-1">{t.status==='EMPTY'?'—':`$${t.total.toFixed(0)}`}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <Kpi n={`$${TABLES.reduce((s,t)=>s+(t.total||0),0).toFixed(0)}`} l="Open bills"/>
            <Kpi n="34" l="Paid today"/>
            <Kpi n="$8,420" l="Cash drawer"/>
          </div>
        </div>

        <aside className="lg:col-span-5 space-y-4">
          {active ? (
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="label-eyebrow">Bill · {active.id}</div>
                  <div className="font-display text-3xl mt-1">{active.zone}</div>
                </div>
                <span className="chip bg-primary/10 text-primary">{active.status.replace('_',' ')}</span>
              </div>
              <div className="mt-5 space-y-2 text-sm">
                {[['Smokehouse Burger','$18.50'],['Buddha Bowl','$14.50'],['Bitter Chocolate Cake','$9.00'],['Sparkling Water ×2','$6.00']].map(([n,p]) => (
                  <div key={n} className="flex justify-between font-mono"><span>{n}</span><span>{p}</span></div>
                ))}
              </div>
              <hr className="my-4 border-border"/>
              <div className="flex justify-between font-mono text-sm"><span>Subtotal</span><span>${(active.total*0.85).toFixed(2)}</span></div>
              <div className="flex justify-between font-mono text-sm"><span>Service 15%</span><span>${(active.total*0.15).toFixed(2)}</span></div>
              <div className="flex justify-between mt-2"><span className="font-fn font-semibold">Total</span><span className="font-display text-3xl">${active.total.toFixed(2)}</span></div>

              <div className="grid grid-cols-3 gap-2 mt-5">
                <input data-testid="cash-tendered" value={tendered} onChange={e=>setTendered(e.target.value)} placeholder="$ tendered"
                  className="col-span-3 bg-cream-sub rounded-xl px-4 py-3 font-mono text-lg outline-none focus:ring-2 focus:ring-primary"/>
                {[10,20,50,100,'EXACT'].map(n => (
                  <button key={n} onClick={()=>setTendered(n==='EXACT'?String(active.total):String(n))} data-testid={`bill-${n}`}
                    className="bg-cream-sub hover:bg-cream-warm font-mono text-sm py-2 rounded-lg">{n==='EXACT'?'EXACT':`$${n}`}</button>
                ))}
              </div>
              {tendered && <div className="mt-3 text-sm font-mono text-right">Change: <span className={change<0?'text-err':'text-ok font-bold'}>${change.toFixed(2)}</span></div>}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 bg-ok text-white py-3 rounded-xl font-fn font-semibold" data-testid="pos-cash"><Banknote size={16}/> Mark paid (cash)</button>
                <button className="flex items-center justify-center gap-2 bg-ink text-white py-3 rounded-xl font-fn font-semibold" data-testid="pos-card"><CreditCard size={16}/> Card</button>
                <button className="flex items-center justify-center gap-2 bg-cream-sub py-3 rounded-xl font-fn" data-testid="pos-split"><SplitSquareHorizontal size={16}/> Split bill</button>
                <button className="flex items-center justify-center gap-2 bg-cream-sub py-3 rounded-xl font-fn" data-testid="pos-receipt"><Receipt size={16}/> Receipt</button>
              </div>
              <button className="mt-3 w-full py-3 rounded-xl border-2 border-ok text-ok font-fn font-medium flex items-center justify-center gap-2" data-testid="pos-release">
                <CheckCircle2 size={16}/> Release table
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border p-10 text-center text-ink-muted">Select a table to view bill</div>
          )}
        </aside>
      </div>
    </OpsLayout>
  );
}

function Legend({ color, label }) {
  return <span className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded-sm ${color}`}/>{label}</span>;
}
function Kpi({ n, l }) {
  return <div className="bg-white rounded-2xl border border-border p-5"><div className="font-display text-3xl">{n}</div><div className="label-eyebrow mt-1">{l}</div></div>;
}
