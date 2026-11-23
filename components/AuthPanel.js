import { useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { getFirebaseAuth } from '../lib/firebase/client'

export default function AuthPanel() {
  const [auth, setAuth] = useState(null)
  const [user, setUser] = useState(null)
  const [session, setSession] = useState('checking')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let unsubscribe = () => {}
    try {
      const instance = getFirebaseAuth()
      setAuth(instance)
      getRedirectResult(instance).catch(() => {
        setError('Google sign-in could not be completed. Check Firebase authorized domains and OAuth settings.')
      })
      unsubscribe = onAuthStateChanged(instance, async (nextUser) => {
        setUser(nextUser)
        if (!nextUser) {
          setSession('signed-out')
          return
        }
        setSession('checking')
        try {
          const idToken = await nextUser.getIdToken()
          const response = await fetch('/api/session', {
            method: 'GET',
            headers: { Authorization: `Bearer ${idToken}` },
            cache: 'no-store',
          })
          const payload = await response.json()
          if (!response.ok || payload.authenticated !== true) {
            throw new Error(payload.error || 'SESSION_VERIFICATION_FAILED')
          }
          setSession('verified')
          setError('')
        } catch {
          setSession('unverified')
          setError('Firebase sign-in succeeded, but the server could not verify this session.')
        }
      })
    } catch {
      setSession('unconfigured')
      setError('Firebase client configuration is missing. Configure the NEXT_PUBLIC_FIREBASE_* values.')
    }
    return () => unsubscribe()
  }, [])

  async function handleSignIn() {
    if (!auth || busy) return
    setBusy(true)
    setError('')
    try {
      await signInWithRedirect(auth, new GoogleAuthProvider())
    } catch {
      setError('Unable to start Google sign-in. Check the Firebase provider and authorized domains.')
      setBusy(false)
    }
  }

  async function handleSignOut() {
    if (!auth || busy) return
    setBusy(true)
    try {
      await signOut(auth)
      setSession('signed-out')
    } catch {
      setError('Sign-out failed. Retry the operation.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-panel" aria-live="polite">
      <div className="auth-panel-copy">
        <span className="auth-kicker">ACCOUNT / IDENTITY</span>
        <b>{user?.email || 'OCodeJS account'}</b>
        <small>
          {session === 'verified' ? 'Firebase session verified by server' :
            session === 'checking' ? 'Checking identity session…' :
              session === 'unverified' ? 'Signed in · server verification failed' :
                session === 'unconfigured' ? 'Authentication not configured' : 'Not signed in'}
        </small>
      </div>
      {user ? (
        <button className="auth-button secondary" type="button" onClick={handleSignOut} disabled={busy}>
          {busy ? 'Working…' : 'Sign out'}
        </button>
      ) : (
        <button className="auth-button" type="button" onClick={handleSignIn} disabled={busy || !auth}>
          {busy ? 'Redirecting…' : 'Continue with Google'}
        </button>
      )}
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
    </section>
  )
}
