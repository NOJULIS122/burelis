import { getAdminClient } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { id } = req.body
  if (!id) return res.status(400).json({ error: 'ID privalomas' })

  const admin = getAdminClient()
  await admin.from('profiles').delete().eq('id', id)
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return res.status(400).json({ error: error.message })
  return res.status(200).json({ success: true })
}
