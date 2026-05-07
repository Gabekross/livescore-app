// lib/platform-settings-server.ts
// Server-side fetcher for the singleton platform_settings row.
// Called once per request from the root layout, then passed to a client
// context provider so all components can read the demo-mode flag without
// each one issuing its own query.
//
// Defaults to safe values if the query fails (e.g. table not yet migrated):
//   demoMode = false  →  normal SaaS behaviour, monetization UI visible.

import { createServerSupabaseClient } from '@/lib/supabase-server'

export interface PlatformSettings {
  demoMode: boolean
}

const DEFAULT_SETTINGS: PlatformSettings = { demoMode: false }

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('platform_settings')
      .select('demo_mode')
      .eq('id', true)
      .maybeSingle()

    if (error || !data) return DEFAULT_SETTINGS
    return { demoMode: !!data.demo_mode }
  } catch {
    return DEFAULT_SETTINGS
  }
}
