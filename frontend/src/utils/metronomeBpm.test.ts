import { describe, expect, it } from 'vitest'
import { clampBpm, MAX_BPM, MIN_BPM } from './metronomeBpm'

describe('clampBpm', () => {
  it('leaves an in-range value untouched', () => {
    expect(clampBpm(120)).toBe(120)
  })

  it('clamps below the minimum', () => {
    expect(clampBpm(10)).toBe(MIN_BPM)
  })

  it('clamps above the maximum', () => {
    expect(clampBpm(999)).toBe(MAX_BPM)
  })

  it('rounds fractional values', () => {
    expect(clampBpm(120.6)).toBe(121)
  })
})
