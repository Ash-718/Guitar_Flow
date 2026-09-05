import type { UserSongVersion, VersionCreate, VersionUpdate } from '../types/version'
import api from './api'

export async function listVersions(songId: string): Promise<UserSongVersion[]> {
  const { data } = await api.get<UserSongVersion[]>(`/songs/${songId}/versions`)
  return data
}

export async function createVersion(songId: string, payload: VersionCreate): Promise<UserSongVersion> {
  const { data } = await api.post<UserSongVersion>(`/songs/${songId}/versions`, payload)
  return data
}

export async function updateVersion(versionId: string, payload: VersionUpdate): Promise<UserSongVersion> {
  const { data } = await api.put<UserSongVersion>(`/versions/${versionId}`, payload)
  return data
}

export async function deleteVersion(versionId: string): Promise<void> {
  await api.delete(`/versions/${versionId}`)
}
