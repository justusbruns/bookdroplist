import { cookies } from 'next/headers'
import type { User } from './auth'

export interface SessionData {
  userId: string
  email: string
  expires: number
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('auth-session')

    if (!sessionCookie?.value) {
      return null
    }

    const sessionData: SessionData = JSON.parse(sessionCookie.value)

    // Check if session has expired
    if (Date.now() > sessionData.expires) {
      // Session expired, clear cookie
      cookieStore.delete('auth-session')
      return null
    }

    return sessionData
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession()

  if (!session) {
    throw new Error('Authentication required')
  }

  return session
}

export async function getUserFromSession(): Promise<User | null> {
  const session = await getSession()

  if (!session) {
    return null
  }

  return {
    id: session.userId,
    email: session.email,
    created_at: '', // We could fetch full user data if needed
    last_login: ''
  }
}