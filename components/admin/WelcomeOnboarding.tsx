'use client'

// components/admin/WelcomeOnboarding.tsx
// Shows a one-time welcome modal after first org signup.
// Guides the user to create their first tournament and add teams.

import { useState, useEffect } from 'react'
import Link                    from 'next/link'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { FREE_PLAN }           from '@/config/pricing'

export default function WelcomeOnboarding() {
  const { orgName, plan } = useAdminOrg()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only show once per browser session, on first dashboard load
    const key = 'kolu_onboarded'
    if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
      // Check if this looks like a fresh signup (trialing with full days left)
      if (plan?.isTrialing && plan.trialDaysLeft >= (FREE_PLAN.trialDays - 1)) {
        setShow(true)
        sessionStorage.setItem(key, '1')
      }
    }
  }, [plan])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '2.5rem 2rem',
        maxWidth: 520, width: '90%', textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
        <h2 style={{
          fontSize: '1.4rem', fontWeight: 900, color: '#0f172a',
          marginBottom: '0.5rem', lineHeight: 1.2,
        }}>
          Welcome to {orgName || 'your new site'}!
        </h2>
        <p style={{
          fontSize: '0.92rem', color: '#64748b', marginBottom: '0.25rem', lineHeight: 1.6,
        }}>
          Your {FREE_PLAN.trialDays}-day free trial has started. You have full access to
          explore everything.
        </p>
        <p style={{
          fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.75rem',
        }}>
          Here&apos;s how to get the most out of your trial:
        </p>

        {/* Quick-start steps */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.65rem',
          textAlign: 'left', marginBottom: '1.75rem',
        }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              padding: '0.7rem 0.85rem', background: '#f8fafc',
              borderRadius: 10, border: '1px solid #e2e8f0',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: '#2563eb', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {step.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/admin/tournaments/new"
            onClick={() => setShow(false)}
            style={{
              padding: '0.7rem 1.5rem', background: '#2563eb', color: '#fff',
              borderRadius: 10, fontWeight: 700, fontSize: '0.88rem',
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            Create Your First Tournament
          </Link>
          <button
            onClick={() => setShow(false)}
            style={{
              padding: '0.7rem 1.5rem', background: '#f1f5f9', color: '#475569',
              borderRadius: 10, fontWeight: 600, fontSize: '0.88rem',
              border: '1px solid #e2e8f0', cursor: 'pointer',
            }}
          >
            Explore Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

const STEPS = [
  {
    title: 'Create a tournament or league',
    text:  'Set up your competition with stages, groups, and fixtures.',
  },
  {
    title: 'Add your teams',
    text:  'Import rosters from spreadsheets or add them manually.',
  },
  {
    title: 'Go live on match day',
    text:  'Update scores in real time — your site updates instantly.',
  },
]
