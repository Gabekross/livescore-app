'use client'

import { useState } from 'react'
import {
  HELP_CATEGORIES,
  HELP_ARTICLES,
  getArticlesByCategory,
  searchArticles,
  type HelpArticle,
} from '@/data/help'
import HelpDrawer from '@/components/help/HelpDrawer'
import styles from '@/styles/components/HelpSystem.module.scss'

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedArticleId, setSelectedArticleId] = useState<string | undefined>()

  const results = query.trim() ? searchArticles(query) : null

  const openArticle = (id: string) => {
    setSelectedArticleId(id)
    setDrawerOpen(true)
  }

  return (
    <div className={styles.helpPage}>
      <h1 className={styles.helpPageTitle}>Help Center</h1>
      <p className={styles.helpPageSubtitle}>
        Find answers to common questions about managing your sports site.
      </p>

      <div className={styles.helpPageSearch}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search for help..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {results ? (
        <SearchResults results={results} onSelect={openArticle} />
      ) : (
        <div className={styles.helpPageGrid}>
          {HELP_CATEGORIES.map(cat => {
            const articles = getArticlesByCategory(cat.key)
            if (articles.length === 0) return null
            return (
              <button
                key={cat.key}
                className={styles.helpPageCard}
                onClick={() => {
                  setSelectedArticleId(articles[0].id)
                  setDrawerOpen(true)
                }}
              >
                <div className={styles.helpPageCardTitle}>{cat.label}</div>
                <div className={styles.helpPageCardCount}>
                  {articles.length} article{articles.length !== 1 ? 's' : ''}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <HelpDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialArticleId={selectedArticleId}
      />
    </div>
  )
}

function SearchResults({
  results,
  onSelect,
}: {
  results:  HelpArticle[]
  onSelect: (id: string) => void
}) {
  if (results.length === 0) {
    return (
      <div className={styles.noResults}>
        No articles found. Try a different search term.
      </div>
    )
  }

  return (
    <div>
      <div className={styles.searchResultsLabel}>
        {results.length} result{results.length !== 1 ? 's' : ''}
      </div>
      {results.map(a => (
        <button
          key={a.id}
          className={styles.articleLink}
          onClick={() => onSelect(a.id)}
        >
          <div className={styles.articleTitle}>{a.title}</div>
          <div className={styles.articleSummary}>{a.summary}</div>
        </button>
      ))}
    </div>
  )
}
