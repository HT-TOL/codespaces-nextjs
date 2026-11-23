import test from 'node:test'
import assert from 'node:assert/strict'
import { getBearerToken, verifyFirebaseIdToken, FirebaseAuthError } from '../lib/auth/firebase.js'
import { createGithubCodespacesHandoff } from '../lib/providers/github-codespaces.js'
import { assertWorkspaceRole, isUuid } from '../lib/auth/workspace-access.js'

test('Bearer parser accepts a valid Authorization header', () => {
  assert.equal(getBearerToken({ headers: { authorization: 'Bearer abc.def.ghi' } }), 'abc.def.ghi')
})

test('Bearer parser rejects missing and malformed headers', () => {
  assert.equal(getBearerToken({ headers: {} }), null)
  assert.equal(getBearerToken({ headers: { authorization: 'Basic abc' } }), null)
})

test('Firebase verifier rejects malformed tokens without a network request', async () => {
  await assert.rejects(
    verifyFirebaseIdToken('short'),
    (error) => error instanceof FirebaseAuthError && error.status === 401 && error.code === 'INVALID_SESSION',
  )
})

test('GitHub Codespaces provider creates a hand-off, never a provisioned runtime', () => {
  const result = createGithubCodespacesHandoff('octo/repo', 'feature/demo')
  const url = new URL(result.launchUrl)
  assert.equal(url.hostname, 'github.com')
  assert.equal(url.pathname, '/codespaces/new')
  assert.equal(url.searchParams.get('repo'), 'octo/repo')
  assert.equal(result.provisionsWorkspace, false)
  assert.equal(result.state, 'handoff_ready')
})

test('GitHub Codespaces provider rejects malformed repository names', () => {
  assert.throws(() => createGithubCodespacesHandoff('https://evil.example'), { code: 'INVALID_REPOSITORY' })
})


test('workspace membership roles enforce least privilege', () => {
  const viewer = { member_role: 'viewer' }
  const editor = { member_role: 'editor' }
  const owner = { member_role: 'owner' }
  assert.doesNotThrow(() => assertWorkspaceRole(viewer, { uid: 'u1' }, 'viewer'))
  assert.throws(() => assertWorkspaceRole(viewer, { uid: 'u1' }, 'editor'), { code: 'WORKSPACE_NOT_FOUND' })
  assert.doesNotThrow(() => assertWorkspaceRole(editor, { uid: 'u1' }, 'editor'))
  assert.doesNotThrow(() => assertWorkspaceRole(owner, { uid: 'u1' }, 'owner'))
})

test('workspace resource identifiers must be UUIDs', () => {
  assert.equal(isUuid('d9428888-122b-4c4f-9f7e-9a2f5a3f8c10'), true)
  assert.equal(isUuid('not-a-uuid'), false)
  assert.equal(isUuid(['not-a-uuid']), false)
})
