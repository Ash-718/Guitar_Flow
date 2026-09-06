import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ProgressBar } from '../components/playmode/ProgressBar'
import { SpeedControl } from '../components/playmode/SpeedControl'
import { SectionBlock } from '../components/song/SectionBlock'
import { usePreferences } from '../contexts/PreferencesContext'
import { useAutoScroll } from '../hooks/useAutoScroll'
import { getSong } from '../services/songService'
import type { Song } from '../types/song'

export function PlayMode() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { scrollSpeed, setScrollSpeed } = usePreferences()

  const [song, setSong] = useState<Song | null>((location.state as { song?: Song } | null)?.song ?? null)
  const [isPlaying, setIsPlaying] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (song || !id) return
    getSong(id).then(setSong).catch(() => {})
  }, [id, song])

  const { progress, restart } = useAutoScroll(containerRef, scrollSpeed, isPlaying)

  // Auto-pause once the lyrics have fully scrolled by - nothing left to show.
  useEffect(() => {
    if (progress >= 1 && isPlaying) setIsPlaying(false)
  }, [progress, isPlaying])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === ' ') {
        e.preventDefault()
        setIsPlaying((p) => !p)
      } else if (e.key === 'Escape') {
        navigate(`/songs/${id}`)
      } else if (e.key === 'ArrowUp') {
        setScrollSpeed(Math.min(150, scrollSpeed + 5))
      } else if (e.key === 'ArrowDown') {
        setScrollSpeed(Math.max(10, scrollSpeed - 5))
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [id, navigate, scrollSpeed, setScrollSpeed])

  function handleRestart() {
    restart()
    setIsPlaying(true)
  }

  if (!song) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="opacity-60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold opacity-80">{song.title}</p>
          <p className="truncate text-xs opacity-50">{song.artist}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/songs/${id}`)}
          aria-label="Exit Play Mode"
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl opacity-70"
        >
          ×
        </button>
      </div>

      <div
        ref={containerRef}
        className="chordsheet flex-1 overflow-x-auto overflow-y-auto px-4 pb-[40vh] sm:px-10"
        style={{ fontSize: 'clamp(0.9rem, 1.2vw + 0.7rem, 1.6rem)' }}
      >
        <div className="mx-auto flex w-max min-w-full max-w-3xl flex-col gap-8 pt-[15vh]">
          {song.sections.map((section, i) => (
            <SectionBlock key={i} section={section} sectionIndex={i} />
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <ProgressBar progress={progress} />
        <div className="flex flex-wrap items-center justify-center gap-4 px-4 py-3 sm:gap-8">
          <button
            type="button"
            onClick={handleRestart}
            aria-label="Restart"
            className="flex h-11 w-11 items-center justify-center rounded-full text-lg"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            ⟲
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold"
            style={{ background: 'var(--color-amber-400)', color: '#0b0a09' }}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>

          <SpeedControl speed={scrollSpeed} onChange={setScrollSpeed} />
        </div>
      </div>
    </div>
  )
}
