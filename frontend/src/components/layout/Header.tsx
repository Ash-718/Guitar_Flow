import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePreferences } from '../../contexts/PreferencesContext'

export function Header() {
  const { darkMode, setDarkMode } = usePreferences()
  const { currentUser, signOut } = useAuth()

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 sm:px-6"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md text-sm"
          style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
        >
          G
        </span>
        <span style={{ color: 'var(--text)' }}>GuitarFlow</span>
      </Link>

      <div className="flex items-center gap-3">
        {currentUser && (
          <Link
            to="/saved"
            className="hidden text-sm font-medium sm:inline"
            style={{ color: 'var(--text-muted)' }}
          >
            My Songs
          </Link>
        )}

        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
          style={{ color: 'var(--text-muted)' }}
        >
          {darkMode ? '☀' : '☾'}
        </button>

        {currentUser ? (
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-md px-3 py-1.5 text-sm font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            Log out
          </button>
        ) : (
          <Link
            to="/login"
            className="rounded-md px-3 py-1.5 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  )
}
