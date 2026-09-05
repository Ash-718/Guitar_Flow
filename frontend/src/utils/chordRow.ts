import type { ChordPlacement } from '../types/chord'

/** Builds the chord row string that renders above a lyric line, aligned by
 * character position. Relies on a monospace font for visual alignment. */
export function buildChordRow(lyricsLength: number, chords: ChordPlacement[]): string {
  const width = Math.max(lyricsLength, ...chords.map((c) => c.position + c.chord.length), 0)
  const row = Array.from({ length: width }, () => ' ')
  for (const c of [...chords].sort((a, b) => a.position - b.position)) {
    for (let i = 0; i < c.chord.length; i++) {
      row[c.position + i] = c.chord[i]
    }
  }
  return row.join('')
}
