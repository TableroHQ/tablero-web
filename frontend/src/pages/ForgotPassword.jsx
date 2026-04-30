import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function ForgotPassword() {
  const [step, setStep] = React.useState(1);
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState(Array(6).fill(''));
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);
  const inputs = React.useRef([]);
  const nav = useNavigate();

  React.useEffect(() => {
    if (countdown > 0) { const t = setTimeout(()=>setCountdown(c=>c-1), 1000); return ()=>clearTimeout(t); }
  }, [countdown]);

  const sendOtp = async (e) => {
    e?.preventDefault();
    setLoading(true);
    const r = await api.forgotPassword(email);
    setLoading(false);
    if (!r.ok) return toast.error(r.error);
    toast.success('6-digit code sent to your email');
    setCountdown(60);
    setStep(2);
  };
  const verify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Enter the 6-digit code');
    setLoading(true);
    const r = await api.verifyOtp(code);
    setLoading(false);
    if (!r.ok) return toast.error(r.error);
    setStep(3);
  };
  const reset = async () => {
    if (password.length < 6) return toast.error('Password too short');
    setLoading(true);
    await api.resetPassword();
    setLoading(false);
    toast.success('Password updated. Sign in with your new password.');
    nav('/login');
  };

  const onOtp = (i, v) => {
    const arr = [...otp]; arr[i] = v.slice(-1); setOtp(arr);
    if (v && i < 5) inputs.current[i+1]?.focus();
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-ink-body hover:text-primary mb-8" data-testid="back-to-login"><ArrowLeft size={14}/> Back to sign in</Link>
        <div className="flex items-center gap-2 mb-8">
          {[1,2,3].map(n => <div key={n} className={`h-1 flex-1 rounded-full ${step>=n?'bg-primary':'bg-cream-sub'}`}/>)}
        </div>

        {step === 1 && (
          <form onSubmit={sendOtp} data-testid="step-email">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6"><Mail size={22}/></div>
            <h1 className="font-display text-4xl">Reset your password.</h1>
            <p className="mt-3 text-ink-body">We'll send a 6-digit code to your email. Valid for 10 minutes.</p>
            <label className="block mt-8">
              <span className="label-eyebrow">Email</span>
              <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@bite.com"
                className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3.5 font-fn outline-none focus:ring-2 focus:ring-primary" data-testid="email-input"/>
            </label>
            <button disabled={loading} type="submit" className="btn-primary w-full mt-6" data-testid="send-otp">
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div data-testid="step-otp">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6"><Shield size={22}/></div>
            <h1 className="font-display text-4xl">Enter the code.</h1>
            <p className="mt-3 text-ink-body">We sent 6 digits to <strong>{email}</strong>.</p>
            <div className="flex gap-2 mt-8">
              {otp.map((v, i) => (
                <input key={i} ref={el=>inputs.current[i]=el} value={v} onChange={e=>onOtp(i, e.target.value)} data-testid={`otp-${i}`}
                  className="w-12 h-14 text-center bg-cream-sub rounded-xl font-mono text-2xl font-bold outline-none focus:ring-2 focus:ring-primary" maxLength={1} inputMode="numeric"/>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between text-sm font-mono">
              <button onClick={()=>countdown===0 && sendOtp()} disabled={countdown>0} className="text-primary disabled:text-ink-muted" data-testid="resend-otp">
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code →'}
              </button>
              <span className="text-ink-muted">Hint: any 6 digits works</span>
            </div>
            <button disabled={loading} onClick={verify} className="btn-primary w-full mt-6" data-testid="verify-otp">{loading?'Verifying…':'Verify'}</button>
          </div>
        )}

        {step === 3 && (
          <div data-testid="step-new-password">
            <div className="h-14 w-14 rounded-2xl bg-ok-bg text-ok flex items-center justify-center mb-6"><Check size={22}/></div>
            <h1 className="font-display text-4xl">New password.</h1>
            <p className="mt-3 text-ink-body">At least 6 characters. Pick something memorable.</p>
            <label className="block mt-8">
              <span className="label-eyebrow">New password</span>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
                className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3.5 font-fn outline-none focus:ring-2 focus:ring-primary" data-testid="new-password"/>
            </label>
            <button disabled={loading} onClick={reset} className="btn-primary w-full mt-6" data-testid="reset-submit">{loading?'Saving…':'Save and sign in'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
