import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Calendar, Filter } from 'lucide-react';

const DATA = Array.from({length:30}).map((_,i)=>({
  day: `${i+1}`, card: 2200 + Math.sin(i/3)*800 + Math.random()*500, cash: 900 + Math.cos(i/4)*300 + Math.random()*200, balance: 600 + Math.random()*250,
}));

const BREAKDOWN = [
  { name: 'Card · Stripe', value: 58420, color: '#C8553D' },
  { name: 'Cash', value: 22150, color: '#E4883A' },
  { name: 'Account balance', value: 11300, color: '#437E55' },
  { name: 'Refunded', value: 2120, color: '#D14949' },
];

export default function RevenueReport() {
  const [range, setRange] = React.useState('30d');
  return (
    <OpsLayout title="Revenue report" subtitle="Admin · payment methods · date range"
      right={
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-border rounded-full p-1">
            {['7d','30d','90d','YTD'].map(r=>(
              <button key={r} onClick={()=>setRange(r)} data-testid={`range-${r}`}
                className={`px-3 py-1.5 text-xs font-mono rounded-full ${range===r?'bg-ink text-white':'text-ink-body'}`}>{r}</button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-fn" data-testid="export-csv"><Download size={14}/> Export CSV</button>
        </div>
      }>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi n="$93,990" l="Gross revenue"/>
        <Kpi n="$91,870" l="Net (after refunds)"/>
        <Kpi n="1,284" l="Invoices paid"/>
        <Kpi n="$71.50" l="Avg ticket size"/>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div><div className="label-eyebrow">Daily revenue</div><div className="font-display text-2xl mt-1">Last {range}</div></div>
            <div className="flex gap-3 text-xs font-mono">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary"/>CARD</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary"/>CASH</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-ok"/>BALANCE</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer>
              <LineChart data={DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DF"/>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8A817C', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#8A817C' }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #E8E4DF', fontSize:12 }}/>
                <Line type="monotone" dataKey="card" stroke="#C8553D" strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="cash" stroke="#E4883A" strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="balance" stroke="#437E55" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="label-eyebrow">Payment mix</div>
          <div className="h-[260px] mt-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={BREAKDOWN} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {BREAKDOWN.map(e => <Cell key={e.name} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #E8E4DF', fontSize:12 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {BREAKDOWN.map(b=>(
              <div key={b.name} className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{background:b.color}}/>{b.name}</span>
                <span>${b.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border mt-5 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="label-eyebrow">Top performing items</div>
          <button className="text-xs font-mono text-primary" data-testid="filter-items">Filter</button>
        </div>
        <table className="w-full">
          <thead className="bg-cream-sub/40 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
            <tr><th className="text-left p-3 pl-5">Item</th><th className="text-left p-3">Units</th><th className="text-left p-3">Revenue</th><th className="text-left p-3">Avg. rating</th><th className="text-right p-3 pr-5">% of total</th></tr>
          </thead>
          <tbody>
            {[
              ['Smokehouse Burger', 412, 7622, 4.7, 18.6],
              ['Truffle Tagliatelle', 289, 6936, 4.9, 16.9],
              ['Buddha Bowl', 354, 5133, 4.6, 12.5],
              ['Bitter Chocolate Cake', 521, 4689, 4.8, 11.4],
              ['Burrata & Heirloom', 198, 3168, 4.5, 7.7],
            ].map(([name, units, rev, r, p]) => (
              <tr key={name} className="border-t border-border" data-testid={`top-${name}`}>
                <td className="p-3 pl-5 font-fn font-medium">{name}</td>
                <td className="p-3 font-mono text-sm">{units}</td>
                <td className="p-3 font-mono text-sm">${rev.toLocaleString()}</td>
                <td className="p-3 font-mono text-sm text-secondary">★ {r}</td>
                <td className="p-3 pr-5 text-right font-mono text-sm">{p}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OpsLayout>
  );
}

function Kpi({ n, l }) {
  return <div className="bg-white rounded-2xl border border-border p-5"><div className="font-display text-3xl">{n}</div><div className="label-eyebrow mt-1">{l}</div></div>;
}
