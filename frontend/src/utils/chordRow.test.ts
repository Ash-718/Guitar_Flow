import { describe, expect, it } from 'vitest'
import { buildChordRow } from './chordRow'

describe('buildChordRow', () => {
  it('places a chord at its exact character position', () => {
    const row = buildChordRow(20, [{ chord: 'Em', position: 5 }])
    expect(row.slice(5, 7)).toBe('Em')
    expect(row.slice(0, 5)).toBe('     ')
  })

  it('matches the worked example from the product spec', () => {
    // "G              Em\nI found a love for me" -> Em lines up with "love"
    const lyrics = 'I found a love for me'
    const chords = [
      { chord: 'G', position: 0 },
      { chord: 'Em', position: lyrics.indexOf('love') },
    ]
    const row = buildChordRow(lyrics.length, chords)
    expect(row.slice(0, 1)).toBe('G')
    expect(row.slice(lyrics.indexOf('love'), lyrics.indexOf('love') + 2)).toBe('Em')
  })

  it('extends the row width when a chord name overruns the lyric length', () => {
    const row = buildChordRow(3, [{ chord: 'Dmaj7', position: 2 }])
    expect(row).toBe('  Dmaj7')
  })

  it('handles a line with no chords', () => {
    expect(buildChordRow(10, [])).toBe('          ')
  })

  it('orders overlapping placements by position so later ones win ties', () => {
    const row = buildChordRow(10, [
      { chord: 'D', position: 0 },
      { chord: 'G', position: 0 },
    ])
    expect(row.slice(0, 1)).toBe('G')
  })
})
