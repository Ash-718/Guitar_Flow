import type { StrummingPattern } from '../../types/song'

export function StrummingPatternView({ pattern, bpm }: StrummingPattern) {
  const tokens = pattern.split(/\s+/).filter(Boolean)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1.5">
        {tokens.map((token, i) => (
          <span
            key={i}
            className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold"
            style={{
              background: 'var(--surface-raised)',
              color: token === 'D' ? 'var(--accent)' : 'var(--color-string-500)',
            }}
            title={token === 'D' ? 'Downstrum' : token === 'U' ? 'Upstrum' : token}
          >
            {token}
          </span>
        ))}
      </div>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {bpm} BPM
      </span>
    </div>
  )
}
