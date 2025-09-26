import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import type { Book } from '@/types'
import { Tables } from '@/types/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareUrl: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    const { shareUrl } = await params
    const session = await getSession()

    // Get the list
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('*')
      .eq('share_url', shareUrl)
      .single<Tables<"lists">>()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Get books for this list using admin client to bypass RLS
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service not properly configured' }, { status: 500 })
    }

    const { data: listBookLinks, error: listBooksError } = await supabaseAdmin
      .from('list_books')
      .select('book_id, position')
      .eq('list_id', list.id)
      .order('position')
      .returns<Tables<"list_books">[]>()

    if (listBooksError) {
      console.error('Error fetching list_books:', listBooksError)
      return NextResponse.json({ error: 'Failed to fetch book links' }, { status: 500 })
    }

    const bookIds = listBookLinks.map(link => link.book_id)
    let books: Book[] = []

    if (bookIds.length > 0) {
      // Get book details for the collected IDs, also using admin client
      const { data: bookDetails, error: booksError } = await supabaseAdmin!
        .from('books')
        .select('*')
        .in('id', bookIds)

      if (booksError) {
        console.error('Error fetching book details:', booksError)
        return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
      }

      // Create a map for quick lookups
      const bookMap = new Map((bookDetails as Book[]).map(book => [book.id, book]))

      // Reconstruct the books array in the correct order
      books = listBookLinks
        .map(link => bookMap.get(link.book_id))
        .filter(Boolean) as Book[] // Filter out any potential misses
    }

    // Check if current user is the owner
    const isOwner = session?.userId === list.user_id

    // For mini libraries, any authenticated user can edit (community managed)
    const canEdit = isOwner || (list.purpose === 'minilibrary' && !!session)

    // Show exact location only for mini libraries, hide for other purposes
    const isMiniLibrary = list.purpose === 'minilibrary'

    return NextResponse.json({
      ...list,
      books,
      isOwner,
      canEdit,
      isManager: isOwner, // Only the owner is the manager who can change name/location
      // Show exact coordinates only for mini libraries
      exact_latitude: isMiniLibrary ? list.exact_latitude : undefined,
      exact_longitude: isMiniLibrary ? list.exact_longitude : undefined
    })

  } catch (error) {
    console.error('Error fetching list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch list' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shareUrl: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    const { shareUrl } = await params
    const { name, purpose, description } = await request.json()
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // First, verify the list exists and check permissions
    const { data: existingList, error: findError } = await (supabase)
      .from('lists')
      .select('id, user_id, purpose')
      .eq('share_url', shareUrl)
      .single<Tables<"lists">>()

    console.log('Finding list:', { shareUrl, existingList, findError })

    if (findError || !existingList) {
      console.error('List not found:', findError)
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const isOwner = existingList.user_id === session.userId
    const isMiniLibrary = existingList.purpose === 'minilibrary'
    const canEdit = isOwner || isMiniLibrary

    console.log('Checking permissions:', {
      listUserId: existingList.user_id,
      sessionUserId: session.userId,
      isOwner,
      isMiniLibrary,
      canEdit
    })

    if (!canEdit) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // For mini libraries, only owners can change name and purpose
    if (isMiniLibrary && !isOwner && (name !== undefined || purpose !== undefined)) {
      return NextResponse.json({
        error: 'Only the manager can change the name or purpose of a mini library'
      }, { status: 403 })
    }

    // Now update the list using the ID (more reliable than shareUrl)
    console.log('Attempting update:', { listId: existingList.id, newName: name, newPurpose: purpose })

    // Use admin client to bypass RLS for this authorized update
    if (!supabaseAdmin) {
      console.error('Admin client not available - missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Admin service not configured' }, { status: 500 })
    }

    console.log('Using admin client for update operation')

    // Prepare update object - only include fields that are provided
    const updateData: { name?: string; purpose?: string; description?: string } = {}
    if (name !== undefined) updateData.name = name
    if (purpose !== undefined) updateData.purpose = purpose
    if (description !== undefined) updateData.description = description

    const { data, error } = await (supabaseAdmin as any)
      .from('lists')
      .update(updateData)
      .eq('id', existingList.id)
      .select()

    console.log('Update result:', { data, error })

    if (error) {
      console.error('Error updating list:', error)
      return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
    }

    // If no data returned, it might be an RLS policy issue
    if (!data || data.length === 0) {
      console.error('Update succeeded but no data returned - likely RLS policy issue')
      return NextResponse.json({ error: 'Update failed due to permissions' }, { status: 403 })
    }

    return NextResponse.json(data[0])

  } catch (error) {
    console.error('Error updating list:', error)
    return NextResponse.json(
      { error: 'Failed to update list' },
      { status: 500 }
    )
  }
}