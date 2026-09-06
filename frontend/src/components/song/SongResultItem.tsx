import { Link } from 'react-router-dom'
import type { Difficulty } from '../../types/chord'

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  beginner: 'var(--difficulty-beginner)',
  intermediate: 'var(--difficulty-intermediate)',
  advanced: 'var(--difficulty-advanced)',
}

interface Props {
  id: string
  title: string
  artist: string
  songKey: string
  difficulty: Difficulty
}

export function SongResultItem({ id, title, artist, songKey, difficulty }: Props) {
  return (
    <Link
      to={`/songs/${id}`}
      className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors hover:brightness-95"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="min-w-0">
        <p className="truncate font-semibold" style={{ color: 'var(--text)' }}>
          {title}
        </p>
        <p className="truncate text-sm" style={{ color: 'var(--text-muted)' }}>
          {artist}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-sm">
        <span style={{ color: 'var(--text-muted)' }}>Key {songKey}</span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
          style={{ color: DIFFICULTY_COLOR[difficulty], background: 'var(--surface-raised)' }}
        >
          {difficulty}
        </span>
      </div>
    </Link>
  )
}
