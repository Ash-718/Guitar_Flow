import { Modal } from '../ui/Modal'

export interface SimplifyDiffEntry {
  from: string
  to: string
}

interface Props {
  diff: SimplifyDiffEntry[]
  onAccept: () => void
  onReject: () => void
}

export function SimplifyPreview({ diff, onAccept, onReject }: Props) {
  if (diff.length === 0) {
    return (
      <Modal title="Simplify chords" onClose={onReject}>
        <p style={{ color: 'var(--text-muted)' }}>
          This song is already about as simple as it gets - no beginner-friendly swaps found.
        </p>
      </Modal>
    )
  }

  return (
    <Modal title="Simplify chords" onClose={onReject}>
      <p className="mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>
        These chords have a beginner-friendly alternative:
      </p>
      <ul className="mb-4 flex flex-col gap-2">
        {diff.map(({ from, to }) => (
          <li
            key={from}
            className="flex items-center justify-center gap-3 rounded-md border px-3 py-2 font-bold"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-raised)' }}
          >
            <span style={{ color: 'var(--text-muted)' }}>{from}</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ color: 'var(--accent)' }}>{to}</span>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onReject}
          className="flex-1 rounded-md py-2 font-semibold"
          style={{ background: 'var(--surface-raised)', color: 'var(--text)' }}
        >
          Keep original
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="flex-1 rounded-md py-2 font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
        >
          Use simpler chords
        </button>
      </div>
    </Modal>
  )
}
