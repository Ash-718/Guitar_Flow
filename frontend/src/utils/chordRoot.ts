/** Extracts just the root+accidental from a chord symbol, e.g. "F#m7" -> "F#". */
export function getChordRoot(chord: string): string {
  const match = chord.match(/^[A-G][#b]?/)
  return match ? match[0] : chord
}
