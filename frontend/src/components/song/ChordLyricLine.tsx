import type { ChordPlacement } from '../../types/chord'
import { buildChordRow } from '../../utils/chordRow'

interface Props {
  lyrics: string
  chords: ChordPlacement[]
  onChordClick?: (chordIndex: number, chord: string) => void
}

export function ChordLyricLine({ lyrics, chords, onChordClick }: Props) {
  return (
    <div className="chordsheet leading-tight">
      <div className="whitespace-pre text-[0.95em] font-bold" style={{ color: 'var(--accent)' }}>
        {onChordClick ? (
          <ClickableChordRow chords={chords} onChordClick={onChordClick} />
        ) : (
          buildChordRow(lyrics.length, chords) || ' '
        )}
      </div>
      <div className="whitespace-pre" style={{ color: 'var(--text)' }}>
        {lyrics || ' '}
      </div>
    </div>
  )
}

function ClickableChordRow({
  chords,
  onChordClick,
}: {
  chords: ChordPlacement[]
  onChordClick: (chordIndex: number, chord: string) => void
}) {
  if (chords.length === 0) return <>{' '}</>

  const sorted = chords
    .map((c, originalIndex) => ({ ...c, originalIndex }))
    .sort((a, b) => a.position - b.position)

  const nodes: React.ReactNode[] = []
  let cursor = 0
  for (const c of sorted) {
    if (c.position > cursor) {
      nodes.push(<span key={`gap-${c.originalIndex}`}>{' '.repeat(c.position - cursor)}</span>)
    }
    nodes.push(
      <button
        key={`chord-${c.originalIndex}`}
        type="button"
        onClick={() => onChordClick(c.originalIndex, c.chord)}
        className="border-0 bg-transparent p-0 font-bold hover:underline"
        style={{ color: 'var(--accent)', font: 'inherit' }}
      >
        {c.chord}
      </button>,
    )
    cursor = Math.max(cursor, c.position + c.chord.length)
  }
  return <>{nodes}</>
}
