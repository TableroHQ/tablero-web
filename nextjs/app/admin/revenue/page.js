'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import OpsLayout from '@/components/OpsLayout';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = { Stripe: '#C8553D', Cash: '#E4883A', Card: '#437E55', Mock: '#8A817C', PayPal: '#003087', REFUNDED: '#D14949' };
const STATUS_KEY = { PAID: 'stPAID', REFUNDED: 'stREFUNDED', PENDING: 'stPENDING' };

function rangeToDate(range) {
  const now = new Date();
  const from = new Date(now);
  if (range === '7d') from.setDate(now.getDate() - 7);
  else if (range === '30d') from.setDate(now.getDate() - 30);
  else if (range === '90d') from.setDate(now.getDate() - 90);
  else from.setFullYear(now.getFullYear(), 0, 1); // YTD
  return from.toISOString();
}

function aggregateByDay(payments) {
  const map = {};
  for (const p of payments) {
    if (p.status !== 'PAID') continue;
    const day = (p.paidAt || p.createdAt || '').split('T')[0];
    if (!day) continue;
    if (!map[day]) map[day] = {};
    const provider = p.provider || 'Other';
    map[day][provider] = (map[day][provider] || 0) + Number(p.amount || 0);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, byProvider]) => ({ day: day.slice(5), ...byProvider }));
}

function aggregateByProvider(payments) {
  const map = {};
  for (const p of payments) {
    if (p.status !== 'PAID') continue;
    const provider = p.provider || 'Other';
    map[provider] = (map[provider] || 0) + Number(p.amount || 0);
  }
  return Object.entries(map).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
    color: COLORS[name] || '#8A817C',
  }));
}

export default function RevenueReport() {
  const t = useTranslations('adminRevenue');
  const tc = useTranslations('common');
  const statusLabel = (s) => (STATUS_KEY[s] ? t(STATUS_KEY[s]) : s);
  const [{ user }] = useStore();
  const restaurantId = user.restaurantId;
  const [range, setRange] = React.useState('30d');
  const [payments, setPayments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!restaurantId) { setLoading(false); return; }
    setLoading(true);
    const params = { restaurantId, from: rangeToDate(range), pageSize: 200 };
    api.get('/api/payments', { params })
      .then(data => setPayments(Array.isArray(data) ? data : data?.items ?? []))
      .catch(() => toast.error(t('failedLoad')))
      .finally(() => setLoading(false));
  }, [range, restaurantId]);

  const paid = payments.filter(p => p.status === 'PAID');
  const gross = paid.reduce((s, p) => s + Number(p.amount || 0), 0);
  const refundedTotal = payments.filter(p => p.status === 'REFUNDED').reduce((s, p) => s + Number(p.amount || 0), 0);
  const net = gross - refundedTotal;
  const avgTicket = paid.length > 0 ? gross / paid.length : 0;

  const dailyData = aggregateByDay(payments);
  const breakdown = aggregateByProvider(payments);
  const providers = [...new Set(paid.map(p => p.provider || 'Other'))];

  return (
    <OpsLayout title={t('title')} subtitle={t('subtitle')}
      right={
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-border rounded-full p-1">
            {['7d', '30d', '90d', 'YTD'].map(r => (
              <button key={r} onClick={() => setRange(r)} data-testid={`range-${r}`}
                className={`px-3 py-1.5 text-xs font-mono rounded-full ${range === r ? 'bg-ink text-white' : 'text-ink-body'}`}>{r}</button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-fn" data-testid="export-csv">
            <Download size={14} /> {t('exportCsv')}
          </button>
        </div>
      }>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 size={24} className="animate-spin text-ink-muted" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi n={`$${gross.toFixed(0)}`} l={t('kpiGross')} />
            <Kpi n={`$${net.toFixed(0)}`} l={t('kpiNet')} />
            <Kpi n={String(paid.length)} l={t('kpiInvoices')} />
            <Kpi n={`$${avgTicket.toFixed(2)}`} l={t('kpiAvgTicket')} />
          </div>

          <div className="grid lg:grid-cols-3 gap-5 mt-5">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="label-eyebrow">{t('dailyRevenue')}</div>
                  <div className="font-display text-2xl mt-1">{t('lastRange', { range })}</div>
                </div>
                <div className="flex gap-3 flex-wrap text-xs font-mono">
                  {providers.map(p => (
                    <span key={p} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[p] || '#8A817C' }} />{p.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              {dailyData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-ink-muted text-sm">{t('noPaidRange')}</div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DF" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8A817C', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#8A817C' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E4DF', fontSize: 12 }} />
                      {providers.map(p => (
                        <Line key={p} type="monotone" dataKey={p} stroke={COLORS[p] || '#8A817C'} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="label-eyebrow">{t('paymentMix')}</div>
              {breakdown.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-ink-muted text-sm">{tc('noData')}</div>
              ) : (
                <>
                  <div className="h-[200px] mt-2">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                          {breakdown.map(e => <Cell key={e.name} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E4DF', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 space-y-2">
                    {breakdown.map(b => (
                      <div key={b.name} className="flex justify-between text-xs font-mono">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />{b.name}
                        </span>
                        <span>${b.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border mt-5 overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="label-eyebrow">{t('recentPayments')}</div>
              <span className="text-xs font-mono text-ink-muted">{t('transactions', { count: paid.length })}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream-sub/40 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                  <tr>
                    <th className="text-left p-3 pl-5">{t('thId')}</th>
                    <th className="text-left p-3">{t('thOrder')}</th>
                    <th className="text-left p-3">{t('thAmount')}</th>
                    <th className="text-left p-3">{t('thProvider')}</th>
                    <th className="text-left p-3">{t('thStatus')}</th>
                    <th className="text-right p-3 pr-5">{t('thDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 20).map(p => (
                    <tr key={p.id} className="border-t border-border" data-testid={`payment-${p.id}`}>
                      <td className="p-3 pl-5 font-mono text-xs text-ink-muted">{p.id?.slice(-8)}</td>
                      <td className="p-3 font-mono text-sm">{p.orderId?.slice(-8)}</td>
                      <td className="p-3 font-mono text-sm font-semibold">${Number(p.amount || 0).toFixed(2)}</td>
                      <td className="p-3 text-xs text-ink-muted">{p.provider}</td>
                      <td className="p-3">
                        <span className={`chip ${p.status === 'PAID' ? 'bg-ok-bg text-ok' : p.status === 'REFUNDED' ? 'bg-err-bg text-err' : 'bg-warn-bg text-warn'}`}>{statusLabel(p.status)}</span>
                      </td>
                      <td className="p-3 pr-5 text-right font-mono text-xs text-ink-muted">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr><td colSpan={6} className="p-10 text-center text-ink-muted">{t('noPaymentsRange')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </OpsLayout>
  );
}

function Kpi({ n, l }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="font-display text-3xl">{n}</div>
      <div className="label-eyebrow mt-1">{l}</div>
    </div>
  );
}
