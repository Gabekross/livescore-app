'use client'

// components/ui/ArticleCarousel.tsx
// Hero image carousel for article pages.
// Shown when a post has multiple cover images.
// The cover image (selected by admin) is shown first; all others follow.

import { useState } from 'react'
import NewsImage    from '@/components/ui/NewsImage'
import styles       from '@/styles/components/ArticlePage.module.scss'

interface Props {
  /** Ordered list with the active cover first */
  images: string[]
  title:  string
}

export default function ArticleCarousel({ images, title }: Props) {
  const [index, setIndex] = useState(0)

  if (images.length === 0) return null

  if (images.length === 1) {
    return (
      <div className={styles.hero}>
        <NewsImage
          src={images[0]}
          alt={title}
          fill
          priority
          className={styles.heroImage}
          sizes="100vw"
        />
        <div className={styles.heroOverlay} />
      </div>
    )
  }

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length)
  const next = () => setIndex((i) => (i + 1) % images.length)

  return (
    <div className={styles.hero}>
      {/* Slide */}
      <NewsImage
        key={index}
        src={images[index]}
        alt={`${title} — image ${index + 1}`}
        fill
        priority={index === 0}
        className={`${styles.heroImage} ${styles.heroImageFade}`}
        sizes="100vw"
      />
      <div className={styles.heroOverlay} />

      {/* Arrows */}
      <button
        type="button"
        className={`${styles.carouselBtn} ${styles.carouselBtnLeft}`}
        onClick={prev}
        aria-label="Previous image"
      >
        ‹
      </button>
      <button
        type="button"
        className={`${styles.carouselBtn} ${styles.carouselBtnRight}`}
        onClick={next}
        aria-label="Next image"
      >
        ›
      </button>

      {/* Dot indicators */}
      <div className={styles.carouselDots}>
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.carouselDot} ${i === index ? styles.carouselDotActive : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
