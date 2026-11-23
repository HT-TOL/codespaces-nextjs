export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  // This endpoint reports implementation state, not provider availability.
  // Never return credential values or infer authentication from variable presence.
  return res.status(200).json({
    service: 'ocodejs-codespaces',
    phase: 'control-plane-foundation',
    providers: {
      githubCodespaces: {
        mode: 'handoff',
        configured: false,
        workspaceProvisioning: false,
        note: 'Launch hand-off only; provider API integration is not configured.',
      },
      ocodejsRuntime: {
        mode: 'disabled',
        configured: false,
        workspaceProvisioning: false,
      },
    },
    capabilities: {
      dashboard: true,
      sessionVerification: true,
      workspaceMetadataApi: true,
      durableQueuePrimitives: true,
      workspaceProvisioning: false,
      terminal: false,
      filesystem: false,
      previewProxy: false,
      aiAgentExecution: false,
    },
  })
}
