import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANT_STYLE: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--accent)', color: 'var(--accent-contrast)' },
  secondary: { background: 'var(--surface-raised)', color: 'var(--text)' },
  ghost: { background: 'transparent', color: 'var(--text-muted)' },
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'secondary', className = '', style, ...rest }: Props) {
  return (
    <button
      type="button"
      className={`rounded-md px-3.5 py-2 text-sm font-semibold transition disabled:opacity-40 ${className}`}
      style={{ ...VARIANT_STYLE[variant], ...style }}
      {...rest}
    />
  )
}
