import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { Mail, MessageSquare, Send, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function Promotions() {
  const [channel, setChannel] = React.useState('email');
  const [subject, setSubject] = React.useState('Half off hotdogs this Friday');
  const [body, setBody] = React.useState("Hi {{name}},\n\nTomorrow only — every hotdog on the bonus catalogue is half off.\n\nFrom 18:00 · while they last.\n\nCheers,\nThe Bite team");
  const [audience, setAudience] = React.useState('active');
  const [sending, setSending] = React.useState(false);

  const send = async () => {
    setSending(true);
    const r = await api.sendPromotion({ channel, subject, body, audience });
    setSending(false);
    if (!r.ok) return toast.error(r.error);
    toast.success(`Queued for ${r.data.sent.toLocaleString()} recipients`);
  };

  const counts = { active: 4214, all: 12487, vip: 842, lapsed: 1892 };

  return (
    <OpsLayout title="Promotions" subtitle="Admin · broadcast email or SMS campaigns">
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="label-eyebrow mb-3">Channel</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <ChannelCard active={channel==='email'} onClick={()=>setChannel('email')} icon={Mail} title="Email" sub="Via SendGrid · Marketing API" testid="channel-email"/>
              <ChannelCard active={channel==='sms'} onClick={()=>setChannel('sms')} icon={MessageSquare} title="SMS" sub="Via Twilio · respects SMS opt-out" testid="channel-sms"/>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="label-eyebrow">Audience</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              {[['active','Active · 30d'],['all','All subscribers'],['vip','VIP (500+ pts)'],['lapsed','Lapsed · 90d']].map(([k, l])=>(
                <button key={k} onClick={()=>setAudience(k)} data-testid={`audience-${k}`}
                  className={`text-left p-4 rounded-xl border-2 transition ${audience===k?'border-primary bg-primary/5':'border-border bg-white hover:border-ink/30'}`}>
                  <Users size={16} className={audience===k?'text-primary':'text-ink-muted'}/>
                  <div className="font-fn font-semibold text-sm mt-2">{l}</div>
                  <div className="text-xs font-mono text-ink-muted mt-0.5">{counts[k].toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="label-eyebrow">Message</div>
            {channel==='email' && (
              <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject" data-testid="promo-subject"
                className="w-full mt-3 bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary"/>
            )}
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={8} data-testid="promo-body"
              className="w-full mt-3 bg-cream-sub rounded-xl px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-primary"/>
            <div className="mt-3 flex flex-wrap gap-2">
              {['{{name}}','{{restaurant}}','{{points}}','{{branch}}'].map(t=>(
                <button key={t} onClick={()=>setBody(b=>b+' '+t)} className="text-[10px] font-mono uppercase bg-cream-sub px-2 py-1 rounded">{t}</button>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-ink text-cream rounded-2xl p-6 sticky top-[88px]">
            <div className="label-eyebrow !text-cream/60">Preview</div>
            <div className="mt-4 bg-white text-ink rounded-xl p-4">
              {channel==='email' && <div className="font-fn font-semibold text-sm mb-2">{subject}</div>}
              <pre className="font-body text-xs whitespace-pre-wrap leading-relaxed text-ink-body">{body.replace('{{name}}','Sofia').replace('{{restaurant}}','Downtown').replace('{{points}}','1,240').replace('{{branch}}','Downtown')}</pre>
            </div>
            <div className="mt-5 space-y-2 text-sm font-mono">
              <div className="flex justify-between text-cream/70"><span>Channel</span><span>{channel.toUpperCase()}</span></div>
              <div className="flex justify-between text-cream/70"><span>Audience</span><span>{counts[audience].toLocaleString()}</span></div>
              <div className="flex justify-between text-cream/70"><span>Est. cost</span><span>${(counts[audience]*0.002).toFixed(2)}</span></div>
            </div>
            <button disabled={sending} onClick={send} className="mt-6 w-full py-3 rounded-full bg-primary hover:bg-terracotta-dark transition font-fn font-semibold inline-flex items-center justify-center gap-2" data-testid="send-blast">
              <Send size={14}/> {sending?'Queuing…':`Send to ${counts[audience].toLocaleString()}`}
            </button>
            <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-cream/50"><Calendar size={10}/> Or schedule for later</div>
          </div>
        </aside>
      </div>
    </OpsLayout>
  );
}

function ChannelCard({ active, onClick, icon: Icon, title, sub, testid }) {
  return (
    <button onClick={onClick} data-testid={testid} className={`text-left p-4 rounded-xl border-2 transition ${active?'border-primary bg-primary/5':'border-border bg-white hover:border-ink/30'}`}>
      <Icon size={20} className={active?'text-primary':'text-ink-muted'}/>
      <div className="mt-3 font-fn font-semibold">{title}</div>
      <div className="text-xs text-ink-muted mt-0.5 font-mono">{sub}</div>
    </button>
  );
}
