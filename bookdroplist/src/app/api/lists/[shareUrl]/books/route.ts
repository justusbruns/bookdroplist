import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import type { Book } from '@/types'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shareUrl: string }> }
) {
  try {
    const session = await requireAuth()
    const { shareUrl } = await params
    const { books }: { books: Book[] } = await request.json()

    if (!supabase) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    // Get the list and verify permissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: list, error: listError } = await (supabase as any)
      .from('lists')
      .select('id, user_id, purpose')
      .eq('share_url', shareUrl)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const isOwner = list.user_id === session.userId
    const isMiniLibrary = list.purpose === 'minilibrary'
    const canEdit = isOwner || isMiniLibrary

    if (!canEdit) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Start a transaction to update books and list_books
    // First, get existing book relationships
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingLinks } = await (supabase as any)
      .from('list_books')
      .select('book_id')
      .eq('list_id', list.id)

    // Delete all existing book links for this list
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('list_books')
      .delete()
      .eq('list_id', list.id)

    // Update/insert books and create new links
    for (let i = 0; i < books.length; i++) {
      const book = books[i]

      // Update or insert the book
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: upsertedBook, error: bookError } = await (supabase as any)
        .from('books')
        .upsert({
          id: book.id,
          title: book.title,
          author: book.author,
          cover_url: book.cover_url,
          isbn: book.isbn,
          publication_year: book.publication_year,
          genre: book.genre,
          description: book.description,
          publisher: book.publisher
        })
        .select()
        .single()

      if (bookError) {
        console.error('Error upserting book:', bookError)
        // Continue with the existing book ID if upsert failed
      }

      // Create new link with updated position
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: linkError } = await (supabase as any)
        .from('list_books')
        .insert({
          list_id: list.id,
          book_id: book.id,
          position: i
        })

      if (linkError) {
        console.error('Error linking book to list:', linkError)
        return NextResponse.json({ error: 'Failed to update book order' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, bookCount: books.length })

  } catch (error) {
    console.error('Error updating books:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update books' }, { status: 500 })
  }
}