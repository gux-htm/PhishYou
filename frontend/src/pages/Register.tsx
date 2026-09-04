import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, UserPlus } from 'lucide-react';
import { register } from '../services/auth';
import { ApiError } from '../services/api';

const ROLES = ['CISO', 'Security Manager', 'Security Analyst', 'HR/Debrief Officer', 'Auditor'];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', organization: '', email: '', role: 'Security Analyst', password: '', confirm: '', consent: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.organization.trim()) return setError('Name and organization are required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid work email address.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (!form.consent) return setError('You must accept the authorized-use agreement.');

    setLoading(true);
    try {
      const result = await register({ name: form.name.trim(), organization: form.organization.trim(), email: form.email.trim(), role: form.role, password: form.password, consent: true });
      const params = new URLSearchParams({ email: result.email });
      if (result.verificationUrl) {
        const token = new URL(result.verificationUrl).searchParams.get('token');
        if (token) params.set('token', token);
      }
      navigate(`/verify-email?${params.toString()}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090a0e] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-lg items-center justify-center">
        <section className="w-full border border-white/[.09] bg-[#0d1016]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,.38)] sm:p-8">
          <div className="flex items-center gap-3 border-b border-white/[.06] pb-5"><UserPlus className="h-5 w-5 text-[#2FD9C7]" /><div><div className="font-mono text-[9px] uppercase tracking-[.2em] text-[#2FD9C7]">Operator enrollment</div><h1 className="mt-1 text-2xl font-black">Create your account</h1></div></div>
          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
            <input className="w-full border border-white/[.11] bg-[#0b0d12] px-4 py-3 text-sm outline-none focus:border-[#2FD9C7]" placeholder="Full name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="w-full border border-white/[.11] bg-[#0b0d12] px-4 py-3 text-sm outline-none focus:border-[#2FD9C7]" placeholder="Organization" autoComplete="organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
            <input className="w-full border border-white/[.11] bg-[#0b0d12] px-4 py-3 text-sm outline-none focus:border-[#2FD9C7]" placeholder="Work email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select className="w-full border border-white/[.11] bg-[#0b0d12] px-4 py-3 text-sm outline-none focus:border-[#2FD9C7]" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((role) => <option key={role}>{role}</option>)}</select>
            <input className="w-full border border-white/[.11] bg-[#0b0d12] px-4 py-3 text-sm outline-none focus:border-[#2FD9C7]" placeholder="Password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <input className="w-full border border-white/[.11] bg-[#0b0d12] px-4 py-3 text-sm outline-none focus:border-[#2FD9C7]" placeholder="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
            <label className="flex items-start gap-3 text-xs leading-5 text-[#8c949f]"><input type="checkbox" className="mt-1" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />I confirm this account is for authorized security-awareness simulations only.</label>
            {error && <div role="alert" className="flex gap-2 border border-[#ff4757]/25 bg-[#ff4757]/[.07] p-3 text-sm text-[#ff9aa4]"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}
            <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2FD9C7] px-5 py-3 text-sm font-bold text-[#0F1219] disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : 'Create account'}</button>
          </form>
          <p className="mt-6 text-center text-xs text-[#6f7783]">Already registered? <Link to="/login" className="text-[#2FD9C7]">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
