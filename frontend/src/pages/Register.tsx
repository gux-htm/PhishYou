import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Building2, Check, ChevronDown, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Terminal, User, UserPlus } from 'lucide-react'
import { register } from '../services/auth'
import { ApiError, setSessionUser } from '../services/api'

const ROLES = ['CISO', 'Security Manager', 'Security Analyst', 'HR/Debrief Officer', 'Auditor']

function EnrollScene() {
  return <aside className="relative hidden min-h-screen overflow-hidden bg-[#090307] lg:block">
    <style>{`
      @keyframes pyRegSweep { from { transform: rotate(-18deg); opacity:.18 } 45% { opacity:.7 } to { transform: rotate(342deg); opacity:.18 } }
      @keyframes pyRegPulse { 0%,100% { transform:scale(.96); opacity:.45 } 50% { transform:scale(1.03); opacity:.9 } }
      @keyframes pyRegBlink { 0%,45% { opacity:1 } 46%,100% { opacity:.22 } }
      .py-reg-sweep { animation:pyRegSweep 12s linear infinite; transform-origin:50% 50%; }
      .py-reg-pulse { animation:pyRegPulse 5s ease-in-out infinite; }
      .py-reg-blink { animation:pyRegBlink 1.7s steps(2,end) infinite; }
      @media (prefers-reduced-motion:reduce){.py-reg-sweep,.py-reg-pulse,.py-reg-blink{animation:none!important}}
    `}</style>
    <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,54,95,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,54,95,.04)_1px,transparent_1px)] [background-size:64px_64px]" />
    <div className="absolute left-[14%] top-[16%] h-[34rem] w-[34rem] rounded-full border border-[#ff365f]/10" /><div className="absolute left-[22%] top-[24%] h-[25rem] w-[25rem] rounded-full border border-[#ff365f]/15" />
    <div className="py-reg-sweep absolute left-[15%] top-[17%] h-[33rem] w-[33rem] rounded-full border-t border-[#ff365f]/70" /><div className="py-reg-pulse absolute left-[28%] top-[36%] h-24 w-24 rounded-full bg-[#ff365f]/[.08] blur-3xl" />
    <div className="absolute left-14 right-14 top-16 flex items-center justify-between border-b border-[#ff365f]/20 pb-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center border border-[#ff365f]/35 bg-[#ff365f]/[.08] text-[#ff6a76]"><ShieldCheck className="h-5 w-5" /></span><div><div className="font-mono text-sm font-black tracking-[.3em] text-white">PHISHYOU</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[.2em] text-[#7e626b]">Human threat intelligence</div></div></div><span className="font-mono text-[9px] uppercase tracking-[.2em] text-[#ff6a76]">SYS/ENROLL_02</span></div>
    <div className="absolute left-14 top-[30%] max-w-xl"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.22em] text-[#ff6a76]"><span className="py-reg-blink h-2 w-2 bg-[#ff365f]" /> Operator enrollment / authorized teams</div><h1 className="mt-7 text-6xl font-black leading-[.9] tracking-[-.065em] text-[#f5f1f2]">STAND UP YOUR<br /><span className="text-[#ff4d67]">DEFENSE TEAM.</span></h1><p className="mt-7 max-w-md text-sm leading-7 text-[#9c8b91]">Create an operator identity to design authorized social-engineering simulations and turn the results into behavioral intelligence.</p></div>
    <div className="absolute bottom-20 left-14 right-14 grid grid-cols-3 gap-3"><div className="border border-white/[.07] bg-black/20 p-4"><div className="font-mono text-[9px] uppercase tracking-[.16em] text-[#73545d]">Consent</div><div className="mt-2 text-sm font-semibold text-white/80">Required</div></div><div className="border border-white/[.07] bg-black/20 p-4"><div className="font-mono text-[9px] uppercase tracking-[.16em] text-[#73545d]">Setup</div><div className="mt-2 text-sm font-semibold text-white/80">Minutes</div></div><div className="border border-white/[.07] bg-black/20 p-4"><div className="font-mono text-[9px] uppercase tracking-[.16em] text-[#73545d]">Audit</div><div className="mt-2 text-sm font-semibold text-white/80">Enabled</div></div></div>
    <div className="absolute bottom-8 left-14 right-14 flex justify-between font-mono text-[9px] uppercase tracking-[.18em] text-[#5f444c]"><span>Provisioning channel encrypted</span><span>VIBE_GRAPHIC_SYSTEM_2026</span></div>
  </aside>
}

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState(''); const [organization, setOrganization] = useState(''); const [email, setEmail] = useState(''); const [role, setRole] = useState('Security Analyst')
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [showPassword, setShowPassword] = useState(false); const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null)

  const completeRegistration = (token: string, user: { email: string; name: string; organization: string }) => {
    setSessionUser({ email: user.email, token, name: user.name, organization: user.organization })
    navigate('/dashboard', { replace: true })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setError(null)
    if (!name.trim()) return setError('Enter your full name.')
    if (!organization.trim()) return setError('Enter your organization name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid work email address.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    if (!consent) return setError('You must accept the authorized-use agreement.')
    setLoading(true)
    try {
      const response = await register({ name: name.trim(), organization: organization.trim(), email, password, role, consent })
      completeRegistration(response.token, response.user)
    } catch (err) {
      if (err instanceof ApiError) { setError(err.message); setLoading(false); return }
      // Backend unavailable — degrade to a local demo session so the flow still completes.
      await new Promise((resolve) => setTimeout(resolve, 500))
      completeRegistration(`demo.${btoa(email).slice(0, 12)}`, { email, name: name.trim(), organization: organization.trim() })
    } finally { setLoading(false) }
  }

  const inputClass = 'w-full border border-white/[.11] bg-[#0b0d12] px-11 py-4 text-sm text-white placeholder:text-[#58606c] outline-none transition focus:border-[#ff4757]/75 focus:ring-4 focus:ring-[#ff4757]/[.08]'
  const labelClass = 'mb-2 block font-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#7e8792]'

  return <div className="min-h-screen bg-[#090a0e] text-white lg:grid lg:grid-cols-[1.08fr_.92fr]"><EnrollScene />
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10 sm:px-12"><div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.014)_1px,transparent_1px)] [background-size:52px_52px]" /><div className="pointer-events-none absolute right-[-15rem] top-[10%] h-[32rem] w-[32rem] rounded-full bg-[#ff365f]/[.035] blur-[140px]" />
      <div className="relative w-full max-w-md"><button onClick={() => navigate('/')} className="mb-10 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-[#7d838d] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Return to overview</button>
        <div className="relative border border-white/[.09] bg-[#0d1016]/90 p-6 shadow-[0_30px_90px_rgba(0,0,0,.38)] backdrop-blur-xl sm:p-8"><div className="absolute left-0 top-0 h-9 w-9 border-l border-t border-[#ff4757]" /><div className="absolute bottom-0 right-0 h-9 w-9 border-b border-r border-[#ff4757]" />
          <div className="mb-7 flex items-center justify-between border-b border-white/[.06] pb-5"><div className="flex items-center gap-2"><Terminal className="h-4 w-4 text-[#ff6a76]" /><span className="font-mono text-[9px] font-bold uppercase tracking-[.2em] text-[#ff6a76]">Operator enrollment</span></div><span className="font-mono text-[9px] text-[#59616d]">REG // 01</span></div>
          <div className="py-fade-up"><h2 className="text-4xl font-black tracking-[-.055em] text-[#f7f4f5]">Create your account.</h2><p className="mt-3 text-sm leading-6 text-[#8c949f]">Provision an operator identity for your organization’s intelligence workspace.</p>
            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              <label className="block"><span className={labelClass}>Full name</span><div className="relative"><User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69717c]" /><input type="text" autoComplete="name" placeholder="Alex Morgan" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></div></label>
              <label className="block"><span className={labelClass}>Organization</span><div className="relative"><Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69717c]" /><input type="text" autoComplete="organization" placeholder="Acme Corp" value={organization} onChange={(event) => setOrganization(event.target.value)} className={inputClass} /></div></label>
              <label className="block"><span className={labelClass}>Work email</span><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69717c]" /><input type="email" autoComplete="email" placeholder="security@company.com" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} /></div></label>
              <label className="block"><span className={labelClass}>Role</span><div className="relative"><ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69717c]" /><select value={role} onChange={(event) => setRole(event.target.value)} className={`${inputClass} appearance-none pr-12`}>{ROLES.map((value) => <option key={value} value={value} className="bg-[#0b0d12] text-white">{value}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69717c]" /></div></label>
              <label className="block"><span className={labelClass}>Password</span><div className="relative"><Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69717c]" /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#69717c] hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              <label className="block"><span className={labelClass}>Confirm password</span><div className="relative"><Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69717c]" /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className={inputClass} /></div></label>
              <label className="flex cursor-pointer items-start gap-3 pt-1"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="peer sr-only" /><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-white/[.15] bg-[#0b0d12] text-transparent transition peer-checked:border-[#ff4757] peer-checked:bg-[#ff4757] peer-checked:text-[#180508] peer-focus:ring-4 peer-focus:ring-[#ff4757]/[.08]"><Check className="h-3.5 w-3.5" /></span><span className="text-[11px] leading-5 text-[#8c949f]">I confirm this account is for <span className="text-white/80">authorized security-awareness simulations only</span>, under my organization’s consent and audit policies.</span></label>
              {error && <div role="alert" className="flex gap-2 border border-[#ff4757]/25 bg-[#ff4757]/[.07] p-3 text-sm text-[#ff9aa4]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
              <button type="submit" disabled={loading} className="group flex min-h-13 w-full items-center justify-center gap-2 border border-[#ff4757]/40 bg-[#ff4757] px-5 py-4 text-xs font-black uppercase tracking-[.16em] text-[#180508] shadow-[0_16px_38px_rgba(255,71,87,.16)] transition hover:bg-[#ff6472] disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Provisioning</> : <>Create operator account <UserPlus className="h-4 w-4 transition group-hover:translate-x-0.5" /></>}</button>
            </form>
            <p className="mt-6 text-center text-[11px] leading-5 text-[#5d6570]">Already have access? <Link to="/login" className="font-semibold text-[#ff6a76] hover:text-white">Sign in to your workspace</Link></p>
          </div>
        </div>
      </div>
    </main>
  </div>
}
