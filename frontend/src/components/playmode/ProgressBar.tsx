export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.15)' }} role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full"
        style={{ width: `${progress * 100}%`, background: 'var(--color-amber-400)', transition: 'width 80ms linear' }}
      />
    </div>
  )
}
