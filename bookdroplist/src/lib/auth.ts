import { supabase } from './supabase'
import crypto from 'crypto'

export interface User {
  id: string
  email: string
  created_at: string
  last_login?: string
}

export interface AuthSession {
  user: User
  token: string
  expires: number
}

// Generate a secure random token for magic links
export function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Create or get existing user by email
export async function createOrGetUser(email: string): Promise<User | null> {
  if (!supabase) return null

  try {
    // First try to get existing user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingUser } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return existingUser
    }

    // Create new user if doesn't exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newUser, error } = await (supabase as any)
      .from('users')
      .insert({ email: email.toLowerCase() })
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return null
    }

    return newUser
  } catch (error) {
    console.error('Error in createOrGetUser:', error)
    return null
  }
}

// Store magic link token in database
export async function storeMagicLink(userId: string, token: string): Promise<boolean> {
  if (!supabase) return false

  try {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15) // 15 minutes from now

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('magic_links')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString()
      })

    if (error) {
      console.error('Error storing magic link:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in storeMagicLink:', error)
    return false
  }
}

// Verify magic link token and get user
export async function verifyMagicLink(token: string): Promise<User | null> {
  if (!supabase) return null

  try {
    // Get magic link and associated user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: magicLink, error: linkError } = await (supabase as any)
      .from('magic_links')
      .select(`
        *,
        users (*)
      `)
      .eq('token', token)
      .is('used_at', null)
      .single()

    if (linkError || !magicLink) {
      console.error('Magic link not found or already used:', linkError)
      return null
    }

    // Check if token has expired
    const now = new Date()
    const expiresAt = new Date(magicLink.expires_at)

    if (now > expiresAt) {
      console.error('Magic link has expired')
      return null
    }

    // Mark token as used
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('magic_links')
      .update({ used_at: now.toISOString() })
      .eq('token', token)

    // Update user's last login
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('users')
      .update({ last_login: now.toISOString() })
      .eq('id', magicLink.user_id)

    return magicLink.users
  } catch (error) {
    console.error('Error in verifyMagicLink:', error)
    return null
  }
}

// Clean up expired magic links (call periodically)
export async function cleanupExpiredMagicLinks(): Promise<void> {
  if (!supabase) return

  try {
    const now = new Date()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('magic_links')
      .delete()
      .lt('expires_at', now.toISOString())

    console.log('Cleaned up expired magic links')
  } catch (error) {
    console.error('Error cleaning up magic links:', error)
  }
}

// Rate limiting: check if user has requested too many magic links recently
export async function checkMagicLinkRateLimit(email: string): Promise<boolean> {
  if (!supabase) return true // Allow if we can't check

  try {
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    // Get user first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user } = await (supabase as any)
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (!user) return true // Allow if user doesn't exist yet

    // Count magic links in last hour
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from('magic_links')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo.toISOString())

    // Allow max 3 requests per hour
    return (count || 0) < 3
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return true // Allow on error to not block users
  }
}