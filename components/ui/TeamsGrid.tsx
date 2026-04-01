'use client'

import { useState, useMemo } from 'react'
import Link                   from 'next/link'
import SectionHeader          from '@/components/ui/SectionHeader'
import EmptyState             from '@/components/ui/EmptyState'
import { formatTeamName, nameInitial } from '@/lib/formatters'
import styles                 from '@/styles/components/TeamsPage.module.scss'

interface Team {
  id:       string
  name:     string
  logo_url: string | null
}

interface TeamsGridProps {
  teams: Team[]
}

export default function TeamsGrid({ teams }: TeamsGridProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return teams
    return teams.filter((t) => t.name.toLowerCase().includes(q))
  }, [teams, search])

  return (
    <>
      <SectionHeader
        title="Teams"
        subtitle={`${filtered.length} team${filtered.length !== 1 ? 's' : ''}`}
      />

      {teams.length > 0 && (
        <div className={styles.searchWrap}>
          <input
            type="text"
            placeholder="Search teams\u2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon=""
          title={search ? 'No matching teams' : 'No teams yet'}
          description={
            search
              ? 'Try a different search term.'
              : 'Teams will appear here once added.'
          }
        />
      ) : (
        <div className={styles.grid}>
          {filtered.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`} className={styles.card}>
              <div className={styles.logoWrap}>
                {team.logo_url
                  ? <img src={team.logo_url} alt={team.name} className={styles.logo} />
                  : nameInitial(team.name)
                }
              </div>
              <span className={styles.name}>{formatTeamName(team.name)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
