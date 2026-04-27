import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { KDS_TICKETS } from '@/lib/mock';
import { Bell, Volume2, Printer } from 'lucide-react';

const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

export default function KDS() {
  const [tickets, setTickets] = React.useState(KDS_TICKETS);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => { const t = setInterval(()=>setTick(v=>v+1), 1000); return ()=>clearInterval(t); }, []);

  const updateItem = (tid, idx, status) => setTickets(ts => ts.map(t => t.id!==tid?t:{...t, items: t.items.map((it,i)=>i===idx?{...it,status}:it)}));
  const allReady = (t) => t.items.every(i => i.status==='READY');

  const right = (
    <div className="flex items-center gap-3">
      <span className="chip bg-kds-surface2 text-cream/70"><span className="h-2 w-2 rounded-full bg-ok animate-pulse-soft"/> KitchenHub · LIVE</span>
      <span className="font-mono text-xs text-cream/50">{tickets.length} open · {tickets.filter(allReady).length} ready</span>
    </div>
  );

  return (
    <OpsLayout dark title="Kitchen Display" subtitle="Downtown · Chef Marcus · Audio on" right={right}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {tickets.map(t => {
          const elapsed = t.elapsedSec + tick;
          const overdue = elapsed > 300;
          const ready = allReady(t);
          return (
            <div key={t.id} data-testid={`kds-ticket-${t.id}`}
              className={`kds-card rounded-lg border-t-4 ${ready?'border-t-ok':overdue?'border-t-err':'border-t-warn'} p-4 ${ready?'opacity-95':''}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-display text-2xl">{t.table}</div>
                  <div className="text-[10px] font-mono text-cream/50 uppercase tracking-widest">{t.server}</div>
                </div>
                <div className={`font-mono text-2xl ${overdue?'text-err animate-pulse-soft':'text-cream'}`}>{fmt(elapsed)}</div>
              </div>
              <div className="space-y-2">
                {t.items.map((it,idx) => (
                  <div key={idx} className={`p-3 rounded-md ${it.status==='READY'?'bg-ok/20':it.status==='PREPARING'?'bg-warn/20':'bg-kds-surface2'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-fn font-semibold">{it.qty}× {it.name}</div>
                        {it.mods && <div className="text-[11px] text-cream/60 mt-0.5 italic">{it.mods}</div>}
                      </div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-cream/60">{it.status}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {['QUEUED','PREPARING','READY'].map(s => (
                        <button key={s} onClick={()=>updateItem(t.id, idx, s)} data-testid={`kds-status-${t.id}-${idx}-${s}`}
                          className={`flex-1 text-[10px] font-mono py-1.5 rounded ${it.status===s?'bg-cream text-ink':'bg-kds-bg text-cream/60 hover:text-cream'}`}>
                          {s[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 bg-secondary text-white text-xs font-fn font-medium py-2 rounded flex items-center justify-center gap-1" data-testid={`kds-call-${t.id}`}><Bell size={12}/> Call waiter</button>
                <button className="bg-kds-bg text-cream/60 hover:text-cream py-2 px-3 rounded" data-testid={`kds-print-${t.id}`}><Printer size={12}/></button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-kds-surface2 rounded-full px-4 py-2 text-xs font-mono text-cream/70">
        <Volume2 size={14}/> Audio chime · ON
      </div>
    </OpsLayout>
  );
}
