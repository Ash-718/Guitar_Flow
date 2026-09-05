import type { Song } from '../types/song'

/** Walks a song's chords in a fixed, deterministic order (section -> line ->
 * chord). reconstructWithChords must walk in the exact same order, since
 * they're paired by array index rather than any explicit key. */
export function flattenChordStrings(song: Song): string[] {
  const result: string[] = []
  for (const section of song.sections) {
    for (const line of section.lines) {
      for (const c of line.chords) {
        result.push(c.chord)
      }
    }
  }
  return result
}

export function reconstructWithChords(song: Song, flatChords: string[]): Song {
  let cursor = 0
  return {
    ...song,
    sections: song.sections.map((section) => ({
      ...section,
      lines: section.lines.map((line) => ({
        ...line,
        chords: line.chords.map((c) => ({ ...c, chord: flatChords[cursor++] })),
      })),
    })),
  }
}
