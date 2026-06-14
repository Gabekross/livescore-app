// components/ui/TeamLogo.tsx
// Team logo image with a styled fallback when no logo is available.
// Works in server and client components.

import Image from 'next/image'

interface Props {
  src?:       string | null
  alt:        string
  size?:      number   // px, default 24
  className?: string
}

export default function TeamLogo({ src, alt, size = 24, className }: Props) {
  const style: React.CSSProperties = {
    width:        size,
    height:       size,
    borderRadius: 4,
    objectFit:    'contain',
    background:   'rgba(255, 255, 255, 0.06)',
    border:       '1px solid var(--color-border-subtle, rgba(148, 163, 184, 0.18))',
    padding:      Math.max(2, Math.round(size * 0.08)),
    boxSizing:    'border-box',
    flexShrink:   0,
  }

  if (!src) {
    return (
      <span
        aria-label={alt}
        style={{
          ...style,
          display:         'inline-flex',
          alignItems:      'center',
          justifyContent:  'center',
          backgroundColor: 'var(--color-surface, #0f0f1e)',
          border:          '1px solid var(--color-border-subtle, #1c1c35)',
          fontSize:        Math.round(size * 0.55),
          color:           'var(--color-text-dim, #48487a)',
          fontWeight:      700,
        } as React.CSSProperties}
        className={className}
      >
        {alt.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={style}
      className={className}
    />
  )
}
