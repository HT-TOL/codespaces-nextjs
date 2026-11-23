import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCBXsbQWQ_6qmt5rNm-YH_KuWPljFUAUnE',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0137515073.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gen-lang-client-0137515073',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:238460579479:web:147af94c8dd3b1167743d2',
}

export function getFirebaseAuth() {
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.appId) {
    throw new Error('Firebase client configuration is incomplete.')
  }
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  return getAuth(app)
}
