import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLink } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/?error=missing-token', request.url))
    }

    // Verify the magic link token
    const user = await verifyMagicLink(token)

    if (!user) {
      return NextResponse.redirect(new URL('/?error=invalid-token', request.url))
    }

    // Create session cookie (30 days)
    const cookieStore = await cookies()
    const sessionData = {
      userId: user.id,
      email: user.email,
      expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    }

    cookieStore.set('auth-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      path: '/'
    })

    // Check if there's a redirect URL (for after creating a list)
    const redirect = searchParams.get('redirect')
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, request.url))
    }

    // Default redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))

  } catch (error) {
    console.error('Error in magic link verification:', error)
    return NextResponse.redirect(new URL('/?error=verification-failed', request.url))
  }
}