import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IMG } from '@/lib/mock';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const [mode, setMode] = React.useState('login');
  const [identifier, setIdentifier] = React.useState('');
  const navigate = useNavigate();
  const isEmail = identifier.includes('@');

  const submit = (e) => { e.preventDefault(); toast.success(mode==='login'?'Welcome back, Sofia':'Account created · check your email'); navigate('/dashboard'); };

  return (
    <div className="min-h-[calc(100vh-72px)] grid lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={IMG.texture} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-ink/20 to-ink/70" />
        <div className="relative z-10 h-full p-14 flex flex-col justify-between text-white">
          <Link to="/" className="flex items-center gap-2 text-sm font-fn opacity-80 hover:opacity-100"><ArrowLeft size={14}/> Back to Bite</Link>
          <div>
            <div className="label-eyebrow !text-white/60">Welcome back</div>
            <h2 className="font-display text-5xl mt-2 max-w-md leading-tight">Your table, your menu, your rewards — all in one place.</h2>
            <p className="mt-6 max-w-sm text-white/80">Use your email or username — we'll figure out which one. One password to rule them all.</p>
          </div>
          <div className="text-xs font-mono text-white/60">JWT 15min · Refresh 7d · OTP 10min</div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8 md:p-14">
        <div className="w-full max-w-md">
          <div className="label-eyebrow">{mode==='login'?'Sign in':'Create account'}</div>
          <h1 className="font-display text-4xl md:text-5xl mt-2">{mode==='login'?'Welcome back to Bite.':'Pull up a chair.'}</h1>
          <p className="mt-3 text-ink-body">{mode==='login'?'Type your email or username — same field, we auto-detect.':'A few details and you\'re in.'}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode==='register' && (
              <Field label="Full name" testid="auth-name"><input className="auth-input" placeholder="Sofia Marin"/></Field>
            )}
            <Field label="Email or username" hint={identifier ? (isEmail ? 'Detected: email' : 'Detected: username') : null} testid="auth-identifier">
              <input value={identifier} onChange={e=>setIdentifier(e.target.value)} className="auth-input" placeholder="sofia@bite.com or @sofia" autoComplete="username"/>
            </Field>
            <Field label="Password" testid="auth-password"><input type="password" className="auth-input" placeholder="••••••••" autoComplete="current-password"/></Field>
            {mode==='login' && <Link to="/forgot-password" className="text-xs font-mono text-primary hover:underline" data-testid="forgot-pw">Forgot password? OTP via email →</Link>}
            <button type="submit" className="btn-primary w-full inline-flex items-center justify-center gap-2 mt-4" data-testid="auth-submit">
              {mode==='login'?'Sign in':'Create account'} <ArrowRight size={16}/>
            </button>
          </form>

          <div className="mt-8 text-sm text-ink-body">
            {mode==='login' ? (
              <>New here? <button onClick={()=>setMode('register')} className="text-primary font-medium" data-testid="switch-register">Create an account</button></>
            ) : (
              <>Already have one? <button onClick={()=>setMode('login')} className="text-primary font-medium" data-testid="switch-login">Sign in</button></>
            )}
          </div>

          <style>{`.auth-input{width:100%;background:hsl(30 20% 95%);border:1px solid transparent;border-radius:14px;padding:14px 16px;font-family:Figtree,sans-serif;font-size:14px;outline:none;transition:all .2s}.auth-input:focus{border-color:hsl(var(--primary));background:white;box-shadow:0 0 0 4px hsl(var(--primary) / 0.1)}`}</style>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, hint, testid }) {
  return (
    <label className="block" data-testid={testid}>
      <div className="flex items-center justify-between mb-2">
        <span className="label-eyebrow">{label}</span>
        {hint && <span className="text-[10px] font-mono text-primary">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
