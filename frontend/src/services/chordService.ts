import type { ChordLibraryEntry } from '../types/chord'
import api from './api'

export async function listChords(): Promise<ChordLibraryEntry[]> {
  const { data } = await api.get<ChordLibraryEntry[]>('/chords')
  return data
}

export async function getChord(name: string): Promise<ChordLibraryEntry | null> {
  try {
    const { data } = await api.get<ChordLibraryEntry>(`/chords/${encodeURIComponent(name)}`)
    return data
  } catch {
    return null
  }
}
