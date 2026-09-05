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

export interface ChordOccurrence {
  sectionIndex: number
  lineIndex: number
  chordIndex: number
  chord: string
}

/** Same walk order as flattenChordStrings, but keeping the position indices
 * needed to write a chord_override at a specific spot. */
export function getChordOccurrences(song: Song): ChordOccurrence[] {
  const result: ChordOccurrence[] = []
  song.sections.forEach((section, sectionIndex) => {
    section.lines.forEach((line, lineIndex) => {
      line.chords.forEach((c, chordIndex) => {
        result.push({ sectionIndex, lineIndex, chordIndex, chord: c.chord })
      })
    })
  })
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
