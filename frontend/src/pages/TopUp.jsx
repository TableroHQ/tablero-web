import React from 'react';
import { useStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CreditCard, Wallet, ArrowLeft, Shield } from 'lucide-react';

export default function TopUp() {
  const [, s] = useStore();
  const { user } = s.get();
  const [amount, setAmount] = React.useState(50);
  const [processing, setProcessing] = React.useState(false);
  const nav = useNavigate();

  const quick = [25, 50, 100, 200];

  const submit = async () => {
    setProcessing(true);
    await new Promise(r=>setTimeout(r, 1600));
    s.topUp(amount);
    s.addNotif({ type: 'payment.succeeded', title: `+ $${amount.toFixed(2)} added`, body: 'Stripe confirmed. Funds are available.' });
    setProcessing(false);
    toast.success(`$${amount.toFixed(2)} added to your balance`);
    nav('/dashboard');
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 md:px-12 py-12">
      <button onClick={()=>nav(-1)} className="inline-flex items-center gap-2 text-sm text-ink-body hover:text-primary mb-6" data-testid="back"><ArrowLeft size={14}/> Back</button>
      <div className="label-eyebrow">Top up</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">Fund your wallet.</h1>
      <p className="mt-3 text-ink-body max-w-md">Funds cover delivery orders and split bills. Cards processed through Stripe — PCI-DSS compliant.</p>

      <div className="grid md:grid-cols-5 gap-6 mt-10">
        <div className="md:col-span-3 space-y-5">
          <div className="bg-white rounded-3xl border border-border p-7">
            <div className="label-eyebrow">Amount</div>
            <div className="mt-3 relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-display text-3xl text-ink-muted">$</span>
              <input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value)||0)} data-testid="amount-input"
                className="w-full bg-cream-sub rounded-2xl pl-14 pr-5 py-5 font-display text-5xl outline-none focus:ring-2 focus:ring-primary"/>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {quick.map(q => (
                <button key={q} onClick={()=>setAmount(q)} data-testid={`quick-${q}`}
                  className={`py-3 rounded-xl font-mono font-semibold ${amount===q?'bg-primary text-white':'bg-cream-sub hover:bg-cream-warm'}`}>${q}</button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-border p-7">
            <div className="label-eyebrow mb-4">Payment method</div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-cream-sub">
              <CreditCard size={20} className="text-primary"/>
              <div className="flex-1">
                <div className="font-fn font-semibold text-sm">Visa ending •• 4242</div>
                <div className="text-xs font-mono text-ink-muted">EXPIRES 06/29 · SECURED BY STRIPE</div>
              </div>
              <button className="text-xs font-mono text-primary" data-testid="change-card">Change</button>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-ink-muted"><Shield size={12}/> We never see your card. Stripe handles the rest.</div>
          </div>
        </div>

        <aside className="md:col-span-2">
          <div className="bg-ink text-cream rounded-3xl p-7 sticky top-[88px]">
            <div className="label-eyebrow !text-cream/60 flex items-center gap-2"><Wallet size={12}/> Summary</div>
            <div className="mt-5 space-y-3 text-sm font-mono">
              <div className="flex justify-between"><span className="text-cream/70">Current balance</span><span>${user.balance.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-cream/70">Top-up</span><span>+ ${amount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-cream/70">Fee</span><span>$0.00</span></div>
            </div>
            <hr className="my-4 border-cream/20"/>
            <div className="flex justify-between items-end">
              <span className="label-eyebrow !text-cream/60">New balance</span>
              <span className="font-display text-3xl">${(user.balance + amount).toFixed(2)}</span>
            </div>
            <button disabled={processing || amount<=0} onClick={submit} className="mt-6 w-full py-4 rounded-full bg-primary hover:bg-terracotta-dark disabled:opacity-60 font-fn font-semibold transition" data-testid="confirm-topup">
              {processing ? 'Processing…' : `Pay $${amount.toFixed(2)}`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
