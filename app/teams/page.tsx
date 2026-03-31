// app/teams/page.tsx
// Public teams listing — Server Component.

import type { Metadata }              from 'next'
import Link                           from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import SectionHeader                  from '@/components/ui/SectionHeader'
import EmptyState                     from '@/components/ui/EmptyState'
import styles                         from '@/styles/components/TeamsPage.module.scss'
import { formatTeamName, nameInitial } from '@/lib/formatters'

export const metadata: Metadata = {
  title:       'Teams',
  description: 'View all teams and their squads.',
}

interface Team {
  id:       string
  name:     string
  logo_url: string | null
}

export default async function TeamsPage() {
  let teams: Team[] = []

  try {
    const orgId   = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()

    const { data } = await supabase
      .from('teams')
      .select('id, name, logo_url')
      .eq('organization_id', orgId)
      .order('name')

    teams = (data || []) as Team[]
  } catch {
    // DB not available — show empty state
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <SectionHeader title="Teams" subtitle={`${teams.length} team${teams.length !== 1 ? 's' : ''}`} />

        {teams.length === 0 ? (
          <EmptyState icon="" title="No teams yet" description="Teams will appear here once added." />
        ) : (
          <div className={styles.grid}>
            {teams.map((team) => (
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
      </div>
    </div>
  )
}
