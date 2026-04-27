import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { SALES_DATA, STAFF, REVIEWS } from '@/lib/mock';
import { TrendingUp, DollarSign, Users, Star, Check, X, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

export default function Admin() {
  const [branch, setBranch] = React.useState('Downtown');
  return (
    <OpsLayout title="Operations console" subtitle="Director · multi-branch view"
      right={<BranchSelect value={branch} onChange={setBranch}/>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={DollarSign} n="$48.2k" l="Revenue · 7d" trend="+12.4%" up/>
        <Kpi icon={TrendingUp} n="932" l="Orders · 7d" trend="+8.1%" up/>
        <Kpi icon={Users} n="148" l="Staff on shift" trend="3 branches"/>
        <Kpi icon={Star} n="4.74" l="Avg. rating" trend="+0.06"/>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5">
          <div className="flex justify-between items-center"><div><div className="label-eyebrow">Revenue</div><div className="font-display text-2xl mt-1">Last 7 days</div></div>
            <div className="flex gap-2 text-xs font-mono">
              <span className="px-3 py-1 rounded-full bg-primary text-white">REVENUE</span>
              <span className="px-3 py-1 rounded-full bg-cream-sub text-ink-muted">ORDERS</span>
            </div>
          </div>
          <div className="h-[280px] mt-4">
            <ResponsiveContainer>
              <AreaChart data={SALES_DATA}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C8553D" stopOpacity={0.4}/><stop offset="100%" stopColor="#C8553D" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DF"/>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8A817C', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: '#8A817C' }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E4DF', fontSize: 12 }}/>
                <Area type="monotone" dataKey="revenue" stroke="#C8553D" strokeWidth={2.5} fill="url(#g)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="label-eyebrow">Orders by day</div>
          <div className="h-[280px] mt-4">
            <ResponsiveContainer>
              <BarChart data={SALES_DATA}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8A817C' }} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E4DF', fontSize: 12 }}/>
                <Bar dataKey="orders" fill="#E4883A" radius={[8,8,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-border">
            <div><div className="label-eyebrow">Staff roster</div><div className="font-display text-2xl mt-1">Today's shift</div></div>
            <button className="text-xs font-mono text-primary uppercase tracking-widest" data-testid="manage-staff">Manage →</button>
          </div>
          <table className="w-full">
            <thead className="bg-cream-sub/50">
              <tr className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                <th className="text-left p-3 pl-5">Name</th><th className="text-left p-3">Role</th><th className="text-left p-3">Branch</th><th className="text-left p-3 pr-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {STAFF.map(s => (
                <tr key={s.id} className="border-t border-border" data-testid={`staff-${s.id}`}>
                  <td className="p-3 pl-5 font-fn font-medium">{s.name}</td>
                  <td className="p-3 text-sm">{s.role}</td>
                  <td className="p-3 text-sm">{s.branch}</td>
                  <td className="p-3 pr-5">
                    <span className={`chip ${s.status==='On shift'?'bg-ok-bg text-ok':'bg-cream-sub text-ink-muted'}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between"><div><div className="label-eyebrow">Reviews moderation</div><div className="font-display text-2xl mt-1">Pending · {REVIEWS.length}</div></div></div>
          <div className="mt-4 space-y-3">
            {REVIEWS.map(r => (
              <div key={r.id} className="p-4 rounded-xl bg-cream-sub/40 border border-border" data-testid={`mod-${r.id}`}>
                <div className="flex justify-between"><span className="font-fn font-semibold">{r.author}</span><span className="font-mono text-xs text-ink-muted">{r.date}</span></div>
                <div className="flex gap-0.5 text-secondary mt-1">{Array.from({length:r.rating}).map((_,i)=><Star key={i} size={12} fill="currentColor"/>)}</div>
                <p className="text-sm text-ink-body mt-2">"{r.comment}"</p>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 bg-ok text-white text-xs py-2 rounded-lg font-fn font-medium flex items-center justify-center gap-1" data-testid={`approve-${r.id}`}><Check size={12}/> Approve</button>
                  <button className="flex-1 bg-err text-white text-xs py-2 rounded-lg font-fn font-medium flex items-center justify-center gap-1" data-testid={`reject-${r.id}`}><X size={12}/> Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OpsLayout>
  );
}

function Kpi({ icon: Icon, n, l, trend, up }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Icon size={16}/></div>
        {trend && <span className={`text-[10px] font-mono ${up?'text-ok':'text-ink-muted'}`}>{trend}</span>}
      </div>
      <div className="font-display text-3xl mt-4">{n}</div>
      <div className="label-eyebrow mt-1">{l}</div>
    </div>
  );
}

function BranchSelect({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button onClick={()=>setOpen(o=>!o)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border text-sm font-fn" data-testid="branch-selector">
        {value} <ChevronDown size={14}/>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-border shadow-lg overflow-hidden z-10 min-w-[180px]">
          {['Downtown','Riverside','Old Quarter','All branches'].map(b => (
            <button key={b} onClick={()=>{ onChange(b); setOpen(false); }} data-testid={`branch-${b.toLowerCase().replace(/\s+/g,'-')}`}
              className={`block w-full text-left px-4 py-2.5 text-sm font-fn hover:bg-cream-sub ${b===value?'text-primary':''}`}>{b}</button>
          ))}
        </div>
      )}
    </div>
  );
}
