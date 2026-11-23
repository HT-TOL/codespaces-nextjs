import { randomUUID } from 'node:crypto'
import { FirebaseAuthError, getBearerToken, verifyFirebaseIdToken } from '../../../../../lib/auth/firebase'
import { getDatabase } from '../../../../../lib/db/postgres'
import { assertWorkspaceRole, isUuid } from '../../../../../lib/auth/workspace-access'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Vary', 'Authorization')
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
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

  if (req.method === 'GET') {
    try {
      const access = await db.query(
        'SELECT w.id, m.role AS member_role FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE w.id = $1 AND m.user_id = $2 AND w.lifecycle_state <> $3',
        [req.query.id, principal.uid, 'deleted'],
      )
      assertWorkspaceRole(access.rows[0], principal, 'viewer')
      const members = await db.query(
        'SELECT user_id, role, created_at FROM workspace_members WHERE workspace_id = $1 ORDER BY CASE role WHEN $2 THEN 0 WHEN $3 THEN 1 ELSE 2 END, created_at ASC',
        [req.query.id, 'owner', 'editor'],
      )
      return res.status(200).json({ members: members.rows })
    } catch (error) {
      if (error.status === 404) return res.status(404).json({ error: error.code })
      return res.status(503).json({ error: 'WORKSPACE_STORAGE_UNAVAILABLE' })
    }
  }

  const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : ''
  const role = req.body?.role
  if (!userId || userId.length > 128 || !/^[A-Za-z0-9:_-]+$/.test(userId)) {
    return res.status(400).json({ error: 'INVALID_FIREBASE_UID' })
  }
  if (!['editor', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'INVALID_MEMBER_ROLE' })
  }

  if (userId === principal.uid) return res.status(400).json({ error: 'OWNER_ROLE_CANNOT_BE_CHANGED_HERE' })

  let client
  try {
    client = await db.connect()
    await client.query('BEGIN')
    const access = await client.query(
      'SELECT w.id, m.role AS member_role FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE w.id = $1 AND m.user_id = $2 AND w.lifecycle_state <> $3 FOR UPDATE OF w',
      [req.query.id, principal.uid, 'deleted'],
    )
    assertWorkspaceRole(access.rows[0], principal, 'owner')
    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [req.query.id, userId, role],
    )
    await client.query(
      'INSERT INTO workspace_audit_events (id, actor_id, workspace_id, action, outcome, metadata) VALUES ($1, $2, $3, $4, $5, $6::jsonb)',
      [randomUUID(), principal.uid, req.query.id, 'workspace.member_role_changed', 'accepted', JSON.stringify({ targetUserId: userId, role })],
    )
    await client.query('COMMIT')
    return res.status(200).json({ member: { userId, role } })
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    if (error.status === 404) return res.status(404).json({ error: error.code })
    return res.status(503).json({ error: 'WORKSPACE_STORAGE_UNAVAILABLE' })
  } finally {
    client?.release()
  }
}
