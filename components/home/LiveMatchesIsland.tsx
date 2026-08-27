'use client'

// components/home/LiveMatchesIsland.tsx
// Client island: shows live matches and auto-refreshes every 30 s.
// Hidden completely when no live matches are running.

import { useEffect, useState, useCallback } from 'react'
import { supabase }   from '@/lib/supabase'
import MatchCard      from '@/components/ui/MatchCard'
import type { MatchStatus } from '@/lib/utils/match'
import { sortByRelevance } from '@/lib/utils/matchSort'
import styles         from '@/styles/components/Homepage.module.scss'

interface LiveMatch {
  id:            string
  status:        MatchStatus
  match_date:    string
  match_type:    string
  tournament_id: string | null
  home_score:    number | null
  away_score:    number | null
  home_team:     { id: string; name: string; logo_url?: string | null }
  away_team:     { id: string; name: string; logo_url?: string | null }
}

interface Props { orgId: string }

export default function LiveMatchesIsland({ orgId }: Props) {
  const [matches, setMatches] = useState<LiveMatch[]>([])

  const fetchLive = useCallback(async () => {
    const { data: tournaments } = await supabase
      .from('tournaments')
      .select('id')
      .eq('organization_id', orgId)
      .eq('is_archived', false)

    const activeTournamentIds = (tournaments || []).map((t) => t.id)
    const publicMatchScope = activeTournamentIds.length > 0
      ? `match_type.eq.friendly,tournament_id.in.(${activeTournamentIds.join(',')})`
      : 'match_type.eq.friendly'

    const { data } = await supabase
      .from('matches')
      .select(`
        id, status, match_date, match_type, tournament_id, home_score, away_score,
        home_team:home_team_id(id, name, logo_url),
        away_team:away_team_id(id, name, logo_url)
      `)
      .eq('organization_id', orgId)
      .in('status', ['live', 'halftime'])
      .or(publicMatchScope)
      .order('match_date')

    if (data) {
      const normalized = data.map((m) => ({
        ...m,
        home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
        away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
      })) as LiveMatch[]
      setMatches(sortByRelevance(normalized))
    }
  }, [orgId])

  useEffect(() => {
    fetchLive()

    // Poll every 30 s as a lightweight keep-alive
    const interval = setInterval(fetchLive, 30_000)

    // Also subscribe to realtime changes
    const channel = supabase
      .channel('home-live-matches')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'matches',
        filter: `organization_id=eq.${orgId}`,
      }, fetchLive)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'tournaments',
        filter: `organization_id=eq.${orgId}`,
      }, fetchLive)
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [fetchLive, orgId])

  if (matches.length === 0) return null

  return (
    <section className={styles.liveSection} aria-label="Live matches">
      <div className="container">
        <div className={styles.liveHeader}>
          <span className={styles.liveDot} aria-hidden="true" />
          <span className={styles.liveTitle}>Live Now</span>
        </div>
        <div className={styles.liveGrid}>
          {matches.map((m) => (
            <MatchCard
              key={m.id}
              {...m}
              href={`/matches/${m.id}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
