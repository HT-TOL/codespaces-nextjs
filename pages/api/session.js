import { FirebaseAuthError, getBearerToken, verifyFirebaseIdToken } from '../../lib/auth/firebase'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Vary', 'Authorization')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const token = getBearerToken(req)
  if (!token) {
    return res.status(401).json({ error: 'AUTH_REQUIRED' })
  }

  try {
    const user = await verifyFirebaseIdToken(token)
    return res.status(200).json({ authenticated: true, user })
  } catch (error) {
    if (error instanceof FirebaseAuthError) {
      return res.status(error.status).json({ error: error.code })
    }
    return res.status(503).json({ error: 'AUTH_VERIFICATION_UNAVAILABLE' })
  }
}
