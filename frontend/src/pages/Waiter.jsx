// Replace old Waiter with a tabbed version: Floor, Today's reservations, Submit order for table.
import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { TABLES, MENU } from '@/lib/mock';
import { Bell, Plus, CheckCircle2, Calendar, UtensilsCrossed, Check, X as XIcon, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL_RES = [
  { id:'r101', name:'Sofia Marin', party:4, slot:'19:30', table:'T-07', zone:'Terrace', status:'CONFIRMED', pre:2 },
  { id:'r102', name:'Daniel Ruiz', party:2, slot:'20:00', table:'T-04', zone:'Indoor', status:'PENDING', pre:0 },
  { id:'r103', name:'Aria Kim', party:6, slot:'20:30', table:'T-12', zone:'Indoor', status:'CONFIRMED', pre:3 },
  { id:'r104', name:'Marco Silva', party:3, slot:'21:00', table:'T-03', zone:'Bar', status:'CONFIRMED', pre:0 },
];

export default function Waiter() {
  const [tab, setTab] = React.useState('floor');
  const [alerts, setAlerts] = React.useState([
    { id:'a1', type:'READY', table:'T-07', text:'Order ready for pickup' },
    { id:'a2', type:'BILL', table:'T-04', text:'Bill requested' },
  ]);
  const [reservations, setReservations] = React.useState(INITIAL_RES);

  return (
    <OpsLayout title="Service floor" subtitle="Maya · 6 tables assigned"
      right={<span className="chip bg-ok-bg text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse-soft"/> Online</span>}>
      <div className="flex gap-2 mb-5 bg-white border border-border rounded-full p-1 w-fit">
        {[['floor','Floor'],['reservations',`Today's reservations · ${reservations.filter(r=>r.status==='CONFIRMED'||r.status==='PENDING').length}`],['submit','Submit order']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} data-testid={`waiter-tab-${k}`}
            className={`px-4 py-2 rounded-full text-sm font-fn transition ${tab===k?'bg-ink text-white':'text-ink-body'}`}>{l}</button>
        ))}
      </div>

      {tab === 'floor' && <FloorTab alerts={alerts} setAlerts={setAlerts}/>}
      {tab === 'reservations' && <ReservationsTab list={reservations} setList={setReservations}/>}
      {tab === 'submit' && <SubmitTab/>}
    </OpsLayout>
  );
}

function FloorTab({ alerts, setAlerts }) {
  return (
    <div className="grid lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TABLES.slice(0,9).map(t => {
            const map = { EMPTY:'border-border bg-white text-ink-muted', OCCUPIED:'border-warn/40 bg-warn-bg', BILL_REQUESTED:'border-primary bg-primary/5' };
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
                  {t.status==='BILL_REQUESTED' && <button onClick={()=>toast.success('Sent to cashier')} className="flex-1 bg-primary text-white text-xs py-2 rounded-lg font-fn" data-testid={`waiter-bill-${t.id}`}>Send to cashier</button>}
                  {t.status==='EMPTY' && <button onClick={()=>toast.success('Guests seated · pre-orders pushed to kitchen')} className="flex-1 bg-cream-sub text-ink text-xs py-2 rounded-lg font-fn" data-testid={`waiter-seat-${t.id}`}>Seat guests</button>}
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
                <div className="flex justify-between"><span className="font-fn font-semibold">{a.table}</span><span className="text-[10px] font-mono text-ink-muted">just now</span></div>
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
            <MiniStat n="14" l="Tables"/>
            <MiniStat n="48" l="Covers"/>
            <MiniStat n="$1.2k" l="Tips"/>
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
  );
}

function ReservationsTab({ list, setList }) {
  const act = (id, status) => {
    setList(l => l.map(r => r.id===id?{...r, status}:r));
    const msg = { CONFIRMED:'Reservation confirmed', SEATED:'Guests seated · pre-orders sent to kitchen', COMPLETED:'Reservation completed', NO_SHOW:'Marked as no-show', CANCELLED:'Cancelled'}[status];
    toast.success(msg);
  };
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2"><Calendar size={14} className="text-ink-muted"/><div className="label-eyebrow">Today · Jan 27</div></div>
      <table className="w-full">
        <thead className="bg-cream-sub/40 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
          <tr><th className="text-left p-3 pl-5">Time</th><th className="text-left p-3">Guest</th><th className="text-left p-3">Party</th><th className="text-left p-3">Table</th><th className="text-left p-3">Pre-order</th><th className="text-left p-3">Status</th><th className="text-right p-3 pr-5">Actions</th></tr>
        </thead>
        <tbody>
          {list.map(r => (
            <tr key={r.id} className="border-t border-border" data-testid={`res-row-${r.id}`}>
              <td className="p-3 pl-5 font-mono font-semibold">{r.slot}</td>
              <td className="p-3 font-fn">{r.name}</td>
              <td className="p-3 text-sm">{r.party} pax</td>
              <td className="p-3 text-sm">{r.table} · {r.zone}</td>
              <td className="p-3 text-sm">{r.pre>0 ? <span className="chip bg-warn-bg text-warn">{r.pre} items</span> : <span className="text-ink-muted text-xs">—</span>}</td>
              <td className="p-3"><span className={`chip ${r.status==='CONFIRMED'?'bg-ok-bg text-ok':r.status==='PENDING'?'bg-warn-bg text-warn':r.status==='SEATED'?'bg-primary/10 text-primary':r.status==='COMPLETED'?'bg-cream-sub text-ink-muted':'bg-err-bg text-err'}`}>{r.status}</span></td>
              <td className="p-3 pr-5 text-right">
                <div className="inline-flex gap-1">
                  {r.status==='PENDING' && <Btn onClick={()=>act(r.id,'CONFIRMED')} icon={Check} testid={`confirm-${r.id}`}>Confirm</Btn>}
                  {r.status==='CONFIRMED' && <Btn onClick={()=>act(r.id,'SEATED')} icon={UserCheck} testid={`seat-${r.id}`}>Seat</Btn>}
                  {r.status==='SEATED' && <Btn onClick={()=>act(r.id,'COMPLETED')} icon={CheckCircle2} testid={`complete-${r.id}`}>Complete</Btn>}
                  {(r.status==='PENDING'||r.status==='CONFIRMED') && <Btn onClick={()=>act(r.id,'NO_SHOW')} icon={XIcon} variant="err" testid={`noshow-${r.id}`}>No-show</Btn>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubmitTab() {
  const [cart, setCart] = React.useState([]);
  const [table, setTable] = React.useState('T-07');
  const sub = cart.reduce((s,i)=>s+i.price*i.qty,0);

  return (
    <div className="grid lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="label-eyebrow flex items-center gap-2"><UtensilsCrossed size={14}/> Pick items for table</div>
            <select value={table} onChange={e=>setTable(e.target.value)} className="text-sm font-fn bg-cream-sub rounded-full px-4 py-2 outline-none" data-testid="submit-table">
              {TABLES.filter(t=>t.status!=='EMPTY').map(t=><option key={t.id}>{t.id}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MENU.filter(m=>m.available).map(m => {
              const ex = cart.find(c=>c.id===m.id);
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-cream-sub/50 border border-border" data-testid={`submit-item-${m.id}`}>
                  <img src={m.img} alt="" className="h-12 w-12 rounded-lg object-cover"/>
                  <div className="flex-1 min-w-0">
                    <div className="font-fn font-semibold text-sm truncate">{m.name}</div>
                    <div className="text-xs font-mono text-ink-muted">${m.price.toFixed(2)}</div>
                  </div>
                  <button onClick={()=>setCart(c => ex?c.map(x=>x.id===m.id?{...x,qty:x.qty+1}:x):[...c,{...m,qty:1}])}
                    className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0" data-testid={`add-${m.id}`}>
                    <Plus size={16}/>
                  </button>
                  {ex && <span className="chip bg-primary text-white">{ex.qty}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <aside className="lg:col-span-4">
        <div className="bg-white rounded-2xl border border-border p-5 sticky top-[88px]">
          <div className="label-eyebrow">Order for {table}</div>
          {cart.length === 0 ? (
            <div className="py-10 text-center text-ink-muted text-sm">Add items from the left</div>
          ) : (
            <>
              <div className="mt-4 space-y-2 divide-y divide-border">
                {cart.map(i => (
                  <div key={i.id} className="pt-2 flex justify-between text-sm font-fn">
                    <span>{i.qty}× {i.name}</span>
                    <span className="font-mono">${(i.price*i.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <hr className="my-4 border-border"/>
              <div className="flex justify-between items-end mb-4">
                <span className="font-fn font-semibold">Total</span>
                <span className="font-display text-2xl">${sub.toFixed(2)}</span>
              </div>
              <button onClick={()=>{ toast.success(`Order sent for ${table} · event order.placed emitted`); setCart([]); }} className="btn-primary w-full" data-testid="send-to-kitchen">Send to kitchen</button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Btn({ onClick, icon: Icon, children, variant, testid }) {
  return (
    <button onClick={onClick} data-testid={testid} className={`px-3 py-1.5 rounded-lg text-xs font-fn inline-flex items-center gap-1 ${variant==='err'?'bg-err-bg text-err hover:bg-err hover:text-white':'bg-cream-sub hover:bg-ink hover:text-white transition'}`}>
      <Icon size={12}/> {children}
    </button>
  );
}
function MiniStat({ n, l }) {
  return <div className="bg-white rounded-xl p-3 text-center"><div className="font-display text-2xl">{n}</div><div className="text-[9px] font-mono text-ink-muted uppercase tracking-widest mt-1">{l}</div></div>;
}
