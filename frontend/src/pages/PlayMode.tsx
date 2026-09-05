import { Link, useParams } from 'react-router-dom'

export function PlayMode() {
  const { id } = useParams()

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4" style={{ background: 'var(--bg)' }}>
      <p style={{ color: 'var(--text-muted)' }}>Play Mode for this song is coming in a later phase.</p>
      <Link to={`/songs/${id}`} className="underline" style={{ color: 'var(--accent)' }}>
        Back to song
      </Link>
    </div>
  )
}
