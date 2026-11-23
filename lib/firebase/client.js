import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gen-lang-client-0137515073',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export function getFirebaseAuth() {
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.appId) {
    throw new Error('Firebase client configuration is incomplete.')
  }
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  return getAuth(app)
}
