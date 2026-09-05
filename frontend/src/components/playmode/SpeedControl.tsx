const MIN_SPEED = 10
const MAX_SPEED = 150
const STEP = 5

interface Props {
  speed: number
  onChange: (speed: number) => void
}

export function SpeedControl({ speed, onChange }: Props) {
  const clamp = (v: number) => Math.min(MAX_SPEED, Math.max(MIN_SPEED, v))

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(clamp(speed - STEP))}
        aria-label="Decrease auto-scroll speed"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold"
        style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
      >
        −
      </button>

      <input
        type="range"
        min={MIN_SPEED}
        max={MAX_SPEED}
        step={STEP}
        value={speed}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Auto-scroll speed"
        className="h-1.5 w-28 accent-current sm:w-40"
        style={{ color: 'var(--color-amber-400)' }}
      />

      <button
        type="button"
        onClick={() => onChange(clamp(speed + STEP))}
        aria-label="Increase auto-scroll speed"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold"
        style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
      >
        +
      </button>
    </div>
  )
}
