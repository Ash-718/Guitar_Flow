import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

/** Continuous, frame-driven auto-scroll (never line-by-line jumps).
 * `speed` is in pixels/second. Progress is tracked via the container's own
 * scroll events, so it stays accurate whether the scroll came from this
 * hook's own rAF loop or the user dragging/swiping the content manually. */
export function useAutoScroll(containerRef: RefObject<HTMLElement | null>, speed: number, isPlaying: boolean) {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  const recomputeProgress = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0)
  }, [containerRef])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('scroll', recomputeProgress, { passive: true })
    recomputeProgress()
    return () => el.removeEventListener('scroll', recomputeProgress)
  }, [containerRef, recomputeProgress])

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null
      return
    }

    function tick(time: number) {
      const el = containerRef.current
      if (el && lastTimeRef.current !== null) {
        const dt = (time - lastTimeRef.current) / 1000
        const max = el.scrollHeight - el.clientHeight
        if (max > 0) {
          el.scrollTop = Math.min(max, el.scrollTop + speed * dt)
        }
      }
      lastTimeRef.current = time
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = null
    }
  }, [isPlaying, speed, containerRef])

  const restart = useCallback(() => {
    const el = containerRef.current
    if (el) el.scrollTop = 0
  }, [containerRef])

  return { progress, restart }
}
