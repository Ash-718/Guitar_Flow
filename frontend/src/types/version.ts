export interface ChordOverride {
  section_index: number
  line_index: number
  chord_index: number
  chord: string
}

export interface UserSongVersion {
  id: string
  user_id: string
  song_id: string
  name: string
  transpose_semitones: number
  capo_override: number | null
  chord_overrides: ChordOverride[]
  simplify_applied: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface VersionCreate {
  name: string
  transpose_semitones?: number
  capo_override?: number | null
  chord_overrides?: ChordOverride[]
  simplify_applied?: boolean
}

export type VersionUpdate = Partial<VersionCreate>
