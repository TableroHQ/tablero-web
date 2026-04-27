import React from 'react';
import { Calendar, Users, Check } from 'lucide-react';
import { TIME_SLOTS } from '@/lib/mock';

export default function Reservations() {
  const [date, setDate] = React.useState(15);
  const [slot, setSlot] = React.useState('19:30');
  const [party, setParty] = React.useState(2);
  const [zone, setZone] = React.useState('Indoor');
  const [table, setTable] = React.useState('T-04');
  const days = Array.from({length: 14}, (_, i) => i + 1);

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow">Reserve</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">Pick your moment.</h1>
      <p className="mt-3 text-ink-body max-w-xl">Confirmed instantly. Pre-order with the booking and we'll start cooking the moment you sit down.</p>

      <div className="grid lg:grid-cols-12 gap-6 mt-12">
        <div className="lg:col-span-8 space-y-6">
          <Card title="Date" icon={Calendar}>
            <div className="grid grid-cols-7 gap-2 mt-4">
              {days.map(d => (
                <button key={d} onClick={()=>setDate(d)} data-testid={`date-${d}`}
                  className={`py-3 rounded-xl border text-sm font-mono transition ${date===d?'bg-primary text-white border-primary':'border-border bg-white hover:border-ink/30'}`}>
                  <div className="text-[9px] tracking-widest opacity-70">FEB</div>
                  <div className="font-bold text-base">{d}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Time">
            <div className="flex flex-wrap gap-2 mt-4">
              {TIME_SLOTS.map(s => (
                <button key={s} onClick={()=>setSlot(s)} data-testid={`slot-${s}`}
                  className={`px-4 py-2 rounded-full font-mono text-sm transition ${slot===s?'bg-ink text-white':'bg-white border border-border hover:border-ink/30'}`}>
                  {s}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Party" icon={Users}>
            <div className="flex items-center gap-4 mt-4">
              <button onClick={()=>setParty(Math.max(1,party-1))} className="h-12 w-12 rounded-full bg-cream-sub text-xl" data-testid="party-minus">−</button>
              <div className="font-display text-5xl text-ink min-w-[80px] text-center" data-testid="party-count">{party}</div>
              <button onClick={()=>setParty(Math.min(12,party+1))} className="h-12 w-12 rounded-full bg-cream-sub text-xl" data-testid="party-plus">+</button>
              <span className="ml-4 text-ink-body text-sm">{party===1?'guest':'guests'}</span>
            </div>
          </Card>

          <Card title="Zone & table">
            <div className="flex gap-2 mt-4 flex-wrap">
              {['Indoor', 'Terrace', 'Bar', 'Outdoor'].map(z => (
                <button key={z} onClick={()=>setZone(z)} data-testid={`zone-${z}`}
                  className={`px-4 py-2 rounded-full text-sm font-fn ${zone===z?'bg-secondary text-white':'bg-white border border-border'}`}>
                  {z}
                </button>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-4 sm:grid-cols-6 gap-3">
              {Array.from({length:12}).map((_,i)=> {
                const id = `T-${String(i+1).padStart(2,'0')}`;
                const taken = i % 5 === 2;
                return (
                  <button key={id} disabled={taken} onClick={()=>setTable(id)} data-testid={`table-${id}`}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-xs font-mono transition ${
                      taken ? 'bg-cream-sub text-ink-muted line-through' : table===id?'bg-primary text-white shadow-lg':'bg-white border border-border hover:border-primary'
                    }`}>
                    <span className="text-base font-bold">{id}</span>
                    <span className="text-[10px] opacity-70">{(i%3+2)*2} seats</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-[88px] bg-white rounded-3xl border border-border p-7">
            <div className="label-eyebrow">Booking summary</div>
            <Row k="Date" v={`Feb ${date}, 2026`}/>
            <Row k="Time" v={slot}/>
            <Row k="Party" v={`${party} ${party===1?'guest':'guests'}`}/>
            <Row k="Zone" v={zone}/>
            <Row k="Table" v={table}/>
            <hr className="my-5 border-border"/>
            <button className="btn-primary w-full inline-flex items-center justify-center gap-2" data-testid="confirm-reservation"><Check size={16}/> Confirm reservation</button>
            <button className="btn-outline w-full mt-3" data-testid="add-preorder">+ Pre-order from menu</button>
            <p className="mt-4 text-[11px] text-ink-muted text-center font-mono uppercase tracking-wide">Free cancellation up to 2 hours before</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-3xl border border-border p-6 md:p-7">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-ink-muted"/>}
        <div className="label-eyebrow">{title}</div>
      </div>
      {children}
    </div>
  );
}

function Row({ k, v }) {
  return <div className="flex justify-between py-2.5 text-sm"><span className="text-ink-muted font-mono uppercase text-[10px] tracking-widest pt-1">{k}</span><span className="font-fn font-medium">{v}</span></div>;
}
