import { NextRequest, NextResponse } from 'next/server'
import { createOrGetUser, generateMagicLinkToken, storeMagicLink, checkMagicLinkRateLimit } from '@/lib/auth'
import { sendMagicLink } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address required' }, { status: 400 })
    }

    // Check rate limiting
    const canRequest = await checkMagicLinkRateLimit(email)
    if (!canRequest) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before requesting another magic link.' },
        { status: 429 }
      )
    }

    // Create or get user
    const user = await createOrGetUser(email)
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Generate magic link token
    const token = generateMagicLinkToken()

    // Store token in database
    const stored = await storeMagicLink(user.id, token)
    if (!stored) {
      return NextResponse.json({ error: 'Failed to generate magic link' }, { status: 500 })
    }

    // Send email
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://your-domain.com'
      : `http://localhost:3000`

    await sendMagicLink({
      email,
      token,
      baseUrl
    })

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email'
    })

  } catch (error) {
    console.error('Error in magic link request:', error)
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    )
  }
}