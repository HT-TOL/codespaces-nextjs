export function assertWorkspaceOwner(workspace, principal) {
  if (!workspace || !principal?.uid || workspace.owner_id !== principal.uid) {
    const error = new Error('Workspace not found.')
    error.status = 404
    error.code = 'WORKSPACE_NOT_FOUND'
    throw error
  }
  return workspace
}
