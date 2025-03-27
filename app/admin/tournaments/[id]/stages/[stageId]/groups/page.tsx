'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import styles from '@/styles/components/StageList.module.scss'

interface Group {
  id: string
  name: string
  stage_id: string
}

export default function GroupListPage() {
  const { id, stageId } = useParams()
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    const fetchGroups = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('stage_id', stageId)

      if (error) {
        console.error('Error fetching groups:', error)
      } else {
        setGroups(data)
      }
    }

    fetchGroups()
  }, [stageId])

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
