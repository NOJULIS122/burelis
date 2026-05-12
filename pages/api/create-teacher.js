import { getAdminClient } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { vardas, pavarde, email, password, grupe_ids } = req.body
  if (!email || !password || !vardas) {
    return res.status(400).json({ error: 'Trūksta laukų' })
  }

  const admin = getAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) return res.status(400).json({ error: authError.message })

  // Create profile
  const { error: profileError } = await admin.from('profiles').insert({
    id: authData.user.id,
    email,
    vardas,
    pavarde: pavarde || '',
    role: 'teacher',
    grupe_ids: grupe_ids || [],
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return res.status(400).json({ error: profileError.message })
  }

  return res.status(200).json({ success: true })
}
