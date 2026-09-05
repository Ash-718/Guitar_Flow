import type { ChordPlacement, Difficulty } from './chord'

export interface StrummingPattern {
  pattern: string
  bpm: number
}

export interface Line {
  lyrics: string
  chords: ChordPlacement[]
}

export interface Section {
  name: string
  lines: Line[]
}

export interface Song {
  id: string
  title: string
  artist: string
  key: string
  bpm: number
  capo: number
  difficulty: Difficulty
  tags: string[]
  strumming_pattern: StrummingPattern
  sections: Section[]
  source: 'platform' | 'user_uploaded'
  created_at: string
}

export interface SongSummary {
  id: string
  title: string
  artist: string
  key: string
  bpm: number
  difficulty: Difficulty
  tags: string[]
}
