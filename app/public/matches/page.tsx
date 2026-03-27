'use client'

import { useEffect, useState } from 'react'
import Link                    from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase }            from '@/lib/supabase'
import { getOrganizationId }   from '@/lib/org'
import styles                  from '@/styles/components/PublicMatches.module.scss'
import TournamentQuickLink     from '@/components/TournamentQuickLink'

interface Match {
  id:           string
  match_date:   string
  venue?:       string
  status:       string   // scheduled | live | halftime | completed
  match_type:   string   // tournament | friendly
  home_score:   number | null
  away_score:   number | null
  tournament_id: string | null
  home_team: { id: string; name: string; logo_url?: string }
  away_team: { id: string; name: string; logo_url?: string }
}

interface Tournament {
  id:   string
  name: string
}

function statusLabel(match: Match): string {
  switch (match.status) {
    case 'completed': return 'FT'
    case 'live':      return 'LIVE'
    case 'halftime':  return 'HT'
    default:
      return new Date(match.match_date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
      }).replace(',', '')
  }
}

export default function PublicMatchesPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const [tournaments,        setTournaments]        = useState<Tournament[]>([])
  const [matches,            setMatches]            = useState<Match[]>([])
  const [selectedTab,        setSelectedTab]        = useState(searchParams.get('tab') || 'all')
  const [selectedTournament, setSelectedTournament] = useState<string | null>(searchParams.get('tournament') || null)
  const [onlyLive,           setOnlyLive]           = useState(false)
  const [showTopButton,      setShowTopButton]      = useState(false)

  const fetchData = async () => {
    const orgId = await getOrganizationId()

    const [{ data: tourData }, { data: matchData }] = await Promise.all([
      supabase.from('tournaments').select('id, name').eq('organization_id', orgId),
      supabase
        .from('matches')
        .select(`
          id, match_date, venue, status, match_type,
          tournament_id, home_score, away_score,
          home_team:home_team_id(id, name, logo_url),
          away_team:away_team_id(id, name, logo_url)
        `)
        .eq('organization_id', orgId)
        .order('match_date', { ascending: true }),
    ])

    setTournaments(tourData || [])

    if (matchData) {
      setMatches(
        matchData.map((m) => ({
          ...m,
          home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
          away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
        }))
      )
    }
  }

  const filterMatches = () => {
    const now   = new Date()
    const today = now.toISOString().split('T')[0]
    let filtered = [...matches]

    if (selectedTournament) {
      filtered = filtered.filter((m) => m.tournament_id === selectedTournament)
    }
    if (selectedTab === 'today') {
      filtered = filtered.filter((m) => m.match_date.startsWith(today))
    } else if (selectedTab === 'upcoming') {
      filtered = filtered.filter(
        (m) => new Date(m.match_date) > now && m.status === 'scheduled'
      )
    }
    if (onlyLive) {
      filtered = filtered.filter((m) => m.status === 'live')
    }
    return filtered
  }

  useEffect(() => {
    fetchData()

    let orgIdForChannel: string | null = null

    getOrganizationId().then((orgId) => {
      orgIdForChannel = orgId
      const channel = supabase
        .channel('public-matches')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'matches' },
          (payload) => {
            const updated = payload.new
            // Only update if the match belongs to our org
            if (updated.organization_id !== orgId) return
            setMatches((prev) =>
              prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
            )
          }
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    })
  }, [])

  useEffect(() => {
    const handler = () => setShowTopButton(window.scrollY > 300)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab)
    router.push(
      `/public/matches?tab=${tab}${selectedTournament ? `&tournament=${selectedTournament}` : ''}`,
      { scroll: false }
    )
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
          <li>
            <button
              className={!selectedTournament ? styles.activeTab : ''}
              onClick={() => { setSelectedTournament(null); router.push(`/public/matches?tab=${selectedTab}`, { scroll: false }) }}
            >
              All
            </button>
          </li>
          {tournaments.map((t) => (
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
        {selectedTournament && (
          <TournamentQuickLink tournamentId={selectedTournament} tournaments={tournaments} />
        )}
        <h1 className={styles.heading}>⚽ Matches</h1>

        <div className={styles.topControls}>
          <div className={styles.tabs}>
            {(['all', 'today', 'upcoming'] as const).map((tab) => (
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

        <div className={styles.matchList}>
          {filteredMatches.length === 0 ? (
            <p>No matches found.</p>
          ) : (
            filteredMatches.map((match) => (
              <Link key={match.id} href={`/public/matches/${match.id}`} className={styles.card}>
                <div className={styles.matchMeta}>
                  <span className={`${styles.status} ${match.status === 'live' ? styles.live : ''}`}>
                    {statusLabel(match)}
                  </span>
                  {match.match_type === 'friendly' && (
                    <span className={styles.friendlyBadge}>Friendly</span>
                  )}
                  <span className={styles.venue}>📍 {match.venue || 'TBD'}</span>
                </div>

                {/* Desktop layout */}
                <div className={styles.teamsDesktop}>
                  <div className={styles.teamLeft}>
                    {match.home_team.logo_url && (
                      <img src={match.home_team.logo_url} alt="home logo" className={styles.logo} />
                    )}
                    <span>{match.home_team.name}</span>
                  </div>
                  <div className={styles.score}>
                    {match.home_score ?? '-'} – {match.away_score ?? '-'}
                  </div>
                  <div className={styles.teamRight}>
                    <span>{match.away_team.name}</span>
                    {match.away_team.logo_url && (
                      <img src={match.away_team.logo_url} alt="away logo" className={styles.logo} />
                    )}
                  </div>
                </div>

                {/* Mobile layout */}
                <div className={styles.teamsMobile}>
                  <div className={styles.row}>
                    {match.home_team.logo_url && (
                      <img src={match.home_team.logo_url} alt="home logo" className={styles.logo} />
                    )}
                    <span className={styles.name}>{match.home_team.name}</span>
                    <span className={styles.mobileScore}>{match.home_score ?? '-'}</span>
                  </div>
                  <div className={styles.row}>
                    {match.away_team.logo_url && (
                      <img src={match.away_team.logo_url} alt="away logo" className={styles.logo} />
                    )}
                    <span className={styles.name}>{match.away_team.name}</span>
                    <span className={styles.mobileScore}>{match.away_score ?? '-'}</span>
                  </div>
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
