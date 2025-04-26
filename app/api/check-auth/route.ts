import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = cookies()
  const loggedIn = cookieStore.get('admin_logged_in')?.value === 'true'

  return NextResponse.json({ loggedIn })
}
