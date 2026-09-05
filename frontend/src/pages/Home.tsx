import { useEffect, useState } from 'react'
import { SongResultItem } from '../components/song/SongResultItem'
import { listSongs } from '../services/songService'
import type { SongSummary } from '../types/song'
import { getRecentlyViewed } from '../utils/recentlyViewed'

export function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SongSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const recentlyViewed = getRecentlyViewed()

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true)
      setError(null)
      listSongs(query || undefined)
        .then(setResults)
        .catch(() => setError('Could not reach the GuitarFlow server. Is the backend running?'))
        .finally(() => setLoading(false))
    }, 200)
    return () => clearTimeout(handle)
  }, [query])

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-12 sm:py-20">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: 'var(--text)' }}>
          GuitarFlow
        </h1>
        <p className="mt-2 text-lg" style={{ color: 'var(--text-muted)' }}>
          Play songs your way.
        </p>
      </div>

      <div>
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by song title or artist..."
          aria-label="Search songs"
          className="w-full rounded-xl border px-5 py-3.5 text-lg outline-none focus:ring-2"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!error && loading && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Searching...
          </p>
        )}
        {!error && !loading && results.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No songs found{query ? ` for "${query}"` : ''}.
          </p>
        )}
        {!error &&
          !loading &&
          results.map((song) => (
            <SongResultItem
              key={song.id}
              id={song.id}
              title={song.title}
              artist={song.artist}
              songKey={song.key}
              difficulty={song.difficulty}
            />
          ))}
      </div>

      {!query && recentlyViewed.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Recently viewed
          </h2>
          {recentlyViewed.map((song) => (
            <SongResultItem
              key={song.id}
              id={song.id}
              title={song.title}
              artist={song.artist}
              songKey={song.key}
              difficulty={song.difficulty}
            />
          ))}
        </div>
      )}
    </div>
  )
}
