import { useEffect, useRef, useState } from 'react'
import { clampBpm } from '../utils/metronomeBpm'

const SCHEDULE_AHEAD_SECONDS = 0.1
const SCHEDULER_INTERVAL_MS = 25
const CLICK_DURATION_SECONDS = 0.05
const BEATS_PER_MEASURE = 4

interface QueuedBeat {
  beatIndex: number
  time: number
}

/** Web Audio "lookahead" scheduler (the standard pattern for accurate
 * metronome timing): a coarse setInterval only decides *when to schedule*,
 * while the actual click times are set precisely via the AudioContext's own
 * clock (audioCtx.currentTime), which setInterval/setTimeout alone can't
 * guarantee due to JS event-loop jitter. The visual beat pulse is
 * synchronized to those same scheduled times via requestAnimationFrame,
 * rather than firing immediately when a click is scheduled. */
export function useMetronome(initialBpm: number) {
  const [bpm, setBpmState] = useState(() => clampBpm(initialBpm))
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeBeat, setActiveBeat] = useState<number | null>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const nextNoteTimeRef = useRef(0)
  const beatIndexRef = useRef(0)
  const bpmRef = useRef(bpm)
  const schedulerIdRef = useRef<number | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const queueRef = useRef<QueuedBeat[]>([])

  useEffect(() => {
    bpmRef.current = bpm
  }, [bpm])

  function scheduleClick(beatIndex: number, time: number) {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = beatIndex % BEATS_PER_MEASURE === 0 ? 1000 : 750
    gain.gain.setValueAtTime(0.4, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + CLICK_DURATION_SECONDS)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(time)
    osc.stop(time + CLICK_DURATION_SECONDS)
    queueRef.current.push({ beatIndex, time })
  }

  function schedulerTick() {
    const ctx = audioCtxRef.current
    if (!ctx) return
    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
      scheduleClick(beatIndexRef.current, nextNoteTimeRef.current)
      nextNoteTimeRef.current += 60 / bpmRef.current
      beatIndexRef.current += 1
    }
  }

  function visualTick() {
    const ctx = audioCtxRef.current
    if (ctx) {
      while (queueRef.current.length && queueRef.current[0].time <= ctx.currentTime) {
        const next = queueRef.current.shift()!
        setActiveBeat(next.beatIndex % BEATS_PER_MEASURE)
      }
    }
    rafIdRef.current = requestAnimationFrame(visualTick)
  }

  function stop() {
    if (schedulerIdRef.current !== null) {
      clearInterval(schedulerIdRef.current)
      schedulerIdRef.current = null
    }
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    queueRef.current = []
    setIsPlaying(false)
    setActiveBeat(null)
  }

  function start() {
    if (isPlaying) return
    const ctx = audioCtxRef.current ?? new AudioContext()
    audioCtxRef.current = ctx
    if (ctx.state === 'suspended') ctx.resume()

    beatIndexRef.current = 0
    nextNoteTimeRef.current = ctx.currentTime + 0.05
    queueRef.current = []
    schedulerIdRef.current = window.setInterval(schedulerTick, SCHEDULER_INTERVAL_MS)
    rafIdRef.current = requestAnimationFrame(visualTick)
    setIsPlaying(true)
  }

  function toggle() {
    if (isPlaying) stop()
    else start()
  }

  function setBpm(value: number) {
    setBpmState(clampBpm(value))
  }

  useEffect(() => stop, [])

  return { bpm, setBpm, isPlaying, activeBeat, start, stop, toggle }
}
