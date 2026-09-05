interface Props {
  semitones: number
  displayKey: string
  onChange: (semitones: number) => void
}

export function TransposeControl({ semitones, displayKey, onChange }: Props) {
  return (
    <div
      className="flex flex-wrap items-center gap-4 rounded-lg border px-4 py-3"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-raised)' }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(semitones - 1)}
          aria-label="Transpose down"
          className="flex h-9 w-9 items-center justify-center rounded-md text-lg font-bold"
          style={{ background: 'var(--surface)', color: 'var(--text)' }}
        >
          −
        </button>
        <span className="w-16 text-center text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {semitones > 0 ? `+${semitones}` : semitones}
        </span>
        <button
          type="button"
          onClick={() => onChange(semitones + 1)}
          aria-label="Transpose up"
          className="flex h-9 w-9 items-center justify-center rounded-md text-lg font-bold"
          style={{ background: 'var(--surface)', color: 'var(--text)' }}
        >
          +
        </button>
      </div>

      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Key <strong style={{ color: 'var(--text)' }}>{displayKey}</strong>
      </span>

      <button
        type="button"
        onClick={() => onChange(0)}
        disabled={semitones === 0}
        className="ml-auto text-sm font-semibold underline disabled:opacity-40"
        style={{ color: 'var(--accent)' }}
      >
        Reset
      </button>
    </div>
  )
}
