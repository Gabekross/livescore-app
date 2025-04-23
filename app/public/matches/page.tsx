'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/PublicMatches.module.scss'
import TournamentQuickLink from '@/components/TournamentQuickLink'

interface Match {
  id: string
  match_date: string
  venue?: string
  status: string
  home_score: number | null
  away_score: number | null
  tournament_id: string
  home_team: { id: string; name: string; logo_url?: string }
  away_team: { id: string; name: string; logo_url?: string }
}

interface Tournament {
  id: string
  name: string
}

export default function PublicMatchesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedTab, setSelectedTab] = useState(searchParams.get('tab') || 'all')
  const [selectedTournament, setSelectedTournament] = useState<string | null>(searchParams.get('tournament') || null)
  const [onlyLive, setOnlyLive] = useState(false)
  const [showTopButton, setShowTopButton] = useState(false)

  const fetchTournaments = async () => {
    const { data } = await supabase.from('tournaments').select('id, name')
    setTournaments(data || [])
  }

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        venue,
        status,
        tournament_id,
        home_score,
        away_score,
        home_team:home_team_id(id, name, logo_url),
        away_team:away_team_id(id, name, logo_url)
      `)
      .order('match_date', { ascending: true })

    if (data) {
      const parsed = data.map((match) => ({
        ...match,
        home_team: Array.isArray(match.home_team) ? match.home_team[0] : match.home_team,
        away_team: Array.isArray(match.away_team) ? match.away_team[0] : match.away_team,
      }))
      setMatches(parsed)
    }
  }

  const filterMatches = () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    let filtered = [...matches]

    if (selectedTournament) {
      filtered = filtered.filter(m => m.tournament_id === selectedTournament)
    }

    if (selectedTab === 'today') {
      filtered = filtered.filter(m => m.match_date.startsWith(today))
    } else if (selectedTab === 'upcoming') {
      filtered = filtered.filter(m => new Date(m.match_date) > now && m.status === 'scheduled')
    }

    if (onlyLive) {
      filtered = filtered.filter(m => m.status === 'ongoing')
    }

    return filtered
  }

  useEffect(() => {
    fetchTournaments()
    fetchMatches()

    const channel = supabase
      .channel('public-matches')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        (payload) => {
          const updated = payload.new
          setMatches((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      setShowTopButton(window.scrollY > 300)
    }
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab)
    router.push(`/public/matches?tab=${tab}${selectedTournament ? `&tournament=${selectedTournament}` : ''}`, { scroll: false })
  }

  const handleTournamentChange = (tournamentId: string) => {
    setSelectedTournament(tournamentId)
    router.push(`/public/matches?tab=${selectedTab}&tournament=${tournamentId}`, { scroll: false })
  }

  const filteredMatches = filterMatches()

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <h3>Tournaments</h3>
        <ul>
          {tournaments.map(t => (
            <li key={t.id}>
              <button
                className={t.id === selectedTournament ? styles.activeTab : ''}
                onClick={() => handleTournamentChange(t.id)}
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className={styles.container}>
        <h1 className={styles.heading}>⚽ Matches</h1>

        <div className={styles.topControls}>
          <div className={styles.tabs}>
            {['all', 'today', 'upcoming'].map(tab => (
              <button
                key={tab}
                className={selectedTab === tab ? styles.activeTab : ''}
                onClick={() => handleTabChange(tab)}
              >
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={onlyLive}
              onChange={() => setOnlyLive(!onlyLive)}
            />
            Show only LIVE
          </label>
        </div>

        {selectedTournament && (
          <TournamentQuickLink tournamentId={selectedTournament} tournaments={tournaments} />
        )}

        <div className={styles.matchList}>
          {filteredMatches.length === 0 ? (
            <p>No matches found.</p>
          ) : (
            filteredMatches.map((match) => (
              <Link key={match.id} href={`/public/matches/${match.id}`} className={styles.card}>
                <div className={styles.matchMeta}>
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
                          hour12: false,
                        }).replace(',', '')}
                  </span>
                  <span className={styles.venue}>📍 {match.venue || 'TBD'}</span>
                </div>
                <div className={styles.teams}>
                  <span>
                    {match.home_team.logo_url && <img src={match.home_team.logo_url} alt="home logo" className={styles.logo} />} {match.home_team.name}
                  </span>
                  <span className={styles.score}>
                    {match.home_score ?? '-'} – {match.away_score ?? '-'}
                  </span>
                  <span>
                    {match.away_team.logo_url && <img src={match.away_team.logo_url} alt="away logo" className={styles.logo} />} {match.away_team.name}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {showTopButton && (
          <button
            className={styles.backToTop}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ↑ Back to Top
          </button>
        )}
      </main>
    </div>
  )
}
