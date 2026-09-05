import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { auth, firebaseConfigured } from '../services/firebase'
import { syncUser } from '../services/userService'

interface AuthContextValue {
  currentUser: FirebaseUser | null
  loading: boolean
  isConfigured: boolean
  signUp: (email: string, password: string, displayName?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  getIdToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function requireFirebase() {
  if (!firebaseConfigured) {
    throw new Error(
      'Firebase is not configured yet. Add your project keys to frontend/.env (see .env.example).',
    )
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
      // Keep the backend's user record in sync with Firebase on every sign-in
      // (including a restored session after a page refresh), not just at
      // signup - a version save relies on app.users already having a row
      // for this firebase_uid.
      if (user) {
        syncUser(user.displayName ?? '', user.email ?? '').catch(() => {})
      }
    })
    return unsubscribe
  }, [])

  const value: AuthContextValue = {
    currentUser,
    loading,
    isConfigured: firebaseConfigured,
    signUp: async (email, password, displayName) => {
      requireFirebase()
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) {
        await updateProfile(credential.user, { displayName })
      }
      // Firebase's own onAuthStateChanged fires with the *pre-update* user
      // object in some cases, so sync explicitly here with the name we just
      // set rather than relying solely on the listener above.
      await syncUser(displayName ?? '', email).catch(() => {})
    },
    signIn: async (email, password) => {
      requireFirebase()
      await signInWithEmailAndPassword(auth, email, password)
    },
    signOut: async () => {
      await firebaseSignOut(auth)
    },
    getIdToken: async () => {
      if (!currentUser) return null
      return currentUser.getIdToken()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
