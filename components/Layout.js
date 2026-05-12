import { useRouter } from 'next/router'
import { useAuth, isAdmin } from '../lib/auth'

const ADMIN_NAV = [
  { key: 'dashboard', label: 'Suvestinė', icon: '◈', href: '/admin' },
  { key: 'vaikai', label: 'Vaikai', icon: '👦', href: '/admin/vaikai' },
  { key: 'mokytojai', label: 'Mokytojai', icon: '🧑‍🏫', href: '/admin/mokytojai' },
  { key: 'lankomumas', label: 'Lankomumas', icon: '📋', href: '/admin/lankomumas' },
  { key: 'mokejimas', label: 'Mokėjimai', icon: '💶', href: '/admin/mokejimas' },
]

const TEACHER_NAV = [
  { key: 'grupe', label: 'Mano grupė', icon: '📋', href: '/mokytojas' },
]

export default function Layout({ children, activeKey }) {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const admin = isAdmin(profile)
  const nav = admin ? ADMIN_NAV : TEACHER_NAV

  return (
    <div>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">🎮 Būrelio sistema</div>
          <div className="sidebar-logo-sub">Minecraft & Roblox</div>
        </div>
        <nav className="sidebar-nav">
          {nav.map(item => (
            <button
              key={item.key}
              className={`nav-item ${activeKey === item.key ? 'active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{profile?.vardas} {profile?.pavarde}</strong>
            {admin ? 'Administratorius' : 'Mokytojas'}
          </div>
          <button
            className="btn btn-outline btn-sm"
            style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
            onClick={signOut}
          >
            Atsijungti
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
