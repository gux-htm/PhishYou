import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { login } from '../services/auth';
import { ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState((location.state as { verifiedEmail?: string } | null)?.verifiedEmail ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid work email address.');
    if (!password) return setError('Enter your password.');
    setLoading(true);
    try {
      const response = await login({ email: email.trim(), password });
      signIn({ email: response.user.email, token: response.token, name: response.user.name, organization: response.user.organization });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090a0e] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-lg items-center justify-center">
        <section className="w-full border border-white/[.09] bg-[#0d1016]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,.38)] sm:p-8">
          <button onClick={() => navigate('/')} className="mb-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#7d838d] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Return to overview</button>
          <div className="flex items-center gap-3 border-b border-white/[.06] pb-5"><span className="flex h-10 w-10 items-center justify-center border border-[#2FD9C7]/25 bg-[#2FD9C7]/[.06] text-[#2FD9C7]"><ShieldCheck className="h-5 w-5" /></span><div><div className="font-mono text-[9px] uppercase tracking-[.2em] text-[#2FD9C7]">Operator authentication</div><h1 className="mt-1 text-2xl font-black">Sign in to PhishYou</h1></div></div>
          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
            <label className="block"><span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#7e8792]">Work email</span><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69717c]" /><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-white/[.11] bg-[#0b0d12] px-11 py-4 text-sm text-white outline-none focus:border-[#2FD9C7]" placeholder="security@company.com" /></div></label>
            <label className="block"><span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#7e8792]">Password</span><div className="relative"><Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69717c]" /><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-white/[.11] bg-[#0b0d12] px-11 py-4 text-sm text-white outline-none focus:border-[#2FD9C7]" placeholder="Your password" /></div></label>
            {error && <div role="alert" className="flex gap-2 border border-[#ff4757]/25 bg-[#ff4757]/[.07] p-3 text-sm text-[#ff9aa4]"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}
            <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2FD9C7] px-5 py-3 text-sm font-bold text-[#0F1219] disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign in'}</button>
          </form>
          <p className="mt-6 text-center text-xs text-[#6f7783]">Need an account? <Link to="/register" className="text-[#2FD9C7]">Register</Link></p>
        </section>
      </div>
    </main>
  );
}
