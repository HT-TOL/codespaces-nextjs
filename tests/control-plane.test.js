import test from 'node:test'
import assert from 'node:assert/strict'
import { getBearerToken, verifyFirebaseIdToken, FirebaseAuthError } from '../lib/auth/firebase.js'
import { assertWorkspaceOwner } from '../lib/auth/workspace-access.js'
import { createGithubCodespacesHandoff } from '../lib/providers/github-codespaces.js'

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

test('workspace ownership is enforced and hides foreign resources', () => {
  assert.equal(assertWorkspaceOwner({ owner_id: 'user-a' }, { uid: 'user-a' }).owner_id, 'user-a')
  assert.throws(
    () => assertWorkspaceOwner({ owner_id: 'user-a' }, { uid: 'user-b' }),
    (error) => error.status === 404 && error.code === 'WORKSPACE_NOT_FOUND',
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
