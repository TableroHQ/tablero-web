import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { Search, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const INVOICES = [
  { id:'INV-00412', customer:'Sofia Marin', date:'2026-01-15', total:64.50, method:'CARD', status:'PAID', reason:'' },
  { id:'INV-00398', customer:'Daniel Ruiz', date:'2026-01-12', total:41.00, method:'BALANCE', status:'PAID', reason:'' },
  { id:'INV-00376', customer:'Aria Kim', date:'2026-01-08', total:124.00, method:'CARD', status:'REFUNDED', reason:'Item quality' },
  { id:'INV-00351', customer:'Marco Silva', date:'2026-01-05', total:88.00, method:'CASH', status:'PAID', reason:'' },
];

export default function Refunds() {
  const [list, setList] = React.useState(INVOICES);
  const [sel, setSel] = React.useState(null);
  const [reason, setReason] = React.useState('');
  const [q, setQ] = React.useState('');

  const issue = async () => {
    if (!reason.trim()) return toast.error('Please provide a reason');
    const r = await api.refund(sel.id);
    if (!r.ok) return toast.error('Refund failed');
    setList(l => l.map(i => i.id===sel.id ? { ...i, status:'REFUNDED', reason } : i));
    toast.success(`Refund issued for ${sel.id}`);
    setSel(null); setReason('');
  };

  const filtered = list.filter(i => i.id.toLowerCase().includes(q.toLowerCase()) || i.customer.toLowerCase().includes(q.toLowerCase()));

  return (
    <OpsLayout title="Refunds" subtitle="Admin · reverse charges via Stripe or credit balance">
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="flex items-center gap-2 bg-cream-sub rounded-full px-4 py-2 flex-1 max-w-md">
                <Search size={14} className="text-ink-muted"/>
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Invoice ID or customer" className="bg-transparent outline-none flex-1 text-sm" data-testid="refund-search"/>
              </div>
            </div>
            <table className="w-full">
              <thead className="bg-cream-sub/40 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                <tr><th className="text-left p-3 pl-5">Invoice</th><th className="text-left p-3">Customer</th><th className="text-left p-3">Date</th><th className="text-left p-3">Total</th><th className="text-left p-3">Method</th><th className="text-left p-3 pr-5">Status</th></tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.id} className={`border-t border-border cursor-pointer ${sel?.id===i.id?'bg-primary/5':''}`} onClick={()=>setSel(i)} data-testid={`inv-${i.id}`}>
                    <td className="p-3 pl-5 font-mono font-semibold">{i.id}</td>
                    <td className="p-3 text-sm">{i.customer}</td>
                    <td className="p-3 text-xs font-mono text-ink-muted">{i.date}</td>
                    <td className="p-3 font-mono text-sm">${i.total.toFixed(2)}</td>
                    <td className="p-3"><span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">{i.method}</span></td>
                    <td className="p-3 pr-5">
                      <span className={`chip ${i.status==='PAID'?'bg-ok-bg text-ok':'bg-err-bg text-err'}`}>{i.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="lg:col-span-4">
          {sel ? (
            <div className="bg-white rounded-2xl border border-border p-6 sticky top-[88px]">
              <div className="label-eyebrow">Refund</div>
              <div className="font-display text-3xl mt-1">{sel.id}</div>
              <p className="text-sm text-ink-body mt-2">{sel.customer} · ${sel.total.toFixed(2)} via {sel.method}</p>
              <div className="mt-5 p-4 rounded-xl bg-warn-bg text-warn text-xs font-fn flex gap-2"><AlertTriangle size={14} className="flex-shrink-0 mt-0.5"/>Refunds are irreversible. {sel.method==='CARD'?'Funds go back to the original card in 5-10 business days.':'Amount credited to customer balance.'}</div>

              {sel.status === 'REFUNDED' ? (
                <div className="mt-5 p-4 rounded-xl bg-ok-bg text-ok text-sm flex items-center gap-2"><Check size={14}/> Already refunded · {sel.reason}</div>
              ) : (
                <>
                  <label className="block mt-5">
                    <span className="label-eyebrow">Reason (internal)</span>
                    <textarea value={reason} onChange={e=>setReason(e.target.value)} data-testid="refund-reason" rows={3}
                      className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn text-sm outline-none focus:ring-2 focus:ring-primary"/>
                  </label>
                  <button onClick={issue} className="mt-4 w-full py-3 rounded-full bg-err text-white font-fn font-semibold inline-flex items-center justify-center gap-2" data-testid="issue-refund"><RefreshCw size={14}/> Issue refund</button>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border p-10 text-center text-ink-muted sticky top-[88px]">Select an invoice</div>
          )}
        </aside>
      </div>
    </OpsLayout>
  );
}
