const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/

export function githubCodespacesCapabilities() {
  return {
    mode: 'handoff',
    configured: true,
    workspaceProvisioning: false,
    stopWorkspace: false,
    deleteWorkspace: false,
  }
}

export function createGithubCodespacesHandoff(repository, ref = 'main') {
  if (typeof repository !== 'string' || !REPOSITORY_PATTERN.test(repository)) {
    const error = new Error('A valid owner/repository value is required.')
    error.status = 400
    error.code = 'INVALID_REPOSITORY'
    throw error
  }
  const safeRef = typeof ref === 'string' && /^[A-Za-z0-9._/-]{1,128}$/.test(ref) ? ref : 'main'
  const url = new URL('https://github.com/codespaces/new')
  url.searchParams.set('repo', repository)
  url.searchParams.set('ref', safeRef)
  return {
    provider: 'github-codespaces',
    state: 'handoff_ready',
    launchUrl: url.toString(),
    provisionsWorkspace: false,
  }
}
