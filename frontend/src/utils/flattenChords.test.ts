import { describe, expect, it } from 'vitest'
import type { Song } from '../types/song'
import { flattenChordStrings, getChordOccurrences, reconstructWithChords } from './flattenChords'

function makeSong(): Song {
  return {
    id: 's1',
    title: 'Test',
    artist: 'Test Artist',
    key: 'G',
    bpm: 100,
    capo: 0,
    difficulty: 'beginner',
    tags: [],
    strumming_pattern: { pattern: 'D D U U D U', bpm: 100 },
    source: 'platform',
    created_at: '2026-01-01T00:00:00Z',
    sections: [
      {
        name: 'Verse',
        lines: [
          { lyrics: 'a', chords: [{ chord: 'G', position: 0 }, { chord: 'Em', position: 3 }] },
          { lyrics: 'b', chords: [{ chord: 'C', position: 0 }] },
        ],
      },
      {
        name: 'Chorus',
        lines: [{ lyrics: 'c', chords: [{ chord: 'D', position: 0 }] }],
      },
    ],
  }
}

describe('flattenChordStrings / reconstructWithChords', () => {
  it('flattens in section -> line -> chord order', () => {
    expect(flattenChordStrings(makeSong())).toEqual(['G', 'Em', 'C', 'D'])
  })

  it('round-trips: reconstructing with the same flat list reproduces the original chords', () => {
    const song = makeSong()
    const flat = flattenChordStrings(song)
    const rebuilt = reconstructWithChords(song, flat)
    expect(flattenChordStrings(rebuilt)).toEqual(flat)
  })

  it('applies a transformed flat list back to the correct positions', () => {
    const song = makeSong()
    const transposed = ['A', 'F#m', 'D', 'E'] // matches the spec's +2 example
    const rebuilt = reconstructWithChords(song, transposed)
    expect(rebuilt.sections[0].lines[0].chords[0].chord).toBe('A')
    expect(rebuilt.sections[0].lines[0].chords[1].chord).toBe('F#m')
    expect(rebuilt.sections[0].lines[1].chords[0].chord).toBe('D')
    expect(rebuilt.sections[1].lines[0].chords[0].chord).toBe('E')
    // positions must be untouched
    expect(rebuilt.sections[0].lines[0].chords[1].position).toBe(3)
  })
})

describe('getChordOccurrences', () => {
  it('pairs each chord with its section/line/chord indices in flatten order', () => {
    const occurrences = getChordOccurrences(makeSong())
    expect(occurrences).toEqual([
      { sectionIndex: 0, lineIndex: 0, chordIndex: 0, chord: 'G' },
      { sectionIndex: 0, lineIndex: 0, chordIndex: 1, chord: 'Em' },
      { sectionIndex: 0, lineIndex: 1, chordIndex: 0, chord: 'C' },
      { sectionIndex: 1, lineIndex: 0, chordIndex: 0, chord: 'D' },
    ])
  })
})
