import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { withAuth } from '../../lib/withAuth'
import { supabase } from '../../lib/supabase'
import { GRUPES } from '../../lib/constants'
import { format, startOfWeek, addDays } from 'date-fns'
import { lt } from 'date-fns/locale'

function LankoumasPage() {
  const [vaikai, setVaikai] = useState([])
  const [lankomumas, setLankomumas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGrupe, setSelectedGrupe] = useState(GRUPES[0].id)
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))

  function getMonday(d) {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    date.setDate(diff)
    date.setHours(0, 0, 0, 0)
    return date
  }

  useEffect(() => { fetchAll() }, [selectedGrupe, weekStart])

  async function fetchAll() {
    setLoading(true)
    const weekStr = format(weekStart, 'yyyy-MM-dd')
    const [{ data: v }, { data: l }] = await Promise.all([
      supabase.from('vaikai').select('id, vardas, pavarde').eq('grupe_id', selectedGrupe).order('pavarde'),
      supabase.from('lankomumas').select('*').eq('grupe_id', selectedGrupe).eq('savaite', weekStr),
    ])
    setVaikai(v || [])
    setLankomumas(l || [])
    setLoading(false)
  }

  function getLankomumas(vaikasId) {
    return lankomumas.find(l => l.vaikas_id === vaikasId)
  }

  const atejo = lankomumas.filter(l => l.atejo).length
  const grupe = GRUPES.find(g => g.id === selectedGrupe)
  const weekStr = format(weekStart, 'yyyy-MM-dd')
  const weekLabel = `${format(weekStart, 'd MMM', { locale: lt })} – ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: lt })}`

  return (
    <Layout activeKey="lankomumas">
      <div className="page-header">
        <div>
          <div className="page-title">Lankomumas</div>
          <div className="page-sub">Peržiūra (žymėti gali mokytojai)</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={{ width: 'auto' }} value={selectedGrupe} onChange={e => setSelectedGrupe(e.target.value)}>
          {GRUPES.map(g => <option key={g.id} value={g.id}>{g.burelis} · {g.diena} · {g.laikas}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate()-7); return d })}>← Ankst.</button>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{weekLabel}</span>
          <button className="btn btn-outline btn-sm" onClick={() => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate()+7); return d })}>Kita →</button>
          <button className="btn btn-outline btn-sm" onClick={() => setWeekStart(getMonday(new Date()))}>Šiandien</button>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" />Kraunama...</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {grupe?.burelis} · {grupe?.diena} · {grupe?.laikas}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>
              Atėjo: <strong style={{ color: 'var(--green)' }}>{atejo}</strong> / {vaikai.length}
            </span>
          </div>
          {vaikai.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📋</div><p>Šioje grupėje vaikų nėra</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Vardas pavardė</th>
                  <th style={{ textAlign: 'center' }}>Statusas</th>
                  <th>Pažymėjo</th>
                  <th>Laikas</th>
                </tr>
              </thead>
              <tbody>
                {vaikai.map(v => {
                  const l = getLankomumas(v.id)
                  return (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 500 }}>{v.vardas} {v.pavarde}</td>
                      <td style={{ textAlign: 'center' }}>
                        {l ? (
                          l.atejo
                            ? <span className="badge badge-green">✓ Atėjo</span>
                            : <span className="badge badge-red">✗ Neatėjo</span>
                        ) : (
                          <span className="badge badge-gray">— Nepažymėta</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>{l?.pazymejo || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                        {l?.created_at ? format(new Date(l.created_at), 'HH:mm') : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Layout>
  )
}

export default withAuth(LankoumasPage, 'admin')
