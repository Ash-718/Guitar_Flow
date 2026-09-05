import type { ChordLibraryEntry } from '../../types/chord'
import { Modal } from '../ui/Modal'
import { ChordDiagram } from './ChordDiagram'

interface Props {
  chordName: string
  entry: ChordLibraryEntry | undefined
  onClose: () => void
}

export function ChordDiagramPopup({ chordName, entry, onClose }: Props) {
  return (
    <Modal title={chordName} onClose={onClose}>
      {entry?.diagram ? (
        <div className="flex flex-col items-center gap-2">
          <ChordDiagram name={chordName} diagram={entry.diagram} />
          <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
            {entry.difficulty}
          </span>
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>No diagram available for this chord yet.</p>
      )}
    </Modal>
  )
}
