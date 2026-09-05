import { beforeEach, describe, expect, it } from 'vitest'
import { getRecentlyViewed, recordRecentlyViewed } from './recentlyViewed'

const SONG_A = { id: 'a', title: 'Song A', artist: 'Artist A', key: 'G', difficulty: 'beginner' as const }
const SONG_B = { id: 'b', title: 'Song B', artist: 'Artist B', key: 'D', difficulty: 'intermediate' as const }

describe('recentlyViewed', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts empty', () => {
    expect(getRecentlyViewed()).toEqual([])
  })

  it('records a song and puts it first', () => {
    recordRecentlyViewed(SONG_A)
    expect(getRecentlyViewed()).toEqual([SONG_A])
  })

  it('moves a re-viewed song back to the front instead of duplicating it', () => {
    recordRecentlyViewed(SONG_A)
    recordRecentlyViewed(SONG_B)
    recordRecentlyViewed(SONG_A)
    expect(getRecentlyViewed()).toEqual([SONG_A, SONG_B])
  })

  it('caps the list at 6 entries', () => {
    for (let i = 0; i < 10; i++) {
      recordRecentlyViewed({ id: `song-${i}`, title: `Song ${i}`, artist: 'X', key: 'G', difficulty: 'beginner' })
    }
    expect(getRecentlyViewed()).toHaveLength(6)
    expect(getRecentlyViewed()[0].id).toBe('song-9')
  })
})
