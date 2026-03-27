// components/ui/TeamLogo.tsx
// Team logo image with a styled fallback when no logo is available.
// Works in server and client components.

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
    objectFit:    'cover',
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
          className,
        } as React.CSSProperties}
      >
        {alt.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      className={className}
      loading="lazy"
    />
  )
}
