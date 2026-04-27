import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { TABLES } from '@/lib/mock';
import { Bell, Plus, CheckCircle2, Coffee } from 'lucide-react';

export default function Waiter() {
  const [alerts, setAlerts] = React.useState([
    { id:'a1', type:'READY', table:'T-07', text:'Order ready for pickup' },
    { id:'a2', type:'BILL', table:'T-04', text:'Bill requested' },
  ]);

  return (
    <OpsLayout title="Service floor" subtitle="Maya · 6 tables assigned"
      right={<span className="chip bg-ok-bg text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse-soft"/> Online</span>}>
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TABLES.slice(0,9).map(t => {
              const map = {
                EMPTY:'border-border bg-white text-ink-muted',
                OCCUPIED:'border-warn/40 bg-warn-bg',
                BILL_REQUESTED:'border-primary bg-primary/5',
              };
              return (
                <div key={t.id} className={`rounded-2xl border-2 p-5 ${map[t.status]}`} data-testid={`waiter-table-${t.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display text-3xl">{t.id}</div>
                      <div className="text-[10px] font-mono text-ink-muted uppercase tracking-widest">{t.zone} · {t.seats} seats</div>
                    </div>
                    <span className={`chip ${t.status==='EMPTY'?'bg-cream-sub text-ink-muted':t.status==='OCCUPIED'?'bg-warn text-white':'bg-primary text-white'}`}>{t.status.replace('_',' ')}</span>
                  </div>
                  {t.status!=='EMPTY' && <div className="mt-4 font-mono text-2xl font-semibold">${t.total.toFixed(2)}</div>}
                  <div className="mt-4 flex gap-2">
                    {t.status==='OCCUPIED' && <button className="flex-1 bg-ink text-white text-xs py-2 rounded-lg font-fn" data-testid={`waiter-add-${t.id}`}><Plus size={12} className="inline mr-1"/>Add order</button>}
                    {t.status==='BILL_REQUESTED' && <button className="flex-1 bg-primary text-white text-xs py-2 rounded-lg font-fn" data-testid={`waiter-bill-${t.id}`}>Send to cashier</button>}
                    {t.status==='EMPTY' && <button className="flex-1 bg-cream-sub text-ink text-xs py-2 rounded-lg font-fn" data-testid={`waiter-seat-${t.id}`}>Seat guests</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2"><Bell size={16} className="text-primary"/><div className="label-eyebrow">Live alerts</div></div>
            <div className="mt-4 space-y-3">
              {alerts.map(a => (
                <div key={a.id} className={`p-4 rounded-xl border-l-4 ${a.type==='READY'?'border-ok bg-ok-bg':'border-primary bg-primary/5'}`} data-testid={`alert-${a.id}`}>
                  <div className="flex justify-between">
                    <span className="font-fn font-semibold">{a.table}</span>
                    <span className="text-[10px] font-mono text-ink-muted">just now</span>
                  </div>
                  <p className="text-sm text-ink-body mt-1">{a.text}</p>
                  <button onClick={()=>setAlerts(al=>al.filter(x=>x.id!==a.id))} className="mt-2 text-xs font-mono text-primary uppercase" data-testid={`ack-${a.id}`}>Acknowledge →</button>
                </div>
              ))}
              {alerts.length===0 && <div className="text-sm text-ink-muted py-6 text-center">All caught up.</div>}
            </div>
          </div>

          <div className="bg-cream-sub/60 rounded-2xl p-5">
            <div className="label-eyebrow">Today</div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <Stat n="14" l="Tables"/>
              <Stat n="48" l="Covers"/>
              <Stat n="$1.2k" l="Tips"/>
            </div>
          </div>

          <div className="bg-ink text-cream rounded-2xl p-5">
            <CheckCircle2 className="text-secondary mb-2" size={20}/>
            <div className="font-fn font-semibold">Ready for pickup</div>
            <p className="text-sm text-cream/70 mt-1">Chef just rang for table 7. Two plates and a side.</p>
            <button className="mt-3 w-full py-2 rounded-lg bg-secondary text-white font-fn text-sm" data-testid="pickup-confirm">On my way</button>
          </div>
        </aside>
      </div>
    </OpsLayout>
  );
}

function Stat({ n, l }) {
  return <div className="bg-white rounded-xl p-3 text-center"><div className="font-display text-2xl">{n}</div><div className="text-[9px] font-mono text-ink-muted uppercase tracking-widest mt-1">{l}</div></div>;
}
