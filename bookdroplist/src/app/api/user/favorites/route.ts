import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await requireAuth()

    if (!supabase) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    // Get user's favorite lists with details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: favorites, error } = await (supabase as any)
      .from('favorites')
      .select(`
        *,
        lists!inner(
          *,
          list_books(count)
        )
      `)
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user favorites:', error)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }

    // Transform the data to include book count
    const transformedFavorites = favorites?.map((favorite: { lists: { list_books: { count: number }[] } }) => ({
      ...favorite,
      lists: {
        ...favorite.lists,
        book_count: favorite.lists.list_books?.[0]?.count || 0
      }
    })) || []

    return NextResponse.json({ favorites: transformedFavorites })
  } catch (error) {
    console.error('Error in user favorites endpoint:', error)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { listId } = await request.json()

    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 })
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    // Check if list exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: list, error: listError } = await (supabase as any)
      .from('lists')
      .select('id, user_id')
      .eq('id', listId)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Don't allow users to favorite their own lists
    if (list.user_id === session.userId) {
      return NextResponse.json({ error: 'Cannot favorite your own list' }, { status: 400 })
    }

    // Add to favorites
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: favoriteError } = await (supabase as any)
      .from('favorites')
      .insert({
        user_id: session.userId,
        list_id: listId
      })

    if (favoriteError) {
      if (favoriteError.code === '23505') {
        return NextResponse.json({ error: 'List already in favorites' }, { status: 409 })
      }
      console.error('Error adding favorite:', favoriteError)
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in add favorite endpoint:', error)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { listId } = await request.json()

    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 })
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    // Remove from favorites
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('favorites')
      .delete()
      .eq('user_id', session.userId)
      .eq('list_id', listId)

    if (error) {
      console.error('Error removing favorite:', error)
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in remove favorite endpoint:', error)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
}