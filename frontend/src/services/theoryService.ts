import api from './api'

export interface ChordSuggestion {
  original: string
  simplified: string | null
}

export async function transposeChords(chords: string[], semitones: number): Promise<string[]> {
  const { data } = await api.post<{ chords: string[] }>('/transpose', { chords, semitones })
  return data.chords
}

export async function simplifyChords(chords: string[]): Promise<ChordSuggestion[]> {
  const { data } = await api.post<{ suggestions: ChordSuggestion[] }>('/simplify', { chords })
  return data.suggestions
}
