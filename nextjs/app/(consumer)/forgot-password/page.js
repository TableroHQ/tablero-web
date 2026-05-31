'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Shield, Check, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/client';
import { useStore } from '@/lib/store';
import { useTranslations } from 'next-intl';

function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const vis = local.length <= 2 ? local[0] + '**' : local[0] + '**' + local.slice(-1);
  return `${vis}@${domain}`;
}

export default function ForgotPassword() {
  const t = useTranslations('forgotPw');
  const [state] = useStore();
  const loggedInEmail = state.user.email || '';   // empty string if guest
  const isAuthenticated = state.user.role !== 'GUEST' && !!loggedInEmail;

  const [step, setStep] = React.useState(1);
  // Pre-fill with own email when logged in; locked (read-only)
  const [email, setEmail] = React.useState(loggedInEmail);
  const [otp, setOtp] = React.useState(Array(6).fill(''));
  const [devOtp, setDevOtp] = React.useState('');   // dev-mode only
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);
  const inputs = React.useRef([]);
  const router = useRouter();

  // Sync email if store hydrates after first render
  React.useEffect(() => {
    if (loggedInEmail && !email) setEmail(loggedInEmail);
  }, [loggedInEmail]);

  React.useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const sendOtp = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/api/auth/forgot-password', { email });
      // Development mode — backend exposes the OTP directly so you can test
      // without a real SMTP setup
      if (data.developmentOtpCode) {
        const digits = data.developmentOtpCode.padEnd(6, '').split('').slice(0, 6);
        setOtp(digits);
        setDevOtp(data.developmentOtpCode);
      }
      toast.success(t('codeSentToast'));
      setCountdown(60);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || t('errExpired'));
    } finally {
      setLoading(false);
    }
  };

  const verify = () => {
    const code = otp.join('');
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return toast.error(t('errAllDigits'));
    }
    setStep(3);
  };

  const reset = async () => {
    const code = otp.join('');
    if (password.length < 8) return toast.error(t('errMin8'));
    if (!/[A-Z]/.test(password)) return toast.error(t('errUppercase'));
    if (!/[a-z]/.test(password)) return toast.error(t('errLowercase'));
    if (!/[0-9]/.test(password)) return toast.error(t('errNumber'));
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        email,
        otpCode: code,
        newPassword: password,
      });
      toast.success(t('passwordUpdatedToast'));
      router.push('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || t('errExpired'));
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const onOtp = (i, v) => {
    const digit = v.replace(/\D/g, '').slice(-1);
    const arr = [...otp];
    arr[i] = digit;
    setOtp(arr);
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const onOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const onOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const arr = Array(6).fill('');
    text.split('').forEach((ch, idx) => { arr[idx] = ch; });
    setOtp(arr);
    inputs.current[Math.min(text.length, 5)]?.focus();
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link href={isAuthenticated ? '/profile' : '/login'}
          className="inline-flex items-center gap-2 text-sm text-ink-body hover:text-primary mb-8"
          data-testid="back-link">
          <ArrowLeft size={14} /> {isAuthenticated ? t('backToProfile') : t('backToSignIn')}
        </Link>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map(n => (
            <div key={n}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step >= n ? 'bg-primary' : 'bg-cream-sub'}`}
            />
          ))}
        </div>

        {/* ── Step 1 — Email ───────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={sendOtp} data-testid="step-email">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
              <Mail size={22} />
            </div>
            <h1 className="font-display text-4xl">{t('resetTitle')}</h1>
            <p className="mt-3 text-ink-body text-sm leading-relaxed">
              {isAuthenticated ? t('resetSubLoggedIn') : t('resetSubGuest')}
            </p>

            <div className="mt-8">
              <span className="label-eyebrow">{t('emailAddress')}</span>
              {isAuthenticated ? (
                /* Logged-in: show masked email, no input */
                <div className="mt-2 flex items-center gap-3 px-4 py-3.5 bg-cream-sub rounded-xl text-sm font-fn text-ink-muted">
                  <Mail size={14} className="shrink-0 text-ink-muted" />
                  <span className="flex-1">{maskEmail(loggedInEmail)}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wide">{t('yourAccount')}</span>
                </div>
              ) : (
                /* Guest: free input */
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3.5 font-fn text-sm outline-none focus:ring-2 focus:ring-primary"
                  data-testid="email-input"
                />
              )}
            </div>

            <button
              disabled={loading}
              type="submit"
              className="btn-primary w-full mt-6 disabled:opacity-50"
              data-testid="send-otp"
            >
              {loading ? t('sending') : t('sendCode')}
            </button>
          </form>
        )}

        {/* ── Step 2 — OTP ─────────────────────────────────────────────── */}
        {step === 2 && (
          <div data-testid="step-otp">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
              <Shield size={22} />
            </div>
            <h1 className="font-display text-4xl">{t('checkInbox')}</h1>
            <p className="mt-3 text-ink-body text-sm leading-relaxed">
              {t('codeSentTo', { email: maskEmail(email) })}
            </p>

            {/* Dev-mode banner */}
            {devOtp && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-warn-bg rounded-xl text-sm font-mono">
                <Eye size={14} className="text-warn shrink-0" />
                <span className="text-warn font-semibold">{t('devCode')} {devOtp}</span>
              </div>
            )}

            <div className="flex gap-2 mt-8" onPaste={onOtpPaste}>
              {otp.map((v, i) => (
                <input
                  key={i}
                  ref={el => inputs.current[i] = el}
                  value={v}
                  onChange={e => onOtp(i, e.target.value)}
                  onKeyDown={e => onOtpKeyDown(i, e)}
                  data-testid={`otp-${i}`}
                  className="w-12 h-14 text-center bg-cream-sub rounded-xl font-mono text-2xl font-bold outline-none focus:ring-2 focus:ring-primary transition-shadow"
                  maxLength={1}
                  inputMode="numeric"
                />
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between text-sm">
              <button
                onClick={() => countdown === 0 && sendOtp()}
                disabled={countdown > 0}
                className="font-mono text-primary disabled:text-ink-muted transition-colors"
                data-testid="resend-otp"
              >
                {countdown > 0 ? t('resendIn', { n: countdown }) : t('resendCode')}
              </button>
            </div>

            <button
              disabled={loading}
              onClick={verify}
              className="btn-primary w-full mt-6 disabled:opacity-50"
              data-testid="verify-otp"
            >
              {loading ? t('checking') : t('continue')}
            </button>
          </div>
        )}

        {/* ── Step 3 — New password ─────────────────────────────────────── */}
        {step === 3 && (
          <div data-testid="step-new-password">
            <div className="h-14 w-14 rounded-2xl bg-ok-bg text-ok flex items-center justify-center mb-6">
              <Check size={22} />
            </div>
            <h1 className="font-display text-4xl">{t('newPasswordTitle')}</h1>
            <p className="mt-3 text-ink-body text-sm leading-relaxed">
              {t('newPasswordSub')}
            </p>

            <label className="block mt-8">
              <span className="label-eyebrow">{t('newPasswordLabel')}</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3.5 font-fn text-sm outline-none focus:ring-2 focus:ring-primary"
                data-testid="new-password"
              />
            </label>

            {/* Live strength hints */}
            <div className="mt-3 flex gap-3 text-[11px] font-mono">
              {[
                ['8+ chars', password.length >= 8],
                ['A–Z',      /[A-Z]/.test(password)],
                ['a–z',      /[a-z]/.test(password)],
                ['0–9',      /[0-9]/.test(password)],
              ].map(([label, met]) => (
                <span key={label} className={met ? 'text-ok' : 'text-ink-muted'}>
                  {met ? '✓' : '·'} {label}
                </span>
              ))}
            </div>

            <button
              disabled={loading}
              onClick={reset}
              className="btn-primary w-full mt-6 disabled:opacity-50"
              data-testid="reset-submit"
            >
              {loading ? t('checking') : t('saveAndSignIn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
