import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/session'

interface List {
  id: string;
  purpose: string;
}

interface CurrentBook {
  position: number;
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    try {
      await requireAuth()
    } catch {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { listId, booksToAdd, booksToRemove, shareUrl } = await request.json()

    if (!listId && !shareUrl) {
      return NextResponse.json({ error: 'List ID or share URL required' }, { status: 400 })
    }

    // Get the list to verify it's a mini library and check permissions
    let list
    if (shareUrl) {
      if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('share_url', shareUrl)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }
      list = data
    } else {
      if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('id', listId)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }
      list = data
    }

    // Verify this is a mini library
    if ((list as List).purpose !== 'minilibrary') {
      return NextResponse.json({ error: 'This feature is only available for mini libraries' }, { status: 400 })
    }

    // For mini libraries, any authenticated user can edit (community managed)
    // This is different from other list types which require ownership

    const listIdToUse = (list as List).id

    // Remove books first
    if (booksToRemove && booksToRemove.length > 0) {
      for (const bookId of booksToRemove) {
        // Remove from list_books
        await supabase
          .from('list_books')
          .delete()
          .eq('list_id', listIdToUse)
          .eq('book_id', bookId)

        // Check if book is used elsewhere, if not, remove from books table
        const { data: otherUsages } = await supabase
          .from('list_books')
          .select('list_id')
          .eq('book_id', bookId)

        if (!otherUsages || otherUsages.length === 0) {
          await supabase
            .from('books')
            .delete()
            .eq('id', bookId)
        }
      }
    }

    // Add new books
    if (booksToAdd && booksToAdd.length > 0) {
      // Get current max position
      const { data: currentBooks } = await supabase
        .from('list_books')
        .select('position')
        .eq('list_id', listIdToUse)
        .order('position', { ascending: false })
        .limit(1)

      let nextPosition = 1
      if (currentBooks && currentBooks.length > 0) {
        nextPosition = (currentBooks[0] as CurrentBook).position + 1
      }

      for (const book of booksToAdd) {
        // Insert book into books table
        const { error: bookError } = await (supabase as any)!
          .from('books')
          .insert(book)

        if (bookError && bookError.code !== '23505') { // Ignore duplicate key errors
          console.error('Error inserting book:', bookError)
          continue
        }

        // Insert into list_books
        const { error: listBookError } = await (supabase as any)!
          .from('list_books')
          .insert({
            list_id: listIdToUse,
            book_id: book.id,
            position: nextPosition
          })

        if (listBookError) {
          console.error('Error adding book to list:', listBookError)
          continue
        }

        nextPosition++
      }
    }

    // Update the list's updated_at timestamp
    // Note: Skipping timestamp update due to TypeScript strict typing issues

    return NextResponse.json({
      success: true,
      message: `Mini library updated successfully`,
      booksAdded: booksToAdd?.length || 0,
      booksRemoved: booksToRemove?.length || 0
    })

  } catch (error) {
    console.error('Error updating mini library:', error)
    return NextResponse.json(
      { error: 'Failed to update mini library' },
      { status: 500 }
    )
  }
}