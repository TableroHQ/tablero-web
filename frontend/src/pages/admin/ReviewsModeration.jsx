import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { Check, X, Star, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { REVIEWS } from '@/lib/mock';

const extended = [
  ...REVIEWS.map(r => ({ ...r, status: 'PENDING', type: 'restaurant' })),
  { id:'rv4', author:'Marco S.', rating:3, comment:'Service was a bit slow at peak hours. Food was great though.', date:'2025-12-22', status:'PENDING', type:'restaurant' },
  { id:'rv5', author:'Nadia T.', rating:5, comment:'Jamie (courier) went out of his way to double-check. Chef\'s kiss.', date:'2026-01-11', status:'PENDING', type:'courier' },
];

export default function ReviewsModeration() {
  const [list, setList] = React.useState(extended);
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState('pending');

  const act = (id, action) => {
    setList(l => l.map(r => r.id===id?{...r, status: action}:r));
    toast.success(action==='PUBLISHED'?'Review published · ratings recalculated':action==='REMOVED'?'Review removed':'Review rejected');
  };

  const filtered = list.filter(r => {
    if (filter==='pending') return r.status==='PENDING';
    if (filter==='published') return r.status==='PUBLISHED';
    if (filter==='rejected') return r.status==='REJECTED' || r.status==='REMOVED';
    return true;
  }).filter(r => r.author.toLowerCase().includes(q.toLowerCase()) || r.comment.toLowerCase().includes(q.toLowerCase()));

  return (
    <OpsLayout title="Reviews moderation" subtitle="Admin · approve reviews before publication">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          {[['pending',`Pending · ${list.filter(r=>r.status==='PENDING').length}`],['published','Published'],['rejected','Rejected'],['all','All']].map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)} data-testid={`filter-${k}`}
              className={`px-4 py-2 rounded-full text-sm font-fn ${filter===k?'bg-ink text-white':'bg-white border border-border'}`}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-border">
          <Search size={14} className="text-ink-muted"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search reviews" className="bg-transparent outline-none text-sm" data-testid="reviews-search"/>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-border p-5" data-testid={`review-card-${r.id}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-fn font-semibold">{r.author}</div>
                <div className="text-xs font-mono text-ink-muted">{r.date} · {r.type}</div>
              </div>
              <span className={`chip ${r.status==='PENDING'?'bg-warn-bg text-warn':r.status==='PUBLISHED'?'bg-ok-bg text-ok':'bg-err-bg text-err'}`}>{r.status}</span>
            </div>
            <div className="flex gap-0.5 text-secondary mt-2">{Array.from({length:r.rating}).map((_,i)=><Star key={i} size={14} fill="currentColor"/>)}{Array.from({length:5-r.rating}).map((_,i)=><Star key={i} size={14} className="text-cream-sub"/>)}</div>
            <p className="text-sm text-ink-body mt-3 leading-relaxed">"{r.comment}"</p>
            {r.status === 'PENDING' ? (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={()=>act(r.id,'PUBLISHED')} className="py-2.5 rounded-lg bg-ok text-white text-xs font-fn font-medium inline-flex items-center justify-center gap-1" data-testid={`approve-${r.id}`}><Check size={12}/> Approve & publish</button>
                <button onClick={()=>act(r.id,'REJECTED')} className="py-2.5 rounded-lg bg-err text-white text-xs font-fn font-medium inline-flex items-center justify-center gap-1" data-testid={`reject-${r.id}`}><X size={12}/> Reject</button>
              </div>
            ) : (
              <button onClick={()=>act(r.id,'REMOVED')} className="mt-4 w-full py-2.5 rounded-lg bg-cream-sub text-ink-body text-xs font-fn inline-flex items-center justify-center gap-1" data-testid={`remove-${r.id}`}><Trash2 size={12}/> Remove</button>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-2 text-center text-ink-muted p-12">No reviews in this filter.</div>}
      </div>
    </OpsLayout>
  );
}
