'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrganizationId } from '@/lib/org'
import styles from '@/styles/components/PublicSearch.module.scss'

interface SearchResult {
  type:    'team' | 'news' | 'tournament' | 'match'
  id:      string
  title:   string
  subtitle?: string
  href:    string
}

interface Props {
  open:    boolean
  onClose: () => void
}

export default function PublicSearch({ open, onClose }: Props) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const search = useCallback(async (q: string) => {
    const term = q.trim()
    if (term.length < 2) { setResults([]); return }

    setLoading(true)
    try {
      const orgId = await getOrganizationId()
      const like  = `%${term}%`

      const [teams, news, tournaments] = await Promise.all([
        supabase.from('teams').select('id, name').eq('organization_id', orgId).ilike('name', like).limit(4),
        supabase.from('posts').select('id, title, slug').eq('organization_id', orgId).ilike('title', like).limit(4),
        supabase.from('tournaments').select('id, name, slug').eq('organization_id', orgId).ilike('name', like).limit(4),
      ])

      const out: SearchResult[] = [
        ...(teams.data || []).map(t => ({ type: 'team'       as const, id: t.id, title: t.name,  href: `/teams/${t.id}` })),
        ...(news.data  || []).map(n => ({ type: 'news'       as const, id: n.id, title: n.title, href: `/news/${n.slug}` })),
        ...(tournaments.data || []).map(t => ({ type: 'tournament' as const, id: t.id, title: t.name, href: `/tournaments/${t.slug}` })),
      ]

      setResults(out)
    } catch {
      setResults([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 280)
    return () => clearTimeout(t)
  }, [query, search])

  if (!open) return null

  const typeLabel: Record<SearchResult['type'], string> = {
    team:       'Team',
    news:       'News',
    tournament: 'Tournament',
    match:      'Match',
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Search">
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search teams, news, tournaments…"
            className={styles.input}
            autoComplete="off"
          />
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close search">
            Close
          </button>
        </div>

        {loading && <p className={styles.hint}>Searching…</p>}

        {!loading && query.length >= 2 && results.length === 0 && (
          <p className={styles.hint}>No results for &ldquo;{query}&rdquo;</p>
        )}

        {!loading && query.length < 2 && (
          <p className={styles.hint}>Type at least 2 characters to search</p>
        )}

        {results.length > 0 && (
          <ul className={styles.results} role="list">
            {results.map(r => (
              <li key={`${r.type}-${r.id}`}>
                <Link href={r.href} className={styles.result} onClick={onClose}>
                  <span className={styles.resultType}>{typeLabel[r.type]}</span>
                  <span className={styles.resultTitle}>{r.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
