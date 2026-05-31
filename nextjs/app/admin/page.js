'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import OpsLayout from '@/components/OpsLayout';
import { SALES_DATA } from '@/lib/mock';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { TrendingUp, Euro, Users, Star, Check, X, ChevronDown, Loader2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Admin() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const [{ user }] = useStore();
  const restaurantId = user.restaurantId;
  const [branch, setBranch] = React.useState('Downtown');

  const [stats, setStats] = React.useState({ revenue: null, orders: null, staff: null });
  const [staffList, setStaffList] = React.useState([]);
  const [rawPayments, setRawPayments] = React.useState([]);
  const [reviews, setReviews] = React.useState([]);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [loadingReviews, setLoadingReviews] = React.useState(true);

  React.useEffect(() => {
    if (!restaurantId) { setLoadingStats(false); return; }
    Promise.allSettled([
      api.get('/api/payments'),
      api.get(`/api/restaurants/${restaurantId}/orders`),
      api.get('/api/users'),
    ]).then(([paymentsRes, ordersRes, usersRes]) => {
      const payments = paymentsRes.status === 'fulfilled'
        ? (Array.isArray(paymentsRes.value) ? paymentsRes.value : paymentsRes.value?.items ?? [])
        : [];
      const orders = ordersRes.status === 'fulfilled'
        ? (Array.isArray(ordersRes.value) ? ordersRes.value : ordersRes.value?.items ?? [])
        : [];
      const users = usersRes.status === 'fulfilled'
        ? (Array.isArray(usersRes.value) ? usersRes.value : usersRes.value?.items ?? [])
        : [];

      const revenue = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount || 0), 0);
      setRawPayments(payments);
      setStats({
        revenue: `$${revenue.toFixed(0)}`,
        orders: String(orders.length),
        staff: String(users.filter(u => u.role !== 'USER' && u.role !== 'CUSTOMER').length),
      });
      setStaffList(users.filter(u => u.role !== 'USER' && u.role !== 'CUSTOMER').slice(0, 6));
    }).finally(() => setLoadingStats(false));
  }, [restaurantId]);

  React.useEffect(() => {
    if (!restaurantId) { setLoadingReviews(false); return; }
    api.get(`/api/restaurants/${restaurantId}/reviews`, { params: { status: 'PENDING', pageSize: 20 } })
      .then(data => {
        const list = Array.isArray(data) ? data : data?.items ?? [];
        setReviews(list);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [restaurantId]);

  const chartData = React.useMemo(() => {
    const paid = rawPayments.filter(p => p.status === 'PAID');
    if (paid.length === 0) return SALES_DATA;
    const revenueByDay = {};
    const ordersByDay = {};
    paid.forEach(p => {
      const d = new Date(p.createdAt || p.paidAt || p.updatedAt);
      const day = d.toLocaleDateString('en-US', { weekday: 'short' });
      revenueByDay[day] = (revenueByDay[day] || 0) + Number(p.amount || 0);
      ordersByDay[day] = (ordersByDay[day] || 0) + 1;
    });
    return WEEK_DAYS.map(day => ({
      day,
      revenue: Math.round(revenueByDay[day] || 0),
      orders: ordersByDay[day] || 0,
    }));
  }, [rawPayments]);

  const moderateReview = async (id, action) => {
    try {
      if (action === 'approve') {
        await api.patch(`/api/reviews/${id}/publish`, {});
      } else {
        await api.delete(`/api/reviews/${id}`);
      }
      setReviews(rv => rv.filter(r => r.id !== id));
      toast.success(action === 'approve' ? t('reviewApproved') : t('reviewRejected'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('couldNotModerate'));
    }
  };

  return (
    <OpsLayout title={t('title')} subtitle={t('subtitle')}
      right={<BranchSelect value={branch} onChange={setBranch} />}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Euro} n={loadingStats ? '…' : (stats.revenue ?? '—')} l={t('revenueLabel')} />
        <Kpi icon={TrendingUp} n={loadingStats ? '…' : (stats.orders ?? '—')} l={t('ordersLabel')} />
        <Kpi icon={Users} n={loadingStats ? '…' : (stats.staff ?? '—')} l={t('staffLabel')} />
        <Kpi icon={Star} n="4.74" l={t('ratingLabel')} trend="+0.06" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5">
          <div className="flex justify-between items-center">
            <div>
              <div className="label-eyebrow">{t('revenueEyebrow')}</div>
              <div className="font-display text-2xl mt-1">{t('last7Days')}</div>
            </div>
            <div className="flex gap-2 text-xs font-mono">
              <span className="px-3 py-1 rounded-full bg-primary text-white">{t('revenueTab')}</span>
              <span className="px-3 py-1 rounded-full bg-cream-sub text-ink-muted">{t('ordersTab')}</span>
            </div>
          </div>
          <div className="h-[280px] mt-4">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C8553D" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#C8553D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DF" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8A817C', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8A817C' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E4DF', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#C8553D" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="label-eyebrow">{t('ordersByDay')}</div>
          <div className="h-[280px] mt-4">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8A817C' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E4DF', fontSize: 12 }} />
                <Bar dataKey="orders" fill="#E4883A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-border">
            <div>
              <div className="label-eyebrow">{t('staffRoster')}</div>
              <div className="font-display text-2xl mt-1">{t('todaysShift')}</div>
            </div>
            <button className="text-xs font-mono text-primary uppercase tracking-widest" data-testid="manage-staff">{t('manage')}</button>
          </div>
          <table className="w-full">
            <thead className="bg-cream-sub/50">
              <tr className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                <th className="text-left p-3 pl-5">{t('colName')}</th>
                <th className="text-left p-3">{t('colRole')}</th>
                <th className="text-left p-3">{t('colBranch')}</th>
                <th className="text-left p-3 pr-5">{t('colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingStats ? (
                <tr><td colSpan={4} className="p-6 text-center"><Loader2 size={18} className="animate-spin text-ink-muted inline-block" /></td></tr>
              ) : staffList.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-sm text-ink-muted">{t('noStaff')}</td></tr>
              ) : staffList.map(s => (
                <tr key={s.id} className="border-t border-border" data-testid={`staff-${s.id}`}>
                  <td className="p-3 pl-5 font-fn font-medium">{s.name || s.username || '—'}</td>
                  <td className="p-3 text-sm">{s.role}</td>
                  <td className="p-3 text-sm text-ink-muted">—</td>
                  <td className="p-3 pr-5">
                    <span className={`chip ${s.status === 'SUSPENDED' ? 'bg-err-bg text-err' : 'bg-ok-bg text-ok'}`}>{s.status === 'SUSPENDED' ? tc('suspended') : tc('active')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-eyebrow">{t('reviewsModeration')}</div>
              <div className="font-display text-2xl mt-1">{t('pending')} · {loadingReviews ? '…' : reviews.length}</div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {loadingReviews ? (
              <div className="py-4 flex justify-center"><Loader2 size={18} className="animate-spin text-ink-muted" /></div>
            ) : reviews.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink-muted">{t('noReviewsPending')}</div>
            ) : reviews.map(r => (
              <div key={r.id} className="p-4 rounded-xl bg-cream-sub/40 border border-border" data-testid={`mod-${r.id}`}>
                <div className="flex justify-between">
                  <span className="font-fn font-semibold">{r.author || r.authorName || r.userName || '—'}</span>
                  <span className="font-mono text-xs text-ink-muted">{r.date || r.createdAt?.slice(0, 10) || '—'}</span>
                </div>
                <div className="flex gap-0.5 text-secondary mt-1">
                  {Array.from({ length: r.rating || 0 }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                </div>
                <p className="text-sm text-ink-body mt-2">"{r.comment || r.content || r.body}"</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => moderateReview(r.id, 'approve')} className="flex-1 bg-ok text-white text-xs py-2 rounded-lg font-fn font-medium flex items-center justify-center gap-1" data-testid={`approve-${r.id}`}>
                    <Check size={12} /> {t('approve')}
                  </button>
                  <button onClick={() => moderateReview(r.id, 'reject')} className="flex-1 bg-err text-white text-xs py-2 rounded-lg font-fn font-medium flex items-center justify-center gap-1" data-testid={`reject-${r.id}`}>
                    <X size={12} /> {t('reject')}
                  </button>
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
        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Icon size={16} /></div>
        {trend && <span className={`text-[10px] font-mono ${up ? 'text-ok' : 'text-ink-muted'}`}>{trend}</span>}
      </div>
      <div className="font-display text-3xl mt-4">{n}</div>
      <div className="label-eyebrow mt-1">{l}</div>
    </div>
  );
}

function BranchSelect({ value, onChange }) {
  const t = useTranslations('admin');
  const [open, setOpen] = React.useState(false);
  const label = (b) => (b === 'All branches' ? t('allBranches') : b);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border text-sm font-fn" data-testid="branch-selector">
        {label(value)} <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-border shadow-lg overflow-hidden z-10 min-w-[180px]">
          {['Downtown', 'Riverside', 'Old Quarter', 'All branches'].map(b => (
            <button key={b} onClick={() => { onChange(b); setOpen(false); }} data-testid={`branch-${b.toLowerCase().replace(/\s+/g, '-')}`}
              className={`block w-full text-left px-4 py-2.5 text-sm font-fn hover:bg-cream-sub ${b === value ? 'text-primary' : ''}`}>{label(b)}</button>
          ))}
        </div>
      )}
    </div>
  );
}
