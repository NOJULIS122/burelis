import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { withAuth } from '../../lib/withAuth'
import { supabase } from '../../lib/supabase'
import { MENESIAI, getMenesioPavadinimas } from '../../lib/constants'

function MokejimasPage() {
  const [vaikai, setVaikai] = useState([])
  const [mokejimas, setMokejimas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [saving, setSaving] = useState({})
  const [msg, setMsg] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [{ data: v }, { data: m }] = await Promise.all([
      supabase.from('vaikai').select('id, vardas, pavarde, grupe_id, email, tel').order('pavarde'),
      supabase.from('mokejimas').select('*'),
    ])
    setVaikai(v || [])
    setMokejimas(m || [])
    setLoading(false)
  }

  function getMokejimas(vaikasId, menuo) {
    return mokejimas.find(m => m.vaikas_id === vaikasId && m.menuo === menuo)
  }

  async function toggleMokejimas(vaikasId, menuo) {
    const key = `${vaikasId}_${menuo}`
    setSaving(s => ({ ...s, [key]: true }))

    const existing = getMokejimas(vaikasId, menuo)
    if (existing) {
      await supabase.from('mokejimas').update({ sumoketa: !existing.sumoketa, data: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('mokejimas').insert({ vaikas_id: vaikasId, menuo, sumoketa: true, data: new Date().toISOString() })
    }
    await fetchAll()
    setSaving(s => ({ ...s, [key]: false }))
  }

  async function setAllMonth(sumoketa) {
    setSaving({ all: true })
    for (const v of vaikai) {
      const existing = getMokejimas(v.id, selectedMonth)
      if (existing) {
        await supabase.from('mokejimas').update({ sumoketa, data: new Date().toISOString() }).eq('id', existing.id)
      } else if (sumoketa) {
        await supabase.from('mokejimas').insert({ vaikas_id: v.id, menuo: selectedMonth, sumoketa: true, data: new Date().toISOString() })
      }
    }
    await fetchAll()
    setSaving({})
    setMsg({ type: 'success', text: sumoketa ? 'Visi pažymėti kaip sumokėję.' : 'Visi pažymėti kaip nesumokėję.' })
    setTimeout(() => setMsg(null), 3000)
  }

  const monthData = vaikai.map(v => ({
    ...v,
    mokejimas: getMokejimas(v.id, selectedMonth),
  }))

  const sumokejo = monthData.filter(v => v.mokejimas?.sumoketa).length
  const nesumokejo = vaikai.length - sumokejo

  return (
    <Layout activeKey="mokejimas">
      <div className="page-header">
        <div>
          <div className="page-title">Mokėjimai</div>
          <div className="page-sub">Rugsėjis–Birželis, kas mėnesis</div>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {MENESIAI.map(m => (
            <button
              key={m.nr}
              className={`btn btn-sm ${selectedMonth === m.nr ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedMonth(m.nr)}
            >
              {m.pavadinimas.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1rem' }}>
        <div className="stat-card">
          <div className="stat-val">{vaikai.length}</div>
          <div className="stat-lbl">Vaikų iš viso</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--green)' }}>{sumokejo}</div>
          <div className="stat-lbl">Sumokėjo</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: nesumokejo > 0 ? 'var(--red)' : 'var(--green)' }}>{nesumokejo}</div>
          <div className="stat-lbl">Nesumokėjo</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setAllMonth(true)}>✅ Visi sumokėjo</button>
        <button className="btn btn-outline btn-sm" onClick={() => setAllMonth(false)}>❌ Atstatyti viską</button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" />Kraunama...</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Vardas pavardė</th>
                <th>El. paštas</th>
                <th>Tel. nr.</th>
                {MENESIAI.map(m => (
                  <th key={m.nr} style={{
                    textAlign: 'center', minWidth: 36,
                    background: m.nr === selectedMonth ? 'var(--accent-bg)' : undefined,
                    color: m.nr === selectedMonth ? 'var(--accent)' : undefined,
                  }}>
                    {m.pavadinimas.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthData.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 500 }}>{v.vardas} {v.pavarde}</td>
                  <td style={{ fontSize: 12 }}>{v.email || '—'}</td>
                  <td style={{ fontSize: 12 }}>{v.tel || '—'}</td>
                  {MENESIAI.map(m => {
                    const mok = getMokejimas(v.id, m.nr)
                    const key = `${v.id}_${m.nr}`
                    return (
                      <td key={m.nr} style={{ textAlign: 'center', background: m.nr === selectedMonth ? 'var(--accent-bg)' : undefined }}>
                        <button
                          onClick={() => toggleMokejimas(v.id, m.nr)}
                          disabled={saving[key] || saving.all}
                          style={{
                            width: 28, height: 28, borderRadius: 6,
                            border: `1px solid ${mok?.sumoketa ? 'var(--green)' : 'var(--border)'}`,
                            background: mok?.sumoketa ? 'var(--green-bg)' : 'transparent',
                            cursor: 'pointer', fontSize: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: 'auto',
                          }}
                          title={mok?.sumoketa ? 'Sumokėta – spustelėkite norėdami atšaukti' : 'Pažymėti kaip sumokėtą'}
                        >
                          {saving[key] ? '⏳' : mok?.sumoketa ? '✓' : ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}

export default withAuth(MokejimasPage, 'admin')
