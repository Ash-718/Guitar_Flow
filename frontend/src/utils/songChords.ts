import type { Song } from '../types/song'

export function getDistinctChords(song: Song): string[] {
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const section of song.sections) {
    for (const line of section.lines) {
      for (const c of line.chords) {
        if (!seen.has(c.chord)) {
          seen.add(c.chord)
          ordered.push(c.chord)
        }
      }
    }
  }
  return ordered
}
