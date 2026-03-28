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

      if (error) {
        // fetch failed — groups array stays empty
      } else {
        setGroups(data)
      }
    }

    fetchGroups()
  }, [stageId, orgId])

  if (orgGate) return orgGate

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Groups in This Stage</h2>
      <Link href={`/admin/tournaments/${id}/stages/${stageId}/groups/new`} className={styles.newLink}>
        + Add New Group
      </Link>
      <ul className={styles.stageList}>
        {groups.map((group) => (
          <li key={group.id} className={styles.stageItem}>
            {group.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
