import { describe, expect, it } from 'vitest'
import type { Song } from '../types/song'
import { getDistinctChords } from './songChords'

function makeSong(chordsPerLine: string[][]): Song {
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
        lines: chordsPerLine.map((chords) => ({
          lyrics: 'la la la',
          chords: chords.map((chord, i) => ({ chord, position: i * 3 })),
        })),
      },
    ],
  }
}

describe('getDistinctChords', () => {
  it('returns chords in first-appearance order with no duplicates', () => {
    const song = makeSong([
      ['G', 'Em'],
      ['C', 'G', 'D'],
    ])
    expect(getDistinctChords(song)).toEqual(['G', 'Em', 'C', 'D'])
  })

  it('returns an empty array for a song with no chords', () => {
    const song = makeSong([[]])
    expect(getDistinctChords(song)).toEqual([])
  })
})
