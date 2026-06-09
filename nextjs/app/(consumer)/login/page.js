'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { IMG } from '@/lib/brand';
import { ArrowLeft, ArrowRight, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/client';
import { useStore, ROLE_ROUTES } from '@/lib/store';
import { useTranslations } from 'next-intl';

// ─── helpers ────────────────────────────────────────────────────────────────
function decodeRole(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role || 'USER';
  } catch { return 'USER'; }
}

// ─── main page ───────────────────────────────────────────────────────────────
export default function Auth() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const [mode, setMode] = React.useState('login');

  // login fields
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');

  // register — 4 steps: email → otp → details → done
  const [regStep, setRegStep] = React.useState(1);   // 1 | 2 | 3
  const [regEmail, setRegEmail] = React.useState('');
  const [regOtp, setRegOtp] = React.useState(Array(6).fill(''));
  const [devOtp, setDevOtp] = React.useState('');
  const [regCountdown, setRegCountdown] = React.useState(0);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [regUsername, setRegUsername] = React.useState('');
  const [regPassword, setRegPassword] = React.useState('');
  const otpInputs = React.useRef([]);

  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, store] = useStore();
  const isEmail = identifier.includes('@');
  const nextPath = searchParams.get('next');

  // countdown timer for resend
  React.useEffect(() => {
    if (regCountdown > 0) {
      const t = setTimeout(() => setRegCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [regCountdown]);

  const switchMode = (next) => {
    setMode(next);
    setRegStep(1);
    setErrors({});
    setRegEmail(''); setRegOtp(Array(6).fill('')); setDevOtp('');
    setFirstName(''); setLastName(''); setRegUsername(''); setRegPassword('');
    setIdentifier(''); setPassword('');
  };

  // ── Login ────────────────────────────────────────────────────────────────
  const submitLogin = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!identifier.trim()) errs.identifier = t('errIdentifier');
    if (!password)          errs.password   = t('errPassword');
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const data = await api.post('/api/auth/login', { identifier, password });
      store.login(data.accessToken, data.refreshToken);
      toast.success(t('welcomeToast'));
      const role = decodeRole(data.accessToken);
      router.push(nextPath || ROLE_ROUTES[role] || '/dashboard');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) {
        toast.error(Object.values(errData.errors).flat().join(' · '));
      } else {
        toast.error(errData?.message || errData?.error || t('invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Register step 1: send verification email ────────────────────────────
  const sendVerification = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!regEmail.trim() || !regEmail.includes('@')) errs.regEmail = t('errEmail');
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const data = await api.post('/api/auth/send-email-verification', { email: regEmail });
      if (data.developmentOtpCode) {
        const digits = data.developmentOtpCode.split('').slice(0, 6);
        setRegOtp([...digits, ...Array(6 - digits.length).fill('')]);
        setDevOtp(data.developmentOtpCode);
      }
      toast.success(t('codeSentToast'));
      setRegCountdown(60);
      setRegStep(2);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) {
        toast.error(Object.values(errData.errors).flat().join(' · '));
      } else {
        toast.error(errData?.message || tc('somethingWentWrong'));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Register step 2: verify OTP ─────────────────────────────────────────
  const verifyOtp = () => {
    const code = regOtp.join('');
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return toast.error(t('errAllDigits'));
    }
    setRegStep(3);
  };

  const onOtp = (i, v) => {
    const digit = v.replace(/\D/g, '').slice(-1);
    const arr = [...regOtp]; arr[i] = digit; setRegOtp(arr);
    if (digit && i < 5) otpInputs.current[i + 1]?.focus();
  };
  const onOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !regOtp[i] && i > 0) otpInputs.current[i - 1]?.focus();
  };
  const onOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const arr = Array(6).fill('');
    text.split('').forEach((ch, idx) => { arr[idx] = ch; });
    setRegOtp(arr);
    otpInputs.current[Math.min(text.length, 5)]?.focus();
  };

  // ── Register step 3: create account ─────────────────────────────────────
  const submitRegister = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!firstName.trim())  errs.firstName  = t('errFirstName');
    if (!lastName.trim())   errs.lastName   = t('errLastName');
    if (regUsername.length < 3) errs.regUsername = t('errUsername');
    else if (!/^[a-zA-Z0-9_.\-]+$/.test(regUsername)) errs.regUsername = t('errUsernameChars');
    if (regPassword.length < 8) errs.regPassword = t('errPasswordLen');
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        email: regEmail,
        username: regUsername,
        password: regPassword,
        firstName,
        lastName,
        emailVerificationCode: regOtp.join(''),
      });
      toast.success(t('accountCreatedToast'));
      switchMode('login');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) {
        const msgs = Object.values(errData.errors).flat().join(' · ');
        toast.error(msgs);
        // If OTP-related error, send user back to step 2
        if (msgs.toLowerCase().includes('verification') || msgs.toLowerCase().includes('expired')) {
          setRegStep(2);
        }
      } else {
        toast.error(errData?.message || tc('somethingWentWrong'));
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-72px)] grid grid-cols-1 lg:grid-cols-2">
      {/* Left panel */}
      <div className="relative hidden lg:block">
        <img src={IMG.texture} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-ink/20 to-ink/70" />
        <div className="relative z-10 h-full p-14 flex flex-col justify-between text-white">
          <Link href="/" className="flex items-center gap-2 text-sm font-fn opacity-80 hover:opacity-100">
            <ArrowLeft size={14} /> {t('backToTablero')}
          </Link>
          <div>
            <div className="label-eyebrow !text-white/60">
              {mode === 'login' ? t('welcomeBack') : t('joinTablero')}
            </div>
            <h2 className="font-display text-5xl mt-2 max-w-md leading-tight">
              {mode === 'login' ? t('heroSignIn') : t('heroRegister')}
            </h2>
            <p className="mt-6 max-w-sm text-white/80">
              {mode === 'login'
                ? t('subtitleSignIn')
                : regStep === 1 ? t('subtitleStep1')
                  : regStep === 2 ? t('subtitleStep2')
                    : t('subtitleStep3')}
            </p>
          </div>
          <div className="text-xs font-mono text-white/60">JWT 15min · Refresh 7d · OTP 10min</div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-8 md:p-14">
        <div className="w-full max-w-md">

          {/* ── LOGIN ───────────────────────────────────────────────────── */}
          {mode === 'login' && (
            <>
              <div className="label-eyebrow">{t('signIn')}</div>
              <h1 className="font-display text-4xl md:text-5xl mt-2">{t('welcomeBackToTablero')}</h1>
              <p className="mt-3 text-ink-body text-sm">
                {t('emailOrUsernameLine')}
              </p>
              <form onSubmit={submitLogin} className="mt-8 space-y-4">
                <Field label={t('emailOrUsername')}
                  hint={identifier ? (isEmail ? t('detectedEmail') : t('detectedUsername')) : null}
                  testid="auth-identifier" fieldId="login-identifier" error={errors.identifier}>
                  <input value={identifier} onChange={e => { setIdentifier(e.target.value); setErrors(v => ({ ...v, identifier: '' })); }}
                    className="auth-input" placeholder="sofia@tablero.com or sofia_marin"
                    autoComplete="username" required />
                </Field>
                <Field label={t('password')} testid="auth-password" fieldId="login-password" error={errors.password}>
                  <input type="password" className="auth-input" placeholder="••••••••"
                    autoComplete="current-password" value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(v => ({ ...v, password: '' })); }} required />
                </Field>
                <Link href="/forgot-password" className="text-xs font-mono text-primary hover:underline block"
                  data-testid="forgot-pw">
                  {t('forgotPassword')}
                </Link>
                <button type="submit" disabled={loading}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                  data-testid="auth-submit">
                  {loading ? tc('pleaseWait') : t('signInSubmit')} {!loading && <ArrowRight size={16} />}
                </button>
              </form>
              <div className="mt-8 text-sm text-ink-body">
                {t('newHere')}{' '}
                <button onClick={() => switchMode('register')} className="text-primary font-medium"
                  data-testid="switch-register">
                  {t('createAccountLink')}
                </button>
              </div>
            </>
          )}

          {/* ── REGISTER ────────────────────────────────────────────────── */}
          {mode === 'register' && (
            <>
              <div className="label-eyebrow">{t('createAccountTitle')}</div>
              <h1 className="font-display text-4xl md:text-5xl mt-2">{t('pullUpAChair')}</h1>

              {/* Progress dots */}
              <div className="flex items-center gap-2 mt-5">
                {[1, 2, 3].map(n => (
                  <div key={n}
                    className={`h-1 flex-1 rounded-full transition-colors duration-500 ${regStep >= n ? 'bg-primary' : 'bg-cream-sub'}`}
                  />
                ))}
              </div>

              {/* Step 1 — email */}
              {regStep === 1 && (
                <form onSubmit={sendVerification} className="mt-8 space-y-4" data-testid="reg-step-email">
                  <p className="text-sm text-ink-body">{t('enterEmail')}</p>
                  <Field label={t('email')} testid="auth-email" fieldId="reg-email" error={errors.regEmail}>
                    <input type="email" className="auth-input" placeholder="sofia@example.com"
                      value={regEmail} onChange={e => { setRegEmail(e.target.value); setErrors(v => ({ ...v, regEmail: '' })); }}
                      autoComplete="email" required maxLength={255} />
                  </Field>
                  <button type="submit" disabled={loading}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    data-testid="send-verification">
                    {loading ? tc('sending') : t('sendVerificationCode')} {!loading && <ArrowRight size={16} />}
                  </button>
                </form>
              )}

              {/* Step 2 — OTP */}
              {regStep === 2 && (
                <div className="mt-8" data-testid="reg-step-otp">
                  <p className="text-sm text-ink-body">
                    {t('enterCodeSentTo')}{' '}
                    <span className="font-semibold text-ink">{regEmail}</span>.
                  </p>

                  {devOtp && (
                    <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-warn-bg rounded-xl text-sm font-mono">
                      <Eye size={14} className="text-warn shrink-0" />
                      <span className="text-warn font-semibold">{t('devMode')} {devOtp}</span>
                    </div>
                  )}

                  <div className="flex gap-2 mt-6" onPaste={onOtpPaste}>
                    {regOtp.map((v, i) => (
                      <input key={i} ref={el => otpInputs.current[i] = el}
                        value={v} onChange={e => onOtp(i, e.target.value)}
                        onKeyDown={e => onOtpKey(i, e)}
                        className="w-12 h-14 text-center bg-cream-sub rounded-xl font-mono text-2xl font-bold outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        maxLength={1} inputMode="numeric" data-testid={`otp-${i}`} />
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <button onClick={() => regCountdown === 0 && sendVerification()}
                      disabled={regCountdown > 0}
                      className="font-mono text-primary disabled:text-ink-muted">
                      {regCountdown > 0 ? t('resendIn', { n: regCountdown }) : t('resendCode')}
                    </button>
                    <button onClick={() => setRegStep(1)}
                      className="text-xs text-ink-muted hover:text-ink font-mono">
                      {t('wrongEmail')}
                    </button>
                  </div>

                  <button onClick={verifyOtp}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
                    data-testid="verify-otp">
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Step 3 — account details */}
              {regStep === 3 && (
                <form onSubmit={submitRegister} className="mt-8 space-y-4" data-testid="reg-step-details">
                  <p className="text-sm text-ink-body">{t('emailVerified')}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('firstName')} testid="auth-first-name" fieldId="reg-first-name" error={errors.firstName}>
                      <input className="auth-input" placeholder="Sofia"
                        value={firstName} onChange={e => { setFirstName(e.target.value); setErrors(v => ({ ...v, firstName: '' })); }}
                        required maxLength={100} />
                    </Field>
                    <Field label={t('lastName')} testid="auth-last-name" fieldId="reg-last-name" error={errors.lastName}>
                      <input className="auth-input" placeholder="Marin"
                        value={lastName} onChange={e => { setLastName(e.target.value); setErrors(v => ({ ...v, lastName: '' })); }}
                        required maxLength={100} />
                    </Field>
                  </div>

                  <Field label={t('username')} hint={t('usernameHint')} testid="auth-username" fieldId="reg-username" error={errors.regUsername}>
                    <input className="auth-input" placeholder="sofia_marin"
                      value={regUsername} onChange={e => { setRegUsername(e.target.value); setErrors(v => ({ ...v, regUsername: '' })); }}
                      autoComplete="username" required minLength={3} maxLength={50}
                      pattern="^[a-zA-Z0-9_.\-]+$"
                      title="Letters, numbers, dots, underscores, and hyphens only" />
                  </Field>

                  <Field label={t('password')} hint={t('passwordHint')} testid="auth-password" fieldId="reg-password" error={errors.regPassword}>
                    <input type="password" className="auth-input" placeholder="••••••••"
                      autoComplete="new-password" value={regPassword}
                      onChange={e => { setRegPassword(e.target.value); setErrors(v => ({ ...v, regPassword: '' })); }}
                      required minLength={8} />
                  </Field>

                  {/* Live strength hints */}
                  {regPassword && (
                    <div className="flex gap-3 text-[11px] font-mono">
                      {[
                        ['8+ chars', regPassword.length >= 8],
                        ['A–Z', /[A-Z]/.test(regPassword)],
                        ['a–z', /[a-z]/.test(regPassword)],
                        ['0–9', /[0-9]/.test(regPassword)],
                      ].map(([label, met]) => (
                        <span key={label} className={met ? 'text-ok' : 'text-ink-muted'}>
                          {met ? '✓' : '·'} {label}
                        </span>
                      ))}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    data-testid="auth-submit">
                    {loading ? t('creatingAccount') : t('createAccountBtn')} {!loading && <ArrowRight size={16} />}
                  </button>
                </form>
              )}

              <div className="mt-8 text-sm text-ink-body">
                {t('alreadyHaveAccount')}{' '}
                <button onClick={() => switchMode('login')} className="text-primary font-medium"
                  data-testid="switch-login">
                  {t('signInSubmit')}
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      <style>{`.auth-input{width:100%;background:hsl(var(--input));color:hsl(var(--foreground));border:1px solid transparent;border-radius:14px;padding:14px 16px;font-family:Figtree,sans-serif;font-size:14px;outline:none;transition:all .2s}.auth-input:focus{border-color:hsl(var(--primary));background:hsl(var(--card));box-shadow:0 0 0 4px hsl(var(--primary) / 0.1)}`}</style>
    </div>
  );
}

function Field({ label, children, hint, testid, fieldId, error }) {
  const id = fieldId || testid;
  return (
    <div data-testid={testid}>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={id} className="label-eyebrow">{label}</label>
        {hint && <span className="text-[10px] font-mono text-primary">{hint}</span>}
      </div>
      {React.cloneElement(children, {
        id,
        'aria-invalid':     error ? 'true' : undefined,
        'aria-describedby': error ? `${id}-err` : undefined,
      })}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs text-err font-fn">{error}</p>
      )}
    </div>
  );
}
