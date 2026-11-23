import { FirebaseAuthError, getBearerToken, verifyFirebaseIdToken } from '../../../../../lib/auth/firebase'
import { getDatabase } from '../../../../../lib/db/postgres'
import { cancelOwnedJob } from '../../../../../lib/queue/postgres'
import { isUuid } from '../../../../../lib/auth/workspace-access'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Vary', 'Authorization')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!isUuid(req.query.id)) return res.status(400).json({ error: 'INVALID_JOB_ID' })

  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' })

  let principal
  try {
    principal = await verifyFirebaseIdToken(token)
  } catch (error) {
    if (error instanceof FirebaseAuthError) return res.status(error.status).json({ error: error.code })
    return res.status(503).json({ error: 'AUTH_VERIFICATION_UNAVAILABLE' })
  }

  try {
    getDatabase()
    const job = await cancelOwnedJob(req.query.id, principal.uid)
    if (!job) return res.status(404).json({ error: 'JOB_NOT_FOUND_OR_NOT_CANCELLABLE' })
    return res.status(202).json({ job })
  } catch (error) {
    return res.status(503).json({ error: error.code || 'QUEUE_UNAVAILABLE' })
  }
}
