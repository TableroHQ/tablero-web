import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { QrCode, Check, ArrowRight } from 'lucide-react';
import { IMG } from '@/lib/mock';

export default function QrScan() {
  const [params] = useSearchParams();
  const table = params.get('t') || 'T-07';

  return (
    <div className="min-h-[calc(100vh-72px)] relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={IMG.interior} alt="" className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/60 to-ink/95"/>
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 pt-20 pb-16 text-center text-white">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur font-mono text-xs mb-6">
          <span className="h-2 w-2 rounded-full bg-secondary animate-pulse-soft"/>
          QR SESSION DETECTED
        </div>
        <div className="h-20 w-20 rounded-3xl bg-white/10 backdrop-blur mx-auto flex items-center justify-center mb-6">
          <QrCode size={36}/>
        </div>
        <h1 className="font-display text-4xl md:text-5xl">Welcome to table {table}.</h1>
        <p className="mt-4 text-white/80">You're connected to Bite Downtown. Browse the menu and order from your seat — or pass the phone around, it's the same session.</p>

        <div className="mt-10 space-y-3 text-left bg-white/10 backdrop-blur-lg rounded-3xl p-5">
          <Row label="Restaurant" value="Bite · Downtown"/>
          <Row label="Table" value={table}/>
          <Row label="Zone" value="Terrace"/>
          <Row label="Session" value={`qr_${Date.now().toString().slice(-6)}`}/>
        </div>

        <Link to="/menu" className="mt-8 inline-flex items-center justify-center gap-2 w-full py-4 rounded-full bg-primary text-white font-fn font-semibold text-lg" data-testid="open-menu">
          Open menu <ArrowRight size={18}/>
        </Link>
        <Link to="/login" className="mt-3 inline-block text-sm text-white/70 hover:text-white" data-testid="sign-in-for-order">
          Sign in to pay from app → earn points
        </Link>

        <div className="mt-12 flex items-center justify-center gap-1 text-[10px] font-mono uppercase tracking-widest text-white/50">
          <Check size={12}/> Public menu · no sign-in required
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">{label}</span>
      <span className="font-fn text-sm">{value}</span>
    </div>
  );
}
