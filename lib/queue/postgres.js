import { getDatabase } from '../db/postgres'

export async function claimNextJob(workerId, leaseSeconds = 60) {
  if (!workerId || workerId.length > 128) throw new Error('INVALID_WORKER_ID')
  await recoverExpiredJobs()
  const db = getDatabase()
  const result = await db.query(
    `WITH candidate AS (
       SELECT id FROM workspace_jobs
       WHERE state IN ('queued', 'retry_wait')
         AND available_at <= NOW()
         AND attempt < max_attempts
       ORDER BY available_at ASC, created_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     UPDATE workspace_jobs AS job
     SET state = 'running',
         attempt = job.attempt + 1,
         lease_owner = $1,
         lease_expires_at = NOW() + ($2::int * INTERVAL '1 second'),
         updated_at = NOW()
     FROM candidate
     WHERE job.id = candidate.id
     RETURNING job.*`,
    [workerId, Math.max(10, Math.min(leaseSeconds, 900))],
  )
  return result.rows[0] || null
}

export async function extendJobLease(jobId, workerId, leaseSeconds = 60) {
  const db = getDatabase()
  const result = await db.query(
    `UPDATE workspace_jobs
     SET lease_expires_at = NOW() + ($3::int * INTERVAL '1 second'), updated_at = NOW()
     WHERE id = $1 AND lease_owner = $2 AND state = 'running'
       AND lease_expires_at > NOW() AND cancel_requested_at IS NULL
     RETURNING id, lease_expires_at`,
    [jobId, workerId, Math.max(10, Math.min(leaseSeconds, 900))],
  )
  return result.rows[0] || null
}

export async function completeJob(jobId, workerId) {
  const db = getDatabase()
  const result = await db.query(
    `UPDATE workspace_jobs
     SET state = CASE WHEN cancel_requested_at IS NULL THEN 'succeeded' ELSE 'cancelled' END,
         lease_owner = NULL, lease_expires_at = NULL, updated_at = NOW()
     WHERE id = $1 AND lease_owner = $2 AND state = 'running'
     RETURNING id, state`,
    [jobId, workerId],
  )
  return result.rows[0] || null
}

export async function failJob(jobId, workerId, errorCode = 'JOB_FAILED') {
  const db = getDatabase()
  const result = await db.query(
    `UPDATE workspace_jobs
     SET state = CASE WHEN cancel_requested_at IS NOT NULL THEN 'cancelled' WHEN attempt >= max_attempts THEN 'dead_letter' ELSE 'retry_wait' END,
         available_at = NOW() + (LEAST(300, POWER(2, LEAST(attempt, 8))) * INTERVAL '1 second'),
         last_error_code = $3,
         lease_owner = NULL, lease_expires_at = NULL, updated_at = NOW()
     WHERE id = $1 AND lease_owner = $2 AND state = 'running'
     RETURNING id, state, attempt, available_at`,
    [jobId, workerId, String(errorCode).slice(0, 100)],
  )
  return result.rows[0] || null
}

export async function recoverExpiredJobs() {
  const db = getDatabase()
  const result = await db.query(
    `UPDATE workspace_jobs
     SET state = CASE WHEN cancel_requested_at IS NOT NULL THEN 'cancelled' WHEN attempt >= max_attempts THEN 'dead_letter' ELSE 'retry_wait' END,
         available_at = NOW() + (LEAST(300, POWER(2, LEAST(attempt, 8))) * INTERVAL '1 second'),
         lease_owner = NULL, lease_expires_at = NULL,
         last_error_code = 'LEASE_EXPIRED', updated_at = NOW()
     WHERE state = 'running' AND lease_expires_at <= NOW()
     RETURNING id, state`,
  )
  return result.rows
}

export async function cancelOwnedJob(jobId, ownerId) {
  const db = getDatabase()
  const result = await db.query(
    `UPDATE workspace_jobs
     SET state = CASE WHEN state = 'running' THEN state ELSE 'cancelled' END,
         cancel_requested_at = NOW(),
         lease_owner = CASE WHEN state = 'running' THEN lease_owner ELSE NULL END,
         lease_expires_at = CASE WHEN state = 'running' THEN lease_expires_at ELSE NULL END,
         updated_at = NOW()
     WHERE id = $1 AND owner_id = $2
       AND state IN ('queued', 'retry_wait', 'running')
     RETURNING id, state, cancel_requested_at`,
    [jobId, ownerId],
  )
  return result.rows[0] || null
}

export async function enqueueWorkspaceJob({ workspaceId, ownerId, operation, idempotencyKey, maxAttempts = 5 }) {
  const allowedOperations = new Set(['prepare_workspace', 'sync_repository', 'stop_workspace', 'delete_workspace'])
  if (!allowedOperations.has(operation)) throw new Error('INVALID_JOB_OPERATION')
  if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
    throw new Error('INVALID_IDEMPOTENCY_KEY')
  }
  const db = getDatabase()
  const { rows } = await db.query(
    `INSERT INTO workspace_jobs
      (id, workspace_id, owner_id, operation, state, idempotency_key, max_attempts)
     SELECT gen_random_uuid(), id, owner_id, $3, 'queued', $4, $5
     FROM workspaces
     WHERE id = $1 AND owner_id = $2 AND lifecycle_state <> 'deleted'
     ON CONFLICT (owner_id, idempotency_key) DO NOTHING
     RETURNING id, workspace_id, operation, state, attempt, max_attempts, created_at`,
    [workspaceId, ownerId, operation, idempotencyKey, Math.max(1, Math.min(maxAttempts, 10))],
  )
  if (rows[0]) return rows[0]
  const existing = await db.query(
    'SELECT id, workspace_id, operation, state, attempt, max_attempts, created_at FROM workspace_jobs WHERE owner_id = $1 AND idempotency_key = $2',
    [ownerId, idempotencyKey],
  )
  if (!existing.rows[0]) throw new Error('WORKSPACE_NOT_FOUND')
  if (existing.rows[0].workspace_id !== workspaceId || existing.rows[0].operation !== operation) {
    throw new Error('IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST')
  }
  return existing.rows[0]
}

export async function isCancellationRequested(jobId, workerId) {
  const db = getDatabase()
  const result = await db.query(
    'SELECT cancel_requested_at IS NOT NULL AS requested FROM workspace_jobs WHERE id = $1 AND lease_owner = $2 AND state = $3',
    [jobId, workerId, 'running'],
  )
  return result.rows[0]?.requested === true
}
