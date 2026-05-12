import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/auth'

export function withAuth(Component, requiredRole = null) {
  return function ProtectedPage(props) {
    const { user, profile, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (loading) return
      if (!user) { router.replace('/'); return }
      if (requiredRole && profile?.role !== requiredRole) {
        if (profile?.role === 'admin') router.replace('/admin')
        else router.replace('/mokytojas')
      }
    }, [user, profile, loading, router])

    if (loading || !user || !profile) {
      return (
        <div className="loading">
          <div className="spinner"></div>
          Kraunama...
        </div>
      )
    }

    if (requiredRole && profile.role !== requiredRole) return null

    return <Component {...props} />
  }
}
