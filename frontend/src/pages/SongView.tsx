import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { SectionBlock } from '../components/song/SectionBlock'
import { StrummingPatternView } from '../components/song/StrummingPatternView'
import { getSong } from '../services/songService'
import type { Song } from '../types/song'
import { getDistinctChords } from '../utils/songChords'
import { recordRecentlyViewed } from '../utils/recentlyViewed'

export function SongView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [song, setSong] = useState<Song | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setSong(null)
    setError(null)
    getSong(id)
      .then((s) => {
        setSong(s)
        recordRecentlyViewed({ id: s.id, title: s.title, artist: s.artist, key: s.key, difficulty: s.difficulty })
      })
      .catch(() => setError('Song not found.'))
  }, [id])

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        <Link to="/" className="mt-2 inline-block underline" style={{ color: 'var(--accent)' }}>
          Back to search
        </Link>
      </div>
    )
  }

  if (!song) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center" style={{ color: 'var(--text-muted)' }}>
        Loading song...
      </div>
    )
  }

  const distinctChords = getDistinctChords(song)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
            {song.title}
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
            {song.artist}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>
            Key <strong style={{ color: 'var(--text)' }}>{song.key}</strong>
          </span>
          <span>
            BPM <strong style={{ color: 'var(--text)' }}>{song.bpm}</strong>
          </span>
          <span>
            Capo <strong style={{ color: 'var(--text)' }}>{song.capo}</strong>
          </span>
          <span className="capitalize">
            Difficulty <strong style={{ color: 'var(--text)' }}>{song.difficulty}</strong>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate(`/songs/${song.id}/play`)}>
            ▶ Play
          </Button>
          <Button disabled title="Coming in a later phase">
            Edit
          </Button>
          <Button disabled title="Coming in a later phase">
            Transpose
          </Button>
          <Button disabled title="Coming in a later phase">
            Simplify
          </Button>
          <Button disabled title="Coming in a later phase">
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {distinctChords.map((chord) => (
          <span
            key={chord}
            className="rounded-md border px-2.5 py-1 text-sm font-bold"
            style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
          >
            {chord}
          </span>
        ))}
      </div>

      <StrummingPatternView pattern={song.strumming_pattern.pattern} bpm={song.strumming_pattern.bpm} />

      <div className="flex flex-col gap-6 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        {song.sections.map((section, i) => (
          <SectionBlock key={i} section={section} />
        ))}
      </div>
    </div>
  )
}
