import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChordEditor } from '../components/chords/ChordEditor'
import { SectionBlock } from '../components/song/SectionBlock'
import { StrummingPatternView } from '../components/song/StrummingPatternView'
import { Button } from '../components/ui/Button'
import { getSong } from '../services/songService'
import type { Song } from '../types/song'
import { applyChordOverrides, overrideKey } from '../utils/applyChordOverrides'
import { recordRecentlyViewed } from '../utils/recentlyViewed'
import { getDistinctChords } from '../utils/songChords'

type Tab = 'original' | 'mine'

interface EditingTarget {
  sectionIndex: number
  lineIndex: number
  chordIndex: number
  currentChord: string
}

export function SongView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [song, setSong] = useState<Song | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [tab, setTab] = useState<Tab>('original')
  const [editMode, setEditMode] = useState(false)
  const [chordOverrides, setChordOverrides] = useState<Map<string, string>>(new Map())
  const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(null)

  useEffect(() => {
    if (!id) return
    setSong(null)
    setError(null)
    setTab('original')
    setEditMode(false)
    setChordOverrides(new Map())
    getSong(id)
      .then((s) => {
        setSong(s)
        recordRecentlyViewed({ id: s.id, title: s.title, artist: s.artist, key: s.key, difficulty: s.difficulty })
      })
      .catch(() => setError('Song not found.'))
  }, [id])

  const myVersion = useMemo(
    () => (song ? applyChordOverrides(song, chordOverrides) : null),
    [song, chordOverrides],
  )
  const displayedSong = tab === 'mine' ? myVersion : song

  function handleEditClick() {
    setEditMode((prev) => !prev)
    setTab('mine')
  }

  function handleChordClick(sectionIndex: number, lineIndex: number, chordIndex: number, chord: string) {
    if (!editMode) return
    setEditingTarget({ sectionIndex, lineIndex, chordIndex, currentChord: chord })
  }

  function handleChordSelected(newChord: string) {
    if (!editingTarget) return
    const key = overrideKey(editingTarget.sectionIndex, editingTarget.lineIndex, editingTarget.chordIndex)
    setChordOverrides((prev) => {
      const next = new Map(prev)
      next.set(key, newChord)
      return next
    })
    setTab('mine')
    setEditingTarget(null)
  }

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

  if (!song || !displayedSong) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center" style={{ color: 'var(--text-muted)' }}>
        Loading song...
      </div>
    )
  }

  const distinctChords = getDistinctChords(displayedSong)
  const hasEdits = chordOverrides.size > 0

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
          <Button variant={editMode ? 'primary' : 'secondary'} onClick={handleEditClick}>
            {editMode ? 'Done editing' : 'Edit'}
          </Button>
          <Button disabled title="Coming in a later phase">
            Transpose
          </Button>
          <Button disabled title="Coming in a later phase">
            Simplify
          </Button>
          <Button disabled={!hasEdits} title={hasEdits ? undefined : 'Make an edit first'}>
            Save
          </Button>
        </div>

        {editMode && (
          <p className="text-sm" style={{ color: 'var(--accent)' }}>
            Tap any chord below to change it.
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 self-start rounded-lg border p-1" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => setTab('original')}
          className="rounded-md px-3 py-1.5 text-sm font-semibold"
          style={{
            background: tab === 'original' ? 'var(--surface-raised)' : 'transparent',
            color: tab === 'original' ? 'var(--text)' : 'var(--text-muted)',
          }}
        >
          Original
        </button>
        <button
          type="button"
          onClick={() => setTab('mine')}
          className="rounded-md px-3 py-1.5 text-sm font-semibold"
          style={{
            background: tab === 'mine' ? 'var(--surface-raised)' : 'transparent',
            color: tab === 'mine' ? 'var(--text)' : 'var(--text-muted)',
          }}
        >
          My Version{hasEdits ? ' •' : ''}
        </button>
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
        {displayedSong.sections.map((section, i) => (
          <SectionBlock
            key={i}
            section={section}
            sectionIndex={i}
            onChordClick={editMode && tab === 'mine' ? handleChordClick : undefined}
          />
        ))}
      </div>

      {editingTarget && (
        <ChordEditor
          currentChord={editingTarget.currentChord}
          onSelect={handleChordSelected}
          onClose={() => setEditingTarget(null)}
        />
      )}
    </div>
  )
}
