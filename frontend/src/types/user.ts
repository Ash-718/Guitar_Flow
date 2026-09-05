export interface UserPreferences {
  scroll_speed: number
  dark_mode: boolean
}

export interface User {
  id: string
  firebase_uid: string
  display_name: string
  email: string
  preferences: UserPreferences
  created_at: string
}
