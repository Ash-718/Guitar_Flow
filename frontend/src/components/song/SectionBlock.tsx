import type { Section } from '../../types/song'
import { ChordLyricLine } from './ChordLyricLine'

interface Props {
  section: Section
  sectionIndex: number
  onChordClick?: (sectionIndex: number, lineIndex: number, chordIndex: number, chord: string) => void
}

export function SectionBlock({ section, sectionIndex, onChordClick }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {section.name}
      </h3>
      <div className="flex flex-col gap-2.5">
        {section.lines.map((line, lineIndex) => (
          <ChordLyricLine
            key={lineIndex}
            lyrics={line.lyrics}
            chords={line.chords}
            onChordClick={
              onChordClick
                ? (chordIndex, chord) => onChordClick(sectionIndex, lineIndex, chordIndex, chord)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}
