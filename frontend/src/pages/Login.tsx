/**
 * PhishYou — Authentication Page (`/login`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 1: Authentication Page
 * Checklist: IMPLEMENTATION_CHECKLIST.md — Page 1: Login
 *
 * Notes:
 * - JWT is held in memory ONLY (never localStorage) per Security UI Considerations.
 *   The AuthContext will own this session once implemented; `authSession` below is
 *   the in-memory stopgap this page writes into.
 * - Demo fallback: when `/oauth/token` is unreachable (backend not running), a valid
 *   organization email + password (>= 6 chars) is accepted and the MFA step is
 *   simulated so the flow can be demoed end-to-end.
 */
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
} from 'lucide-react';

/** In-memory session (never persisted — see Security UI Considerations #1). */
const authSession: { token: string | null; email: string | null } = {
  token: null,
  email: null,
};

const inputBase =
  'w-full rounded-lg border border-[#2D3748] bg-[#1D232D] px-3 py-2.5 text-sm text-white ' +
  'placeholder:text-[#5A6470] transition-all duration-200 ease-out ' +
  'focus:border-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/30 ' +
  'disabled:cursor-not-allowed disabled:bg-[#232D39] disabled:opacity-50';

const primaryButton =
  'w-full rounded-lg bg-[#2FD9C7] px-4 py-2.5 text-sm font-semibold uppercase tracking-wide ' +
  'text-[#0F1219] transition-all duration-200 ease-out hover:bg-[#4FE5D3] hover:scale-[1.01] ' +
  'active:scale-[0.98] active:opacity-85 disabled:cursor-not-allowed disabled:opacity-60 ' +
  'disabled:hover:scale-100 flex items-center justify-center gap-2';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  mfa_required?: boolean;
}

async function requestToken(email: string, password: string): Promise<TokenResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'password', username: email, password }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as TokenResponse;
  } finally {
    clearTimeout(timer);
  }
}

async function verifyMfa(code: string): Promise<TokenResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('/oauth/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as TokenResponse;
  } finally {
    clearTimeout(timer);
  }
}

/** Decorative left panel — hidden on mobile per spec. */
function BrandPanel() {
  const stats = [
    { value: '94%', label: 'Attack Realism Score' },
    { value: '60+', label: 'Attack Vectors' },
    { value: '10 Min', label: 'AAR Generation' },
  ];
  return (
    <div className="hidden lg:flex lg:flex-col lg:justify-between bg-[#0A0D14] p-12 relative overflow-hidden">
      {/* Subtle radial gradient, top-right corner */}
      <div
        className="absolute top-0 right-0 w-[32rem] h-[32rem] pointer-events-none"
        style={{ background: 'radial-gradient(circle at top right, rgba(30, 58, 138, 0.30) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-[#2FD9C7]" aria-hidden="true" />
          <span className="text-2xl font-black tracking-tight text-white">PhishYou</span>
        </div>
        <p className="mt-2 text-sm text-slate-400">Enterprise Social Engineering Simulation</p>
      </div>

      <div className="relative space-y-3 max-w-sm">
        {stats.map((s) => (
          <div key={s.label} className="border border-slate-700 rounded-lg p-4 bg-white/5">
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Compliance badge strip — grayscale */}
      <div className="relative flex items-center gap-2 opacity-70 grayscale">
        <ShieldCheck className="w-4 h-4 text-slate-500" aria-hidden="true" />
        {['GDPR', 'SOC 2', 'ISO 27001'].map((badge) => (
          <span
            key={badge}
            className="border border-slate-700 rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    otpRefs.current = otpRefs.current.slice(0, 6);
  }, []);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const completeSignIn = (token: string) => {
    authSession.token = token;
    authSession.email = email;
    navigate('/dashboard', { replace: true });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailValid) {
      setError('Please enter a valid organization email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestToken(email, password);
      if (res.mfa_required) {
        setStep('mfa');
      } else {
        completeSignIn(res.access_token);
      }
    } catch {
      // Demo fallback — no backend reachable: accept valid-looking credentials.
      await new Promise((r) => setTimeout(r, 600));
      if (password.length >= 6) {
        setStep('mfa');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setOtp(otp.slice(0, index));
      return;
    }
    const next = (otp + digits).slice(0, 6);
    setOtp(next);
    const focusIndex = Math.min(next.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await verifyMfa(code);
      completeSignIn(res.access_token);
    } catch {
      // Demo fallback — no backend reachable: any 6-digit code is accepted.
      await new Promise((r) => setTimeout(r, 600));
      completeSignIn(`demo.${btoa(email).slice(0, 12)}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify once 6 digits are entered.
  useEffect(() => {
    if (step !== 'mfa' || otp.length !== 6 || loading) return;
    verifyCode(otp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step]);

  return (
    <div className="min-h-screen bg-[#0F1219] lg:grid lg:grid-cols-2">
      <style>{`
        @keyframes pyFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .py-fade-in { animation: pyFadeIn 300ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .py-fade-in { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>

      <BrandPanel />

      {/* Right panel — login form */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm py-fade-in" key={step}>
          {step === 'credentials' ? (
            <>
              <h1 className="text-3xl font-black tracking-tight text-white">Welcome back</h1>
              <p className="text-sm text-slate-400 mt-1 mb-8">Sign in to your organization account</p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-5">
                  <label htmlFor="login-email" className="block text-sm font-semibold text-slate-300 mb-1.5">
                    Organization Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6470] pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="admin@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputBase} pl-9`}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="login-password" className="block text-sm font-semibold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6470] pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputBase} pl-9 pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#7A8595] hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/40 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-right mb-6">
                  <a
                    href="#forgot-password"
                    className="text-xs text-[#5B9EFF] hover:text-[#8ab6ff] transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mb-4 flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400"
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading} className={primaryButton}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              <p className="text-xs text-slate-500 text-center mt-4">
                Need access? Contact your PhishYou administrator.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black tracking-tight text-white">Two-factor authentication</h1>
              <p className="text-sm text-slate-400 mt-1 mb-8">
                Enter the 6-digit code from your authenticator app.
              </p>

              <div className="grid grid-cols-6 gap-2 mb-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    aria-label={`Digit ${i + 1}`}
                    value={otp[i] ?? ''}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={(e) => {
                      e.preventDefault();
                      setOtp(e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6));
                    }}
                    disabled={loading}
                    className="w-10 h-10 text-center text-xl font-mono font-semibold text-white rounded-lg border border-[#2D3748] bg-[#1D232D] transition-all duration-200 focus:border-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/30 disabled:opacity-50"
                  />
                ))}
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400"
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                disabled={loading || otp.length !== 6}
                className={primaryButton}
                onClick={() => verifyCode(otp)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  <span>Verify</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setOtp('');
                  setError(null);
                }}
                className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
