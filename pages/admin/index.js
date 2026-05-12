import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { withAuth } from '../../lib/withAuth'
import { supabase } from '../../lib/supabase'
import { MENESIAI, getMenesioPavadinimas, grupeLabel } from '../../lib/constants'
import { format } from 'date-fns'
import { lt } from 'date-fns/locale'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const [
      { count: vaikuCount },
      { count: mokytojuCount },
      { data: mokejimas },
      { data: nepassigned },
    ] = await Promise.all([
      supabase.from('vaikai').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
      supabase.from('mokejimas').select('*').eq('menuo', currentMonth),
      supabase.from('vaikai').select('id').is('grupe_id', null),
    ])

    const sumokejo = mokejimas?.filter(m => m.sumoketa).length || 0
    const nesumokejo = (vaikuCount || 0) - sumokejo

    setStats({
      vaikuCount: vaikuCount || 0,
      mokytojuCount: mokytojuCount || 0,
      sumokejo,
      nesumokejo: Math.max(0, nesumokejo),
    })
    setLoading(false)
  }

  const dienaLabel = format(now, 'EEEE, d MMMM yyyy', { locale: lt })

  return (
    <Layout activeKey="dashboard">
      <div className="page-header">
        <div>
          <div className="page-title">Suvestinė</div>
          <div className="page-sub" style={{ textTransform: 'capitalize' }}>{dienaLabel}</div>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" />Kraunama...</div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-val">{stats.vaikuCount}</div>
              <div className="stat-lbl">Vaikų iš viso</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">{stats.mokytojuCount}</div>
              <div className="stat-lbl">Mokytojų</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: 'var(--green)' }}>{stats.sumokejo}</div>
              <div className="stat-lbl">Sumokėjo ({getMenesioPavadinimas(currentMonth)})</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: stats.nesumokejo > 0 ? 'var(--red)' : 'var(--green)' }}>
                {stats.nesumokejo}
              </div>
              <div className="stat-lbl">Nesumokėjo ({getMenesioPavadinimas(currentMonth)})</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <QuickLinks />
            <MokejimuSantrauka currentMonth={currentMonth} />
          </div>
        </>
      )}
    </Layout>
  )
}

function QuickLinks() {
  const { useRouter } = require('next/router')
  const router = useRouter()
  return (
    <div className="card">
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Greiti veiksmai</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }} onClick={() => router.push('/admin/vaikai?add=1')}>
          ➕ Pridėti vaiką
        </button>
        <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }} onClick={() => router.push('/admin/mokytojai?add=1')}>
          ➕ Pridėti mokytoją
        </button>
        <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }} onClick={() => router.push('/admin/mokejimas')}>
          💶 Tvarkyti mokėjimus
        </button>
        <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }} onClick={() => router.push('/admin/lankomumas')}>
          📋 Žiūrėti lankomumą
        </button>
      </div>
    </div>
  )
}

function MokejimuSantrauka({ currentMonth }) {
  const [data, setData] = useState([])
  useEffect(() => {
    supabase.from('mokejimas').select('*').then(({ data }) => {
      const santrauka = {}
      data?.forEach(m => {
        if (!santrauka[m.menuo]) santrauka[m.menuo] = { sumokejo: 0, viso: 0 }
        santrauka[m.menuo].viso++
        if (m.sumoketa) santrauka[m.menuo].sumokejo++
      })
      setData(
        MENESIAI.map(m => ({
          ...m,
          ...santrauka[m.nr],
          viso: santrauka[m.nr]?.viso || 0,
          sumokejo: santrauka[m.nr]?.sumokejo || 0,
        }))
      )
    })
  }, [])

  return (
    <div className="card">
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Mokėjimai pagal mėnesį</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map(m => (
          <div key={m.nr} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 0',
            borderBottom: '1px solid var(--border)',
            opacity: m.viso === 0 ? 0.5 : 1,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 600, minWidth: 22, textAlign: 'center',
              background: m.nr === currentMonth ? 'var(--accent)' : 'var(--surface2)',
              color: m.nr === currentMonth ? 'white' : 'var(--text2)',
              borderRadius: 4, padding: '1px 4px',
            }}>{m.nr}</span>
            <span style={{ flex: 1, fontSize: 12 }}>{m.pavadinimas}</span>
            {m.viso > 0 ? (
              <>
                <span style={{ fontSize: 12, color: 'var(--green)' }}>{m.sumokejo} ✓</span>
                {m.viso - m.sumokejo > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--red)' }}>{m.viso - m.sumokejo} ✗</span>
                )}
              </>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default withAuth(AdminDashboard, 'admin')
