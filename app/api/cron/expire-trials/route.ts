// app/api/cron/expire-trials/route.ts
// Vercel Cron endpoint to expire trials.
// Add to vercel.json:
//   { "crons": [{ "path": "/api/cron/expire-trials", "schedule": "0 */6 * * *" }] }

import { NextResponse }             from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  // Verify cron secret (Vercel sets CRON_SECRET automatically for cron jobs)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createAdminSupabaseClient()
    const { data, error } = await admin.rpc('expire_trials')

    if (error) {
      console.error('Trial expiry error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ expired: data, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('Trial expiry exception:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
