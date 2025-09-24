import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareUrl: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    const { shareUrl } = await params
    const { books } = await request.json()

    if (!books || !Array.isArray(books) || books.length === 0) {
      return NextResponse.json({ error: 'At least one book is required' }, { status: 400 })
    }

    // First, verify the list exists and belongs to the user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingList, error: findError } = await (supabaseAdmin as any)
      .from('lists')
      .select('id, user_id')
      .eq('share_url', shareUrl)
      .single()

    if (findError || !existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    if (existingList.user_id !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get the current highest position in the list
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: listBooks } = await (supabaseAdmin as any)
      .from('list_books')
      .select('position')
      .eq('list_id', existingList.id)
      .order('position', { ascending: false })
      .limit(1)

    const startPosition = listBooks && listBooks.length > 0 ? listBooks[0].position + 1 : 0

    // Insert/update books and link them to the list
    const addedBooks = []

    for (let i = 0; i < books.length; i++) {
      const book = books[i]

      console.log(`\n=== Processing book ${i}: "${book.title}" by "${book.author}" ===`)
      console.log(`Original book ID: ${book.id}`)

      // First check if book already exists by title + author
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingBook, error: findError } = await (supabaseAdmin as any)
        .from('books')
        .select('*')
        .eq('title', book.title)
        .eq('author', book.author)
        .single()

      console.log(`Find existing book result:`, { existingBook: existingBook?.id, findError: findError?.code })

      let bookToUse = book

      if (existingBook) {
        // Book already exists, use the existing one
        console.log(`Using existing book with ID: ${existingBook.id}`)
        bookToUse = existingBook
      } else {
        // Try to insert the new book
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: insertedBook, error: bookError } = await (supabaseAdmin as any)
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
          .select()
          .single()

        if (bookError) {
          console.error('Error inserting book:', bookError)
          // If insert fails, try to find the book that caused the conflict
          if (bookError.code === '23505') {
            // Unique constraint violation - book already exists, try to find it
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: conflictBook } = await (supabaseAdmin as any)
              .from('books')
              .select('*')
              .eq('title', book.title)
              .eq('author', book.author)
              .single()

            if (conflictBook) {
              bookToUse = conflictBook
            } else {
              // Skip this book if we can't resolve it
              console.error('Could not resolve book conflict:', book.title)
              continue
            }
          } else {
            // Other error - skip this book
            console.error('Skipping book due to error:', book.title, bookError)
            continue
          }
        } else {
          console.log(`Successfully inserted book with ID: ${insertedBook?.id}`)
          bookToUse = insertedBook || book
        }
      }

      console.log(`Final bookToUse ID: ${bookToUse.id}`)

      // Check if this book is already in the list using the correct book ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingLink } = await (supabaseAdmin as any)
        .from('list_books')
        .select('id')
        .eq('list_id', existingList.id)
        .eq('book_id', bookToUse.id)
        .single()

      if (!existingLink) {
        // Link the book to the list using the correct book ID
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: linkError } = await (supabaseAdmin as any)
          .from('list_books')
          .insert({
            list_id: existingList.id,
            book_id: bookToUse.id,
            position: startPosition + i
          })

        if (linkError) {
          console.error('Error linking book to list:', linkError)
        } else {
          console.log('Successfully linked book to list:', bookToUse.title)
          addedBooks.push(bookToUse)
        }
      } else {
        console.log('Book already in list, skipping:', book.title)
      }
    }

    return NextResponse.json({
      addedBooks,
      message: `Added ${addedBooks.length} book${addedBooks.length !== 1 ? 's' : ''} to the list`
    })

  } catch (error) {
    console.error('Error adding books to list:', error)
    return NextResponse.json(
      { error: 'Failed to add books to list' },
      { status: 500 }
    )
  }
}