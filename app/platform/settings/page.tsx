'use client'

// app/platform/settings/page.tsx
// Power-admin platform settings — currently houses the Demo Mode toggle.
// Route protection (power_admin only) is enforced upstream by middleware.ts.

import { useContext, useState } from 'react'
import toast                    from 'react-hot-toast'
import { PlatformSettingsContext } from '@/contexts/PlatformSettingsContext'

export default function PlatformSettingsPage() {
  const { demoMode, refresh } = useContext(PlatformSettingsContext)
  const [saving, setSaving]   = useState(false)

  async function handleToggle(next: boolean) {
    setSaving(true)
    try {
      const res = await fetch('/api/platform/settings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ demoMode: next }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not update demo mode')
        return
      }
      await refresh()
      toast.success(next ? 'Demo mode enabled' : 'Demo mode disabled')
    } catch {
      toast.error('Could not connect to platform settings service')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f0f0ff', marginBottom: '0.35rem' }}>
        Platform Settings
      </h1>
      <p style={{ fontSize: '0.85rem', color: '#8888aa', marginBottom: '2rem' }}>
        Platform-wide controls available only to power admins.
      </p>

      {/* Demo mode card */}
      <div style={{
        background:   '#141420',
        border:       '1px solid #1e1e2e',
        borderRadius: 12,
        padding:      '1.5rem',
        maxWidth:     720,
      }}>
        <div style={{
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: 'space-between',
          gap:            '1.5rem',
          flexWrap:       'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{
              fontSize: '1rem', fontWeight: 700, color: '#f0f0ff',
              margin: '0 0 0.4rem',
            }}>
              Demo Mode
            </h2>
            <p style={{
              fontSize: '0.83rem', color: '#8888aa',
              margin: 0, lineHeight: 1.5,
            }}>
              Hide pricing, billing, upgrade prompts, subscription details, and Stripe
              actions for demos or white-label presentations. Does not change
              permissions or security — only what is shown in the UI.
            </p>
          </div>

          {/* Toggle */}
          <button
            onClick={() => handleToggle(!demoMode)}
            disabled={saving}
            aria-pressed={demoMode}
            aria-label="Toggle demo mode"
            style={{
              position:     'relative',
              width:        56,
              height:       30,
              borderRadius: 999,
              border:       '1px solid #2a2a3a',
              background:   demoMode ? '#6366f1' : '#1e1e2e',
              cursor:       saving ? 'not-allowed' : 'pointer',
              opacity:      saving ? 0.6 : 1,
              flexShrink:   0,
              transition:   'background 0.15s',
            }}
          >
            <span style={{
              position:     'absolute',
              top:          3,
              left:         demoMode ? 28 : 3,
              width:        22,
              height:       22,
              borderRadius: '50%',
              background:   '#fff',
              transition:   'left 0.15s',
            }} />
          </button>
        </div>

        <div style={{
          marginTop:  '1.25rem',
          paddingTop: '1rem',
          borderTop:  '1px solid #1e1e2e',
          fontSize:   '0.78rem',
          color:      demoMode ? '#a5b4fc' : '#6b7080',
          fontWeight: 600,
        }}>
          {demoMode
            ? 'Demo mode is ACTIVE — pricing & billing UI are hidden across the platform.'
            : 'Demo mode is OFF — normal SaaS pricing & billing UI is visible.'}
        </div>
      </div>
    </div>
  )
}
