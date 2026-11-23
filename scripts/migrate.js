import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { getDatabase } from '../lib/db/postgres'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const migration = await readFile(resolve(root, 'migrations/001_workspace_control_plane.sql'), 'utf8')
const db = getDatabase()
try {
  await db.query(migration)
  process.stdout.write('Workspace control-plane migration applied.\n')
} finally {
  await db.end()
}
