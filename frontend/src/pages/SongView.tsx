import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChordEditor } from '../components/chords/ChordEditor'
import { SimplifyPreview, type SimplifyDiffEntry } from '../components/chords/SimplifyPreview'
import { CapoControl } from '../components/song/CapoControl'
import { SectionBlock } from '../components/song/SectionBlock'
import { StrummingPatternView } from '../components/song/StrummingPatternView'
import { TransposeControl } from '../components/song/TransposeControl'
import { Button } from '../components/ui/Button'
import { getSong } from '../services/songService'
import { simplifyChords, transposeChords } from '../services/theoryService'
import type { Song } from '../types/song'
import { applyChordOverrides, overrideKey } from '../utils/applyChordOverrides'
import { flattenChordStrings, getChordOccurrences, reconstructWithChords } from '../utils/flattenChords'
import { recordRecentlyViewed } from '../utils/recentlyViewed'
import { getDistinctChords } from '../utils/songChords'

type Tab = 'original' | 'mine'

interface EditingTarget {
  sectionIndex: number
  lineIndex: number
  chordIndex: number
  currentChord: string
}

interface PendingSimplification {
  diff: SimplifyDiffEntry[]
  overrides: { key: string; chord: string }[]
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

  const [showTranspose, setShowTranspose] = useState(false)
  const [transposeSemitones, setTransposeSemitones] = useState(0)
  const [capoSetting, setCapoSetting] = useState(0)
  const [shapesSong, setShapesSong] = useState<Song | null>(null)
  const [transposedKey, setTransposedKey] = useState<string | null>(null)

  const [pendingSimplify, setPendingSimplify] = useState<PendingSimplification | null>(null)

  useEffect(() => {
    if (!id) return
    setSong(null)
    setError(null)
    setTab('original')
    setEditMode(false)
    setChordOverrides(new Map())
    setShowTranspose(false)
    setTransposeSemitones(0)
    setShapesSong(null)
    setTransposedKey(null)
    setPendingSimplify(null)
    getSong(id)
      .then((s) => {
        setSong(s)
        setCapoSetting(s.capo)
        recordRecentlyViewed({ id: s.id, title: s.title, artist: s.artist, key: s.key, difficulty: s.difficulty })
      })
      .catch(() => setError('Song not found.'))
  }, [id])

  const myVersionBeforeTranspose = useMemo(
    () => (song ? applyChordOverrides(song, chordOverrides) : null),
    [song, chordOverrides],
  )

  // A capo swap and an explicit transpose are musically different: transposing
  // changes the song's actual (concert) key, while switching capo just picks
  // a different chord shape for the *same* sounding pitch. Both shift the
  // guitar-chord shapes shown, but only the transpose amount shifts the
  // concert key display.
  const capoDelta = song ? song.capo - capoSetting : 0
  const totalShapeShift = transposeSemitones + capoDelta

  // Transposition is computed by the backend (single source of truth for the
  // music theory), so it's applied as an effect rather than a sync memo.
  useEffect(() => {
    if (!myVersionBeforeTranspose) return
    if (totalShapeShift === 0) {
      setShapesSong(myVersionBeforeTranspose)
      return
    }
    let cancelled = false
    const flat = flattenChordStrings(myVersionBeforeTranspose)
    transposeChords(flat, totalShapeShift).then((newChords) => {
      if (cancelled) return
      setShapesSong(reconstructWithChords(myVersionBeforeTranspose, newChords))
    })
    return () => {
      cancelled = true
    }
  }, [myVersionBeforeTranspose, totalShapeShift])

  useEffect(() => {
    if (!song) return
    if (transposeSemitones === 0) {
      setTransposedKey(song.key)
      return
    }
    let cancelled = false
    transposeChords([song.key], transposeSemitones).then(([newKey]) => {
      if (!cancelled) setTransposedKey(newKey)
    })
    return () => {
      cancelled = true
    }
  }, [song, transposeSemitones])

  const myVersion = useMemo(
    () => (shapesSong ? { ...shapesSong, key: transposedKey ?? shapesSong.key } : null),
    [shapesSong, transposedKey],
  )
  const displayedSong = tab === 'mine' ? myVersion : song

  function handleEditClick() {
    setEditMode((prev) => !prev)
    setTab('mine')
  }

  function handleTransposeClick() {
    setShowTranspose((prev) => !prev)
    setTab('mine')
  }

  function handleChordClick(sectionIndex: number, lineIndex: number, chordIndex: number, chord: string) {
    if (!editMode) return
    setEditingTarget({ sectionIndex, lineIndex, chordIndex, currentChord: chord })
  }

  // Overrides are stored against the untransposed, capo-0 song (so
  // re-transposing or switching capo later shifts a manual substitution too,
  // same as any other chord). A chord picked in the UI was chosen in the
  // *current* shape view - so its untransposed equivalent is what actually
  // gets stored.
  async function toUntransposedChords(chords: string[]): Promise<string[]> {
    if (totalShapeShift === 0) return chords
    return transposeChords(chords, -totalShapeShift)
  }

  async function handleChordSelected(newChord: string) {
    if (!editingTarget) return
    const key = overrideKey(editingTarget.sectionIndex, editingTarget.lineIndex, editingTarget.chordIndex)
    const [storedChord] = await toUntransposedChords([newChord])

    setChordOverrides((prev) => {
      const next = new Map(prev)
      next.set(key, storedChord)
      return next
    })
    setTab('mine')
    setEditingTarget(null)
  }

  async function handleSimplifyClick() {
    if (!myVersion) return
    setTab('mine')

    const occurrences = getChordOccurrences(myVersion)
    const suggestions = await simplifyChords(occurrences.map((o) => o.chord))

    const changed = occurrences
      .map((occurrence, i) => ({ occurrence, simplified: suggestions[i]?.simplified ?? null }))
      .filter((entry): entry is { occurrence: typeof occurrences[number]; simplified: string } =>
        Boolean(entry.simplified && entry.simplified !== entry.occurrence.chord),
      )

    const diffMap = new Map<string, SimplifyDiffEntry>()
    for (const { occurrence, simplified } of changed) {
      diffMap.set(`${occurrence.chord}->${simplified}`, { from: occurrence.chord, to: simplified })
    }

    const untransposedValues = await toUntransposedChords(changed.map((c) => c.simplified))
    const overrides = changed.map(({ occurrence }, i) => ({
      key: overrideKey(occurrence.sectionIndex, occurrence.lineIndex, occurrence.chordIndex),
      chord: untransposedValues[i],
    }))

    setPendingSimplify({ diff: [...diffMap.values()], overrides })
  }

  function handleAcceptSimplify() {
    if (!pendingSimplify) return
    setChordOverrides((prev) => {
      const next = new Map(prev)
      for (const { key, chord } of pendingSimplify.overrides) {
        next.set(key, chord)
      }
      return next
    })
    setPendingSimplify(null)
  }

  function handleRejectSimplify() {
    setPendingSimplify(null)
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
  const hasEdits = chordOverrides.size > 0 || transposeSemitones !== 0 || capoSetting !== song.capo

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
            Key <strong style={{ color: 'var(--text)' }}>{displayedSong.key}</strong>
          </span>
          <span>
            BPM <strong style={{ color: 'var(--text)' }}>{song.bpm}</strong>
          </span>
          <CapoControl
            capo={tab === 'mine' ? capoSetting : song.capo}
            onChange={(value) => {
              setCapoSetting(value)
              setTab('mine')
            }}
          />
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
          <Button variant={showTranspose ? 'primary' : 'secondary'} onClick={handleTransposeClick}>
            Transpose
          </Button>
          <Button onClick={handleSimplifyClick}>Simplify</Button>
          <Button disabled={!hasEdits} title={hasEdits ? undefined : 'Make an edit first'}>
            Save
          </Button>
        </div>

        {editMode && (
          <p className="text-sm" style={{ color: 'var(--accent)' }}>
            Tap any chord below to change it.
          </p>
        )}

        {showTranspose && myVersion && (
          <TransposeControl
            semitones={transposeSemitones}
            displayKey={myVersion.key}
            onChange={setTransposeSemitones}
          />
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

      {pendingSimplify && (
        <SimplifyPreview
          diff={pendingSimplify.diff}
          onAccept={handleAcceptSimplify}
          onReject={handleRejectSimplify}
        />
      )}
    </div>
  )
}
