'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/PublicMatchListTabs.module.scss'

interface Match {
  id: string
  match_date: string
  status: string
  venue?: string
  tournament_id: string
  home_score: number | null
  away_score: number | null
  home_team: { id: string; name: string }
  away_team: { id: string; name: string }
}

interface Tournament {
  id: string
  name: string
  default_stage_id?: string // you must attach this in your DB manually or fetch stage dynamically
}

export default function PublicMatchListTabs() {
  const [matches, setMatches] = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming'>('today')
  const [showTourneyDropdown, setShowTourneyDropdown] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchData()

    const interval = setInterval(() => {
      if (matches.some((m) => m.status === 'ongoing')) fetchData()
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    const { data: matchData } = await supabase
      .from('matches')
      .select(`
        id, match_date, status, venue, tournament_id,
        home_score, away_score,
        home_team:home_team_id(id, name),
        away_team:away_team_id(id, name)
      `)
      .order('match_date')

    const { data: tourneyData } = await supabase
      .from('tournaments')
      .select('id, name')

    if (matchData) {
      const parsed = matchData.map((match) => ({
        ...match,
        home_team: Array.isArray(match.home_team) ? match.home_team[0] : match.home_team,
        away_team: Array.isArray(match.away_team) ? match.away_team[0] : match.away_team,
      }))
      setMatches(parsed)
    }

    if (tourneyData) setTournaments(tourneyData)
  }

  const today = new Date().toISOString().split('T')[0]

  const filtered = matches.filter((m) => {
    if (activeTab === 'today') return m.match_date.startsWith(today)
    if (activeTab === 'upcoming') return new Date(m.match_date) > new Date() && m.status === 'scheduled'
    return true
  })

  const handleTourneySelect = async (tournamentId: string) => {
    const { data } = await supabase
      .from('tournament_stages')
      .select('id')
      .eq('tournament_id', tournamentId)
      .order('order_number')
      .limit(1)
      .maybeSingle()

    if (data?.id) {
      router.push(`/public/tournaments/${tournamentId}/stages/${data.id}`)
    } else {
      alert('No stage found for this tournament')
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>⚽ Global Match View</h1>

      {/* Tabs + Tournament Dropdown */}
      <div className={styles.tabRow}>
        <div className={styles.tabs}>
          {['today', 'upcoming', 'all'].map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
              onClick={() => setActiveTab(tab as 'today' | 'upcoming' | 'all')}
            >
              {tab === 'today' ? 'Today' : tab === 'upcoming' ? 'Upcoming' : 'All'}
            </button>
          ))}
        </div>

        <div className={styles.tournamentDropdown}>
          <button onClick={() => setShowTourneyDropdown((prev) => !prev)} className={styles.tab}>
            🏆 Tournaments ▾
          </button>
          {showTourneyDropdown && (
            <div className={styles.dropdownMenu}>
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className={styles.dropdownItem}
                  onClick={() => handleTourneySelect(t.id)}
                >
                  {t.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Match List */}
      {filtered.length === 0 ? (
        <p className={styles.noMatch}>No matches found.</p>
      ) : (
        <div className={styles.matchList}>
          {filtered.map((match) => (
            <div key={match.id} className={styles.matchRow}>
              <span className={`${styles.status} ${match.status === 'ongoing' ? styles.live : ''}`}>
                {match.status === 'finished'
                  ? 'FT'
                  : match.status === 'ongoing'
                  ? 'LIVE'
                  : new Date(match.match_date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
              </span>
              <span className={styles.team}>{match.home_team.name}</span>
              <span className={styles.score}>
                {match.home_score ?? '-'} – {match.away_score ?? '-'}
              </span>
              <span className={styles.team}>{match.away_team.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
