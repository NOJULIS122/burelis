import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, profile } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  if (profile) {
    if (profile.role === 'admin') router.replace('/admin')
    else router.replace('/mokytojas')
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await signIn(email, password)
    if (err) {
      setError('Neteisingas el. paštas arba slaptažodis.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎮</div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Būrelio sistema</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
            Minecraft & Roblox užsiėmimai
          </p>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label>El. paštas</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jusu@pastas.lt"
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Slaptažodis</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              {loading ? 'Jungiamasi...' : 'Prisijungti'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, marginTop: '1.5rem' }}>
          Prisijungimą gausite iš administratoriaus
        </p>
      </div>
    </div>
  )
}
