import type { User, UserPreferences } from '../types/user'
import api from './api'

export async function syncUser(displayName: string, email: string): Promise<User> {
  const { data } = await api.post<User>('/users/sync', { display_name: displayName, email })
  return data
}

export async function getMe(): Promise<User | null> {
  try {
    const { data } = await api.get<User>('/users/me')
    return data
  } catch {
    return null
  }
}

export async function updatePreferences(patch: Partial<UserPreferences>): Promise<User> {
  const { data } = await api.put<User>('/users/me/preferences', patch)
  return data
}
