// lib/supabase.ts
// Browser-side Supabase client using @supabase/ssr.
// createBrowserClient is singleton-safe — it reuses the same instance per browser tab.
// All 'use client' pages import { supabase } from '@/lib/supabase' unchanged.

import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
