import type { SongSummary } from '../types/song'

const KEY = 'guitarflow:recentlyViewed'
const MAX_ITEMS = 6

type RecentSong = Pick<SongSummary, 'id' | 'title' | 'artist' | 'key' | 'difficulty'>

export function getRecentlyViewed(): RecentSong[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as RecentSong[]) : []
  } catch {
    return []
  }
}

export function recordRecentlyViewed(song: RecentSong): void {
  try {
    const existing = getRecentlyViewed().filter((s) => s.id !== song.id)
    const updated = [song, ...existing].slice(0, MAX_ITEMS)
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {
    // localStorage unavailable (private browsing, etc.) - not critical
  }
}
