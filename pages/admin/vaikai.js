import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { withAuth } from '../../lib/withAuth'
import { supabase } from '../../lib/supabase'
import { GRUPES, grupeLabel } from '../../lib/constants'

function VaikaiPage() {
  const [vaikai, setVaikai] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterGrupe, setFilterGrupe] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const empty = { vardas: '', pavarde: '', klase: '', grupe_id: '', tel: '', email: '', pastabos: '' }
  const [form, setForm] = useState(empty)

  useEffect(() => { fetchVaikai() }, [])

  async function fetchVaikai() {
    const { data } = await supabase.from('vaikai').select('*').order('pavarde')
    setVaikai(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditItem(null)
    setForm(empty)
    setShowModal(true)
  }

  function openEdit(v) {
    setEditItem(v)
    setForm({
      vardas: v.vardas, pavarde: v.pavarde, klase: v.klase || '',
      grupe_id: v.grupe_id || '', tel: v.tel || '',
      email: v.email || '', pastabos: v.pastabos || '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.vardas || !form.pavarde) return
    setSaving(true)
    let error
    if (editItem) {
      ({ error } = await supabase.from('vaikai').update(form).eq('id', editItem.id))
    } else {
      ({ error } = await supabase.from('vaikai').insert(form))
    }
    setSaving(false)
    if (error) { setMsg({ type: 'error', text: 'Klaida: ' + error.message }); return }
    setShowModal(false)
    fetchVaikai()
    setMsg({ type: 'success', text: editItem ? 'Pakeitimai išsaugoti.' : 'Vaikas pridėtas.' })
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleDelete(id) {
    if (!confirm('Ištrinti šį vaiką?')) return
    await supabase.from('vaikai').delete().eq('id', id)
    fetchVaikai()
  }

  const filtered = vaikai.filter(v => {
    const q = search.toLowerCase()
    const matchQ = !q || (v.vardas + ' ' + v.pavarde).toLowerCase().includes(q)
    const matchG = !filterGrupe || v.grupe_id === filterGrupe
    return matchQ && matchG
  })

  const grupesBadge = (id) => {
    const g = GRUPES.find(x => x.id === id)
    if (!g) return null
    const cls = g.burelis === 'Minecraft' ? 'badge-mc' : 'badge-rb'
    return <span className={`badge ${cls}`}>{g.burelis} · {g.diena} {g.laikas}</span>
  }

  return (
    <Layout activeKey="vaikai">
      <div className="page-header">
        <div>
          <div className="page-title">Vaikai</div>
          <div className="page-sub">{vaikai.length} įrašų iš viso</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ Pridėti vaiką</button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <span className="search-icon">🔍</span>
          <input placeholder="Ieškoti..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ width: 'auto', minWidth: 180 }} value={filterGrupe} onChange={e => setFilterGrupe(e.target.value)}>
          <option value="">Visos grupės</option>
          {GRUPES.map(g => <option key={g.id} value={g.id}>{g.burelis} · {g.diena} {g.laikas}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" />Kraunama...</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👦</div>
              <p>Vaikų nerasta</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Vardas pavardė</th>
                    <th>Klasė</th>
                    <th>Grupė</th>
                    <th>El. paštas (tėvai)</th>
                    <th>Tel. nr.</th>
                    <th>Pastabos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 500 }}>{v.vardas} {v.pavarde}</td>
                      <td>{v.klase || '—'}</td>
                      <td>{v.grupe_id ? grupesBadge(v.grupe_id) : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                      <td style={{ fontSize: 12 }}>{v.email || '—'}</td>
                      <td style={{ fontSize: 12 }}>{v.tel || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.pastabos || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(v)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">{editItem ? 'Redaguoti vaiką' : 'Pridėti vaiką'}</div>

            <div className="form-row">
              <div className="form-group">
                <label>Vardas *</label>
                <input value={form.vardas} onChange={e => setForm({ ...form, vardas: e.target.value })} placeholder="Vardas" />
              </div>
              <div className="form-group">
                <label>Pavardė *</label>
                <input value={form.pavarde} onChange={e => setForm({ ...form, pavarde: e.target.value })} placeholder="Pavardė" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Klasė</label>
                <input value={form.klase} onChange={e => setForm({ ...form, klase: e.target.value })} placeholder="pvz. 4a" />
              </div>
              <div className="form-group">
                <label>Grupė</label>
                <select value={form.grupe_id} onChange={e => setForm({ ...form, grupe_id: e.target.value })}>
                  <option value="">— Nepriskirta —</option>
                  {GRUPES.map(g => (
                    <option key={g.id} value={g.id}>{g.burelis} · {g.diena} · {g.laikas}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: '1rem', fontSize: 12, color: 'var(--text2)' }}>
              🔒 Tėvų kontaktai matomi tik administratoriui
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tėvų el. paštas</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="pastas@gmail.com" />
              </div>
              <div className="form-group">
                <label>Tėvų tel. nr.</label>
                <input value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} placeholder="+370..." />
              </div>
            </div>

            <div className="form-group">
              <label>Pastabos</label>
              <textarea rows={3} value={form.pastabos} onChange={e => setForm({ ...form, pastabos: e.target.value })} placeholder="Papildoma informacija..." />
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

export default withAuth(VaikaiPage, 'admin')
