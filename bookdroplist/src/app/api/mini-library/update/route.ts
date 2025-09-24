import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/session'
import type { Book } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    let session
    try {
      session = await requireAuth()
    } catch (error) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { listId, booksToAdd, booksToRemove, shareUrl } = await request.json()

    if (!listId && !shareUrl) {
      return NextResponse.json({ error: 'List ID or share URL required' }, { status: 400 })
    }

    // Get the list to verify it's a mini library and check permissions
    let list
    if (shareUrl) {
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
    if (list.purpose !== 'minilibrary') {
      return NextResponse.json({ error: 'This feature is only available for mini libraries' }, { status: 400 })
    }

    // For mini libraries, any authenticated user can edit (community managed)
    // This is different from other list types which require ownership

    const listIdToUse = list.id

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
        nextPosition = currentBooks[0].position + 1
      }

      for (const book of booksToAdd) {
        // Insert book into books table
        const { error: bookError } = await supabase
          .from('books')
          .insert({
            id: book.id,
            title: book.title,
            author: book.author,
            cover_url: book.cover_url,
            isbn: book.isbn,
            publication_year: book.publication_year,
            publisher: book.publisher,
            description: book.description,
            genre: book.genre
          })

        if (bookError && bookError.code !== '23505') { // Ignore duplicate key errors
          console.error('Error inserting book:', bookError)
          continue
        }

        // Insert into list_books
        const { error: listBookError } = await supabase
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
    await supabase
      .from('lists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', listIdToUse)

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