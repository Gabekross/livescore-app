'use client'

// app/platform/page.tsx
// Power admin overview — shows platform stats and quick actions.

import { useEffect, useState } from 'react'
import Link       from 'next/link'
import { supabase } from '@/lib/supabase'

interface Stats {
  orgs:   number
  admins: number
  teams:  number
  tournaments: number
}

export default function PlatformOverviewPage() {
  const [stats, setStats] = useState<Stats>({ orgs: 0, admins: 0, teams: 0, tournaments: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [orgsRes, adminsRes, teamsRes, tournamentsRes] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('admin_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('teams').select('id', { count: 'exact', head: true }),
        supabase.from('tournaments').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        orgs:        orgsRes.count ?? 0,
        admins:      adminsRes.count ?? 0,
        teams:       teamsRes.count ?? 0,
        tournaments: tournamentsRes.count ?? 0,
      })
      setLoading(false)
    })()
  }, [])

  const statCards: { label: string; value: number; href: string }[] = [
    { label: 'Organizations',  value: stats.orgs,        href: '/platform/organizations' },
    { label: 'Admin Users',    value: stats.admins,      href: '/platform/admins' },
    { label: 'Teams (all)',    value: stats.teams,       href: '#' },
    { label: 'Tournaments (all)', value: stats.tournaments, href: '#' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f0f0ff', marginBottom: '0.35rem' }}>
        Platform Overview
      </h1>
      <p style={{ fontSize: '0.85rem', color: '#8888aa', marginBottom: '2rem' }}>
        Manage all organizations, admin users, and platform-wide settings.
      </p>

      <section style={{
        background: '#12121d',
        border: '1px solid #24243a',
        borderRadius: 10,
        padding: '1rem 1.15rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.55rem' }}>
          Platform Admin Help
        </div>
        <p style={{ fontSize: '0.84rem', color: '#c7c7dd', lineHeight: 1.55, margin: '0 0 0.75rem' }}>
          Use this area for platform-wide work: create organizations, review all admin accounts, assign roles, and manage global settings like demo mode.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.65rem' }}>
          <HelpItem title="Organizations" text="Create tenant sites and review each organization subscription status." />
          <HelpItem title="Admin Users" text="Assign platform, organization, billing-exempt, or match-operator access." />
          <HelpItem title="Settings" text="Control global platform behavior that affects every organization." />
        </div>
      </section>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem', marginBottom: '2.5rem',
      }}>
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} style={{
            display: 'block', padding: '1.25rem', background: '#141420',
            border: '1px solid #1e1e2e', borderRadius: '10px', textDecoration: 'none',
            transition: 'border-color 0.15s',
          }}>
            <div style={{ fontSize: '0.72rem', color: '#8888aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f0ff' }}>
              {loading ? '—' : s.value}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#c0c0d4', marginBottom: '1rem' }}>
        Quick Actions
      </h2>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/platform/organizations" style={{
          padding: '0.6rem 1.2rem', background: '#6366f1', color: '#fff',
          borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
        }}>
          Manage Organizations
        </Link>
        <Link href="/platform/admins" style={{
          padding: '0.6rem 1.2rem', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc',
          border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px',
          fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
        }}>
          Manage Admins
        </Link>
      </div>
    </div>
  )
}

function HelpItem({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ background: '#171728', border: '1px solid #24243a', borderRadius: 8, padding: '0.75rem' }}>
      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f0f0ff', marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '0.76rem', color: '#8f8fb0', lineHeight: 1.45 }}>{text}</div>
    </div>
  )
}
