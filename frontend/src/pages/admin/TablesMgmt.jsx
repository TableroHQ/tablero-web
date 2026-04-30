import React from 'react';
import OpsLayout from '@/components/OpsLayout';
import { TABLES } from '@/lib/mock';
import { Plus, RefreshCw, Trash2, QrCode, X } from 'lucide-react';
import { toast } from 'sonner';

export default function TablesMgmt() {
  const [tables, setTables] = React.useState(TABLES.map(t=>({...t})));
  const [selected, setSelected] = React.useState(null);
  const [qr, setQr] = React.useState(null);

  const addTable = () => {
    const id = `T-${String(tables.length+1).padStart(2,'0')}`;
    setTables(t => [...t, { id, zone: 'Indoor', seats: 2, status: 'EMPTY', total: 0 }]);
    toast.success(`Table ${id} added`);
  };
  const regenQr = (t) => { setQr(t); toast.success(`QR regenerated for ${t.id}`); };
  const remove = (id) => { setTables(t => t.filter(x=>x.id!==id)); toast.success('Table removed'); };

  return (
    <OpsLayout title="Tables & QR codes" subtitle="Admin · floor layout · QR per table"
      right={<button onClick={addTable} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-fn font-medium" data-testid="add-table"><Plus size={14}/> Add table</button>}>
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="label-eyebrow mb-4">Floor plan</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {tables.map(t => {
                const sel = selected?.id===t.id;
                return (
                  <button key={t.id} onClick={()=>setSelected(t)} data-testid={`table-${t.id}`}
                    className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition ${sel?'border-primary bg-primary/10':'border-border bg-white hover:border-ink/30'}`}>
                    <span className="font-display text-2xl">{t.id}</span>
                    <span className="text-[10px] font-mono text-ink-muted mt-1">{t.zone} · {t.seats}pax</span>
                    <QrCode size={14} className="text-ink-muted mt-2"/>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4">
          {selected ? (
            <div className="bg-white rounded-2xl border border-border p-6 sticky top-[88px]">
              <div className="label-eyebrow">Selected</div>
              <div className="font-display text-4xl mt-1">{selected.id}</div>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <Info label="Zone" value={selected.zone}/>
                <Info label="Seats" value={selected.seats}/>
                <Info label="Status" value={selected.status.replace('_',' ')}/>
                <Info label="Current bill" value={selected.total?`$${selected.total.toFixed(2)}`:'—'}/>
              </div>
              <div className="mt-5 space-y-2">
                <button onClick={()=>regenQr(selected)} className="w-full py-3 rounded-xl bg-ink text-white font-fn inline-flex items-center justify-center gap-2" data-testid={`regen-${selected.id}`}><RefreshCw size={14}/> Regenerate QR</button>
                <button onClick={()=>remove(selected.id)} className="w-full py-3 rounded-xl bg-err-bg text-err font-fn inline-flex items-center justify-center gap-2" data-testid={`remove-${selected.id}`}><Trash2 size={14}/> Remove table</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border p-10 text-center text-ink-muted sticky top-[88px]">
              Select a table to manage it
            </div>
          )}
        </aside>
      </div>

      {qr && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setQr(null)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md text-center" onClick={e=>e.stopPropagation()} data-testid="qr-modal">
            <div className="flex justify-between items-center mb-5">
              <div className="label-eyebrow">New QR · {qr.id}</div>
              <button onClick={()=>setQr(null)} className="p-2" data-testid="qr-close"><X size={18}/></button>
            </div>
            <div className="aspect-square max-w-xs mx-auto rounded-2xl bg-ink p-6">
              <div className="h-full w-full [background:repeating-linear-gradient(45deg,#FAFAF8_0_8px,#1C1917_8px_10px),repeating-linear-gradient(-45deg,#FAFAF8_0_6px,#1C1917_6px_8px)] bg-blend-multiply rounded-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1/4 h-1/4 bg-ink p-2"><div className="h-full w-full bg-cream rounded-sm p-1"><div className="h-full w-full bg-ink"/></div></div>
                <div className="absolute top-0 right-0 w-1/4 h-1/4 bg-ink p-2"><div className="h-full w-full bg-cream rounded-sm p-1"><div className="h-full w-full bg-ink"/></div></div>
                <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-ink p-2"><div className="h-full w-full bg-cream rounded-sm p-1"><div className="h-full w-full bg-ink"/></div></div>
              </div>
            </div>
            <div className="mt-5 font-mono text-xs text-ink-muted uppercase tracking-widest">bite.com/qr?t={qr.id.toLowerCase()}</div>
            <div className="flex gap-3 mt-5">
              <button className="btn-outline flex-1" data-testid="qr-download-png">Download PNG</button>
              <button className="btn-primary flex-1" data-testid="qr-download-svg">Download SVG</button>
            </div>
          </div>
        </div>
      )}
    </OpsLayout>
  );
}

function Info({ label, value }) {
  return <div className="p-3 rounded-xl bg-cream-sub/60"><div className="label-eyebrow !text-[9px]">{label}</div><div className="font-fn text-sm mt-1">{value}</div></div>;
}
