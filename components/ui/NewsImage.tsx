import Image from 'next/image'

interface NewsImageProps {
  src: string
  alt: string
  fill?: boolean
  priority?: boolean
  sizes?: string
  className?: string
}

function canOptimize(src: string) {
  if (src.startsWith('/')) return true

  try {
    const { hostname, protocol } = new URL(src)
    return protocol === 'https:' && (
      hostname.endsWith('.supabase.co') ||
      hostname.endsWith('.supabase.in')
    )
  } catch {
    return false
  }
}

export default function NewsImage({
  src,
  alt,
  fill,
  priority,
  sizes,
  className,
}: NewsImageProps) {
  if (canOptimize(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={fill ? undefined : 1200}
        height={fill ? undefined : 675}
        priority={priority}
        sizes={sizes}
        className={className}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      style={fill ? {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      } : undefined}
    />
  )
}
