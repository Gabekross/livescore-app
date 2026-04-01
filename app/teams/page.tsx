// app/teams/page.tsx
// Public teams listing — Server Component.

import type { Metadata }              from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import TeamsGrid                      from '@/components/ui/TeamsGrid'
import styles                         from '@/styles/components/TeamsPage.module.scss'

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
        <TeamsGrid teams={teams} />
      </div>
    </div>
  )
}
