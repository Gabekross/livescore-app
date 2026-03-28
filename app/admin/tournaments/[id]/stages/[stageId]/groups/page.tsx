'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import styles from '@/styles/components/StageList.module.scss'
import { useAdminOrg } from '@/contexts/AdminOrgContext'
import { useAdminOrgGate } from '@/components/admin/AdminOrgGate'

interface Group {
  id: string
  name: string
  stage_id: string
}

export default function GroupListPage() {
  const { id, stageId } = useParams()
  const { orgId } = useAdminOrg()
  const orgGate = useAdminOrgGate()
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    if (!orgId) return
    const fetchGroups = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('stage_id', stageId)

      if (!error && data) setGroups(data)
    }

    fetchGroups()
  }, [stageId, orgId])

  if (orgGate) return orgGate

  return (
    <div className={styles.container}>
      <Link href={`/admin/tournaments/${id}/stages`} className={styles.backButton}>
        &#8592; Back to Stages
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className={styles.heading}>Groups in This Stage</h1>
        <Link href={`/admin/tournaments/${id}/stages/${stageId}/groups/new`} className={styles.primaryButton}>
          + Add Group
        </Link>
      </div>

      {groups.length === 0 ? (
        <div style={{
          padding: '3rem 2rem', textAlign: 'center', color: '#9ca3af',
          background: '#f9fafb', borderRadius: '10px', border: '1px dashed #e5e7eb',
        }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>
            No groups yet
          </p>
          <p style={{ fontSize: '0.82rem' }}>
            Add groups to organise teams and schedule matches.
          </p>
        </div>
      ) : (
        <ul className={styles.groupList} style={{ paddingLeft: 0 }}>
          {groups.map((group) => (
            <li key={group.id} className={styles.groupItem}>
              <div className={styles.groupHeader}>
                <span>{group.name}</span>
              </div>
              <div className={styles.linkRow}>
                <Link href={`/admin/tournaments/${id}/stages/${stageId}/groups/${group.id}/assign-teams`}>
                  Assign Teams
                </Link>
                <Link href={`/admin/tournaments/${id}/stages/${stageId}/groups/${group.id}/matches`}>
                  View Matches
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
