export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface ChordPlacement {
  chord: string
  position: number
}

export interface Barre {
  fret: number
  fromString: number
  toString: number
}

export interface ChordDiagram {
  frets: number[]
  fingers: number[]
  barre: Barre | null
  base_fret: number
}

export interface ChordLibraryEntry {
  id: string
  name: string
  root: string
  quality: string
  difficulty: Difficulty
  simplifies_to: string | null
  diagram: ChordDiagram | null
}
