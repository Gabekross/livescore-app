'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAdminOrg } from '@/contexts/AdminOrgContext'
import styles from '@/styles/components/HelpSystem.module.scss'

interface ChecklistStep {
  key:      string
  title:    string
  hint:     string
  href:     string
  check:    () => Promise<boolean>
}

const STORAGE_KEY = 'kolu_checklist_dismissed'

export default function OnboardingChecklist() {
  const { orgId } = useAdminOrg()
  const [dismissed, setDismissed] = useState(true)
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const steps: ChecklistStep[] = [
    {
      key:   'tournament',
      title: 'Create a tournament',
      hint:  'Set up your first competition',
      href:  '/admin/tournaments/new',
      check: async () => {
        if (!orgId) return false
        const { count } = await supabase
          .from('tournaments')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgId)
        return (count ?? 0) > 0
      },
    },
    {
      key:   'team',
      title: 'Add a team',
      hint:  'Register your first team',
      href:  '/admin/teams/new',
      check: async () => {
        if (!orgId) return false
        const { count } = await supabase
          .from('teams')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgId)
        return (count ?? 0) > 0
      },
    },
    {
      key:   'settings',
      title: 'Customize site settings',
      hint:  'Set your site name, logo, and theme',
      href:  '/admin/settings',
      check: async () => {
        if (!orgId) return false
        const { data } = await supabase
          .from('site_settings')
          .select('site_logo')
          .eq('org_id', orgId)
          .single()
        return !!data?.site_logo
      },
    },
    {
      key:   'match',
      title: 'Schedule a match',
      hint:  'Create your first fixture',
      href:  '/admin/matches/friendly/new',
      check: async () => {
        if (!orgId) return false
        const { count } = await supabase
          .from('matches')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgId)
        return (count ?? 0) > 0
      },
    },
  ]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasDismissed = localStorage.getItem(STORAGE_KEY) === '1'
      setDismissed(wasDismissed)
    }
  }, [])

  useEffect(() => {
    if (dismissed || !orgId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function checkAll() {
      const result: Record<string, boolean> = {}
      for (const step of steps) {
        try {
          result[step.key] = await step.check()
        } catch {
          result[step.key] = false
        }
      }
      if (!cancelled) {
        setCompleted(result)
        setLoading(false)
      }
    }

    checkAll()
    return () => { cancelled = true }
  }, [dismissed, orgId])

  if (dismissed || loading) return null

  const doneCount = steps.filter(s => completed[s.key]).length
  const allDone = doneCount === steps.length

  if (allDone) return null

  const progressPct = (doneCount / steps.length) * 100

  return (
    <div className={styles.checklist}>
      <div className={styles.checklistHeader}>
        <span className={styles.checklistTitle}>Quick Start Guide</span>
        <span className={styles.checklistProgress}>
          {doneCount} of {steps.length} done
        </span>
      </div>

      <div className={styles.checklistBar}>
        <div
          className={styles.checklistBarFill}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {steps.map(step => {
        const done = completed[step.key]
        return (
          <Link
            key={step.key}
            href={done ? '#' : step.href}
            className={styles.checklistItem}
          >
            <span
              className={`${styles.checklistCheck} ${done ? styles.checklistCheckDone : ''}`}
            >
              {done ? '✓' : ''}
            </span>
            <span className={styles.checklistItemText}>
              <span
                className={`${styles.checklistItemTitle} ${done ? styles.checklistItemDoneTitle : ''}`}
              >
                {step.title}
              </span>
              {!done && (
                <span className={styles.checklistItemHint}>{step.hint}</span>
              )}
            </span>
          </Link>
        )
      })}

      <button
        className={styles.checklistDismiss}
        onClick={() => {
          setDismissed(true)
          localStorage.setItem(STORAGE_KEY, '1')
        }}
      >
        Dismiss checklist
      </button>
    </div>
  )
}
