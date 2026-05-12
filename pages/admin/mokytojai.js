import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { withAuth } from '../../lib/withAuth'
import { supabase, getAdminClient } from '../../lib/supabase'
import { GRUPES } from '../../lib/constants'

function MokytojaiPage() {
  const [mokytojai, setMokytojai] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const empty = { vardas: '', pavarde: '', email: '', password: '', grupe_ids: [] }
  const [form, setForm] = useState(empty)

  useEffect(() => { fetchMokytojai() }, [])

  async function fetchMokytojai() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'teacher').order('pavarde')
    setMokytojai(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditItem(null)
    setForm(empty)
    setShowModal(true)
  }

  function openEdit(m) {
    setEditItem(m)
    setForm({ vardas: m.vardas, pavarde: m.pavarde, email: m.email, password: '', grupe_ids: m.grupe_ids || [] })
    setShowModal(true)
  }

  function toggleGrupe(id) {
    setForm(f => ({
      ...f,
      grupe_ids: f.grupe_ids.includes(id)
        ? f.grupe_ids.filter(x => x !== id)
        : [...f.grupe_ids, id],
    }))
  }

  async function handleSave() {
    if (!form.vardas || !form.email) { setMsg({ type: 'error', text: 'Vardas ir el. paštas privalomi.' }); return }
    setSaving(true)
    try {
      if (editItem) {
        const { error } = await supabase.from('profiles').update({
          vardas: form.vardas, pavarde: form.pavarde, grupe_ids: form.grupe_ids,
        }).eq('id', editItem.id)
        if (error) throw error
      } else {
        if (!form.password) { setMsg({ type: 'error', text: 'Slaptažodis privalomas.' }); setSaving(false); return }
        // Create via API route
        const res = await fetch('/api/create-teacher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error)
      }
      setShowModal(false)
      fetchMokytojai()
      setMsg({ type: 'success', text: editItem ? 'Pakeitimai išsaugoti.' : 'Mokytojas sukurtas.' })
    } catch (e) {
      setMsg({ type: 'error', text: 'Klaida: ' + e.message })
    }
    setSaving(false)
    setTimeout(() => setMsg(null), 4000)
  }

  async function handleDelete(id) {
    if (!confirm('Ištrinti šį mokytoją?')) return
    await fetch('/api/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetchMokytojai()
  }

  return (
    <Layout activeKey="mokytojai">
      <div className="page-header">
        <div>
          <div className="page-title">Mokytojai</div>
          <div className="page-sub">{mokytojai.length} mokytojų</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ Pridėti mokytoją</button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" />Kraunama...</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {mokytojai.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🧑‍🏫</div><p>Mokytojų dar nėra</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Vardas pavardė</th>
                  <th>El. paštas</th>
                  <th>Priskirtinos grupės</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {mokytojai.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 500 }}>{m.vardas} {m.pavarde}</td>
                    <td style={{ fontSize: 12 }}>{m.email}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(m.grupe_ids || []).map(gid => {
                          const g = GRUPES.find(x => x.id === gid)
                          if (!g) return null
                          return <span key={gid} className={`badge ${g.burelis === 'Minecraft' ? 'badge-mc' : 'badge-rb'}`}>{g.burelis} {g.diena} {g.laikas}</span>
                        })}
                        {(!m.grupe_ids || m.grupe_ids.length === 0) && <span style={{ color: 'var(--text3)', fontSize: 12 }}>Nepriskirta</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">{editItem ? 'Redaguoti mokytoją' : 'Pridėti mokytoją'}</div>

            <div className="form-row">
              <div className="form-group">
                <label>Vardas *</label>
                <input value={form.vardas} onChange={e => setForm({ ...form, vardas: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Pavardė</label>
                <input value={form.pavarde} onChange={e => setForm({ ...form, pavarde: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label>El. paštas *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!!editItem} />
            </div>

            {!editItem && (
              <div className="form-group">
                <label>Slaptažodis *</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 simboliai" />
              </div>
            )}

            <div className="form-group">
              <label>Priskirtos grupės</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {GRUPES.map(g => {
                  const checked = form.grupe_ids.includes(g.id)
                  return (
                    <label key={g.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px',
                      border: `1px solid ${checked ? (g.burelis === 'Minecraft' ? 'var(--mc)' : 'var(--rb)') : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      background: checked ? (g.burelis === 'Minecraft' ? 'var(--mc-bg)' : 'var(--rb-bg)') : 'transparent',
                      textTransform: 'none',
                      letterSpacing: 0,
                      fontWeight: 400,
                      fontSize: 13,
                      color: 'var(--text)',
                    }}
                      onClick={() => toggleGrupe(g.id)}
                    >
                      <input type="checkbox" checked={checked} onChange={() => {}} style={{ width: 'auto', accentColor: 'var(--accent)' }} />
                      <span className={`badge ${g.burelis === 'Minecraft' ? 'badge-mc' : 'badge-rb'}`}>{g.burelis}</span>
                      {g.diena} · {g.laikas}
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Atšaukti</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saugoma...' : 'Išsaugoti'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default withAuth(MokytojaiPage, 'admin')
