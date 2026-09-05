import type { Difficulty } from '../types/chord'
import type { Song, SongSummary } from '../types/song'
import api from './api'

export async function listSongs(search?: string, difficulty?: Difficulty): Promise<SongSummary[]> {
  const { data } = await api.get<SongSummary[]>('/songs', { params: { search, difficulty } })
  return data
}

export async function getSong(id: string): Promise<Song> {
  const { data } = await api.get<Song>(`/songs/${id}`)
  return data
}
