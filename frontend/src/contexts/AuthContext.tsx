import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { auth, firebaseConfigured } from '../services/firebase'

interface AuthContextValue {
  currentUser: FirebaseUser | null
  loading: boolean
  isConfigured: boolean
  signUp: (email: string, password: string) => Promise<void>
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
    })
    return unsubscribe
  }, [])

  const value: AuthContextValue = {
    currentUser,
    loading,
    isConfigured: firebaseConfigured,
    signUp: async (email, password) => {
      requireFirebase()
      await createUserWithEmailAndPassword(auth, email, password)
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
