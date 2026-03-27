'use server'

// lib/auth-actions.ts
// Server Actions for Supabase Auth sign-out.
// Sign-in is handled client-side in app/admin/page.tsx via supabase.auth.signInWithPassword().
// Sign-out is a server action so it can properly clear the session cookie on the server.

import { createServerSupabaseClient } from './supabase-server'
import { redirect } from 'next/navigation'

export async function logoutAdmin() {
  const supabase = createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/admin')
}
