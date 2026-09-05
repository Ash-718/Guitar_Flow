import type { ChordPlacement } from '../../types/chord'
import { buildChordRow } from '../../utils/chordRow'

interface Props {
  lyrics: string
  chords: ChordPlacement[]
}

export function ChordLyricLine({ lyrics, chords }: Props) {
  const chordRow = buildChordRow(lyrics.length, chords)

  return (
    <div className="chordsheet leading-tight">
      <div className="whitespace-pre text-[0.95em] font-bold" style={{ color: 'var(--accent)' }}>
        {chordRow || ' '}
      </div>
      <div className="whitespace-pre" style={{ color: 'var(--text)' }}>
        {lyrics || ' '}
      </div>
    </div>
  )
}
