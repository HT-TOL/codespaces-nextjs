const fs = require('node:fs/promises')
const path = require('node:path')
const { Pool } = require('pg')

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 5000,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: true },
  })
  try {
    const sql = await fs.readFile(path.join(__dirname, '..', 'migrations/001_workspace_control_plane.sql'), 'utf8')
    await pool.query(`BEGIN;\n${sql}\nCOMMIT;`)
    process.stdout.write('Workspace control-plane migration applied.\n')
  } finally {
    await pool.end()
  }
}
main().catch((error) => {
  process.stderr.write(`Migration failed: ${error.message}\n`)
  process.exitCode = 1
})
