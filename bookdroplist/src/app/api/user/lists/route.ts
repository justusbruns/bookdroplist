import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await requireAuth()

    if (!supabase) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    // Get user's lists with book count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lists, error } = await (supabase as any)
      .from('lists')
      .select(`
        *,
        list_books(count)
      `)
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user lists:', error)
      return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 })
    }

    // Transform the data to include book count
    const transformedLists = lists?.map((list: any) => ({
      ...list,
      book_count: list.list_books?.[0]?.count || 0
    })) || []

    return NextResponse.json({ lists: transformedLists })
  } catch (error) {
    console.error('Error in user lists endpoint:', error)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
}