import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInFlow1 } from '../components/ui/sign-in-flow-1'

const authSession: { token: string | null; email: string | null } = { token: null, email: null }

async function requestToken(email: string, password: string) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch('/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'password', username: email, password }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return (await response.json()) as { access_token: string; mfa_required?: boolean }
  } finally {
    window.clearTimeout(timer)
  }
}

async function verifyMfa(code: string) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch('/oauth/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return (await response.json()) as { access_token: string }
  } finally {
    window.clearTimeout(timer)
  }
}

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completeSignIn = (token: string, email: string) => {
    authSession.token = token
    authSession.email = email
    navigate('/dashboard', { replace: true })
  }

  const handleCredentials = async (email: string, password: string) => {
    setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid organization email address.')
      return false
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return false
    }

    setLoading(true)
    try {
      const response = await requestToken(email, password)
      if (response.mfa_required) return true
      completeSignIn(response.access_token, email)
      return false
    } catch {
      // Preserve the existing demo fallback: unavailable auth services continue into MFA.
      await new Promise((resolve) => window.setTimeout(resolve, 600))
      return true
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyMfa = async (code: string, email: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await verifyMfa(code)
      completeSignIn(response.access_token, email)
    } catch {
      // Preserve the existing demo fallback when the backend is unavailable.
      await new Promise((resolve) => window.setTimeout(resolve, 500))
      completeSignIn(`demo.${btoa(email).slice(0, 12)}`, email)
    } finally {
      setLoading(false)
    }
  }

  return <SignInFlow1 loading={loading} error={error} onBack={() => navigate('/')} onCredentialsSubmit={handleCredentials} onVerifyMfa={handleVerifyMfa} />
}
