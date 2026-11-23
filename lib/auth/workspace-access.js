const ROLE_LEVEL = { viewer: 1, editor: 2, owner: 3 }

export function assertWorkspaceRole(workspace, principal, minimumRole = 'viewer') {
  const actualRole = workspace?.member_role
  if (!workspace || !principal?.uid || !ROLE_LEVEL[actualRole] || ROLE_LEVEL[actualRole] < ROLE_LEVEL[minimumRole]) {
    const error = new Error('Workspace not found.')
    error.status = 404
    error.code = 'WORKSPACE_NOT_FOUND'
    throw error
  }
  return workspace
}

export function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
