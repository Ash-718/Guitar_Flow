import { describe, expect, it } from 'vitest'
import type { Song } from '../types/song'
import { applyChordOverrides, overrideKey, overridesListToMap, overridesMapToList } from './applyChordOverrides'

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
          { lyrics: 'la la', chords: [{ chord: 'G', position: 0 }, { chord: 'Em', position: 3 }] },
        ],
      },
    ],
  }
}

describe('applyChordOverrides', () => {
  it('returns the same song unchanged when there are no overrides', () => {
    const song = makeSong()
    expect(applyChordOverrides(song, new Map())).toEqual(song)
  })

  it('replaces only the targeted chord, leaving others and the original object untouched', () => {
    const song = makeSong()
    const overrides = new Map([[overrideKey(0, 0, 1), 'Am']])
    const result = applyChordOverrides(song, overrides)

    expect(result.sections[0].lines[0].chords[0].chord).toBe('G')
    expect(result.sections[0].lines[0].chords[1].chord).toBe('Am')
    // original song object must never be mutated
    expect(song.sections[0].lines[0].chords[1].chord).toBe('Em')
  })

  it('preserves chord position when overriding', () => {
    const song = makeSong()
    const overrides = new Map([[overrideKey(0, 0, 1), 'Cadd9']])
    const result = applyChordOverrides(song, overrides)
    expect(result.sections[0].lines[0].chords[1].position).toBe(3)
  })
})

describe('overridesMapToList / overridesListToMap', () => {
  it('round-trips a map through the backend ChordOverride list shape and back', () => {
    const map = new Map([
      [overrideKey(0, 0, 1), 'Am'],
      [overrideKey(1, 2, 0), 'F#m7'],
    ])
    const list = overridesMapToList(map)
    expect(list).toContainEqual({ section_index: 0, line_index: 0, chord_index: 1, chord: 'Am' })
    expect(list).toContainEqual({ section_index: 1, line_index: 2, chord_index: 0, chord: 'F#m7' })

    const roundTripped = overridesListToMap(list)
    expect(roundTripped).toEqual(map)
  })

  it('an empty map round-trips to an empty list and back', () => {
    expect(overridesMapToList(new Map())).toEqual([])
    expect(overridesListToMap([])).toEqual(new Map())
  })
})
