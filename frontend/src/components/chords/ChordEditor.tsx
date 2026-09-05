import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { getChordRoot } from '../../utils/chordRoot'

interface Props {
  currentChord: string
  onSelect: (chord: string) => void
  onClose: () => void
}

export function ChordEditor({ currentChord, onSelect, onClose }: Props) {
  const root = getChordRoot(currentChord)
  const suffixes = ['', 'm', '7', 'maj7', 'add9']
  const quickOptions = suffixes.map((suffix) => `${root}${suffix}`)

  const [customValue, setCustomValue] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  function choose(chord: string) {
    onSelect(chord)
    onClose()
  }

  return (
    <Modal title={`Edit chord: ${currentChord}`} onClose={onClose}>
      <div className="grid grid-cols-3 gap-2">
        {quickOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => choose(option)}
            className="rounded-md border py-2.5 text-center font-bold"
            style={{
              borderColor: option === currentChord ? 'var(--accent)' : 'var(--border)',
              color: option === currentChord ? 'var(--accent)' : 'var(--text)',
              background: 'var(--surface-raised)',
            }}
          >
            {option}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="rounded-md border py-2.5 text-center font-semibold"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--surface-raised)' }}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (customValue.trim()) choose(customValue.trim())
          }}
        >
          <input
            autoFocus
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="e.g. Csus2, Bb, F#dim"
            className="flex-1 rounded-md border px-3 py-2"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
          <button
            type="submit"
            className="rounded-md px-4 py-2 font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            Apply
          </button>
        </form>
      )}
    </Modal>
  )
}
