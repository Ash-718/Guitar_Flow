import type { Song } from '../types/song'

/** Key format matches the backend's ChordOverride (section_index:line_index:chord_index). */
export function overrideKey(sectionIndex: number, lineIndex: number, chordIndex: number): string {
  return `${sectionIndex}:${lineIndex}:${chordIndex}`
}

export function applyChordOverrides(song: Song, overrides: Map<string, string>): Song {
  if (overrides.size === 0) return song

  return {
    ...song,
    sections: song.sections.map((section, sectionIndex) => ({
      ...section,
      lines: section.lines.map((line, lineIndex) => ({
        ...line,
        chords: line.chords.map((c, chordIndex) => {
          const override = overrides.get(overrideKey(sectionIndex, lineIndex, chordIndex))
          return override ? { ...c, chord: override } : c
        }),
      })),
    })),
  }
}
