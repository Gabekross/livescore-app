'use server'

import { cookies } from 'next/headers'

export async function setLoginCookie() {
  cookies().set('admin_logged_in', 'true', { path: '/' })
}

export async function logoutAdmin() {
  cookies().delete('admin_logged_in')
}
