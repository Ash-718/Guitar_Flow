import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Signup() {
  const { signUp, isConfigured } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signUp(email, password, name)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
        Create an account
      </h1>

      {!isConfigured && (
        <p className="rounded-md p-3 text-sm" style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>
          Firebase isn't configured on this deployment yet, so sign-up is disabled. See
          frontend/.env.example.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border px-3 py-2"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border px-3 py-2"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border px-3 py-2"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !isConfigured}
          className="rounded-md py-2 font-semibold disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
        >
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Already have an account? <Link to="/login" className="font-medium underline">Log in</Link>
      </p>
    </div>
  )
}
