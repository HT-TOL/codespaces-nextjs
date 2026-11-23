import { randomUUID } from 'node:crypto'
import { FirebaseAuthError, getBearerToken, verifyFirebaseIdToken } from '../../../../lib/auth/firebase'
import { getDatabase } from '../../../../lib/db/postgres'
import { createGithubCodespacesHandoff } from '../../../../lib/providers/github-codespaces'

const TEMPLATES = new Set(['nextjs', 'react-vite', 'node', 'python'])

async function authenticate(req, res) {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ error: 'AUTH_REQUIRED' })
    return null
  }
  try {
    return await verifyFirebaseIdToken(token)
  } catch (error) {
    if (error instanceof FirebaseAuthError) {
      res.status(error.status).json({ error: error.code })
      return null
    }
    res.status(503).json({ error: 'AUTH_VERIFICATION_UNAVAILABLE' })
    return null
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Vary', 'Authorization')

  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const principal = await authenticate(req, res)
  if (!principal) return

  let db
  try {
    db = getDatabase()
  } catch (error) {
    return res.status(503).json({ error: error.code || 'STORAGE_UNAVAILABLE' })
  }

  if (req.method === 'GET') {
    try {
      const result = await db.query(
        'SELECT w.id, w.repository, w.git_ref, w.template, w.provider, w.lifecycle_state, w.created_at, w.updated_at, m.role AS member_role FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE m.user_id = $1 AND w.lifecycle_state <> $2 ORDER BY w.created_at DESC LIMIT 100',
        [principal.uid, 'deleted'],
      )
      return res.status(200).json({ workspaces: result.rows })
    } catch {
      return res.status(503).json({ error: 'WORKSPACE_STORAGE_UNAVAILABLE' })
    }
  }

  const idempotencyKey = String(req.headers['idempotency-key'] || '')
  if (idempotencyKey.length < 16 || idempotencyKey.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey)) {
    return res.status(400).json({ error: 'INVALID_IDEMPOTENCY_KEY' })
  }

  const body = req.body || {}
  const repository = typeof body.repository === 'string' ? body.repository.trim() : ''
  const gitRef = typeof body.ref === 'string' && /^[A-Za-z0-9._/-]{1,128}$/.test(body.ref) ? body.ref : 'main'
  const template = typeof body.template === 'string' ? body.template : 'nextjs'
  if (!/^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(repository)) {
    return res.status(400).json({ error: 'INVALID_REPOSITORY' })
  }
  if (!TEMPLATES.has(template)) {
    return res.status(400).json({ error: 'INVALID_TEMPLATE' })
  }

  const handoff = createGithubCodespacesHandoff(repository, gitRef)
  const workspaceId = randomUUID()
  let client
  try {
    client = await db.connect()
    await client.query('BEGIN')
    const inserted = await client.query(
      `INSERT INTO workspaces
        (id, owner_id, repository, git_ref, template, provider, lifecycle_state, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, 'github-codespaces', 'handoff_ready', $6)
       ON CONFLICT (owner_id, idempotency_key) DO NOTHING
       RETURNING id, repository, git_ref, template, provider, lifecycle_state, created_at`,
      [workspaceId, principal.uid, repository, gitRef, template, idempotencyKey],
    )

    let workspace = inserted.rows[0]
    let created = Boolean(workspace)
    if (!workspace) {
      const existing = await client.query(
        'SELECT id, repository, git_ref, template, provider, lifecycle_state, created_at FROM workspaces WHERE owner_id = $1 AND idempotency_key = $2 FOR UPDATE',
        [principal.uid, idempotencyKey],
      )
      workspace = existing.rows[0]
      if (!workspace) throw new Error('IDEMPOTENCY_CONFLICT')
      if (workspace.repository !== repository || workspace.git_ref !== gitRef || workspace.template !== template) {
        await client.query('ROLLBACK')
        return res.status(409).json({ error: 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST' })
      }
    } else {
      await client.query(
        'INSERT INTO workspace_audit_events (id, actor_id, workspace_id, action, outcome, metadata) VALUES ($1, $2, $3, $4, $5, $6::jsonb)',
        [randomUUID(), principal.uid, workspace.id, 'workspace.handoff_requested', 'accepted', JSON.stringify({ repository, ref: gitRef, template })],
      )
    }

    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT (workspace_id, user_id) DO NOTHING`,
      [workspace.id, principal.uid],
    )
    await client.query('COMMIT')
    return res.status(created ? 202 : 200).json({
      workspace,
      provider: handoff,
      idempotentReplay: !created,
    })
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    if (error.message === 'IDEMPOTENCY_CONFLICT') return res.status(409).json({ error: error.message })
    return res.status(503).json({ error: 'WORKSPACE_STORAGE_UNAVAILABLE' })
  } finally {
    client?.release()
  }
}
