'use client'

// contexts/PlatformSettingsContext.tsx
// Holds platform-wide settings (currently just demo mode) for the whole app.
// Seeded server-side from lib/platform-settings-server.ts, then re-fetched
// in the background so client navigations always see the latest value.
//
// Use the hooks in @/hooks/useDemoMode — DO NOT read the context directly
// from feature code, so the abstraction stays swappable.

import { createContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface PlatformSettingsValue {
  demoMode: boolean
  loading:  boolean
  /** Bust the cache and refetch — used after the toggle is saved. */
  refresh:  () => Promise<void>
}

export const PlatformSettingsContext = createContext<PlatformSettingsValue>({
  demoMode: false,
  loading:  false,
  refresh:  async () => {},
})

interface ProviderProps {
  initial:  { demoMode: boolean }
  children: React.ReactNode
}

export function PlatformSettingsProvider({ initial, children }: ProviderProps) {
  const [demoMode, setDemoMode] = useState<boolean>(initial.demoMode)
  const [loading,  setLoading]  = useState<boolean>(false)

  const fetchLatest = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('platform_settings')
        .select('demo_mode')
        .eq('id', true)
        .maybeSingle()
      if (data) setDemoMode(!!data.demo_mode)
    } catch {
      // Silently fall back to the SSR-seeded value
    } finally {
      setLoading(false)
    }
  }

  // Re-validate once on mount so client navigations after a toggle change
  // pick up the new value within a render or two.
  useEffect(() => {
    fetchLatest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PlatformSettingsContext.Provider
      value={{ demoMode, loading, refresh: fetchLatest }}
    >
      {children}
    </PlatformSettingsContext.Provider>
  )
}
