import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { STAFF } from '@/lib/mock';
import { Plus, UserPlus, Ban, RotateCcw, Search, X, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffMgmt() {
  const [staff, setStaff] = React.useState(STAFF.map(s=>({...s})));
  const [q, setQ] = React.useState('');
  const [role, setRole] = React.useState('all');
  const [invite, setInvite] = React.useState(false);

  const list = staff.filter(s => (role==='all' || s.role===role) && s.name.toLowerCase().includes(q.toLowerCase()));

  const suspend = (id) => {
    setStaff(s => s.map(x=>x.id===id?{...x, status:x.status==='On shift'||x.status==='Off'?'Suspended':'On shift'}:x));
    toast.success('Account status updated');
  };
  const changeRole = (id, newRole) => { setStaff(s => s.map(x=>x.id===id?{...x, role:newRole}:x)); toast.success('Role updated'); };
  const addStaff = (data) => {
    setStaff(s => [...s, { ...data, id:`s_${Date.now()}`, status:'On shift' }]);
    toast.success('Invitation sent to ' + data.email);
    setInvite(false);
  };

  return (
    <OpsLayout title="Staff management" subtitle="Admin · hire, assign roles, suspend accounts"
      right={<button onClick={()=>setInvite(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-fn font-medium" data-testid="invite-staff"><UserPlus size={14}/> Invite staff</button>}>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-cream-sub rounded-full px-4 py-2 flex-1 max-w-md min-w-[200px]">
            <Search size={14} className="text-ink-muted"/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search staff" className="bg-transparent outline-none flex-1 text-sm" data-testid="staff-search"/>
          </div>
          <div className="flex gap-2">
            {['all','Waiter','Chef','Cashier','Courier'].map(r => (
              <button key={r} onClick={()=>setRole(r)} data-testid={`role-filter-${r.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-full text-xs font-fn ${role===r?'bg-ink text-white':'bg-cream-sub text-ink-body'}`}>{r==='all'?'All':r}</button>
            ))}
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-cream-sub/40 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
            <tr><th className="text-left p-3 pl-5">Name</th><th className="text-left p-3">Role</th><th className="text-left p-3">Branch</th><th className="text-left p-3">Status</th><th className="text-right p-3 pr-5">Actions</th></tr>
          </thead>
          <tbody>
            {list.map(m => (
              <tr key={m.id} className="border-t border-border" data-testid={`staff-row-${m.id}`}>
                <td className="p-3 pl-5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                    <div>
                      <div className="font-fn font-medium">{m.name}</div>
                      <div className="text-xs font-mono text-ink-muted">{m.id}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <select value={m.role} onChange={e=>changeRole(m.id, e.target.value)} data-testid={`role-${m.id}`}
                    className="text-xs font-fn bg-cream-sub rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-primary">
                    {['Waiter','Chef','Cashier','Courier','Admin'].map(r=><option key={r}>{r}</option>)}
                  </select>
                </td>
                <td className="p-3 text-sm">{m.branch}</td>
                <td className="p-3"><span className={`chip ${m.status==='On shift'?'bg-ok-bg text-ok':m.status==='Suspended'?'bg-err-bg text-err':'bg-cream-sub text-ink-muted'}`}>{m.status}</span></td>
                <td className="p-3 pr-5 text-right">
                  <button onClick={()=>suspend(m.id)} className="p-2 rounded-lg hover:bg-cream-sub" title="Suspend/reactivate" data-testid={`suspend-${m.id}`}>
                    {m.status==='Suspended' ? <RotateCcw size={14}/> : <Ban size={14}/>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invite && <InviteModal onClose={()=>setInvite(false)} onSave={addStaff}/>}
    </OpsLayout>
  );
}

function InviteModal({ onClose, onSave }) {
  const [form, setForm] = React.useState({ name:'', email:'', role:'Waiter', branch:'Downtown' });
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md p-7" onClick={e=>e.stopPropagation()} data-testid="invite-modal">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="label-eyebrow">Invite staff</div>
            <h2 className="font-display text-2xl mt-1">New team member</h2>
          </div>
          <button onClick={onClose} className="p-2" data-testid="invite-close"><X size={18}/></button>
        </div>
        <div className="space-y-4">
          <L label="Full name" testid="invite-name"><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="inp" placeholder="Maya Holloway"/></L>
          <L label="Email" testid="invite-email"><input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="inp" placeholder="maya@bite.com"/></L>
          <div className="grid grid-cols-2 gap-3">
            <L label="Role" testid="invite-role">
              <select value={form.role} onChange={e=>setForm(f=>({...f, role:e.target.value}))} className="inp">
                {['Waiter','Chef','Cashier','Courier','Admin'].map(r=><option key={r}>{r}</option>)}
              </select>
            </L>
            <L label="Branch" testid="invite-branch">
              <select value={form.branch} onChange={e=>setForm(f=>({...f, branch:e.target.value}))} className="inp">
                {['Downtown','Riverside','Old Quarter'].map(b=><option key={b}>{b}</option>)}
              </select>
            </L>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-outline" data-testid="invite-cancel">Cancel</button>
          <button onClick={()=>onSave(form)} className="btn-primary inline-flex items-center gap-2" data-testid="invite-send"><Mail size={14}/> Send invite</button>
        </div>
        <style>{`.inp{width:100%;background:hsl(30 20% 95%);border-radius:12px;padding:12px 16px;font-family:Figtree,sans-serif;font-size:14px;outline:none}.inp:focus{box-shadow:0 0 0 3px hsl(var(--primary) / 0.2)}`}</style>
      </div>
    </div>
  );
}
function L({ label, children, testid }) { return <label data-testid={testid}><span className="label-eyebrow">{label}</span><div className="mt-2">{children}</div></label>; }
