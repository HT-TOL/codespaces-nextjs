import { createRemoteJWKSet, jwtVerify } from 'jose'

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)
const DEFAULT_FIREBASE_PROJECT_ID = 'gen-lang-client-0137515073'

export class FirebaseAuthError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export async function verifyFirebaseIdToken(token, env = process.env) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 8192) {
    throw new FirebaseAuthError(401, 'INVALID_SESSION', 'Firebase ID token is missing or invalid.')
  }

  const projectId = String(env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID).trim()
  if (!projectId) {
    throw new FirebaseAuthError(503, 'AUTH_NOT_CONFIGURED', 'Firebase Authentication is not configured.')
  }

  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      algorithms: ['RS256'],
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    })

    if (typeof payload.sub !== 'string' || payload.sub.length < 1 || payload.sub.length > 128) {
      throw new Error('Invalid Firebase subject')
    }
    const now = Math.floor(Date.now() / 1000)
    if (!Number.isInteger(payload.auth_time) || payload.auth_time > now + 60 || !Number.isInteger(payload.iat) || payload.iat > now + 60) {
      throw new Error('Invalid Firebase authentication timestamps')
    }
    if (payload.firebase?.sign_in_provider === 'anonymous') {
      throw new FirebaseAuthError(403, 'AUTH_PROVIDER_NOT_ALLOWED', 'Anonymous sessions are not allowed.')
    }

    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      emailVerified: payload.email_verified === true,
      provider: typeof payload.firebase?.sign_in_provider === 'string'
        ? payload.firebase.sign_in_provider
        : 'unknown',
    }
  } catch (error) {
    if (error instanceof FirebaseAuthError) throw error
    if (error?.code === 'ERR_JWKS_TIMEOUT' || error?.code === 'ERR_JWKS_FETCH' || error instanceof TypeError) {
      throw new FirebaseAuthError(503, 'AUTH_VERIFICATION_UNAVAILABLE', 'Firebase token verification is temporarily unavailable.')
    }
    throw new FirebaseAuthError(401, 'INVALID_SESSION', 'Firebase session is invalid or expired.')
  }
}

export function getBearerToken(req) {
  const authorization = req.headers?.authorization || ''
  const match = /^Bearer\s+([^\s]+)$/i.exec(String(authorization))
  return match?.[1] || null
}
