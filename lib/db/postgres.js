import pg from 'pg'

const { Pool } = pg
let pool

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    const error = new Error('Workspace storage is not configured.')
    error.code = 'DATABASE_NOT_CONFIGURED'
    throw error
  }
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: true },
    })
  }
  return pool
}
