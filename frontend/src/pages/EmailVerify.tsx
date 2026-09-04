import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Loader2, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { ApiError } from '../services/api';
import { verifyEmail, resendVerificationEmail } from '../services/auth';

export default function EmailVerify() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialEmail = params.get('email') ?? '';
  const token = params.get('token');

  const [email, setEmail] = useState(initialEmail);
  const [verificationCode, setVerificationCode] = useState(token ?? '');
  const [loading, setLoading] = useState(Boolean(token));
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(Boolean(token));

  async function verify(code: string) {
    setLoading(true);
    setError(null);
    try {
      await verifyEmail(code);
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true, state: { verifiedEmail: email } }), 700);
    } catch (err) {
      setSuccess(false);
      setError(err instanceof ApiError ? err.message : 'Verification failed. Check the link or code and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const code = verificationCode.trim();
    if (!code) {
      setError('Paste the verification token from your email.');
      return;
    }
    await verify(code);
  }

  async function resend() {
    if (!email.trim()) {
      setError('Enter the email address you used to register.');
      return;
    }
    setResending(true);
    setError(null);
    try {
      const response = await resendVerificationEmail(email.trim());
      setSuccess(true);
      if (response.verificationUrl) {
        setVerificationCode(new URL(response.verificationUrl).searchParams.get('token') ?? '');
      }
    } catch (err) {
      setSuccess(false);
      setError(err instanceof ApiError ? err.message : 'Could not resend the verification email.');
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090a0e] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-lg items-center justify-center">
        <section className="w-full border border-white/[.09] bg-[#0d1016]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,.38)] backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3 border-b border-white/[.06] pb-5">
            <span className="flex h-10 w-10 items-center justify-center border border-[#2FD9C7]/25 bg-[#2FD9C7]/[.06] text-[#2FD9C7]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[.2em] text-[#2FD9C7]">Identity verification</div>
              <h1 className="mt-1 text-2xl font-black tracking-tight">Verify your email</h1>
            </div>
          </div>

          {success ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[#06D369]" />
              <h2 className="mt-5 text-xl font-bold">Email verified</h2>
              <p className="mt-2 text-sm leading-6 text-[#8c949f]">Your operator account is ready. Continue to sign in.</p>
              <Link to="/login" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2FD9C7] px-5 py-3 text-sm font-bold text-[#0F1219]">Go to login</Link>
            </div>
          ) : (
            <>
              <p className="mt-6 text-sm leading-6 text-[#8c949f]">We sent a verification message to your work email. Paste the verification token from that message to activate your account.</p>
              <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                <label className="block">
                  <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#7e8792]">Work email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69717c]" />
                    <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className="w-full border border-white/[.11] bg-[#0b0d12] px-11 py-4 text-sm text-white outline-none focus:border-[#2FD9C7]" placeholder="security@company.com" />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#7e8792]">Verification token</span>
                  <textarea value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} rows={4} className="w-full resize-y border border-white/[.11] bg-[#0b0d12] px-4 py-3 font-mono text-xs text-white outline-none focus:border-[#2FD9C7]" placeholder="Paste the token from your verification email" />
                </label>
                {error && <div role="alert" className="flex gap-2 border border-[#ff4757]/25 bg-[#ff4757]/[.07] p-3 text-sm text-[#ff9aa4]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
                <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2FD9C7] px-5 py-3 text-sm font-bold text-[#0F1219] disabled:opacity-60">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : <>Verify email</>}
                </button>
              </form>
              <button type="button" onClick={resend} disabled={resending} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/[.11] px-4 py-3 text-xs font-semibold text-[#aeb6c2] hover:text-white disabled:opacity-50">
                {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Resend verification email
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
