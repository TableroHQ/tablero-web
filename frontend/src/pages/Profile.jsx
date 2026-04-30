import React from 'react';
import { useStore } from '@/lib/store';
import { User, Mail, Phone, AtSign, Shield, Camera, LogOut, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Profile() {
  const [, s] = useStore();
  const { user } = s.get();
  const [draft, setDraft] = React.useState({ name: user.name, email: user.email, username: user.username, phone: user.phone });

  const save = () => { s.updateUser(draft); toast.success('Profile updated'); };

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow">Profile</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">Your account.</h1>

      <div className="grid lg:grid-cols-3 gap-6 mt-10">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Identity">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display text-3xl">{user.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                <button className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-ink text-white flex items-center justify-center" data-testid="change-avatar"><Camera size={14}/></button>
              </div>
              <div>
                <div className="font-display text-2xl">{user.name}</div>
                <div className="text-sm text-ink-muted font-mono mt-1">{user.role} · id {user.id}</div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <Field icon={User} label="Full name" value={draft.name} onChange={v=>setDraft(d=>({...d, name:v}))} testid="profile-name"/>
              <Field icon={AtSign} label="Username" value={draft.username} onChange={v=>setDraft(d=>({...d, username:v}))} testid="profile-username"/>
              <Field icon={Mail} label="Email" value={draft.email} onChange={v=>setDraft(d=>({...d, email:v}))} testid="profile-email"/>
              <Field icon={Phone} label="Phone" value={draft.phone} onChange={v=>setDraft(d=>({...d, phone:v}))} testid="profile-phone"/>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={save} className="btn-primary" data-testid="save-profile">Save changes</button>
              <Link to="/login" className="btn-outline inline-flex items-center gap-2" data-testid="reset-password-link"><Shield size={14}/> Reset password</Link>
            </div>
          </Card>

          <Card title="Security">
            <div className="grid sm:grid-cols-2 gap-4">
              <Info label="Last sign-in" value="Today · 12:14 · Safari/macOS"/>
              <Info label="Sessions" value="2 active devices"/>
              <Info label="JWT rotation" value="Every 15 minutes"/>
              <Info label="Refresh token" value="Expires in 6d 18h"/>
            </div>
          </Card>

          <Card title="Danger zone" tone="err">
            <div className="flex flex-wrap gap-3">
              <button className="px-5 py-2.5 rounded-full bg-cream-sub text-ink font-fn inline-flex items-center gap-2" data-testid="logout"><LogOut size={14}/> Sign out everywhere</button>
              <button className="px-5 py-2.5 rounded-full bg-err-bg text-err font-fn inline-flex items-center gap-2" data-testid="delete-account"><Trash2 size={14}/> Delete my account</button>
            </div>
          </Card>
        </div>

        <aside>
          <div className="bg-ink text-cream rounded-3xl p-6">
            <div className="label-eyebrow !text-cream/60">Wallet</div>
            <div className="font-display text-5xl mt-2">${user.balance.toFixed(2)}</div>
            <div className="text-xs font-mono text-cream/60 mt-1">AVAILABLE · HELD ${user.heldBalance.toFixed(2)}</div>
            <Link to="/topup" className="mt-4 w-full block text-center py-3 rounded-full bg-primary text-white font-fn font-medium" data-testid="topup-link">Top up</Link>
          </div>
          <div className="bg-white rounded-3xl border border-border p-6 mt-4">
            <div className="label-eyebrow">Loyalty</div>
            <div className="font-display text-4xl mt-2">{user.loyaltyPoints.toLocaleString()}</div>
            <div className="text-xs font-mono text-ink-muted">POINTS</div>
            <Link to="/loyalty" className="mt-3 block text-sm text-primary font-fn">Browse rewards →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, children, tone }) {
  return (
    <div className={`bg-white rounded-3xl border p-6 md:p-7 ${tone==='err'?'border-err/30':'border-border'}`}>
      <div className={`label-eyebrow mb-5 ${tone==='err'?'!text-err':''}`}>{title}</div>
      {children}
    </div>
  );
}
function Field({ icon: Icon, label, value, onChange, testid }) {
  return (
    <label className="block" data-testid={testid}>
      <span className="label-eyebrow">{label}</span>
      <div className="mt-2 relative">
        <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"/>
        <input value={value} onChange={e=>onChange(e.target.value)} className="w-full bg-cream-sub rounded-xl pl-11 pr-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary"/>
      </div>
    </label>
  );
}
function Info({ label, value }) {
  return <div className="p-4 rounded-2xl bg-cream-sub/50"><div className="label-eyebrow !text-[9px]">{label}</div><div className="font-fn text-sm mt-1">{value}</div></div>;
}
