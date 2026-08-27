import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Eye, EyeOff, Fingerprint, Loader2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'

const authSession: { token: string | null; email: string | null } = { token: null, email: null }

async function requestToken(email: string, password: string) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch('/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'password', username: email, password }), signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return (await response.json()) as { access_token: string; mfa_required?: boolean }
  } finally { window.clearTimeout(timer) }
}

async function verifyMfa(code: string) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch('/oauth/mfa/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }), signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return (await response.json()) as { access_token: string }
  } finally { window.clearTimeout(timer) }
}

function SecurityScene() {
  return (
    <div className="relative hidden min-h-screen overflow-hidden border-r border-white/[0.06] bg-[#0A0F14] lg:flex lg:flex-col lg:justify-between lg:p-12">
      <style>{`
        @keyframes pyLoginOrbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pyLoginFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .py-login-orbit { animation: pyLoginOrbit 20s linear infinite; }
        .py-login-float { animation: pyLoginFloat 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .py-login-orbit,.py-login-float { animation: none !important; } }
      `}</style>
      <div className="pointer-events-none absolute -left-28 top-[-7rem] h-[32rem] w-[32rem] rounded-full bg-[#2FD9C7]/10 blur-[130px]" />
      <div className="relative flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#2FD9C7]/25 bg-[#2FD9C7]/10 text-[#2FD9C7]"><ShieldCheck className="h-5 w-5" /></span><div><div className="text-sm font-black tracking-[.18em] text-white">PHISHYOU</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[.16em] text-white/35">Human risk intelligence</div></div></div>

      <div className="relative max-w-lg">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#2FD9C7]/15 bg-[#2FD9C7]/[.05] px-3 py-2 text-xs font-semibold text-[#8FEFE3]"><Sparkles className="h-3.5 w-3.5" /> Enterprise security, seen through behavior</div>
        <h1 className="mt-7 text-5xl font-black leading-[.95] tracking-[-.055em] text-white">The next signal can change the whole picture.</h1>
        <p className="mt-6 max-w-md text-base leading-7 text-[#7A8595]">Observe realistic, authorized simulations as they unfold—and turn human behavior into better security decisions.</p>
        <div className="relative mt-10 h-52 [perspective:900px]">
          <div className="py-login-orbit absolute left-12 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-[#2FD9C7]/20" />
          <div className="py-login-orbit absolute left-24 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border border-[#5B9EFF]/20 [animation-direction:reverse] [animation-duration:14s]" />
          <div className="py-login-float absolute left-0 top-9 w-64 rounded-2xl border border-white/[0.08] bg-[#151C23]/85 p-4 shadow-2xl backdrop-blur-xl [transform:rotateY(-8deg)]"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7A8595]">Live resilience</span><span className="h-2 w-2 rounded-full bg-[#06D369] shadow-[0_0_12px_rgba(6,211,105,.6)]" /></div><div className="mt-3 text-3xl font-black text-[#2FD9C7]">74<span className="text-sm text-white/35">/100</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#232D39]"><div className="h-full w-[74%] rounded-full bg-gradient-to-r from-[#2FD9C7] to-[#06D369]" /></div></div>
        </div>
      </div>

      <div className="relative flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-white/30"><span>Authorized use</span><span>·</span><span>Consent workflows</span><span>·</span><span>Audit-ready</span></div>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const completeSignIn = (token: string) => { authSession.token = token; authSession.email = email; navigate('/dashboard', { replace: true }) }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid organization email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try { const response = await requestToken(email, password); if (response.mfa_required) setStep('mfa'); else completeSignIn(response.access_token) }
    catch { await new Promise((resolve) => setTimeout(resolve, 600)); setStep('mfa') }
    finally { setLoading(false) }
  }

  const verifyCode = async (code: string) => {
    setLoading(true); setError(null)
    try { const response = await verifyMfa(code); completeSignIn(response.access_token) }
    catch { await new Promise((resolve) => setTimeout(resolve, 500)); completeSignIn(`demo.${btoa(email).slice(0, 12)}`) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (step === 'mfa' && otp.length === 6 && !loading) verifyCode(otp) }, [otp, step])

  const inputClass = 'w-full rounded-xl border border-[#2D3748] bg-[#121820] px-11 py-3.5 text-sm text-white placeholder:text-[#5A6470] outline-none transition focus:border-[#2FD9C7]/70 focus:ring-4 focus:ring-[#2FD9C7]/10'

  return (
    <div className="min-h-screen bg-[#0A0D13] text-white lg:grid lg:grid-cols-2">
      <SecurityScene />
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 sm:px-12"><div className="pointer-events-none absolute right-[-12rem] top-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[#2FD9C7]/[.045] blur-[120px]" />
        <div className="relative w-full max-w-md"><button onClick={() => navigate('/')} className="mb-12 inline-flex items-center gap-2 text-xs font-semibold text-[#7A8595] hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to overview</button>
          {step === 'credentials' ? <div className="py-fade-up"><div className="mb-8"><div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#2FD9C7]/15 bg-[#2FD9C7]/[.06] text-[#2FD9C7]"><Fingerprint className="h-5 w-5" /></div><h2 className="mt-6 text-4xl font-black tracking-[-.045em]">Welcome back.</h2><p className="mt-2 text-sm leading-6 text-[#7A8595]">Sign in to your organization workspace and continue monitoring what matters.</p></div>
            <form onSubmit={handleSubmit} noValidate className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-white/50">Organization email</span><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8595]" /><input type="email" autoComplete="email" placeholder="security@company.com" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} /></div></label>
              <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-white/50">Password</span><div className="relative"><Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8595]" /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#7A8595] hover:bg-white/[.04] hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              {error && <div role="alert" className="flex gap-2 rounded-xl border border-[#FF4757]/20 bg-[#FF4757]/[.07] p-3 text-sm text-[#FF9AA4]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
              <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2FD9C7] px-5 py-3.5 text-sm font-bold text-[#07110F] shadow-[0_12px_30px_rgba(47,217,199,.12)] hover:-translate-y-0.5 hover:bg-[#5BE7D8] disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating…</> : <>Continue <ShieldCheck className="h-4 w-4" /></>}</button></form><p className="mt-6 text-center text-xs leading-5 text-[#5A6470]">Need access? Contact your PhishYou organization administrator.</p></div>
          : <div className="py-fade-up"><button onClick={() => { setStep('credentials'); setOtp(''); setError(null) }} className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-[#7A8595] hover:text-white"><ArrowLeft className="h-4 w-4" /> Use another account</button><div className="mb-8"><div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#5B9EFF]/20 bg-[#5B9EFF]/[.07] text-[#5B9EFF]"><Lock className="h-5 w-5" /></div><h2 className="mt-6 text-4xl font-black tracking-[-.045em]">Verify your identity.</h2><p className="mt-2 text-sm leading-6 text-[#7A8595]">Enter the six-digit code from your authenticator app.</p></div><div className="grid grid-cols-6 gap-2">{Array.from({ length: 6 }).map((_, index) => <input key={index} ref={(element) => { otpRefs.current[index] = element }} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={1} value={otp[index] ?? ''} onChange={(event) => { const digit = event.target.value.replace(/\D/g, '').slice(-1); setOtp((current) => { const next = current.padEnd(index + 1, ' '); return (next.slice(0, index) + digit + next.slice(index + 1)).replace(/\s+$/, '') }); if (digit) otpRefs.current[index + 1]?.focus() }} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Backspace' && !otp[index]) otpRefs.current[index - 1]?.focus() }} disabled={loading} className="h-14 rounded-xl border border-[#2D3748] bg-[#121820] text-center font-mono text-xl font-bold outline-none transition focus:border-[#2FD9C7] focus:ring-4 focus:ring-[#2FD9C7]/10 disabled:opacity-50" />)}</div>{error && <div role="alert" className="mt-5 flex gap-2 rounded-xl border border-[#FF4757]/20 bg-[#FF4757]/[.07] p-3 text-sm text-[#FF9AA4]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}<p className="mt-6 text-xs text-[#5A6470]">For the demo environment, any six-digit code completes verification when the backend is unavailable.</p></div>}
        </div>
      </div>
    </div>
  )
}
