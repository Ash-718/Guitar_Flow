interface Props {
  capo: number
  onChange: (capo: number) => void
}

export function CapoControl({ capo, onChange }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5">
      Capo
      <button
        type="button"
        onClick={() => onChange(Math.max(0, capo - 1))}
        aria-label="Decrease capo"
        className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold"
        style={{ background: 'var(--surface-raised)', color: 'var(--text)' }}
      >
        −
      </button>
      <strong style={{ color: 'var(--text)' }}>{capo}</strong>
      <button
        type="button"
        onClick={() => onChange(Math.min(11, capo + 1))}
        aria-label="Increase capo"
        className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold"
        style={{ background: 'var(--surface-raised)', color: 'var(--text)' }}
      >
        +
      </button>
    </span>
  )
}
