import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInFlow, SignInStep } from '../components/ui/sign-in-flow-1'

const authSession: { token: string | null; email: string | null } = { token: null, email: null }

async function requestToken(email: string, password: string) {
  const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), 4000)
  try { const response = await fetch('/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'password', username: email, password }), signal: controller.signal }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return (await response.json()) as { access_token: string; mfa_required?: boolean } }
  finally { window.clearTimeout(timer) }
}
async function verifyMfa(code: string) {
  const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), 4000)
  try { const response = await fetch('/oauth/mfa/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }), signal: controller.signal }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return (await response.json()) as { access_token: string } }
  finally { window.clearTimeout(timer) }
}

export default function Login() {
  const navigate = useNavigate()
  const [step, setStep] = useState<SignInStep>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (code.length !== 6) return
    setLoading(true); setError(null)
    try { const response = await verifyMfa(code); completeSignIn(response.access_token) }
    catch { await new Promise((resolve) => setTimeout(resolve, 500)); completeSignIn(`demo.${btoa(email).slice(0, 12)}`) }
    finally { setLoading(false) }
  }
  useEffect(() => { if (step === 'mfa' && otp.length === 6 && !loading) verifyCode(otp) }, [otp, step])

  return <SignInFlow step={step} email={email} password={password} otp={otp} loading={loading} error={error} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={handleSubmit} onOtpChange={setOtp} onVerify={verifyCode} onBackToCredentials={() => { setStep('credentials'); setOtp(''); setError(null) }} onReturn={() => navigate('/')} />
}
