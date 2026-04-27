import React from 'react';
import { Trash2, MapPin, Wallet, CreditCard, Coins, Plus, Minus } from 'lucide-react';
import { MENU } from '@/lib/mock';

export default function Checkout() {
  const [cart, setCart] = React.useState([
    { ...MENU[0], qty: 1 },
    { ...MENU[2], qty: 2 },
    { ...MENU[3], qty: 1 },
  ]);
  const [pay, setPay] = React.useState('balance');
  const [type, setType] = React.useState('delivery');

  const sub = cart.reduce((s,i) => s + i.price*i.qty, 0);
  const fee = type==='delivery'?4.5:0;
  const total = sub + fee;

  const change = (id, d) => setCart(c => c.map(i => i.id===id?{...i, qty: Math.max(1,i.qty+d)}:i));
  const remove = (id) => setCart(c => c.filter(i=>i.id!==id));

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow">Checkout</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">Almost ready to eat.</h1>

      <div className="grid lg:grid-cols-12 gap-6 mt-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex gap-2">
            {[['delivery','Delivery'],['table','Order at table']].map(([k,l])=>(
              <button key={k} onClick={()=>setType(k)} data-testid={`type-${k}`}
                className={`px-5 py-2.5 rounded-full text-sm font-fn ${type===k?'bg-ink text-white':'bg-white border border-border'}`}>{l}</button>
            ))}
          </div>

          {type==='delivery' && (
            <div className="bg-white rounded-3xl border border-border p-6 md:p-7">
              <div className="label-eyebrow mb-4">Delivery to</div>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><MapPin size={20}/></div>
                <div className="flex-1">
                  <input data-testid="address-input" defaultValue="12 Birch Lane, Apt 4" className="w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary"/>
                  <div className="mt-3 aspect-[16/7] rounded-2xl overflow-hidden relative bg-cream-sub">
                    <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(45deg,#E4883A_25%,transparent_25%),linear-gradient(-45deg,#C8553D_25%,transparent_25%)] [background-size:24px_24px]"/>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white rounded-full px-4 py-2 shadow-lg font-mono text-xs">≈ 22 min · 1.4 km</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-border p-6 md:p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Your order</h2>
              <span className="text-xs font-mono text-ink-muted">{cart.length} items</span>
            </div>
            <div className="mt-4 divide-y divide-border">
              {cart.map(i => (
                <div key={i.id} className="py-4 flex items-center gap-4" data-testid={`cart-row-${i.id}`}>
                  <img src={i.img} alt="" className="h-16 w-16 rounded-2xl object-cover"/>
                  <div className="flex-1">
                    <div className="font-fn font-semibold">{i.name}</div>
                    <div className="text-xs font-mono text-ink-muted">${i.price.toFixed(2)} each</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>change(i.id,-1)} className="h-8 w-8 rounded-full bg-cream-sub flex items-center justify-center" data-testid={`qty-minus-${i.id}`}><Minus size={14}/></button>
                    <span className="w-6 text-center font-mono">{i.qty}</span>
                    <button onClick={()=>change(i.id,1)} className="h-8 w-8 rounded-full bg-cream-sub flex items-center justify-center" data-testid={`qty-plus-${i.id}`}><Plus size={14}/></button>
                  </div>
                  <div className="font-mono w-20 text-right">${(i.price*i.qty).toFixed(2)}</div>
                  <button onClick={()=>remove(i.id)} className="text-ink-muted hover:text-err" data-testid={`remove-${i.id}`}><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-border p-6 md:p-7">
            <div className="label-eyebrow mb-4">Payment</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <PayOption active={pay==='balance'} onClick={()=>setPay('balance')} icon={Wallet} title="Account balance" sub="$84.00 available" testid="pay-balance"/>
              <PayOption active={pay==='card'} onClick={()=>setPay('card')} icon={CreditCard} title="Card via Stripe" sub="•• 4242 · expires 06/29" testid="pay-card"/>
            </div>
            <label className="flex items-center gap-2 mt-5 text-sm font-fn cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-primary"/> Use 50 loyalty points for a free hotdog <Coins size={14} className="text-secondary"/>
            </label>
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-[88px] bg-ink text-cream rounded-3xl p-7">
            <div className="label-eyebrow !text-cream/60">Summary</div>
            <Row k="Subtotal" v={`$${sub.toFixed(2)}`} dark/>
            <Row k="Delivery fee" v={`$${fee.toFixed(2)}`} dark/>
            <Row k="Loyalty bonus" v="− $4.50" dark accent/>
            <hr className="my-4 border-cream/20"/>
            <Row k="Total" v={`$${(total-4.5).toFixed(2)}`} dark big/>
            <button className="mt-6 w-full bg-primary hover:bg-terracotta-dark py-4 rounded-full font-fn font-semibold transition" data-testid="place-order">Place order →</button>
            <p className="mt-3 text-[10px] font-mono text-cream/50 text-center uppercase">{pay==='balance'?'Balance held until delivery confirmed':'Card charged on Stripe'}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PayOption({ active, onClick, icon: Icon, title, sub, testid }) {
  return (
    <button onClick={onClick} data-testid={testid} className={`text-left p-4 rounded-2xl border-2 transition ${active?'border-primary bg-primary/5':'border-border bg-white hover:border-ink/30'}`}>
      <Icon size={20} className={active?'text-primary':'text-ink-muted'}/>
      <div className="mt-3 font-fn font-semibold">{title}</div>
      <div className="text-xs text-ink-muted mt-0.5 font-mono">{sub}</div>
    </button>
  );
}

function Row({ k, v, dark, big, accent }) {
  return <div className={`flex justify-between py-2 ${big?'pt-1':''}`}>
    <span className={`${dark?'text-cream/70':'text-ink-body'} text-sm font-fn`}>{k}</span>
    <span className={`${big?'font-display text-2xl':accent?'text-secondary font-mono text-sm':'font-mono text-sm'} ${dark?'text-cream':''}`}>{v}</span>
  </div>;
}
