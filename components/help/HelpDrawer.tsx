'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  getArticlesByCategory,
  getRelatedArticles,
  searchArticles,
  type HelpArticle,
} from '@/data/help'
import { usePlanAccess } from '@/hooks/usePlanAccess'
import styles from '@/styles/components/HelpSystem.module.scss'

interface Props {
  open:              boolean
  onClose:           () => void
  initialArticleId?: string
}

export default function HelpDrawer({ open, onClose, initialArticleId }: Props) {
  const [activeArticle, setActiveArticle] = useState<HelpArticle | null>(null)
  const [query, setQuery]                 = useState('')
  const { isPro }                         = usePlanAccess()

  useEffect(() => {
    if (open && initialArticleId) {
      const article = HELP_ARTICLES.find(a => a.id === initialArticleId)
      // Don't open a Pro article for non-Pro users
      if (article && (!article.requiresPro || isPro)) setActiveArticle(article)
    }
    if (!open) {
      setActiveArticle(null)
      setQuery('')
    }
  }, [open, initialArticleId, isPro])

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

  if (!open) return null

  // Filter search results by plan access
  const rawResults = query.trim() ? searchArticles(query) : null
  const results    = rawResults
    ? rawResults.filter(a => !a.requiresPro || isPro)
    : null

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label="Help">
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>
            {activeArticle ? activeArticle.title : 'Help'}
          </h2>
          <button className={styles.drawerClose} onClick={onClose}>
            Close
          </button>
        </div>

        {!activeArticle && (
          <div className={styles.drawerSearch}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search help articles..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div className={styles.drawerBody}>
          {activeArticle ? (
            <ArticleView
              article={activeArticle}
              isPro={isPro}
              onBack={() => setActiveArticle(null)}
              onNavigate={setActiveArticle}
            />
          ) : results ? (
            <SearchResults results={results} onSelect={setActiveArticle} />
          ) : (
            <CategoryList isPro={isPro} onSelect={setActiveArticle} />
          )}
        </div>
      </aside>
    </>
  )
}

function ArticleView({
  article,
  isPro,
  onBack,
  onNavigate,
}: {
  article:    HelpArticle
  isPro:      boolean
  onBack:     () => void
  onNavigate: (a: HelpArticle) => void
}) {
  const related = getRelatedArticles(article.id).filter(
    r => !r.requiresPro || isPro
  )

  return (
    <div className={styles.articleDetail}>
      <button className={styles.backButton} onClick={onBack}>
        &larr; Back to all articles
      </button>
      <h3 className={styles.articleDetailTitle}>{article.title}</h3>
      <div className={styles.articleBody}>
        {article.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {related.length > 0 && (
        <div className={styles.relatedSection}>
          <div className={styles.relatedLabel}>Related Articles</div>
          {related.map(r => (
            <button
              key={r.id}
              className={styles.relatedLink}
              onClick={() => onNavigate(r)}
            >
              {r.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryList({
  isPro,
  onSelect,
}: {
  isPro:     boolean
  onSelect:  (a: HelpArticle) => void
}) {
  return (
    <>
      {HELP_CATEGORIES.map(cat => {
        const allArticles  = getArticlesByCategory(cat.key)
        const accessible   = allArticles.filter(a => !a.requiresPro || isPro)
        const lockedCount  = allArticles.length - accessible.length

        if (allArticles.length === 0) return null

        return (
          <div key={cat.key} className={styles.categoryGroup}>
            <div className={styles.categoryLabel}>{cat.label}</div>

            {accessible.map(a => (
              <button
                key={a.id}
                className={styles.articleLink}
                onClick={() => onSelect(a)}
              >
                <div className={styles.articleTitle}>{a.title}</div>
                <div className={styles.articleSummary}>{a.summary}</div>
              </button>
            ))}

            {/* Pro-locked teaser — only shown when there are locked articles */}
            {!isPro && lockedCount > 0 && (
              <div className={styles.proLockedTeaser}>
                <span className={styles.proLockedText}>
                  {lockedCount} more article{lockedCount !== 1 ? 's' : ''} available on Pro
                </span>
                <a href="/admin/settings#billing" className={styles.proLockedUpgrade}>
                  Upgrade
                </a>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

function SearchResults({
  results,
  onSelect,
}: {
  results:  HelpArticle[]
  onSelect: (a: HelpArticle) => void
}) {
  if (results.length === 0) {
    return (
      <div className={styles.noResults}>
        No articles found. Try a different search term.
      </div>
    )
  }

  return (
    <div className={styles.searchResults}>
      <div className={styles.searchResultsLabel}>
        {results.length} result{results.length !== 1 ? 's' : ''}
      </div>
      {results.map(a => (
        <button
          key={a.id}
          className={styles.articleLink}
          onClick={() => onSelect(a)}
        >
          <div className={styles.articleTitle}>{a.title}</div>
          <div className={styles.articleSummary}>{a.summary}</div>
        </button>
      ))}
    </div>
  )
}
