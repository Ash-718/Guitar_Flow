import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { getMe, updatePreferences } from '../services/userService'

const DARK_MODE_KEY = 'guitarflow:darkMode'
const SCROLL_SPEED_KEY = 'guitarflow:scrollSpeed'
const DEFAULT_SCROLL_SPEED = 40

interface PreferencesContextValue {
  darkMode: boolean
  setDarkMode: (value: boolean) => void
  scrollSpeed: number
  setScrollSpeed: (value: number) => void
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined)

function readInitialDarkMode(): boolean {
  const stored = localStorage.getItem(DARK_MODE_KEY)
  if (stored !== null) return stored === 'true'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
}

function readInitialScrollSpeed(): number {
  const stored = localStorage.getItem(SCROLL_SPEED_KEY)
  const parsed = stored ? Number(stored) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SCROLL_SPEED
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()
  const [darkMode, setDarkModeState] = useState(readInitialDarkMode)
  const [scrollSpeed, setScrollSpeedState] = useState(readInitialScrollSpeed)
  const hasLoadedRemote = useRef(false)

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    localStorage.setItem(DARK_MODE_KEY, String(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem(SCROLL_SPEED_KEY, String(scrollSpeed))
  }, [scrollSpeed])

  // Once per login, pull the user's saved preferences from the backend so
  // they follow the guitarist across devices instead of just this browser.
  useEffect(() => {
    if (!currentUser || hasLoadedRemote.current) return
    hasLoadedRemote.current = true
    getMe().then((user) => {
      if (!user) return
      setDarkModeState(user.preferences.dark_mode)
      setScrollSpeedState(user.preferences.scroll_speed)
    })
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    updatePreferences({ dark_mode: darkMode }).catch(() => {})
  }, [darkMode, currentUser])

  const setScrollSpeed = (value: number) => {
    setScrollSpeedState(value)
    if (currentUser) {
      updatePreferences({ scroll_speed: value }).catch(() => {})
    }
  }

  return (
    <PreferencesContext.Provider
      value={{ darkMode, setDarkMode: setDarkModeState, scrollSpeed, setScrollSpeed }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider')
  return ctx
}
