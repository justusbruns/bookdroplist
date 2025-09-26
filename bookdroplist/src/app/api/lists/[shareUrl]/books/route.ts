import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { supabase, supabaseAdmin } from '@/lib/supabase'
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
    console.log('Looking up list with share URL:', shareUrl)

    // Try to find by share_url first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: list, error: listError } = await (supabase as any)
      .from('lists')
      .select('id, user_id, purpose, share_url, name')
      .eq('share_url', shareUrl)
      .single()

    // If not found by share_url, try by id (in case shareUrl is actually the list ID)
    if (listError || !list) {
      console.log('Not found by share_url, trying by id')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: listById, error: listByIdError } = await (supabase as any)
        .from('lists')
        .select('id, user_id, purpose, share_url, name')
        .eq('id', shareUrl)
        .single()

      list = listById
      listError = listByIdError
    }

    console.log('Database query result:', { list, listError })

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const isOwner = list.user_id === session.userId
    const isMiniLibrary = list.purpose === 'minilibrary'
    const canEdit = isOwner || isMiniLibrary

    if (!canEdit) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Use admin client to bypass RLS for authorized operations
    if (!supabaseAdmin) {
      console.error('Admin client not available - missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Admin service not configured' }, { status: 500 })
    }

    console.log('Using admin client for database operations')

    // Get existing book relationships for cleanup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingLinks, error: existingLinksError } = await (supabaseAdmin as any)
      .from('list_books')
      .select('book_id')
      .eq('list_id', list.id)

    if (existingLinksError) {
      console.error('Error fetching existing book links:', existingLinksError)
      return NextResponse.json({ error: 'Failed to fetch existing books' }, { status: 500 })
    }

    const existingBookIds = (existingLinks || []).map((link: { book_id: string }) => link.book_id)
    const newBookIds = books.map(book => book.id)

    console.log('Share URL:', shareUrl)
    console.log('List ID from DB:', list.id)
    console.log('Existing book IDs:', existingBookIds)
    console.log('New book IDs:', newBookIds)
    console.log('Books to remove:', existingBookIds.filter((id: string) => !newBookIds.includes(id)))

    // Delete all existing book links for this list using admin client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteLinkError, count } = await (supabaseAdmin as any)
      .from('list_books')
      .delete()
      .eq('list_id', list.id)

    if (deleteLinkError) {
      console.error('Error deleting existing book links:', deleteLinkError)
      return NextResponse.json({ error: 'Failed to clear existing books' }, { status: 500 })
    }

    console.log(`Deleted ${count || 0} existing book links for list ${list.id}`)

    console.log(`Processing ${books.length} books for list ${list.id}`)
    console.log('Books to be saved:', books.map(b => ({ id: b.id, title: b.title })))

    // Update/insert books and create new links
    for (let i = 0; i < books.length; i++) {
      const book = books[i]
      console.log(`Processing book ${i + 1}/${books.length}: ${book.title}`)

      try {
        // First, try to insert the book using admin client
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabaseAdmin as any)
          .from('books')
          .insert({
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

        // If insert fails with duplicate key error, that's fine - book already exists
        if (insertError && insertError.code !== '23505') {
          // Try to update the existing book instead using admin client
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: updateError } = await (supabaseAdmin as any)
            .from('books')
            .update({
              title: book.title,
              author: book.author,
              cover_url: book.cover_url,
              isbn: book.isbn,
              publication_year: book.publication_year,
              genre: book.genre,
              description: book.description,
              publisher: book.publisher
            })
            .eq('id', book.id)

          if (updateError) {
            console.error('Error updating existing book:', updateError)
            return NextResponse.json({
              error: `Failed to update book: ${book.title} - ${updateError.message}`
            }, { status: 500 })
          }
        }

        // Create new link with updated position
        // First check if this link already exists using admin client
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingLink } = await (supabaseAdmin as any)
          .from('list_books')
          .select('list_id')
          .eq('list_id', list.id)
          .eq('book_id', book.id)
          .single()

        if (existingLink) {
          console.log(`Link already exists for book ${book.title}, updating position`)
          // Update the position instead of inserting
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: updateLinkError } = await (supabaseAdmin as any)
            .from('list_books')
            .update({ position: i })
            .eq('list_id', list.id)
            .eq('book_id', book.id)

          if (updateLinkError) {
            console.error('Error updating book link position:', updateLinkError)
            return NextResponse.json({
              error: `Failed to update book position: ${book.title} - ${updateLinkError.message}`
            }, { status: 500 })
          }
        } else {
          // Insert new link using admin client
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: linkError } = await (supabaseAdmin as any)
            .from('list_books')
            .insert({
              list_id: list.id,
              book_id: book.id,
              position: i
            })

          if (linkError) {
            console.error('Error linking book to list:', linkError)
            // If it's a duplicate key error, that's unexpected since we just checked
            if (linkError.code === '23505') {
              console.log(`Duplicate key error for book ${book.title}, attempting upsert`)
              // Try to update instead using admin client
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { error: upsertError } = await (supabaseAdmin as any)
                .from('list_books')
                .upsert({
                  list_id: list.id,
                  book_id: book.id,
                  position: i
                })

              if (upsertError) {
                return NextResponse.json({
                  error: `Failed to link book: ${book.title} - ${upsertError.message}`
                }, { status: 500 })
              }
            } else {
              return NextResponse.json({
                error: `Failed to link book: ${book.title} - ${linkError.message}`
              }, { status: 500 })
            }
          }
        }

      } catch (error) {
        console.error(`Error processing book ${book.title}:`, error)
        return NextResponse.json({
          error: `Failed to process book: ${book.title}`
        }, { status: 500 })
      }
    }

    // Clean up orphaned books (books that were removed and aren't used in other lists)
    const removedBookIds = existingBookIds.filter((id: string) => !newBookIds.includes(id))

    for (const bookId of removedBookIds) {
      // Check if this book is used in other lists using admin client
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: otherUsages, error: usageError } = await (supabaseAdmin as any)
        .from('list_books')
        .select('list_id')
        .eq('book_id', bookId)
        .limit(1)

      if (usageError) {
        console.error('Error checking book usage:', usageError)
        continue // Skip cleanup for this book
      }

      // If no other lists use this book, delete it using admin client
      if (!otherUsages || otherUsages.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: deleteBookError } = await (supabaseAdmin as any)
          .from('books')
          .delete()
          .eq('id', bookId)

        if (deleteBookError) {
          console.error('Error deleting orphaned book:', deleteBookError)
          // Continue even if cleanup fails
        }
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