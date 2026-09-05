import type { Section } from '../../types/song'
import { ChordLyricLine } from './ChordLyricLine'

export function SectionBlock({ section }: { section: Section }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {section.name}
      </h3>
      <div className="flex flex-col gap-2.5">
        {section.lines.map((line, i) => (
          <ChordLyricLine key={i} lyrics={line.lyrics} chords={line.chords} />
        ))}
      </div>
    </div>
  )
}
