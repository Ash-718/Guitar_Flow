export const MIN_BPM = 40
export const MAX_BPM = 240

export function clampBpm(bpm: number): number {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))
}
