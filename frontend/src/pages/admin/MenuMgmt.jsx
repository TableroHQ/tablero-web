import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { MENU } from '@/lib/mock';
import { Plus, Edit3, Trash2, EyeOff, Eye, Search, X } from 'lucide-react';
import { toast } from 'sonner';

export default function MenuMgmt() {
  const [items, setItems] = React.useState(MENU.map(m => ({ ...m })));
  const [editing, setEditing] = React.useState(null);
  const [q, setQ] = React.useState('');

  const toggle86 = (id) => {
    setItems(it => it.map(i => i.id===id ? { ...i, available: !i.available } : i));
    toast.success('Menu updated · event menu.item.unavailable emitted');
  };
  const remove = (id) => { setItems(it => it.filter(i=>i.id!==id)); toast.success('Item deleted'); };
  const save = (data) => {
    if (data.id) setItems(it => it.map(i => i.id===data.id?data:i));
    else setItems(it => [...it, { ...data, id: `m_${Date.now()}`, available: true }]);
    setEditing(null);
    toast.success(data.id ? 'Item updated' : 'Item created');
  };

  const list = items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <OpsLayout title="Menu management" subtitle="Admin · Downtown · canonical menu"
      right={<button onClick={()=>setEditing({})} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-fn font-medium" data-testid="new-item"><Plus size={14}/> New item</button>}>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="flex items-center gap-2 bg-cream-sub rounded-full px-4 py-2 flex-1 max-w-md">
            <Search size={14} className="text-ink-muted"/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search menu" className="bg-transparent outline-none flex-1 text-sm" data-testid="menu-search"/>
          </div>
          <div className="text-xs font-mono text-ink-muted">{list.length} ITEMS · {items.filter(i=>!i.available).length} 86'd</div>
        </div>
        <table className="w-full">
          <thead className="bg-cream-sub/40 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
            <tr><th className="text-left p-3 pl-5">Item</th><th className="text-left p-3">Category</th><th className="text-left p-3">Price</th><th className="text-left p-3">Allergens</th><th className="text-left p-3">Status</th><th className="text-right p-3 pr-5">Actions</th></tr>
          </thead>
          <tbody>
            {list.map(m => (
              <tr key={m.id} className="border-t border-border" data-testid={`menu-row-${m.id}`}>
                <td className="p-3 pl-5">
                  <div className="flex items-center gap-3">
                    <img src={m.img} alt="" className="h-10 w-10 rounded-lg object-cover"/>
                    <div>
                      <div className="font-fn font-medium">{m.name}</div>
                      <div className="text-xs text-ink-muted truncate max-w-[260px]">{m.desc}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-sm">{m.cat}</td>
                <td className="p-3 font-mono text-sm">${m.price.toFixed(2)}</td>
                <td className="p-3">
                  <div className="flex gap-1 flex-wrap">{m.allergens.map(a=><span key={a} className="text-[9px] font-mono uppercase bg-cream-sub px-1.5 py-0.5 rounded text-ink-muted">{a}</span>)}</div>
                </td>
                <td className="p-3"><span className={`chip ${m.available?'bg-ok-bg text-ok':'bg-err-bg text-err'}`}>{m.available?'AVAILABLE':"86'd"}</span></td>
                <td className="p-3 pr-5 text-right">
                  <button onClick={()=>toggle86(m.id)} className="p-2 rounded-lg hover:bg-cream-sub" data-testid={`toggle-${m.id}`}>
                    {m.available ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                  <button onClick={()=>setEditing(m)} className="p-2 rounded-lg hover:bg-cream-sub" data-testid={`edit-${m.id}`}><Edit3 size={14}/></button>
                  <button onClick={()=>remove(m.id)} className="p-2 rounded-lg hover:bg-err-bg text-ink-muted hover:text-err" data-testid={`delete-${m.id}`}><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && <EditModal item={editing} onClose={()=>setEditing(null)} onSave={save}/>}
    </OpsLayout>
  );
}

function EditModal({ item, onClose, onSave }) {
  const [form, setForm] = React.useState({ name: '', cat: 'Mains', price: 10, desc: '', allergens: [], img: '', ...item });
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-xl p-6 md:p-8" onClick={e=>e.stopPropagation()} data-testid="menu-modal">
        <div className="flex justify-between items-start mb-5">
          <h2 className="font-display text-3xl">{form.id ? 'Edit item' : 'New menu item'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-cream-sub" data-testid="modal-close"><X size={18}/></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Name" value={form.name} onChange={v=>setForm(f=>({...f, name:v}))} full testid="modal-name"/>
          <Input label="Category" value={form.cat} onChange={v=>setForm(f=>({...f, cat:v}))} testid="modal-cat"/>
          <Input label="Price ($)" type="number" value={form.price} onChange={v=>setForm(f=>({...f, price: Number(v)}))} testid="modal-price"/>
          <Input label="Image URL" value={form.img} onChange={v=>setForm(f=>({...f, img:v}))} full testid="modal-img"/>
          <Textarea label="Description" value={form.desc} onChange={v=>setForm(f=>({...f, desc:v}))} full testid="modal-desc"/>
          <Input label="Allergens (comma)" value={(form.allergens||[]).join(', ')} onChange={v=>setForm(f=>({...f, allergens: v.split(',').map(s=>s.trim()).filter(Boolean)}))} full testid="modal-allergens"/>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-outline" data-testid="modal-cancel">Cancel</button>
          <button onClick={()=>onSave(form)} className="btn-primary" data-testid="modal-save">Save</button>
        </div>
      </div>
    </div>
  );
}
function Input({ label, value, onChange, type='text', full, testid }) {
  return <label className={full?'col-span-2':''} data-testid={testid}><span className="label-eyebrow">{label}</span>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary"/>
  </label>;
}
function Textarea({ label, value, onChange, full, testid }) {
  return <label className={full?'col-span-2':''} data-testid={testid}><span className="label-eyebrow">{label}</span>
    <textarea value={value} onChange={e=>onChange(e.target.value)} rows={3} className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary"/>
  </label>;
}
