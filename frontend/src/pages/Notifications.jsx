import React from 'react';
import { useStore } from '@/lib/store';
import { Check, CheckCheck, Trash2, Mail, MessageSquare, BellRing } from 'lucide-react';

export default function Notifications() {
  const [, s] = useStore();
  const { notifications, prefs } = s.get();
  const [filter, setFilter] = React.useState('all');

  const list = notifications.filter(n => filter==='all' ? true : filter==='unread' ? !n.read : n.read);

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow">Inbox</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">Your notifications.</h1>

      <div className="grid lg:grid-cols-3 gap-6 mt-10">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {[['all','All'],['unread','Unread'],['read','Read']].map(([k, l]) => (
                <button key={k} onClick={()=>setFilter(k)} data-testid={`filter-${k}`}
                  className={`px-4 py-2 rounded-full text-sm font-fn ${filter===k?'bg-ink text-white':'bg-white border border-border'}`}>{l}</button>
              ))}
            </div>
            <button onClick={s.markAllRead} className="text-sm font-mono text-primary flex items-center gap-1" data-testid="mark-all"><CheckCheck size={14}/> Mark all read</button>
          </div>
          <div className="bg-white rounded-3xl border border-border divide-y divide-border">
            {list.length === 0 ? (
              <div className="p-10 text-center text-ink-muted">No notifications here.</div>
            ) : list.map(n => (
              <div key={n.id} className={`p-5 flex gap-4 ${!n.read?'bg-primary/5':''}`} data-testid={`notif-row-${n.id}`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-mono font-bold ${!n.read?'bg-primary text-white':'bg-cream-sub text-ink-muted'}`}>●</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-fn font-semibold">{n.title}</span>
                    <span className="text-[10px] font-mono text-ink-muted uppercase tracking-widest">{n.type}</span>
                  </div>
                  <p className="text-sm text-ink-body mt-1">{n.body}</p>
                </div>
                {!n.read && <button onClick={()=>s.markRead(n.id)} className="text-ink-muted hover:text-primary" data-testid={`read-${n.id}`}><Check size={16}/></button>}
              </div>
            ))}
          </div>
        </div>

        <aside>
          <div className="bg-white rounded-3xl border border-border p-6">
            <div className="label-eyebrow">Preferences</div>
            <p className="text-sm text-ink-body mt-2">Choose how we nudge you.</p>
            <div className="mt-5 space-y-4">
              <Toggle label="Email receipts" hint="Orders, reservations, OTPs" icon={Mail} value={prefs.email} onChange={v=>s.setPrefs({email:v})} testid="pref-email"/>
              <Toggle label="SMS alerts" hint="Delivery + reminders" icon={MessageSquare} value={prefs.sms} onChange={v=>s.setPrefs({sms:v})} testid="pref-sms"/>
              <Toggle label="Push notifications" hint="In-app and mobile" icon={BellRing} value={prefs.push} onChange={v=>s.setPrefs({push:v})} testid="pref-push"/>
              <Toggle label="Promotions" hint="Monthly food drops" icon={Trash2} value={prefs.marketing} onChange={v=>s.setPrefs({marketing:v})} testid="pref-marketing"/>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Toggle({ label, hint, value, onChange, icon: Icon, testid }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer" data-testid={testid}>
      <div className="h-9 w-9 rounded-lg bg-cream-sub text-ink-muted flex items-center justify-center flex-shrink-0"><Icon size={14}/></div>
      <div className="flex-1">
        <div className="font-fn font-semibold text-sm">{label}</div>
        <div className="text-xs text-ink-muted">{hint}</div>
      </div>
      <button type="button" onClick={()=>onChange(!value)}
        className={`h-6 w-11 rounded-full transition relative flex-shrink-0 ${value?'bg-primary':'bg-cream-sub'}`}>
        <span className={`h-5 w-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${value?'left-[22px]':'left-0.5'}`}/>
      </button>
    </label>
  );
}
