import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'

export async function GET() {
  try {
    const session = await requireAuth()

    return NextResponse.json({
      email: session.email,
      userId: session.userId
    })
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
}