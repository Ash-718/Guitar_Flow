import type { ChordOverride } from '../types/version'
import type { Song } from '../types/song'

/** Key format matches the backend's ChordOverride (section_index:line_index:chord_index). */
export function overrideKey(sectionIndex: number, lineIndex: number, chordIndex: number): string {
  return `${sectionIndex}:${lineIndex}:${chordIndex}`
}

export function parseOverrideKey(key: string): Omit<ChordOverride, 'chord'> {
  const [sectionIndex, lineIndex, chordIndex] = key.split(':').map(Number)
  return { section_index: sectionIndex, line_index: lineIndex, chord_index: chordIndex }
}

export function overridesMapToList(overrides: Map<string, string>): ChordOverride[] {
  return [...overrides.entries()].map(([key, chord]) => ({ ...parseOverrideKey(key), chord }))
}

export function overridesListToMap(overrides: ChordOverride[]): Map<string, string> {
  return new Map(overrides.map((o) => [overrideKey(o.section_index, o.line_index, o.chord_index), o.chord]))
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
