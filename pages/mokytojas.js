import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { withAuth } from '../lib/withAuth'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { GRUPES } from '../lib/constants'
import { format, startOfWeek, addDays } from 'date-fns'
import { lt } from 'date-fns/locale'

function MokytojasPage() {
  const { profile } = useAuth()
  const [vaikai, setVaikai] = useState([])
  const [lankomumas, setLankomumas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [selectedGrupe, setSelectedGrupe] = useState(null)
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [msg, setMsg] = useState(null)

  const myGrupes = (profile?.grupe_ids || []).map(id => GRUPES.find(g => g.id === id)).filter(Boolean)

  useEffect(() => {
    if (myGrupes.length > 0 && !selectedGrupe) {
      setSelectedGrupe(myGrupes[0].id)
    }
  }, [profile])

  useEffect(() => {
    if (selectedGrupe) fetchData()
  }, [selectedGrupe, weekStart])

  function getMonday(d) {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    date.setDate(diff)
    date.setHours(0, 0, 0, 0)
    return date
  }

  async function fetchData() {
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

  async function markAttendance(vaikasId, atejo) {
    const key = `${vaikasId}`
    setSaving(s => ({ ...s, [key]: true }))
    const weekStr = format(weekStart, 'yyyy-MM-dd')
    const existing = getLankomumas(vaikasId)
    const pazymejo = `${profile?.vardas || ''} ${profile?.pavarde || ''}`.trim()

    if (existing) {
      if (existing.atejo === atejo) {
        // Deselect
        await supabase.from('lankomumas').delete().eq('id', existing.id)
      } else {
        await supabase.from('lankomumas').update({ atejo, pazymejo }).eq('id', existing.id)
      }
    } else {
      await supabase.from('lankomumas').insert({
        vaikas_id: vaikasId, grupe_id: selectedGrupe, savaite: weekStr, atejo, pazymejo,
      })
    }
    await fetchData()
    setSaving(s => ({ ...s, [key]: false }))
  }

  const grupe = GRUPES.find(g => g.id === selectedGrupe)
  const weekLabel = `${format(weekStart, 'd MMM', { locale: lt })} – ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: lt })}`
  const atejo = lankomumas.filter(l => l.atejo).length
  const neatejo = lankomumas.filter(l => !l.atejo).length

  if (myGrupes.length === 0) {
    return (
      <Layout activeKey="grupe">
        <div className="empty-state" style={{ paddingTop: '4rem' }}>
          <div className="empty-state-icon">🗂️</div>
          <p>Jums dar nepriskirta jokia grupė.</p>
          <p style={{ marginTop: 8 }}>Susisiekite su administratoriumi.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout activeKey="grupe">
      <div className="page-header">
        <div>
          <div className="page-title">Lankomumo žymėjimas</div>
          <div className="page-sub">
            Sveiki, {profile?.vardas}! Pažymėkite šios savaitės lankomumą.
          </div>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {myGrupes.length > 1 && (
          <select style={{ width: 'auto' }} value={selectedGrupe || ''} onChange={e => setSelectedGrupe(e.target.value)}>
            {myGrupes.map(g => <option key={g.id} value={g.id}>{g.burelis} · {g.diena} · {g.laikas}</option>)}
          </select>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate()-7); return d })}>← Ankst.</button>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{weekLabel}</span>
          <button className="btn btn-outline btn-sm" onClick={() => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate()+7); return d })}>Kita →</button>
          <button className="btn btn-outline btn-sm" onClick={() => setWeekStart(getMonday(new Date()))}>Šiandien</button>
        </div>
      </div>

      {grupe && (
        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
          <span className={`badge ${grupe.burelis === 'Minecraft' ? 'badge-mc' : 'badge-rb'}`} style={{ fontSize: 13, padding: '4px 12px' }}>
            {grupe.burelis}
          </span>
          <span className="badge badge-gray" style={{ fontSize: 13, padding: '4px 12px' }}>
            {grupe.diena} · {grupe.laikas}
          </span>
          <span className="badge badge-green" style={{ fontSize: 13, padding: '4px 12px' }}>✓ {atejo} atėjo</span>
          {neatejo > 0 && <span className="badge badge-red" style={{ fontSize: 13, padding: '4px 12px' }}>✗ {neatejo} neatėjo</span>}
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" />Kraunama...</div>
      ) : vaikai.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">👦</div><p>Šioje grupėje vaikų nėra</p></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Vardas pavardė</th>
                <th style={{ textAlign: 'center' }}>Atėjo?</th>
              </tr>
            </thead>
            <tbody>
              {vaikai.map(v => {
                const l = getLankomumas(v.id)
                const isSaving = saving[v.id]
                return (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500, fontSize: 15 }}>{v.vardas} {v.pavarde}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
                        <button
                          onClick={() => markAttendance(v.id, true)}
                          disabled={isSaving}
                          style={{
                            width: 44, height: 44, borderRadius: 10,
                            border: `2px solid ${l?.atejo === true ? 'var(--green)' : 'var(--border)'}`,
                            background: l?.atejo === true ? 'var(--green-bg)' : 'var(--surface)',
                            cursor: 'pointer', fontSize: 20,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                          title="Atėjo"
                        >
                          {isSaving ? '⏳' : '✓'}
                        </button>
                        <button
                          onClick={() => markAttendance(v.id, false)}
                          disabled={isSaving}
                          style={{
                            width: 44, height: 44, borderRadius: 10,
                            border: `2px solid ${l?.atejo === false ? 'var(--red)' : 'var(--border)'}`,
                            background: l?.atejo === false ? 'var(--red-bg)' : 'var(--surface)',
                            cursor: 'pointer', fontSize: 20,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                          title="Neatėjo"
                        >
                          {isSaving ? '⏳' : '✗'}
                        </button>
                        {l ? (
                          <span className={`badge ${l.atejo ? 'badge-green' : 'badge-red'}`}>
                            {l.atejo ? 'Atėjo' : 'Neatėjo'}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Nepažymėta</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text3)' }}>
            Spustelėkite ✓ arba ✗ kad pažymėtumėte. Spustelėkite dar kartą – atšauksite.
          </div>
        </div>
      )}
    </Layout>
  )
}

export default withAuth(MokytojasPage, 'teacher')
