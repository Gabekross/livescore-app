'use client'

import { useEffect, useCallback } from 'react'
import { getArticle, getRelatedArticles } from '@/data/help'
import { usePlanAccess } from '@/hooks/usePlanAccess'
import styles from '@/styles/components/HelpSystem.module.scss'

interface Props {
  articleId:   string
  open:        boolean
  onClose:     () => void
  onNavigate?: (articleId: string) => void
}

export default function HelpModal({ articleId, open, onClose, onNavigate }: Props) {
  const article      = getArticle(articleId)
  const { isPro }    = usePlanAccess()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  // Don't render Pro articles for non-Pro users
  if (!open || !article || (article.requiresPro && !isPro)) return null

  const related = getRelatedArticles(articleId).filter(
    r => !r.requiresPro || isPro
  )

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal} onClick={onClose}>
        <div
          className={styles.modalPanel}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-label={article.title}
        >
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>{article.title}</h2>
            <button className={styles.modalClose} onClick={onClose}>
              Close
            </button>
          </div>
          <div className={styles.modalBody}>
            {article.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {related.length > 0 && onNavigate && (
              <div className={styles.relatedSection}>
                <div className={styles.relatedLabel}>Related</div>
                {related.map(r => (
                  <button
                    key={r.id}
                    className={styles.relatedLink}
                    onClick={() => {
                      onClose()
                      onNavigate(r.id)
                    }}
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
