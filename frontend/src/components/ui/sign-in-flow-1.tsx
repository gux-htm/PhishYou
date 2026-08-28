import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Fingerprint, Loader2, Lock, Mail, ShieldCheck, Sparkles, Terminal } from 'lucide-react'

type AuthStep = 'credentials' | 'mfa'

interface SignInFlowProps {
  loading?: boolean
  error?: string | null
  onBack: () => void
  onCredentialsSubmit: (email: string, password: string) => void | Promise<void>
  onVerifyMfa: (code: string, email: string) => void | Promise<void>
  onStepChange?: (step: AuthStep) => void
}

/**
 * Adapted from the supplied 21st.dev Sign In Flow 1 visual direction.
 * This version intentionally uses the application's existing React/Vite stack
 * and existing password + MFA contract instead of inventing a new auth provider.
 */
export function SignInFlow1({ loading = false, error, onBack, onCredentialsSubmit, onVerifyMfa, onStepChange }: SignInFlowProps) {
  const [step, setStep] = useState<AuthStep>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const transitionStep = (next: AuthStep) => {
    setStep(next)
    onStepChange?.(next)
  }

  useEffect(() => {
    if (step === 'mfa') window.setTimeout(() => otpRefs.current[0]?.focus(), 120)
  }, [step])

  const submitCredentials = async (event: FormEvent) => {
    event.preventDefault()
    await onCredentialsSubmit(email.trim(), password)
  }

  const updateOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setOtp((current) => {
      const next = [...current]
      next[index] = digit
      const code = next.join('')
      if (code.length === 6 && next.every(Boolean)) void onVerifyMfa(code, email.trim())
      return next
    })
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07080c] text-[#f4f0f1]">
      <style>{`
        @keyframes pyDotPulse { 0%,100% { opacity:.25 } 50% { opacity:.75 } }
        @keyframes pyScan { from { transform: translateY(-115%) } to { transform: translateY(115%) } }
        @keyframes pyOrbit { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes pyReveal { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .py-auth-dotfield { background-image: radial-gradient(circle at center, rgba(255,74,99,.42) 1px, transparent 1.35px); background-size: 19px 19px; mask-image: radial-gradient(ellipse at center, black 8%, transparent 70%); }
        .py-auth-reveal { animation: pyReveal .55s cubic-bezier(.22,1,.36,1) both; }
        .py-auth-orbit { animation: pyOrbit 18s linear infinite; }
        .py-auth-scan { animation: pyScan 7s ease-in-out infinite; }
        .py-auth-pulse { animation: pyDotPulse 3.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .py-auth-orbit,.py-auth-scan,.py-auth-pulse,.py-auth-reveal { animation:none!important } }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 py-auth-dotfield opacity-60" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-[#ff365f]/45 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ff365f]/[.08]" />
      <div aria-hidden="true" className="py-auth-orbit pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ff365f]/[.12] border-t-[#ff365f]/65" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/2 overflow-hidden opacity-30"><div className="py-auth-scan absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-[#ff365f]/12 to-transparent blur-2xl" /></div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7 sm:px-10">
        <button onClick={onBack} className="group inline-flex items-center gap-3 text-left">
          <span className="relative flex h-9 w-9 items-center justify-center border border-[#ff365f]/35 bg-[#ff365f]/[.07] text-[#ff6678]"><ShieldCheck className="h-4 w-4" /></span>
          <span><span className="block font-mono text-xs font-black tracking-[.3em] text-white">PHISHYOU</span><span className="mt-1 block font-mono text-[8px] uppercase tracking-[.2em] text-[#79616a]">AI security intelligence</span></span>
        </button>
        <div className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[.18em] text-[#7d6970] sm:flex"><span className="h-1.5 w-1.5 bg-[#ff365f] py-auth-pulse" /> Secure operator access</div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-5 pb-16 sm:px-8">
        <section className="py-auth-reveal w-full max-w-[34rem]">
          <div className="mb-7 flex items-center justify-between border-b border-white/[.08] pb-4">
            <button onClick={step === 'credentials' ? onBack : () => { setOtp(['', '', '', '', '', '']); transitionStep('credentials') }} className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.17em] text-[#8b777d] transition hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> {step === 'credentials' ? 'Return to overview' : 'Change identity'}</button>
            <span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#ff6678]">ACCESS // {step === 'credentials' ? '01' : '02'}</span>
          </div>

          <div className="relative overflow-hidden border border-white/[.11] bg-[#0b0c11]/90 p-6 shadow-[0_32px_100px_rgba(0,0,0,.48)] backdrop-blur-xl sm:p-9">
            <span aria-hidden="true" className="absolute left-0 top-0 h-11 w-11 border-l border-t border-[#ff365f]" />
            <span aria-hidden="true" className="absolute bottom-0 right-0 h-11 w-11 border-b border-r border-[#ff365f]" />
            <span aria-hidden="true" className="absolute right-0 top-0 h-px w-20 bg-[#ff365f]/70" />

            <div className="relative mb-9 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center border border-[#ff365f]/25 bg-[#ff365f]/[.06] text-[#ff6a76]">{step === 'credentials' ? <Terminal className="h-4 w-4" /> : <Fingerprint className="h-4 w-4" />}</span>
              <div><div className="font-mono text-[9px] font-bold uppercase tracking-[.2em] text-[#ff6678]">{step === 'credentials' ? 'Operator authentication' : 'Identity verification'}</div><div className="mt-1 font-mono text-[8px] uppercase tracking-[.14em] text-[#697078]">Authorized environment / encrypted session</div></div>
            </div>

            {step === 'credentials' ? (
              <form onSubmit={submitCredentials} noValidate>
                <h1 className="text-4xl font-black leading-none tracking-[-.06em] text-[#f7f4f5] sm:text-5xl">Enter the<br /><span className="text-[#ff5268]">signal layer.</span></h1>
                <p className="mt-5 max-w-md text-sm leading-6 text-[#90949b]">Authenticate to access your organization’s AI-powered human-threat intelligence workspace.</p>

                <div className="mt-8 space-y-5">
                  <label className="block"><span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#7f858d]">Organization email</span><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#727983]" /><input required type="email" autoComplete="email" placeholder="security@company.com" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border border-white/[.11] bg-[#08090d] px-11 py-4 text-sm text-white outline-none transition placeholder:text-[#515761] focus:border-[#ff5268]/75 focus:ring-4 focus:ring-[#ff365f]/[.08]" /></div></label>
                  <label className="block"><span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#7f858d]">Password</span><div className="relative"><Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#727983]" /><input required type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-white/[.11] bg-[#08090d] px-11 py-4 pr-12 text-sm text-white outline-none transition placeholder:text-[#515761] focus:border-[#ff5268]/75 focus:ring-4 focus:ring-[#ff365f]/[.08]" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#727983] transition hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
                </div>

                {error && <div role="alert" className="mt-5 border border-[#ff4757]/25 bg-[#ff4757]/[.07] px-4 py-3 text-sm text-[#ff9aa4]">{error}</div>}

                <button type="submit" disabled={loading} className="group mt-7 flex w-full items-center justify-center gap-2 border border-[#ff5268]/45 bg-[#ff4757] px-5 py-4 text-xs font-black uppercase tracking-[.17em] text-[#170507] shadow-[0_16px_42px_rgba(255,71,87,.18)] transition hover:bg-[#ff6472] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating</> : <>Enter command layer <Sparkles className="h-4 w-4 transition group-hover:scale-110" /></>}</button>
              </form>
            ) : (
              <div>
                <h1 className="text-4xl font-black leading-none tracking-[-.06em] text-[#f7f4f5]">Verify your<br /><span className="text-[#ff5268]">identity signal.</span></h1>
                <p className="mt-5 text-sm leading-6 text-[#90949b]">Enter the six-digit code from your authenticator to complete access.</p>
                <div className="mt-8 grid grid-cols-6 gap-2 sm:gap-3">{otp.map((digit, index) => <input key={index} ref={(element) => { otpRefs.current[index] = element }} value={digit} onChange={(event) => updateOtp(index, event.target.value)} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus() }} inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} maxLength={1} disabled={loading} className="h-12 border border-white/[.12] bg-[#08090d] text-center font-mono text-lg font-bold outline-none transition focus:border-[#ff5268] focus:ring-4 focus:ring-[#ff365f]/[.08] disabled:opacity-50 sm:h-14" />)}</div>
                {error && <div role="alert" className="mt-5 border border-[#ff4757]/25 bg-[#ff4757]/[.07] px-4 py-3 text-sm text-[#ff9aa4]">{error}</div>}
                <div className="mt-7 border-t border-white/[.06] pt-5 font-mono text-[9px] uppercase tracking-[.14em] text-[#697078]">MFA channel active / awaiting verification</div>
              </div>
            )}
          </div>

          <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-[.13em] text-[#62676e]">Authorized simulations only · auditable by design</p>
        </section>
      </main>
    </div>
  )
}
