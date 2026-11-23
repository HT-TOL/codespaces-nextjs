import { FirebaseAuthError, getBearerToken, verifyFirebaseIdToken } from '../../../../lib/auth/firebase'
import { getDatabase } from '../../../../lib/db/postgres'
import { assertWorkspaceRole, isUuid } from '../../../../lib/auth/workspace-access'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Vary', 'Authorization')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!isUuid(req.query.id)) return res.status(400).json({ error: 'INVALID_WORKSPACE_ID' })

  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' })

  let principal
  try {
    principal = await verifyFirebaseIdToken(token)
  } catch (error) {
    if (error instanceof FirebaseAuthError) return res.status(error.status).json({ error: error.code })
    return res.status(503).json({ error: 'AUTH_VERIFICATION_UNAVAILABLE' })
  }

  let db
  try {
    db = getDatabase()
  } catch (error) {
    return res.status(503).json({ error: error.code || 'STORAGE_UNAVAILABLE' })
  }

  try {
    const result = await db.query(
      'SELECT w.id, w.owner_id, w.repository, w.git_ref, w.template, w.provider, w.lifecycle_state, w.created_at, w.updated_at, m.role AS member_role FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE w.id = $1 AND m.user_id = $2 AND w.lifecycle_state <> $3',
      [req.query.id, principal.uid, 'deleted'],
    )
    const workspace = result.rows[0]
    assertWorkspaceRole(workspace, principal, 'viewer')
    delete workspace.owner_id
    return res.status(200).json({ workspace })
  } catch (error) {
    if (error.status === 404) return res.status(404).json({ error: error.code })
    return res.status(503).json({ error: 'WORKSPACE_STORAGE_UNAVAILABLE' })
  }
}
