import React from 'react';
import { Star } from 'lucide-react';
import { REVIEWS } from '@/lib/mock';

export default function Reviews() {
  const [r, setR] = React.useState({ chef: 5, waiter: 4, cleanliness: 5, service: 5 });

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow">Reviews</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">Tell us how it landed.</h1>
      <p className="mt-3 text-ink-body max-w-xl">Reviews appear publicly after admin approval. One review per visit.</p>

      <div className="grid lg:grid-cols-12 gap-6 mt-10">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-border p-7 md:p-8">
          <h2 className="font-display text-2xl">Last visit · Feb 4 · Table 7</h2>
          <div className="space-y-5 mt-6">
            {[['chef','Chef'],['waiter','Waiter'],['cleanliness','Cleanliness'],['service','Service']].map(([k,l]) => (
              <div key={k} className="flex items-center justify-between" data-testid={`rate-${k}`}>
                <span className="font-fn">{l}</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={()=>setR(s=>({...s,[k]:n}))} className={`p-1 ${r[k]>=n?'text-secondary':'text-cream-sub'}`} data-testid={`star-${k}-${n}`}>
                      <Star size={22} fill={r[k]>=n?'currentColor':'none'}/>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <textarea data-testid="review-comment" placeholder="What stood out? What could we improve?" className="w-full mt-6 bg-cream-sub rounded-2xl p-4 min-h-[140px] outline-none focus:ring-2 focus:ring-primary font-fn"/>
          <div className="mt-5 flex gap-3">
            <button className="btn-primary" data-testid="submit-review">Submit review</button>
            <button className="btn-outline" data-testid="cancel-review">Maybe later</button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-border p-6">
            <div className="label-eyebrow">Recent reviews</div>
            <div className="mt-4 space-y-5 divide-y divide-border">
              {REVIEWS.map(rv => (
                <div key={rv.id} className="pt-5 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="font-fn font-semibold">{rv.author}</span>
                    <span className="font-mono text-xs text-ink-muted">{rv.date}</span>
                  </div>
                  <div className="flex gap-0.5 text-secondary mt-1">{Array.from({length:rv.rating}).map((_,i)=><Star key={i} size={14} fill="currentColor"/>)}</div>
                  <p className="text-sm text-ink-body mt-2 leading-relaxed">"{rv.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
