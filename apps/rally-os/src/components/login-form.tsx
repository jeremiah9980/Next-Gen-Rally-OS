'use client'

import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button, Card } from '@rally/ui'

function mapError(code: string) {
  switch (code) {
    case 'CredentialsSignin':
      return 'Invalid email or password.'
    case 'EmailSignin':
      return 'Could not send the sign-in email. Check the email server configuration.'
    case 'AccessDenied':
      return 'Access denied for this account.'
    default:
      return 'Something went wrong while signing in. Please try again.'
  }
}

const inputClass =
  'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition focus:border-accent-lime/60 focus:ring-2 focus:ring-accent-lime/20'

export function LoginForm() {
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') ?? '/'
  const errorParam = params.get('error')
  const emailSent = params.get('check') === 'email'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState<'credentials' | 'email' | null>(null)
  const [error, setError] = useState<string | null>(errorParam ? mapError(errorParam) : null)

  async function handleCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending('credentials')
    setError(null)

    const result = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
      callbackUrl,
    })

    setPending(null)
    if (result?.error) {
      setError('Invalid email or password.')
    } else if (result?.url) {
      window.location.href = result.url
    }
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setError('Enter your email address first.')
      return
    }
    setPending('email')
    setError(null)
    await signIn('email', { email: email.trim(), callbackUrl })
  }

  return (
    <Card className="w-full max-w-md space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-lime">Rally OS</p>
        <h1 className="text-2xl font-semibold text-text-primary">Coach sign in</h1>
        <p className="text-sm text-text-muted">
          Access your organization&apos;s team portal.
        </p>
      </div>

      {emailSent ? (
        <div className="rounded-2xl border border-accent-lime/40 bg-accent-lime/10 px-4 py-3 text-sm text-accent-lime">
          Check your inbox for a sign-in link.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleCredentials} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="coach@example.com"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-xs font-medium uppercase tracking-wide text-text-muted"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending !== null}>
          {pending === 'credentials' ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={handleMagicLink}
        disabled={pending !== null}
      >
        {pending === 'email' ? 'Sending link…' : 'Email me a sign-in link'}
      </Button>
    </Card>
  )
}
