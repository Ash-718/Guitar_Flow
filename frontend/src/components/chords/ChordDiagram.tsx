import type { ChordDiagram as ChordDiagramData } from '../../types/chord'

const STRING_COUNT = 6
const FRET_ROWS = 4
const LEFT = 22
const RIGHT = 98
const TOP = 28
const BOTTOM = 128
const STRING_GAP = (RIGHT - LEFT) / (STRING_COUNT - 1)
const FRET_GAP = (BOTTOM - TOP) / FRET_ROWS
const DOT_RADIUS = 7

interface Props {
  name: string
  diagram: ChordDiagramData
}

/** Strings are indexed low-E(6) -> high-E(1), matching the backend's diagram
 * geometry convention (see backend/app/models/chord.py). */
export function ChordDiagram({ name, diagram }: Props) {
  const { frets, fingers, barre, base_fret: baseFret } = diagram
  const stringX = (stringIndex: number) => LEFT + stringIndex * STRING_GAP
  const rowY = (row: number) => TOP + row * FRET_GAP

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 120 150" width={140} height={175} role="img" aria-label={`${name} chord diagram`}>
        {/* Nut (thick) or a plain top line + base-fret label when shown mid-neck */}
        <line
          x1={LEFT}
          y1={TOP}
          x2={RIGHT}
          y2={TOP}
          stroke="currentColor"
          strokeWidth={baseFret === 1 ? 4 : 1.5}
        />
        {baseFret > 1 && (
          <text x={LEFT - 10} y={rowY(0.75)} fontSize={10} textAnchor="end" fill="currentColor">
            {baseFret}fr
          </text>
        )}

        {/* Fret lines */}
        {Array.from({ length: FRET_ROWS }, (_, i) => i + 1).map((i) => (
          <line key={i} x1={LEFT} y1={rowY(i)} x2={RIGHT} y2={rowY(i)} stroke="currentColor" strokeWidth={1} opacity={0.5} />
        ))}

        {/* Strings */}
        {Array.from({ length: STRING_COUNT }, (_, i) => i).map((i) => (
          <line key={i} x1={stringX(i)} y1={TOP} x2={stringX(i)} y2={BOTTOM} stroke="currentColor" strokeWidth={1} opacity={0.5} />
        ))}

        {/* Barre */}
        {barre && (
          <rect
            x={stringX(6 - barre.fromString) - DOT_RADIUS}
            y={rowY(barre.fret - baseFret) + FRET_GAP / 2 - DOT_RADIUS}
            width={stringX(6 - barre.toString) - stringX(6 - barre.fromString) + DOT_RADIUS * 2}
            height={DOT_RADIUS * 2}
            rx={DOT_RADIUS}
            fill="var(--accent)"
          />
        )}

        {/* Open / muted markers above the nut */}
        {frets.map((fret, i) => {
          if (fret > 0) return null
          const x = stringX(i)
          return (
            <text key={i} x={x} y={TOP - 10} fontSize={12} textAnchor="middle" fill="currentColor" fontWeight="bold">
              {fret === 0 ? 'O' : 'X'}
            </text>
          )
        })}

        {/* Fretted note dots */}
        {frets.map((fret, i) => {
          if (fret <= 0) return null
          const x = stringX(i)
          const y = rowY(fret - baseFret) + FRET_GAP / 2
          const finger = fingers[i]
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={DOT_RADIUS} fill="var(--accent)" />
              {finger > 0 && (
                <text x={x} y={y + 3.5} fontSize={9} textAnchor="middle" fill="var(--accent-contrast)" fontWeight="bold">
                  {finger}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
