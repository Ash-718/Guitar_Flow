import { useMetronome } from '../../hooks/useMetronome'
import { MAX_BPM, MIN_BPM } from '../../utils/metronomeBpm'

export function Metronome({ initialBpm }: { initialBpm: number }) {
  const { bpm, setBpm, isPlaying, activeBeat, toggle } = useMetronome(initialBpm)

  return (
    <div
      className="flex flex-wrap items-center gap-4 rounded-lg border px-4 py-3"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-raised)' }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setBpm(bpm - 1)}
          aria-label="Decrease BPM"
          className="flex h-9 w-9 items-center justify-center rounded-md text-lg font-bold"
          style={{ background: 'var(--surface)', color: 'var(--text)' }}
        >
          −
        </button>
        <span className="w-16 text-center text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {bpm} BPM
        </span>
        <button
          type="button"
          onClick={() => setBpm(bpm + 1)}
          aria-label="Increase BPM"
          className="flex h-9 w-9 items-center justify-center rounded-md text-lg font-bold"
          style={{ background: 'var(--surface)', color: 'var(--text)' }}
        >
          +
        </button>
      </div>

      <input
        type="range"
        min={MIN_BPM}
        max={MAX_BPM}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        aria-label="Metronome BPM"
        className="h-1.5 w-28 sm:w-40"
        style={{ accentColor: 'var(--accent)' }}
      />

      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-full transition-transform"
            style={{
              background: activeBeat === i ? 'var(--accent)' : 'var(--border)',
              transform: activeBeat === i ? 'scale(1.4)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={toggle}
        className="ml-auto rounded-md px-4 py-1.5 text-sm font-semibold"
        style={{
          background: isPlaying ? 'var(--surface)' : 'var(--accent)',
          color: isPlaying ? 'var(--text)' : 'var(--accent-contrast)',
        }}
      >
        {isPlaying ? 'Stop' : 'Start'}
      </button>
    </div>
  )
}
