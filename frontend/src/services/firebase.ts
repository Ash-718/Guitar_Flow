import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const useEmulator = import.meta.env.VITE_USE_AUTH_EMULATOR === 'true'
const hasRealConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

// A real project isn't required to develop against: VITE_USE_AUTH_EMULATOR=true
// runs auth entirely against the local Firebase Auth emulator (see README).
export const firebaseConfigured = useEmulator || hasRealConfig

const app = initializeApp(hasRealConfig ? firebaseConfig : { apiKey: 'demo-key', projectId: 'demo-project' })

export const auth = getAuth(app)

if (useEmulator) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
}
